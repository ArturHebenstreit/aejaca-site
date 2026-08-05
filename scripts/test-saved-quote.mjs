#!/usr/bin/env node
// ============================================================
// ZAPISANA WYCENA: CO SIE PRZELICZA, A CO ZOSTAJE
// ============================================================
// Obietnica zlozona klientowi brzmi: robocizna jest wiazaca przez caly okres
// waznosci, a kruszec liczy sie z dnia zamowienia. To jest jedno zdanie i
// dwie rozne rzeczy, ktore latwo skleic w kodzie w jedna: "przelicz wszystko
// od nowa". Roznica ujawnia sie dopiero wtedy, gdy zmienimy WLASNY cennik.
// Wtedy pelne przeliczenie po cichu podniosloby takze robocizne, ktora
// obiecalismy, a klient zobaczylby inna kwote pod tym samym numerem wyceny.
//
// Dlatego glowny test nie sprawdza, czy cena "sie zmienia". Sprawdza, czy
// zmienia sie DOKLADNIE o ruch kruszcu i o nic wiecej.
//
//   node scripts/test-saved-quote.mjs

import { repriceSavedItem } from "../chat-api/quotes.js";
import { priceItem } from "../chat-api/orders.js";
import { SERVICES } from "../src/data/orderCatalog.js";

let failed = 0;
const ok = (name, cond, detail = "") => {
  console.log(`${cond ? "  ok" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  if (!cond) failed++;
};

/** Komplet parametrow, ktory dany kalkulator faktycznie przyjmuje */
function paramsFor(calculator) {
  const svc = SERVICES.find((s) => s.calculator === calculator);
  if (!svc) throw new Error(`brak uslugi dla ${calculator}`);
  const p = { ...(svc.defaults || {}), ...(svc.fixed || {}) };
  for (const f of svc.fields || []) {
    if (p[f.key] !== undefined) continue;
    const opts = f.optionsFrom ? f.optionsFrom(svc.defaults) : f.options;
    if (!opts?.length) continue;
    p[f.key] = f.multi ? [opts[0].id] : opts[0].id;
  }
  return p;
}

const RATES_AT_SAVE = { au_pln_per_g: 300, ag_pln_per_g: 4, pt_pln_per_g: 130, pd_pln_per_g: 120, pln_per_eur: 4.25 };
const RATES_UP = { ...RATES_AT_SAVE, au_pln_per_g: 360, ag_pln_per_g: 4.8 };   // kruszec +20%
const RATES_DOWN = { ...RATES_AT_SAVE, au_pln_per_g: 150, ag_pln_per_g: 2 };   // kruszec -50%

const jewelryParams = paramsFor("jewelry_new");
const item = (over = {}) => ({
  calculator: "jewelry_new", qty: 1, params: jewelryParams,
  unit_grosze: priceItem({ calculator: "jewelry_new", params: jewelryParams, rates: RATES_AT_SAVE }).unitGrosze,
  ...over,
});

console.log("Kruszec sie rusza, robocizna nie\n");

// ------------------------------------------------------------
// 0. Warunek wstepny: kurs w ogole dociera do kalkulatora
// ------------------------------------------------------------
// `calcNew` i `calcChain` przyjmuja kursy TRZECIM argumentem. Kurs wlozony
// do obiektu parametrow jest po cichu ignorowany, a wtedy cala reszta tego
// pliku przechodzi na zielono, bo "nic sie nie zmienilo" wyglada tak samo
// jak "kurs nie dotarl". Ten test musi byc pierwszy.
{
  const a = priceItem({ calculator: "jewelry_new", params: jewelryParams, rates: { ag_pln_per_g: 1, au_pln_per_g: 100, pln_per_eur: 4.25 } }).unitGrosze;
  const b = priceItem({ calculator: "jewelry_new", params: jewelryParams, rates: { ag_pln_per_g: 40, au_pln_per_g: 900, pln_per_eur: 4.25 } }).unitGrosze;
  ok("kurs kruszcu dociera przez priceItem do kalkulatora", a !== b,
     `${(a / 100).toFixed(2)} vs ${(b / 100).toFixed(2)} PLN`);
}

// ------------------------------------------------------------
// 1. Wzrost kursu podnosi cene
// ------------------------------------------------------------
{
  const base = item();
  const r = repriceSavedItem(base, { ratesAtSave: RATES_AT_SAVE, ratesNow: RATES_UP });
  ok("wzrost kursu zlota podnosi cene bizuterii", r.repriced && r.unitGrosze > base.unit_grosze,
     `${(base.unit_grosze / 100).toFixed(2)} -> ${(r.unitGrosze / 100).toFixed(2)} PLN`);

  // Kruszec to czesc kosztu, wiec 20% na zlocie nie moze dac 20% na cenie.
  const growth = r.unitGrosze / base.unit_grosze;
  ok("cena rosnie wolniej niz kurs kruszcu", growth > 1 && growth < 1.2,
     `x${growth.toFixed(4)} przy kursie x1.20`);
}

// ------------------------------------------------------------
// 2. Rdzen obietnicy: przeliczamy roznice, nie cala pozycje
// ------------------------------------------------------------
// Udajemy, ze od czasu zapisu zmienil sie NASZ cennik: zapisana kwota jest
// inna niz ta, ktora silnik policzylby dzis ze starych kursow. Pelne
// przeliczenie zwrociloby cene z nowego cennika. Poprawna odpowiedz to
// kwota ZAPISANA plus sam ruch kruszcu.
{
  const before = priceItem({ calculator: "jewelry_new", params: jewelryParams, rates: RATES_AT_SAVE }).unitGrosze;
  const after = priceItem({ calculator: "jewelry_new", params: jewelryParams, rates: RATES_UP }).unitGrosze;
  const metalMove = after - before;

  // Klientowi obiecano 100 PLN mniej, niz wyliczylby dzisiejszy cennik.
  const promised = before - 10_000;
  const r = repriceSavedItem(item({ unit_grosze: promised }), { ratesAtSave: RATES_AT_SAVE, ratesNow: RATES_UP });

  ok("do zapisanej kwoty dokladamy sam ruch kruszcu", r.unitGrosze === promised + metalMove,
     `${(r.unitGrosze / 100).toFixed(2)} = ${(promised / 100).toFixed(2)} + ${(metalMove / 100).toFixed(2)}`);
  ok("obiecana robocizna nie wraca do cennika", r.unitGrosze !== after,
     `pelne przeliczenie daloby ${(after / 100).toFixed(2)} PLN`);
  ok("roznica jest raportowana osobno", r.metalDeltaGrosze === metalMove);
}

// ------------------------------------------------------------
// 3. Spadek kursu obniza cene, ale nigdy ponizej grosza
// ------------------------------------------------------------
{
  const base = item();
  const r = repriceSavedItem(base, { ratesAtSave: RATES_AT_SAVE, ratesNow: RATES_DOWN });
  ok("spadek kursu obniza cene", r.unitGrosze < base.unit_grosze,
     `${(base.unit_grosze / 100).toFixed(2)} -> ${(r.unitGrosze / 100).toFixed(2)} PLN`);

  // Wycena za 1 gr jest absurdem, ale ujemna jest bledem ksiegowym.
  const r2 = repriceSavedItem(item({ unit_grosze: 100 }), { ratesAtSave: RATES_AT_SAVE, ratesNow: RATES_DOWN });
  ok("cena nie schodzi ponizej grosza", r2.unitGrosze >= 1, `${r2.unitGrosze} gr`);
}

// ------------------------------------------------------------
// 4. Czego przeliczac NIE wolno
// ------------------------------------------------------------
{
  const printParams = paramsFor("print3d_fdm");
  const print = {
    calculator: "print3d_fdm", qty: 1, params: printParams, unit_grosze: 5000,
  };
  const r = repriceSavedItem(print, { ratesAtSave: RATES_AT_SAVE, ratesNow: RATES_UP });
  ok("druk 3D nie zalezy od kursu kruszcu", !r.repriced && r.unitGrosze === 5000);

  const noSnapshot = repriceSavedItem(item(), { ratesAtSave: null, ratesNow: RATES_UP });
  ok("bez zapisanych kursow trzymamy kwote zapisana", !noSnapshot.repriced);

  const noParams = repriceSavedItem({ ...item(), params: null }, { ratesAtSave: RATES_AT_SAVE, ratesNow: RATES_UP });
  ok("bez parametrow trzymamy kwote zapisana", !noParams.repriced);

  const broken = repriceSavedItem(
    { ...item(), params: { metalId: "nie-ma-takiego-metalu" } },
    { ratesAtSave: RATES_AT_SAVE, ratesNow: RATES_UP }
  );
  ok("zepsute parametry nie podnosza ceny", broken.unitGrosze === item().unit_grosze && !broken.repriced);
}

// ------------------------------------------------------------
// 5. Kursy bez zmian: kwota ma zostac co do grosza
// ------------------------------------------------------------
{
  const base = item();
  const r = repriceSavedItem(base, { ratesAtSave: RATES_AT_SAVE, ratesNow: { ...RATES_AT_SAVE } });
  ok("ten sam kurs nie rusza kwoty", r.unitGrosze === base.unit_grosze && !r.repriced);
}

console.log(failed ? `\n${failed} bledow` : "\nWszystko sie zgadza");
process.exit(failed ? 1 : 0);
