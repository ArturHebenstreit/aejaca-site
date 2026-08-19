#!/usr/bin/env node
// ============================================================
// WYBOR MATERIALU Z MAGAZYNU MUSI ZMIENIAC CENE
// ============================================================
// Przy "Na waszym materiale" bylo puste pole tekstowe. Trafialo w osobe,
// ktora wybrala szybka wycene wlasnie dlatego, ze na materialach sie nie zna,
// wiec odpowiadala "cos z drewna" albo nic. Zlecenie wracalo do wymiany maili,
// czyli do tego, czego ten formularz mial oszczedzic.
//
// Wybor z listy jest jednak wart tyle, ile realnie zmienia. Lista, ktora
// wyglada jak wybor, a cena pod nia stoi w miejscu, jest gorsza od pustego
// pola: klient wierzy, ze zamowil akryl 5 mm, a placi za sklejke 3 mm i nikt
// tego nie zauwazy do momentu realizacji.
//
// Ten test pilnuje czterech rzeczy:
//   1. lista pochodzi z cennika i nie zawiera nic spoza niego,
//   2. wybor realnie przestawia kwote,
//   3. wybor z obcej technologii NIE przecieka do wyceny,
//   4. metali szlachetnych nie wydajemy z magazynu.
//
//   node scripts/test-our-stock.mjs

import { stockOptions, stockAllowed, STOCK_OTHER } from "../src/data/ourStock.js";
import { ENGRAVE_MATERIALS, CUT_MATERIALS } from "../src/pricing/laserCo2.js";
import { MATERIALS as FIBER_MATERIALS } from "../src/pricing/laserFiber.js";
import { resolveTechAndParams, runCalc } from "../src/pricing/simpleQuote.js";
import { readFileSync } from "node:fs";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

// ------------------------------------------------------------
// 1. Lista pochodzi z cennika, a nie z przepisanej kopii
// ------------------------------------------------------------
console.log("\n1. Zrodlo listy");

for (const [opis, arg, cennik] of [
  ["grawer CO2", { tech: "co2", mode: "engrave" }, ENGRAVE_MATERIALS],
  ["ciecie CO2", { tech: "co2", mode: "cut" }, CUT_MATERIALS],
  ["laser swiatlowodowy", { tech: "fiber" }, FIBER_MATERIALS],
]) {
  const lista = stockOptions(arg);
  const obce = lista.filter((o) => !cennik.some((m) => m.id === o.id));
  const oczekiwane = cennik.filter((m) => !m.custom && !m.precious).length;

  if (!lista.length) zle(`${opis}: lista jest pusta, klient nie ma z czego wybrac`);
  else if (obce.length) zle(`${opis}: pozycje spoza cennika: ${obce.map((o) => o.id).join(", ")}`);
  else if (lista.length !== oczekiwane) zle(`${opis}: ${lista.length} pozycji, cennik daje ${oczekiwane}`);
  else ok(`${opis}: ${lista.length} pozycji, wszystkie z cennika`);

  if (lista.some((o) => o.id === "custom")) zle(`${opis}: "custom" z cennika wyciekl na liste jako material`);
  if (lista.some((o) => !o.label?.pl || !o.label?.en || !o.label?.de)) zle(`${opis}: pozycja bez kompletu trzech jezykow`);
}

if (STOCK_OTHER !== "custom") ok('"inny material" ma wlasny identyfikator, nie myli sie z "custom" z cennika');
else zle('"inny material" uzywa identyfikatora "custom", ktory w cenniku znaczy wycene reczna');

// ------------------------------------------------------------
// 2. Metali szlachetnych nie wydajemy z polki
// ------------------------------------------------------------
// Srebro i zloto sa w cenniku fibera, bo znakujemy je stale, ale na
// przedmiocie klienta. Na liscie "nasz material" byloby to obietnica
// blaszki ze zlota z naszego magazynu.
console.log("\n2. Metale szlachetne");

const fiber = stockOptions({ tech: "fiber" });
const szlachetne = fiber.filter((o) => FIBER_MATERIALS.find((m) => m.id === o.id)?.precious);
if (!szlachetne.length) ok("srebra ani zlota nie oferujemy z wlasnego magazynu");
else zle(`z magazynu oferujemy metale szlachetne: ${szlachetne.map((o) => o.id).join(", ")}`);

if (FIBER_MATERIALS.some((m) => m.precious)) ok("cennik fibera nadal zna metale szlachetne, wiec znakowanie ich dziala");
else zle("metale szlachetne zniknely z cennika fibera, znakowanie bizuterii przestalo istniec");

// ------------------------------------------------------------
// 3. Wybor realnie zmienia kwote
// ------------------------------------------------------------
// To jest wlasciwy test tej zmiany. Bez niego lista moze wygladac poprawnie
// i nie robic nic.
console.log("\n3. Wplyw na cene");

const rysunek = { bboxMm: { x: 200, y: 100 }, pathLengthCm: 60, engravAreaCm2: 200 };
const bazowe = {
  item: "sign", size: "palm", material: "wood", finish: "standard", quantity: "one",
  fileType: "svg", svgData: rysunek,
};

const kwota = (dodatki) => {
  const r = runCalc(resolveTechAndParams({ ...bazowe, ...dodatki }), "pl");
  return r?.unitGrosze ?? null;
};

const domyslna = kwota({ co2Mode: "cut" });
const sklejka8 = kwota({ co2Mode: "cut", stockId: "ply8" });
const akryl3 = kwota({ co2Mode: "cut", stockId: "acr3" });

if (domyslna == null) zle("domyslna wycena ciecia nie wyszla, reszta testu nic nie znaczy");
else if (sklejka8 === domyslna) zle(`wybor sklejki 8 mm nie zmienil kwoty (${domyslna} gr), lista jest ozdoba`);
else ok(`sklejka 8 mm zmienia kwote: ${domyslna} gr -> ${sklejka8} gr`);

if (akryl3 != null && akryl3 !== sklejka8) ok(`akryl 3 mm daje jeszcze inna kwote: ${akryl3} gr`);
else zle("akryl 3 mm kosztuje tyle samo co sklejka 8 mm, wiec wybor nie dziala");

const grawerDomyslny = kwota({ co2Mode: "engrave" });
const grawerSzklo = kwota({ co2Mode: "engrave", stockId: "glass" });
if (grawerSzklo != null && grawerSzklo !== grawerDomyslny) ok(`grawer na szkle rozni sie od domyslnego: ${grawerDomyslny} gr -> ${grawerSzklo} gr`);
else zle("wybor materialu przy grawerowaniu nie zmienia kwoty");

// ------------------------------------------------------------
// 4. Wybor z obcej listy nie przecieka do wyceny
// ------------------------------------------------------------
// Klient przelacza ciecie na grawerowanie, a wybor zostaje w stanie
// komponentu. Gdyby przeszedl do silnika, ten nie znalazlby stawki i policzyl
// cos innego albo nic, bez sladu na ekranie.
console.log("\n4. Wybor z obcej technologii");

const grawerZeSklejka8 = kwota({ co2Mode: "engrave", stockId: "ply8" });
if (grawerZeSklejka8 === grawerDomyslny) ok("material z listy ciecia nie wplywa na grawerowanie, wraca domysl");
else zle(`identyfikator z ciecia przeciekl do grawerowania: ${grawerDomyslny} gr -> ${grawerZeSklejka8} gr`);

const cieciePoMetalu = kwota({ co2Mode: "cut", stockId: "stainless" });
if (cieciePoMetalu === domyslna) ok("material z listy fibera nie wplywa na ciecie CO2");
else zle("identyfikator ze stali przeciekl do ciecia CO2");

const zmyslony = kwota({ co2Mode: "cut", stockId: "nie-ma-takiego" });
if (zmyslony === domyslna) ok("zmyslony identyfikator nie wywraca wyceny, wraca domysl");
else zle("zmyslony identyfikator zmienil kwote albo ja skasowal");

if (!stockAllowed("ply8", { tech: "co2", mode: "engrave" })) ok("stockAllowed odrzuca material z obcej listy");
else zle("stockAllowed przepuszcza material z obcej listy");
if (stockAllowed("ply8", { tech: "co2", mode: "cut" })) ok("stockAllowed przepuszcza material z wlasciwej listy");
else zle("stockAllowed odrzuca material z wlasciwej listy");

// ------------------------------------------------------------
// 5. Pole tekstowe nie znika, tylko schodzi pod "Inny material"
// ------------------------------------------------------------
// Nasza lista nie wyczerpuje swiata. Odebranie klientowi mozliwosci opisania
// czegos wlasnego byloby zamiana jednej blokady na druga.
console.log("\n5. Furtka na material spoza listy");

const widok = readFileSync(new URL("../src/components/calculators/SimpleStudioCalc.jsx", import.meta.url), "utf8");
const ma = (wzor, komunikat, dobry) => (wzor.test(widok) ? ok(dobry) : zle(komunikat));

ma(/STOCK_OTHER_LBL/, "zniknela pozycja \"inny material\"", "pozycja \"inny material\" jest na liscie");
ma(/wlasny && \(\s*<textarea/, "pole tekstowe nie wraca przy wyborze \"inny material\"", "pole tekstowe wraca przy \"inny material\"");
ma(/onOther=\{\(\) => \{ setStockId\(null\); setMaterialNote\(""\); \}\}/,
  "przelaczenie na wlasny material zostawia stara etykiete w notatce",
  "przelaczenie na wlasny material czysci notatke");
ma(/onPick=\{\(id, etykieta\) => \{ setStockId\(id\); setMaterialNote\(etykieta\); \}\}/,
  "wybor z listy nie zapisuje sie w notatce, wiec do pracowni nie dojedzie",
  "wybor z listy zapisuje sie w notatce zlecenia");
ma(/STOCK_HINT/, "brak zastrzezenia o dostepnosci, lista obiecuje polke, ktorej nie deklarujemy",
  "lista mowi wprost, ze dostepnosc potwierdzamy przy realizacji");

for (const klucz of ["STOCK_LBL", "STOCK_OTHER_LBL", "STOCK_HINT"]) {
  const blok = new RegExp(`${klucz} = \\{[^}]*pl:[^}]*en:[^}]*de:`, "s");
  if (blok.test(widok)) ok(`${klucz} istnieje w trzech jezykach`);
  else zle(`${klucz} nie ma kompletu trzech jezykow`);
}

// ------------------------------------------------------------
// 6. "Nie wiem, doradzcie" nie moze byc wygaszone
// ------------------------------------------------------------
// Kafelki materialow niepasujacych do wgranego pliku sa wygaszane i slusznie.
// Razem z nimi gaslo jednak "nie wiem", czyli JEDYNA odpowiedz osoby, ktora
// sie nie zna, i to dokladnie w chwili, gdy umiemy doradzic najlepiej: plik
// juz u nas lezy. Nic sie przy tym nie wywalalo, klient po prostu nie mial
// w co kliknac.
console.log("\n6. Nie wiem, doradzcie");

ma(/m\.id !== "idk" && !allowed\.has\(m\.id\)/,
  "\"nie wiem\" gasnie razem z materialami niepasujacymi do pliku",
  "\"nie wiem\" zostaje aktywne takze po wgraniu pliku");

ma(/material === "idk" && \(/,
  "wybor \"nie wiem\" nie pokazuje nic wiecej, wiec jest slepym zaulkiem",
  "wybor \"nie wiem\" odslania podpowiedz z mozliwymi materialami");

ma(/matSugerowane\.map/,
  "podpowiedziane materialy nie sa klikalne, klient nadal nie ma jak wybrac",
  "podpowiedziane materialy da sie wybrac jednym klikiem");

ma(/m\.id !== "idk" && \(!allowed \|\| allowed\.has\(m\.id\)\)/,
  "podpowiedz nie zawęża sie do materialow pasujacych do wgranego pliku",
  "podpowiedz pokazuje tylko materialy pasujace do wgranego pliku");

for (const klucz of ["IDK_TITLE", "IDK_TITLE_FILE", "IDK_HINT"]) {
  const blok = new RegExp(`${klucz} = \\{[^}]*pl:[^}]*en:[^}]*de:`, "s");
  if (blok.test(widok)) ok(`${klucz} istnieje w trzech jezykach`);
  else zle(`${klucz} nie ma kompletu trzech jezykow`);
}

// ------------------------------------------------------------
// 7. Kafelek, ktory nic nie robi, czyta sie jak usterka
// ------------------------------------------------------------
// Po wgraniu SVG drugi kafelek ("Mam gotowy plik 3D") dawal sie klikac
// i podswietlal sie, ale pole wgrywania pokazuje sie wylacznie przy braku
// pliku, wiec nie dzialo sie NIC. Reakcja bez skutku jest gorsza od braku
// reakcji: klient probuje dalej, bo interfejs obiecuje, ze zadziala.
console.log("\n7. Kafelki rodzaju pliku po wgraniu");

ma(/disabled=\{zablokowany\}/,
  "kafelki rodzaju pliku nadal daja sie klikac przy wgranym pliku",
  "kafelki rodzaju pliku sa wylaczone przy wgranym pliku");

ma(/const zablokowany = Boolean\(hasFile \|\| fileForHuman\)/,
  "blokada nie obejmuje pliku oddanego do wyceny recznej",
  "blokada obejmuje takze plik oddany do wyceny recznej");

ma(/zablokowany\s*\?\s*"opacity-40 cursor-not-allowed"/,
  "wylaczony kafelek wyglada jak czynny, wiec klient bedzie go klikal",
  "wylaczony kafelek jest wyszarzony i ma kursor blokady");

if (/if \(hasFile \|\| fileForHuman\) \{ setFileMode/.test(widok)) {
  zle("wrocilo ciche przestawianie rodzaju pliku, ktore nie ma zadnego skutku");
} else {
  ok("nie ma juz cichego przestawiania rodzaju pliku bez skutku");
}

ma(/l\.q0locked/, "brak wyjasnienia, jak zmienic rodzaj pliku, wiec blokada jest slepym zaulkiem",
  "pod kafelkami stoi, jak zmienic rodzaj pliku");

{
  const n = (widok.match(/q0locked:/g) || []).length;
  if (n >= 3) ok("q0locked istnieje w trzech jezykach");
  else zle(`q0locked musi istniec w trzech jezykach, znaleziono ${n}`);
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nMaterial z magazynu: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
