#!/usr/bin/env node
// ============================================================
// PODSUMOWANIE W MAILU MUSI NIESC TO, CO KLIENT WIDZIAL
// ============================================================
// Do maila szedl jeden string obciety do tysiaca znakow: sama lista wyborow.
// Bez rozpiski ceny, bez uwag do modelu, bez zgod. Klient dostawal
// potwierdzenie, ktore nie potwierdzalo tego, co mial na ekranie, i my
// dostawalismy kopie tego samego.
//
// Awaria ujawnia sie dopiero przy sporze, po miesiacach: nie da sie odtworzyc,
// co pokazano i na co klient przystal. Do tego czasu wszystko wyglada dobrze,
// bo mail przychodzi i jest czytelny.
//
// Test pilnuje czterech rzeczy, ktore po cichu wypadaja najlatwiej:
//   1. rozpiska ceny jest w calosci, co do wiersza,
//   2. ostrzezenia do modelu sa WSZYSTKIE, nie tylko te pokwitowane,
//   3. przy ustaleniu wymagajacym potwierdzenia widac, czy klient je dal,
//   4. calosc miesci sie w limicie, ktory przyjmuje serwer.
//
//   node scripts/test-quote-summary.mjs

import { buildQuoteSummary, describeFinding } from "../src/pricing/quoteSummary.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

/** Ten sam limit, ktory stoi w chat-api/server.js przy /api/quote. */
const LIMIT_SERWERA = 8000;

const WYNIK = {
  type: "calculated",
  perPcPLN: { min: 43, max: 85 },
  perPcEUR: { min: 10, max: 20 },
  qty: 3,
  unitGrosze: 6120,
  discount: 0.05,
  breakdown: [
    { label: "Materiał", value: "12.40 PLN" },
    { label: "Czas druku", value: "2.15 h" },
    { divider: true },
    { label: "Koszt szacunkowy", value: "61.20 PLN", bold: true },
  ],
};

const BRAMKA = {
  tech: "fdm",
  nozzle: "0.4",
  scale: 0.5,
  thinnestMm: 0.31,
  watertight: false,
  findings: [
    { id: "holes", level: "blocker", value: 8 },
    { id: "too_thin", level: "warning", share: 0.12, limit: 0.42 },
  ],
  blocked: true,
  accepted: true,
};

const WEJSCIE = {
  techLabel: "Druk 3D FDM",
  params: "PLA | Średnie 35% | 1 kolor",
  result: WYNIK,
  printability: BRAMKA,
  file: { name: "kolba.stl", scale: 0.5 },
  consents: { contact: true, license: false, printNotes: true },
  lang: "pl",
};

const tekst = buildQuoteSummary(WEJSCIE);

// ------------------------------------------------------------
// 1. Rozpiska ceny, co do wiersza
// ------------------------------------------------------------
console.log("\n1. Rozpiska ceny");

const wiersze = WYNIK.breakdown.filter((r) => !r.divider);
const brakujace = wiersze.filter((r) => !tekst.includes(r.label) || !tekst.includes(r.value));
if (brakujace.length === 0) ok(`wszystkie ${wiersze.length} pozycji rozpiski sa w podsumowaniu`);
else zle(`z rozpiski wypadlo: ${brakujace.map((r) => r.label).join(", ")}`);

if (tekst.includes("61.20")) ok("kwota wiazaca jest w podsumowaniu");
else zle("kwota wiazaca nie doszla do maila");

if (tekst.includes("43 - 85")) ok("widelki cenowe sa w podsumowaniu");
else zle("widelki cenowe nie doszly do maila");

// Rabat rynku polskiego nie ma prawa pojawic sie po nazwie takze tutaj.
if (!/rabat rynek polski/i.test(tekst)) ok("podsumowanie nie nazywa rabatu rynku polskiego");
else zle("nazwa rabatu wyciekla do maila");

// ------------------------------------------------------------
// 2. Ostrzezenia do modelu, wszystkie
// ------------------------------------------------------------
console.log("\n2. Uwagi do modelu");

for (const f of BRAMKA.findings) {
  const zdanie = describeFinding(f, "pl");
  if (zdanie && tekst.includes(zdanie)) ok(`ustalenie "${f.id}" (${f.level}) jest w podsumowaniu`);
  else zle(`ustalenie "${f.id}" (${f.level}) wypadlo z podsumowania`);
}

// To jest sedno: samo ostrzezenie bez informacji o pokwitowaniu jest
// bezwartosciowe przy sporze.
if (tekst.includes("POTWIERDZONE PRZEZ KLIENTA")) ok("widac, ze klient pokwitowal ustalenie wymagajace zgody");
else zle("brak informacji o pokwitowaniu, przy sporze nie da sie tego odtworzyc");

if (tekst.includes("FDM") && tekst.includes("0.4")) ok("technologia i dysza sa w podsumowaniu");
else zle("technologia albo dysza wypadly");

if (tekst.includes("kolba.stl")) ok("nazwa pliku jest w podsumowaniu");
else zle("nazwa pliku wypadla");

if (tekst.includes("0.50")) ok("skala wykonania jest w podsumowaniu");
else zle("skala wypadla, a uwagi dotycza modelu W TEJ wielkosci");

// ------------------------------------------------------------
// 3. Zgody, razem z tymi odmownymi
// ------------------------------------------------------------
console.log("\n3. Zgody");

if (/Zgoda na otrzymanie wyceny.*: tak/.test(tekst)) ok("zgoda udzielona jest zapisana jako udzielona");
else zle("zgoda udzielona nie zostala zapisana");

// Zgoda nieudzielona tez musi byc widoczna. Milczenie o niej czyta sie
// pozniej jak zgoda, ktorej nie bylo.
if (/prawach do przesłanego pliku: nie/.test(tekst)) ok("zgoda nieudzielona jest zapisana jako nieudzielona");
else zle("zgoda nieudzielona zniknela zamiast zostac zapisana jako brak zgody");

// ------------------------------------------------------------
// 4. Limit serwera
// ------------------------------------------------------------
console.log("\n4. Limit serwera");

if (tekst.length <= LIMIT_SERWERA) ok(`podsumowanie ma ${tekst.length} znakow, limit to ${LIMIT_SERWERA}`);
else zle(`podsumowanie ma ${tekst.length} znakow i zostanie uciete na ${LIMIT_SERWERA}`);

// Przypadek skrajny: dwadziescia pozycji rozpiski i osiem ustalen.
const duze = buildQuoteSummary({
  ...WEJSCIE,
  result: { ...WYNIK, breakdown: Array.from({ length: 20 }, (_, i) => ({ label: `Pozycja ${i}`, value: "999.99 PLN" })) },
  printability: { ...BRAMKA, findings: Array.from({ length: 8 }, () => ({ id: "holes", level: "blocker", value: 12345 })) },
});
if (duze.length <= LIMIT_SERWERA) ok(`nawet rozbudowana wycena miesci sie w limicie (${duze.length} znakow)`);
else zle(`rozbudowana wycena ma ${duze.length} znakow i zostanie ucieta`);

// ------------------------------------------------------------
// 5. Trzy jezyki
// ------------------------------------------------------------
console.log("\n5. Jezyki");

for (const lang of ["pl", "en", "de"]) {
  const t = buildQuoteSummary({ ...WEJSCIE, lang });
  const zdanie = describeFinding(BRAMKA.findings[0], lang);
  if (t && zdanie && t.includes(zdanie)) ok(`${lang}: uwagi do modelu sa w jezyku odbiorcy`);
  else zle(`${lang}: uwagi do modelu nie sa przetlumaczone`);
}

// ------------------------------------------------------------
// 6. Brak danych nie moze wywracac podsumowania
// ------------------------------------------------------------
console.log("\n6. Puste wejscie");

const puste = buildQuoteSummary({ techLabel: "Test", params: "a | b", lang: "pl" });
if (typeof puste === "string" && puste.includes("Test")) ok("bez ceny, pliku i zgod podsumowanie nadal powstaje");
else zle("puste wejscie wywraca podsumowanie");

const custom = buildQuoteSummary({ ...WEJSCIE, result: { type: "custom" } });
if (/nie wyceniamy automatycznie/.test(custom)) ok("wycena indywidualna mowi o tym wprost");
else zle("wycena indywidualna nie jest opisana");

// ------------------------------------------------------------
// NAZWA WYCENY W MAILU IDZIE ZA JEZYKIEM STRONY
// ------------------------------------------------------------
// `techLabel` trafia do tematu i do tresci maila, ktorego dostaje klient.
// Dwa kalkulatory mialy ja wpisana na sztywno po polsku, wiec Anglik dostawal
// list z angielskim naglowkiem, angielska lista wyborow i polskim "Szybka
// wycena" w srodku. Mail przychodzil i byl czytelny, wiec nikt tego nie zglosil.
{
  const { readdirSync, readFileSync: czytaj } = await import("node:fs");
  const { join: polacz, dirname: katalog } = await import("node:path");
  const { fileURLToPath: naSciezke } = await import("node:url");
  const KAT = polacz(katalog(naSciezke(import.meta.url)), "../src/components/calculators");
  let sprawdzonych = 0;
  for (const plik of readdirSync(KAT).filter((f) => f.endsWith(".jsx"))) {
    const tresc = czytaj(polacz(KAT, plik), "utf8");
    // Wyrazenie WYCINAMY LICZAC NAWIASY, a nie wzorcem na jedna linie.
    // Wzorzec liniowy przestawal widziec atrybut, gdy tylko ktos rozbil go na
    // kilka linii, wiec sprawdzenie robilo sie zielone przez to, ze przestawalo
    // patrzec. Dokladnie te dwa pliki, dla ktorych powstalo, wypadly z niego
    // przy pierwszym formatowaniu.
    let od = tresc.indexOf("techLabel={");
    while (od !== -1) {
      let glebokosc = 0;
      let koniec = od + "techLabel=".length;
      for (; koniec < tresc.length; koniec++) {
        if (tresc[koniec] === "{") glebokosc++;
        else if (tresc[koniec] === "}" && --glebokosc === 0) break;
      }
      const wyrazenie = tresc.slice(od + "techLabel={".length, koniec);
      sprawdzonych++;
      // Dozwolone sa tylko trzy drogi: slownik przez `t(...)`, slownik jezyka
      // biezacego (`l.`) albo przekazanie dalej tej samej zmiennej.
      const zJezyka = /\bt\(/.test(wyrazenie) || /\bl\./.test(wyrazenie) || /^techLabel$/.test(wyrazenie.trim());
      // Sam fakt, ze gdzies w wyrazeniu stoi `t(`, nie wystarcza: doklejony
      // polski przedrostek przeszedlby obok. Litera z ogonkiem w tekscie
      // wpisanym wprost jest dowodem, ze jeden jezyk zostal wybrany na sztywno.
      const bezWstawek = wyrazenie.replace(/\$\{[^}]*\}/g, "").replace(/^\s*\/\/.*$/gm, "");
      const naSztywnoPoPolsku = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(bezWstawek);
      if (!zJezyka || naSztywnoPoPolsku) {
        zle(`${plik}: techLabel={${wyrazenie.trim().slice(0, 80)}} nie idzie za jezykiem strony`);
      }
      od = tresc.indexOf("techLabel={", koniec);
    }
  }
  if (sprawdzonych === 0) zle("nie znalazlem ani jednego techLabel, sprawdzenie nic nie pilnuje");
  else if (!bledy) ok(`nazwa wyceny w mailu idzie za jezykiem strony (${sprawdzonych} kalkulatorow)`);

  // Slownik musi miec wpis w KAZDYM jezyku. Brak jednego nie wywala niczego:
  // do tematu maila trafiloby "undefined - Fiber Laser".
  const studyjny = czytaj(polacz(KAT, "SimpleStudioCalc.jsx"), "utf8");
  const ileStudyjnych = (studyjny.match(/quickQuote: "/g) || []).length;
  if (ileStudyjnych === 3) ok("szybka wycena sTuDiO ma nazwe we wszystkich trzech jezykach");
  else zle(`szybka wycena sTuDiO ma nazwe w ${ileStudyjnych} jezykach zamiast w trzech`);
  const jubilerski = czytaj(polacz(KAT, "SimpleJewelryCalc.jsx"), "utf8");
  const slownik = jubilerski.match(/const QUICK_QUOTE_LBL = \{([\s\S]*?)\};/);
  const ileJubilerskich = slownik ? (slownik[1].match(/^\s*(pl|en|de):/gm) || []).length : 0;
  if (ileJubilerskich === 3) ok("szybka wycena jubilerska ma nazwe we wszystkich trzech jezykach");
  else zle(`szybka wycena jubilerska ma nazwe w ${ileJubilerskich} jezykach zamiast w trzech`);
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nPodsumowanie wyceny: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
