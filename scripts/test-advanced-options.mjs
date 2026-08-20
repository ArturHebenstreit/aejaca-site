// ============================================================
// PODPOWIEDZ O TRYBIE ZAAWANSOWANYM: czy mowi prawde
// ============================================================
// Podpowiedz obiecuje klientowi konkret: tyle a tyle filamentow, takie a
// takie parametry, przycisk prowadzacy do wlasciwej zakladki. Kazda z tych
// obietnic moze sie po cichu rozjechac, bo tekst marketingowy nie wywala
// buildu sam z siebie:
//
//   - klucz parametru z literowka -> parametr znika ze zdania, a zdanie
//     dalej wyglada poprawnie,
//   - filament pokazowy usuniety z cennika -> przyklad znika bez sladu,
//   - zakladka nazwana inaczej niz w `StudioCalculator` -> przycisk
//     przelacza tryb i zostawia klienta na cudzej usludze.
//
// Klasa awarii jest zawsze ta sama: nic nie krzyczy, tylko obietnica
// przestaje byc prawdziwa.

import { readFileSync } from "node:fs";
import {
  ADVANCED_TAB, ADVANCED_TECHS, SHOWCASE_IDS, ADVANCED_KEYS,
  advancedParams, advancedMaterials, advancedExamples,
} from "../src/data/advancedOptions.js";
import { makeHandoff, handoffFor } from "../src/data/calcHandoff.js";
import { FILAMENTS } from "../src/pricing/print3d.js";
import { RESIN_TYPES } from "../src/data/resins.js";

const LANGS = ["pl", "en", "de"];
let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const sekcja = (n) => console.log(`\n${n}`);

// --- 1. Kazdy parametr ma nazwe we wszystkich trzech jezykach -------------
sekcja("1. Nazwy parametrow trybu zaawansowanego");
// Porownanie miedzy jezykami nie wystarcza: literowka w kluczu gubi parametr
// we WSZYSTKICH trzech naraz, wiec liczby dalej sie zgadzaja. Sprawdzamy
// wiec, czy kazdy zadeklarowany klucz naprawde ma nazwe w slowniku.
for (const tech of ADVANCED_TECHS) {
  const zadeklarowane = ADVANCED_KEYS[tech] || [];
  if (!zadeklarowane.length) zle(`${tech}: brak nazw parametrow, podpowiedz bylaby pusta`);
  for (const lang of LANGS) {
    const nazwy = advancedParams(tech, lang);
    if (nazwy.length !== zadeklarowane.length) {
      zle(`${tech}/${lang}: ${nazwy.length} nazw z ${zadeklarowane.length} kluczy (klucz nie istnieje w slowniku trybu zaawansowanego)`);
    }
  }
}
console.log(`  ${ADVANCED_TECHS.length} technologii, po ${advancedParams("3dprint", "pl").length}+ parametrow w kazdym jezyku`);

// --- 2. Liczba materialow zgadza sie z cennikiem --------------------------
sekcja("2. Liczba materialow idzie z cennika, nie z pamieci");
const filamentyZCennika = Object.values(FILAMENTS).reduce((n, seg) => n + Object.keys(seg.materials).length, 0);
const filamentyZModulu = advancedMaterials("3dprint", "pl").length;
if (filamentyZModulu !== filamentyZCennika) {
  zle(`filamenty: podpowiedz mowi ${filamentyZModulu}, cennik ma ${filamentyZCennika}`);
}
const zywiceZCennika = RESIN_TYPES.filter((r) => !r.custom).length;
const zywiceZModulu = advancedMaterials("msla", "pl").length;
if (zywiceZModulu !== zywiceZCennika) {
  zle(`zywice: podpowiedz mowi ${zywiceZModulu}, cennik ma ${zywiceZCennika}`);
}
// Laser wybiera material juz w prostym trybie. Powtorzenie tego w podpowiedzi
// byloby obietnica czegos, co klient wlasnie ma przed soba.
for (const tech of ["co2", "fiber"]) {
  if (advancedMaterials(tech, "pl").length !== 0) {
    zle(`${tech}: podpowiedz obiecuje wybor materialu, ktory prosty tryb juz daje`);
  }
}
console.log(`  filamenty: ${filamentyZModulu}, zywice: ${zywiceZModulu}, laser: material wybierany wyzej`);

// --- 3. Przyklady naprawde istnieja --------------------------------------
sekcja("3. Materialy pokazowe istnieja w cenniku");
for (const [tech, ids] of Object.entries(SHOWCASE_IDS)) {
  const przyklady = advancedExamples(tech, "pl");
  if (przyklady.length !== ids.length) {
    zle(`${tech}: ${ids.length} pozycji pokazowych, w cenniku odnalazlo sie ${przyklady.length}`);
  }
  for (const lang of LANGS) {
    if (advancedExamples(tech, lang).length !== ids.length) {
      zle(`${tech}/${lang}: przyklad bez etykiety w tym jezyku`);
    }
  }
}
// Przyklad nie moze byc tym samym, co klient wlasnie odrzuca. "Wybierzesz
// z 21, na przyklad PLA" jest zdaniem, ktore pogarsza sprawe.
if (advancedExamples("3dprint", "pl").includes("PLA")) {
  zle("filament pokazowy to PLA, czyli dokladnie to, co klient chcial zmienic");
}
console.log(`  ${Object.keys(SHOWCASE_IDS).map((t) => `${t}: ${advancedExamples(t, "pl").join(", ")}`).join(" | ")}`);

// --- 4. Zakladki trybu zaawansowanego istnieja ---------------------------
sekcja("4. Przycisk trafia we wlasciwa zakladke");
const kalkulator = readFileSync(new URL("../src/components/StudioCalculator.jsx", import.meta.url), "utf8");
const blokTechs = kalkulator.match(/const TECHS = \[([\s\S]*?)\n\];/);
if (!blokTechs) {
  zle("nie znalazlem listy TECHS w StudioCalculator.jsx");
} else {
  const znane = new Set([...blokTechs[1].matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]));
  for (const [tech, tab] of Object.entries(ADVANCED_TAB)) {
    if (!znane.has(tab)) zle(`${tech} -> "${tab}": takiej zakladki nie ma w trybie zaawansowanym`);
  }
  for (const tech of ADVANCED_TECHS) {
    if (!ADVANCED_TAB[tech]) zle(`${tech}: technologia bez przypisanej zakladki, przycisk zostawilby klienta gdzie indziej`);
  }
  console.log(`  ${Object.keys(ADVANCED_TAB).length} mapowan, wszystkie wskazuja na istniejace zakladki`);
}

// --- 5. Podpowiedz jest podpieta i dostaje przelacznik --------------------
sekcja("5. Podpowiedz jest renderowana tam, gdzie zapada wybor");
const simple = readFileSync(new URL("../src/components/calculators/SimpleStudioCalc.jsx", import.meta.url), "utf8");
const ile = (simple.match(/<AdvancedHint/g) || []).length;
if (ile < 2) zle(`<AdvancedHint> renderowany ${ile} raz: ma stac i przy druku, i przy materiale lasera`);
if (!/onAdvanced\s*=\s*null/.test(simple)) zle("SimpleStudioCalc nie przyjmuje onAdvanced");
if (!/onAdvanced=\{openAdvanced\}/.test(kalkulator)) zle("StudioCalculator nie podaje openAdvanced do szybkiej wyceny");

// Zdanie o zywicy czytalo `getResin(...)?.name`, a takiego pola w cenniku
// zywic nie ma: karta MSLA po cichu nie pokazywala zadnej zywicy.
if (/getResin\([^)]*\)\?\.name/.test(simple)) {
  zle("nazwa zywicy czytana z pola `name`, ktorego RESIN_TYPES nie ma");
}
if (RESIN_TYPES.some((r) => r.name !== undefined)) {
  zle("RESIN_TYPES ma teraz pole `name`: sprawdz, ktore pole ma czytac karta MSLA");
}
console.log(`  <AdvancedHint> w ${ile} miejscach, przelacznik podpiety, nazwa zywicy z pola label`);

// --- 6. Plik przechodzi razem z klientem ---------------------------------
sekcja("6. Przejscie do trybu zaawansowanego zabiera plik");

// Paczka bez geometrii albo o nieznanym rodzaju nie moze udawac dobrej:
// kalkulator czytalby pola, ktorych nie ma, i pokazal cene z niczego.
if (makeHandoff({ kind: "mesh", data: null }) !== null) zle("paczka bez geometrii nie zostala odrzucona");
if (makeHandoff({ kind: "cos", data: { volumeCm3: 1 } }) !== null) zle("paczka o nieznanym rodzaju nie zostala odrzucona");

const siatka = makeHandoff({ kind: "mesh", name: "a.stl", data: { volumeCm3: 12 }, scale: 2 });
if (!siatka || siatka.scale !== 2) zle("poprawna paczka siatki nie powstala");
if (handoffFor(siatka, "vector")) zle("siatka trafilaby do kalkulatora lasera");
if (!handoffFor(siatka, "mesh")) zle("siatka nie trafia do kalkulatora druku");
// Skala musi jechac OSOBNO. Gdyby geometria byla juz przeskalowana, tryb
// zaawansowany nalozylby swoja skale drugi raz i cena poszlaby w sufit.
if (/data:\s*scaledStl|data:\s*scaledSvg/.test(simple)) {
  zle("szybka wycena wysyla geometrie juz przeskalowana: tryb zaawansowany przeskaluje ja po raz drugi");
}
if (!/makeHandoff\(\{ kind: "mesh"[^}]*data: stlData/.test(simple)) zle("siatka nie jest pakowana w skali oryginalu");
if (!/makeHandoff\(\{ kind: "vector"[^}]*data: svgData/.test(simple)) zle("rysunek nie jest pakowany w skali oryginalu");

// Kazdy kalkulator, ktory moze paczke dostac, musi ja tez SKASOWAC. Bez tego
// plik wracalby przy kazdym powrocie do zakladki i nie dalby sie usunac.
for (const plik of ["Print3DCalc.jsx", "CO2LaserCalc.jsx", "FiberLaserCalc.jsx"]) {
  const tresc = readFileSync(new URL(`../src/components/calculators/${plik}`, import.meta.url), "utf8");
  if (!/handoff\s*=\s*null/.test(tresc)) zle(`${plik} nie przyjmuje paczki z pliku`);
  if (!/onHandoffUsed\?\.\(\)/.test(tresc)) zle(`${plik} nie kasuje paczki, plik wracalby po usunieciu`);
}
// Rodzaj musi sie zgadzac z zakladka: siatka do druku, rysunek do lasera.
for (const [zakladka, rodzaj] of [["3dprint", "mesh"], ["resin_msla", "mesh"], ["co2_laser", "vector"], ["fiber_laser", "vector"]]) {
  const wiersz = kalkulator.split("\n").find((w) => w.includes(`activeTech === "${zakladka}"`));
  if (!wiersz || !wiersz.includes(`handoffFor(handoff, "${rodzaj}")`)) {
    zle(`zakladka ${zakladka} nie dostaje paczki rodzaju ${rodzaj}`);
  }
}
console.log("  paczka jednorazowa, geometria w skali oryginalu, 4 zakladki dostaja wlasciwy rodzaj");

// --- podsumowanie --------------------------------------------------------
if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: podpowiedz o trybie zaawansowanym mowi to, co cennik.");
