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
import { makeHandoff, handoffFor, stashHandoff, claimHandoff, clearHandoff } from "../src/data/calcHandoff.js";
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
  // Nie kazda nazwa zakladki ma dzis wlasny kafelek: druk zywiczny zostal
  // wciagniety pod druk 3D, a stara nazwa zyje dalej jako alias, bo stoi
  // w odnosnikach sklepu i w linkach u klientow.
  const aliasy = Object.fromEntries(
    [...(kalkulator.match(/const ALIASY_TECH = \{([\s\S]*?)\};/)?.[1] || "")
      .matchAll(/(\w+):\s*\{\s*tech:\s*"([^"]+)"/g)].map((m) => [m[1], m[2]])
  );
  // WARUNEK JEST MOCNIEJSZY NIZ "TAKI KAFELEK ISTNIEJE". Sprawdzamy, czy
  // zakladka naprawde COS RENDERUJE, bo dokladnie tego zabraklo, gdy kafelek
  // znikal: identyfikator dalej wygladal sensownie, mapowanie prowadzilo
  // donikad, a klient dostawal pusty panel bez zadnego bledu.
  const galezie = new Set([...kalkulator.matchAll(/activeTech === "([^"]+)"\s*&&/g)].map((m) => m[1]));
  for (const [tech, tab] of Object.entries(ADVANCED_TAB)) {
    const cel = aliasy[tab] || tab;
    if (!znane.has(cel)) zle(`${tech} -> "${tab}": takiej zakladki nie ma w trybie zaawansowanym`);
    if (!galezie.has(cel)) zle(`${tech} -> "${tab}" (${cel}): zakladka nic nie renderuje, klient dostanie pusty panel`);
  }
  for (const tech of ADVANCED_TECHS) {
    if (!ADVANCED_TAB[tech]) zle(`${tech}: technologia bez przypisanej zakladki, przycisk zostawilby klienta gdzie indziej`);
  }
  // Alias musi byc przepuszczony w OBU drogach: przy odnosniku `?tab=` i przy
  // przycisku z szybkiej wyceny. Rozjechanie sie ich dawalo by dzialajacy link
  // i martwy przycisk, albo odwrotnie.
  if (Object.keys(aliasy).length && !/ALIASY_TECH\[tab\]/.test(kalkulator)) {
    zle("przycisk z szybkiej wyceny nie przepuszcza zakladki przez aliasy, wiec trafi w nieistniejaca galaz");
  }
  if (Object.keys(aliasy).length && !/ALIASY_TECH\[urlTab\]/.test(kalkulator)) {
    zle("odnosnik ?tab= nie przepuszcza zakladki przez aliasy, wiec stary link otworzy szybka wycene");
  }
  console.log(`  ${Object.keys(ADVANCED_TAB).length} mapowan i ${Object.keys(aliasy).length} aliasow, wszystkie trafiaja w galaz, ktora cos renderuje`);
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
// LISTE WYPROWADZAMY Z KODU, a nie wpisujemy z pamieci. Wpisana recznie
// zostawala przy zakladce, ktora zniknela, i test wywalal build z powodu,
// ktorego juz nie bylo, zamiast pilnowac tych zakladek, ktore sa.
const OCZEKIWANY_RODZAJ = { Print3DCalc: "mesh", CO2LaserCalc: "vector", FiberLaserCalc: "vector" };
const wiersze = kalkulator.split("\n").filter((w) => /activeTech === "[^"]+"\s*&&/.test(w));
if (!wiersze.length) zle("nie znalazlem zadnej galezi trybu zaawansowanego");
for (const wiersz of wiersze) {
  const zakladka = wiersz.match(/activeTech === "([^"]+)"/)[1];
  const komponent = Object.keys(OCZEKIWANY_RODZAJ).find((k) => wiersz.includes(`<${k}`));
  if (!komponent) continue; // np. odlewy zywiczne: nie przyjmuja pliku
  const rodzaj = OCZEKIWANY_RODZAJ[komponent];
  if (!wiersz.includes(`handoffFor(handoff, "${rodzaj}")`)) {
    zle(`zakladka ${zakladka} nie dostaje paczki rodzaju ${rodzaj}`);
  }
}
console.log(`  paczka jednorazowa, geometria w skali oryginalu, ${wiersze.length} zakladek sprawdzonych`);

// --- 7. Model jedzie takze do sklepu -------------------------------------
sekcja("7. Poczekalnia dla przejscia do sklepu");
clearHandoff();

const doSklepu = makeHandoff({ kind: "mesh", name: "b.stl", data: { volumeCm3: 5 }, scale: 1.5 });
stashHandoff(doSklepu);
// Rodzaj musi sie zgadzac, inaczej rysunek trafilby na karte druku.
if (claimHandoff("vector")) zle("paczka siatki dala sie odebrac jako rysunek");
const odebrana = claimHandoff("mesh");
if (!odebrana || odebrana.scale !== 1.5) zle("paczka nie dotarla do sklepu ze skala");
// Odbior JEDNORAZOWY: inaczej plik doklejalby sie do kazdej kolejnej uslugi.
if (claimHandoff("mesh")) zle("paczke dalo sie odebrac drugi raz, plik doklejalby sie do kolejnych uslug");

// Zamiar sprzed godziny nie jest juz zamiarem.
stashHandoff(doSklepu);
const prawdziwyNow = Date.now;
Date.now = () => prawdziwyNow() + 16 * 60 * 1000;
if (claimHandoff("mesh")) zle("przeterminowana paczka nadal sie odbiera");
Date.now = prawdziwyNow;
clearHandoff();

const konfigurator = readFileSync(new URL("../src/components/shop/ServiceConfigurator.jsx", import.meta.url), "utf8");
if (!/claimHandoff\("mesh"\)/.test(konfigurator)) zle("karta uslugi nie odbiera modelu z kalkulatora");
if (!/claimHandoff\("vector"\)/.test(konfigurator)) zle("karta uslugi nie odbiera rysunku z kalkulatora");
// Plik przeniesiony musi isc TA SAMA droga co wybrany na miejscu, inaczej
// omijalby kontrole serwera i trafil do koszyka bez tokenu.
if (!/async function przyjmijPlik/.test(konfigurator)) zle("brak wspolnej drogi przyjecia modelu");
if (!/await przyjmijPlik\(f\)/.test(konfigurator)) zle("wybor pliku na miejscu nie idzie wspolna droga");
if (!/await przyjmijWektor\(f\)/.test(konfigurator)) zle("wybor rysunku na miejscu nie idzie wspolna droga");
if (!/onClick=\{onShop\}/.test(simple)) zle("przycisk sklepu nie odklada paczki, model zostawalby w kalkulatorze");
console.log("  odbior jednorazowy, rodzaj sprawdzany, waznosc kwadrans, wspolna droga przyjecia pliku");

// --- podsumowanie --------------------------------------------------------
if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: podpowiedz o trybie zaawansowanym mowi to, co cennik.");
