// ============================================================
// TABELA MATERIALOW: czy liczby w niej i w kodzie mowia to samo
// ============================================================
// Ceny materialow to jedyne dane w wycenie, ktore pochodza SPOZA nas: rynek
// je ustala, my je tylko przepisujemy. Rozjezdzaja sie po cichu na trzy
// sposoby i za kazdym razem kwota wyglada poprawnie:
//
//   - stala domyslna zostaje w tyle za tabela, wiec material nieznany
//     wycenia sie wedlug rynku sprzed roku,
//   - pozycja kupowana na sztuki (szklanka, plytka lupkowa) dostaje cene za
//     metr kwadratowy, czyli liczbe bez znaczenia,
//   - material rozliczany wagowo (srebro, zloto) dostaje jakakolwiek cene
//     i przestaje isc do wyceny indywidualnej.
//
// Zadnego z tych trzech nie zglosi zaden wyjatek.

import { readFileSync } from "node:fs";
import {
  DEFAULT_PLN_PER_M2, MATERIAL_WASTE, MATERIAL_MARKUP,
  materialCostPLN, ratePerPiece, pricedSeparately, salePerM2,
} from "../src/pricing/materialStock.js";
import { CUT_MATERIALS, ENGRAVE_MATERIALS } from "../src/pricing/laserCo2.js";
import { MATERIAL_SEED, seedAsStock } from "../src/pricing/materialStockSeed.js";
import { MATERIALS as FIBER_MATERIALS } from "../src/pricing/laserFiber.js";

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const ok = (m) => console.log(`  OK ${m}`);
const sekcja = (n) => console.log(`\n${n}`);

// Tabela zyje w bazie, ale jej wartosci startowe opisuja, co uwazamy za cene
// rynkowa, i sa jednym plikiem: czyta go serwer przy zakladaniu tabeli, skrypt
// etykiet "od X zl" i ten test. Wczesniej byly tekstem SQL wyluskiwanym stad
// wyrazeniem regularnym, ktore przestawalo pasowac przy pierwszej zmianie
// zapisu, a test milkl zamiast zaczerwienic sie.
const WIERSZE = MATERIAL_SEED.map((m) => ({
  id: m.material_id, nazwa: m.name_pl, m2: m.pln_per_m2, szt: m.pln_per_piece,
}));

const mediana = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

// --- 1. Tabela w ogole sie czyta -----------------------------------------
sekcja("1. Wartosci startowe tabeli");
if (WIERSZE.length < 20) zle(`zestaw startowy ma tylko ${WIERSZE.length} pozycji, a cennik lasera potrzebuje ich wiecej`);
else ok(`${WIERSZE.length} pozycji w zestawie startowym`);

// --- 2. Stala domyslna trzyma sie mediany --------------------------------
sekcja("2. Stawka domyslna kontra tabela");
const naMetry = WIERSZE.filter((w) => w.m2 > 0).map((w) => w.m2);
const med = mediana(naMetry);
const srednia = naMetry.reduce((a, b) => a + b, 0) / naMetry.length;
// Mediana, a nie srednia: srednia jest ciagnieta przez tytan i miedz, ktorych
// prawie nie tniemy, wiec opisuje material, ktorego nikt nie zamawia.
if (Math.abs(DEFAULT_PLN_PER_M2 - med) > med * 0.25) {
  zle(`stala domyslna ${DEFAULT_PLN_PER_M2} zl odjechala od mediany tabeli ${med} zl o wiecej niz cwierc`);
} else {
  ok(`domyslna ${DEFAULT_PLN_PER_M2} zl przy medianie ${med} zl (srednia ${srednia.toFixed(0)} zl, ${naMetry.length} pozycji)`);
}

// --- 3. Sztuki nie udaja metrow ------------------------------------------
sekcja("3. Materialy kupowane na sztuki");
const stock = seedAsStock();
const NA_SZTUKI = ["glass", "stone"];
for (const id of NA_SZTUKI) {
  const w = WIERSZE.find((x) => x.id === id);
  if (!w) { zle(`${id}: brak w tabeli`); continue; }
  if (!(w.szt > 0)) zle(`${id}: kupujemy go sztukami, a nie ma ceny za sztuke`);
  if (w.m2 > 0) zle(`${id}: ma cene za metr kwadratowy, ktora dla przedmiotu nic nie znaczy`);
  if (ratePerPiece(id, stock) == null) zle(`${id}: silnik nie widzi ceny za sztuke`);
}
// Cena za sztuke NIE zalezy od pola: przedmiot jest jeden, niezaleznie od
// tego, jak duzy wzor na nim wypalimy.
const male = materialCostPLN({ areaCm2: 20, matId: "glass", podloze: "our_stock", stock });
const duze = materialCostPLN({ areaCm2: 400, matId: "glass", podloze: "our_stock", stock });
if (male !== duze) zle(`cena szklanki zalezy od wielkosci graweru (${male} vs ${duze}), a to jest ta sama szklanka`);
else ok(`cena za sztuke stala niezaleznie od pola graweru (${male.toFixed(2)} zl)`);

// --- 4. Metale szlachetne ida do wyceny indywidualnej --------------------
sekcja("4. Srebro i zloto");
for (const id of ["silver", "gold"]) {
  if (!pricedSeparately(id, stock)) zle(`${id}: dostal cene w tabeli, a rozliczamy go wagowo`);
  if (materialCostPLN({ areaCm2: 100, matId: id, podloze: "our_stock", stock }) !== 0) {
    zle(`${id}: doliczony do kwoty, choc ma isc do wyceny indywidualnej`);
  }
}
ok("srebro i zloto nie wchodza do automatycznej kwoty");

// --- 5. Kazdy material z cennika ma swoja cene ---------------------------
sekcja("5. Pokrycie cennika");
const wTabeli = new Set(WIERSZE.map((w) => w.id));
const zCennika = [...CUT_MATERIALS, ...ENGRAVE_MATERIALS, ...FIBER_MATERIALS].filter((m) => !m.custom).map((m) => m.id);
const braki = [...new Set(zCennika)].filter((id) => !wTabeli.has(id));
if (braki.length) {
  zle(`materialy bez ceny w tabeli, wyceniaja sie stawka domyslna: ${braki.join(", ")}`);
} else {
  ok(`wszystkie ${new Set(zCennika).size} materialow z cennika ma swoja cene`);
}

// --- 6. Zapas na odpad jest w cenie, ale nie przy sztukach ---------------
sekcja("6. Zapas na odpad");
const arkusz = materialCostPLN({ areaCm2: 10000, matId: "acr5", podloze: "our_stock", stock });
const bezZapasu = (10000 / 10000) * (WIERSZE.find((w) => w.id === "acr5")?.m2 || 0);
if (Math.abs(arkusz - bezZapasu * MATERIAL_WASTE * MATERIAL_MARKUP) > 0.01) {
  zle(`zapas ${MATERIAL_WASTE} nie wchodzi do ceny z metrow: ${arkusz.toFixed(2)} zamiast ${(bezZapasu * MATERIAL_WASTE * MATERIAL_MARKUP).toFixed(2)}`);
}
ok(`metr kwadratowy akrylu 5 mm kosztuje klienta ${arkusz.toFixed(2)} zl (zakup ${bezZapasu.toFixed(0)}, zapas ${Math.round((MATERIAL_WASTE - 1) * 100)}%, narzut ${Math.round((MATERIAL_MARKUP - 1) * 100)}%)`);

// --- 6b. Narzut wchodzi do obu drog liczenia -----------------------------
sekcja("6b. Narzut na material");
// W tabeli trzymamy KOSZT ZAKUPU, wiec narzut musi dojsc w silniku, i to
// tak samo przy metrach i przy sztukach. Doliczony tylko w jednej drodze
// bylby bledem niewidocznym: obie kwoty wygladaja poprawnie osobno.
const kosztAkrylu = WIERSZE.find((w) => w.id === "acr5")?.m2 || 0;
const zMetrow = materialCostPLN({ areaCm2: 10000, matId: "acr5", podloze: "our_stock", stock });
const oczekiwaneZMetrow = kosztAkrylu * MATERIAL_WASTE * MATERIAL_MARKUP;
if (Math.abs(zMetrow - oczekiwaneZMetrow) > 0.01) {
  zle(`narzut nie wchodzi do ceny z metrow: ${zMetrow.toFixed(2)} zamiast ${oczekiwaneZMetrow.toFixed(2)}`);
}
const kosztSzkla = WIERSZE.find((w) => w.id === "glass")?.szt || 0;
const zeSztuk = materialCostPLN({ areaCm2: 100, matId: "glass", podloze: "our_stock", stock });
if (Math.abs(zeSztuk - kosztSzkla * MATERIAL_MARKUP) > 0.01) {
  zle(`narzut nie wchodzi do ceny za sztuke: ${zeSztuk.toFixed(2)} zamiast ${(kosztSzkla * MATERIAL_MARKUP).toFixed(2)}`);
}
if (Math.abs(salePerM2(kosztAkrylu) - kosztAkrylu * MATERIAL_MARKUP) > 0.01) {
  zle("cena sprzedazy pokazywana w panelu liczy sie inaczej niz w silniku");
}
ok(`narzut ${Math.round((MATERIAL_MARKUP - 1) * 100)}% w obu drogach: akryl ${zMetrow.toFixed(2)} zl/m2, szklo ${zeSztuk.toFixed(2)} zl/szt.`);

// Panel administracyjny ma wlasna kopie tej liczby, bo wdraza sie go osobno.
// Rozjazd oznaczalby, ze wlasciciel widzi inna cene sprzedazy niz klient.
const adminSrc = readFileSync(new URL("../admin/server.js", import.meta.url), "utf8");
const wAdminie = Number(/const MATERIAL_MARKUP = ([\d.]+);/.exec(adminSrc)?.[1]);
if (wAdminie !== MATERIAL_MARKUP) {
  zle(`panel liczy narzut ${wAdminie}, a silnik ${MATERIAL_MARKUP}: wlasciciel widzi inna cene niz klient`);
} else {
  ok(`panel i silnik licza ten sam narzut (${MATERIAL_MARKUP})`);
}

// --- 7. Rozpiska pokazuje material ---------------------------------------
sekcja("7. Material widoczny w rozpisce");
const silnik = readFileSync(new URL("../src/pricing/laserCo2.js", import.meta.url), "utf8");
if ((silnik.match(/label: l\.materialCost/g) || []).length < 4) {
  zle("material nie jest wypisany w rozpisce obu silnikow razem z przypadkiem wyceny indywidualnej");
}
if (!/materialSeparate/.test(silnik)) zle("brak pozycji 'wycena indywidualna', wiec znikajaca linia czyta sie jak material gratis");
ok("ciecie i grawer wypisuja material, takze gdy rozliczamy go osobno");

// --- 8. Etykieta "od" liczy sie z tej samej tabeli --------------------------
sekcja("8. Cena 'od' na kartach uslug");
// Skrypt etykiet nie ma dostepu do bazy, wiec bierze zestaw startowy. Gdy
// przestanie go podawac, silnik zjedzie na stawke domyslna i karta uslugi
// zacznie obiecywac inna cene niz kalkulator. Roznica bywa mniejsza niz
// zaokraglenie do zlotowki, wiec sam `--check` tego nie zlapie.
const deriveSrc = readFileSync(new URL("./derive-service-prices.mjs", import.meta.url), "utf8");
if (!/seedAsStock\(\)/.test(deriveSrc)) {
  zle("skrypt cen 'od' nie bierze tabeli materialow, wiec karta uslugi liczy inna stawke niz koszyk");
} else if (!/fn\([^\n]*,\s*"pl",\s*stock\)/.test(deriveSrc)) {
  zle("tabela jest wczytana, ale nie trafia do wywolania kalkulatora");
} else {
  ok("karta uslugi i koszyk licza material z tego samego zestawu");
}

if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: tabela materialow i wycena mowia to samo.");
