#!/usr/bin/env node
// ============================================================
// ASYSTENT MOWI TO, CO ROBI SERWIS
// ============================================================
// Wiedza asystenta (`chat-api/context.js`) to szescdziesiat kilobajtow tekstu
// pisanego recznie, w ktorym stoja KWOTY I TERMINY. Kod obok zmienia sie dalej,
// a tekst nie ma jak sie o tym dowiedziec. Przeglad z 2026-09-03 znalazl cztery
// rozjazdy naraz, wszystkie ciche:
//
//   wysylka kurierem po Polsce: asystent 30 zl, kasa 19,49 zl
//   wysylka do Wielkiej Brytanii: asystent 70 do 120 zl, kasa 180 zl
//   kod powitalny: asystent 90 dni, kod 45 dni (skrocone 2026-08-31)
//   progi nakladu: dwa akapity, jeden z liczbami, drugi bez
//
// Kierunek "za drogo" kosztuje zamowienie: klient rezygnuje przy liczbie, ktora
// nie jest prawdziwa. Kierunek "za tanio" kosztuje zaufanie: klient dochodzi do
// kasy i widzi wiecej, niz mu obiecano. Termin kodu podany o polowe za dlugo to
// obietnica, ktora wygasa klientowi w reku.
//
// Ten sprawdzian NIE czyta tekstu ze zrozumieniem. Bierze liczby z KODU
// i sprawdza, czy stoja w tekscie. Kiedy ktos zmieni stawke albo waznosc,
// build pada, dopoki wiedza asystenta nie zostanie poprawiona.
//
// Uruchamiany w `npm run build`.

import { readFileSync } from "node:fs";
import { ZONES, FREE_SHIPPING_FROM_GROSZE } from "../chat-api/pricing/shipping.js";
import { QUANTITY_TIERS } from "../chat-api/pricing/config.js";
import { RODZAJE_KODOW } from "../chat-api/discounts.js";
import { ENGRAVING_OPTIONS, ENGRAVING_FREE_ABOVE_PLN } from "../chat-api/pricing/jewelryConfig.js";
import { CASTING_ENVELOPE_MM } from "../chat-api/pricing/preciousMetalCasting.js";

const wiedza = readFileSync(new URL("../chat-api/context.js", import.meta.url), "utf8");

let bledy = 0;
const ok = (warunek, opis, co) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + (co === undefined ? "" : "  ->  " + JSON.stringify(co))); bledy += 1; }
};
const zlote = (grosze) => (grosze / 100).toFixed(2).replace(/\.00$/, "");

console.log("1. Stawki wysylki, strefa po strefie");
{
  for (const [id, z] of Object.entries(ZONES)) {
    const kwota = zlote(z.courierGrosze);
    ok(wiedza.includes(`PLN ${kwota}`), `strefa ${id}: kurier ${kwota} zl stoi w wiedzy asystenta`, kwota);
  }
  const paczkomat = zlote(ZONES.pl.lockerGrosze);
  ok(wiedza.includes(`PLN ${paczkomat}`), `paczkomat ${paczkomat} zl stoi w wiedzy asystenta`, paczkomat);
}

console.log("2. Zadnej kwoty wysylki wzietej z sufitu");
{
  // Konkretne liczby, ktore tam kiedys staly i ktore trzeba bylo wyciac.
  // Nie ma sensu szukac ich ogolnym wzorcem: "PLN 30" trafia takze w zdanie
  // o czyms innym. Wpisujemy te, ktore naprawde klamaly.
  for (const zle of ["Courier: from PLN 30", "Parcel locker: from PLN 17", "from PLN 50 (≈€12)"]) {
    ok(!wiedza.includes(zle), `nie ma juz zdania "${zle}"`);
  }
}

console.log("3. Darmowa wysylka mowi, gdzie obowiazuje");
{
  const prog = zlote(FREE_SHIPPING_FROM_GROSZE);
  ok(wiedza.includes(`PLN ${prog}`), `prog darmowej wysylki ${prog} zl`, prog);
  // Kod daje ja WYLACZNIE dla strefy `pl` (`shippingGrosze`), wiec zdanie bez
  // tego zastrzezenia jest obietnica zlozona takze Niemcowi.
  ok(/POLAND ONLY/i.test(wiedza), "i zaznacza, ze dotyczy tylko Polski");
}

console.log("4. Waznosc kazdego rodzaju kodu");
{
  for (const [nazwa, r] of Object.entries(RODZAJE_KODOW)) {
    ok(wiedza.includes(`${r.dni} days`), `rodzaj ${nazwa}: ${r.dni} dni stoi w wiedzy asystenta`, r.dni);
  }
  ok(!/valid 90 days and usable once/.test(wiedza),
    "kod powitalny nie obiecuje juz 90 dni, skrocony do 45 dnia 2026-08-31");
}

console.log("5. Progi nakladu z rabatem");
{
  for (const t of QUANTITY_TIERS.filter((x) => x.discount)) {
    const procent = Math.round(t.discount * 100);
    ok(wiedza.includes(`${t.min} to ${t.max} pieces −${procent}%`)
      || wiedza.includes(`${t.min}-${t.max} szt. ${procent}%`),
      `prog ${t.min}-${t.max} daje ${procent}%`, { min: t.min, max: t.max, procent });
  }
}

console.log("6. Cennik graweru i prog gratisu");
{
  for (const o of ENGRAVING_OPTIONS.filter((x) => x.pricePLN)) {
    ok(wiedza.includes(`${o.pricePLN} PLN`), `grawer ${o.id}: ${o.pricePLN} zl`, o.pricePLN);
  }
  ok(wiedza.includes(`${ENGRAVING_FREE_ABOVE_PLN} PLN`), `prog graweru ${ENGRAVING_FREE_ABOVE_PLN} zl`);
  // Wariant "obie strony" wypadl z oferty 2026-09-03. Sprawdzamy POZYTYWNIE,
  // ze wiedza asystenta o tym mowi. Wzorzec szukajacy samej nazwy wariantu
  // trafial w zdanie, ktore wlasnie oglasza jego zniknięcie, wiec bramka
  // zglaszala blad tam, gdzie tekst byl poprawny.
  ok(ENGRAVING_OPTIONS.every((o) => o.id !== "both"), "cennik nie ma juz wariantu `both`");
  ok(/both sides" option is gone/i.test(wiedza),
    "a asystent wie, ze wariant dwoch stron zniknal, gdyby klient o niego pytal");
}

console.log("7. Limit kolby odlewniczej");
{
  const [a, b, c] = CASTING_ENVELOPE_MM;
  ok(wiedza.includes(`${a} x ${b} x ${c} mm`) || wiedza.includes(`${a} × ${b} × ${c} mm`),
    `limit modelu ${a} x ${b} x ${c} mm`, CASTING_ENVELOPE_MM);
}

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nWiedza asystenta zgodna z kodem");
process.exit(bledy ? 1 : 0);
