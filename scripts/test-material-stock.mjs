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
  DEFAULT_PLN_PER_M2, MATERIAL_WASTE, materialCostPLN, ratePerPiece, pricedSeparately,
} from "../src/pricing/materialStock.js";
import { CUT_MATERIALS, ENGRAVE_MATERIALS } from "../src/pricing/laserCo2.js";
import { MATERIALS as FIBER_MATERIALS } from "../src/pricing/laserFiber.js";

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const ok = (m) => console.log(`  OK ${m}`);
const sekcja = (n) => console.log(`\n${n}`);

// Tabela zyje w bazie, ale jej wartosci startowe stoja w kodzie serwera i to
// one opisuja, co uwazamy za cene rynkowa. Czytamy je stamtad.
const server = readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
const blok = server.slice(server.indexOf("INSERT INTO material_stock"), server.indexOf("ON CONFLICT (material_id)"));
const WIERSZE = [...blok.matchAll(/\('([a-z0-9_]+)','([^']*)','[^']*','[^']*',(\d+(?:\.\d+)?),(NULL|\d+(?:\.\d+)?),/g)]
  .map((m) => ({ id: m[1], nazwa: m[2], m2: Number(m[3]), szt: m[4] === "NULL" ? null : Number(m[4]) }));

const mediana = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

// --- 1. Tabela w ogole sie czyta -----------------------------------------
sekcja("1. Wartosci startowe tabeli");
if (WIERSZE.length < 20) zle(`odczytalem tylko ${WIERSZE.length} pozycji: wzorzec przestal pasowac do zapisu w serwerze`);
else ok(`${WIERSZE.length} pozycji odczytanych z serwera`);

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
const stock = WIERSZE.map((w) => ({ material_id: w.id, pln_per_m2: w.m2, pln_per_piece: w.szt }));
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
if (Math.abs(arkusz - bezZapasu * MATERIAL_WASTE) > 0.01) {
  zle(`zapas ${MATERIAL_WASTE} nie wchodzi do ceny z metrow: ${arkusz.toFixed(2)} zamiast ${(bezZapasu * MATERIAL_WASTE).toFixed(2)}`);
}
ok(`metr kwadratowy akrylu 5 mm kosztuje ${arkusz.toFixed(2)} zl razem z zapasem ${Math.round((MATERIAL_WASTE - 1) * 100)}%`);

// --- 7. Rozpiska pokazuje material ---------------------------------------
sekcja("7. Material widoczny w rozpisce");
const silnik = readFileSync(new URL("../src/pricing/laserCo2.js", import.meta.url), "utf8");
if ((silnik.match(/label: l\.materialCost/g) || []).length < 4) {
  zle("material nie jest wypisany w rozpisce obu silnikow razem z przypadkiem wyceny indywidualnej");
}
if (!/materialSeparate/.test(silnik)) zle("brak pozycji 'wycena indywidualna', wiec znikajaca linia czyta sie jak material gratis");
ok("ciecie i grawer wypisuja material, takze gdy rozliczamy go osobno");

if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: tabela materialow i wycena mowia to samo.");
