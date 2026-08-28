// ============================================================
// NAZWA DLA CZYTNIKA EKRANU JEST W JEZYKU STRONY
// ============================================================
// Kontrolka bez widocznego napisu (ikona, strzalka, krzyzyk, plus) musi miec
// `aria-label`, bo inaczej czytnik ekranu przeczyta "przycisk" i tyle. Ale
// `aria-label` wpisany na sztywno jest gorszy niz brak jezyka: jest ZAWSZE w
// jednym jezyku, wiec dla dwoch trzecich odwiedzajacych w zlym.
//
// Serwis stoi pod trzema adresami i ma trzy komplety tresci. Napis wpisany na
// sztywno nie ma jak za tym nadazyc, a nikt tego nie zobaczy, bo nazwa dla
// czytnika ekranu jest niewidoczna. Znaleziono 22 takie miejsca 2026-08-28,
// mieszanka angielskiego i polskiego, w tym pasek nawigacji i czat.
//
// Nazwa idzie ze slownika (`t.a11y.*`) albo, w kalkulatorach, z ich wlasnych
// etykiet, zgodnie z tym, jak dany plik juz mowi o jezyku.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

// Nazwa wpisana wprost, czyli w cudzyslowie zamiast w klamrach.
const NA_SZTYWNO = /aria-label="([^"]*)"/g;

// Nazwa sklejona z szablonu. `aria-label={`${ocena} out of 5 stars`}` wyglada
// jak kod, a jest angielskim napisem, ktory szedl tak samo na polska i na
// niemiecka wersje strony. Wycinamy wstawki `${...}` i patrzymy, czy w reszcie
// zostal wyraz.
const Z_SZABLONU = /aria-label=\{`([^`]*)`\}/g;
const WYRAZ = /\p{L}{2,}/u;

// Nazwy wlasne, ktore w kazdym jezyku brzmia tak samo. Puste do czasu, az
// naprawde takiej potrzeby nie bedzie: dopisujac tu cokolwiek, napisz dlaczego.
const WYJATKI = new Set([]);

function pliki(katalog) {
  const wynik = [];
  for (const wpis of readdirSync(katalog)) {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) wynik.push(...pliki(sciezka));
    else if (/\.(js|jsx)$/.test(wpis)) wynik.push(sciezka);
  }
  return wynik;
}

const potkniecia = [];
for (const plik of pliki(KORZEN)) {
  readFileSync(plik, "utf-8").split("\n").forEach((linia, i) => {
    for (const [, nazwa] of linia.matchAll(NA_SZTYWNO)) {
      if (WYJATKI.has(nazwa)) continue;
      potkniecia.push(`${plik.replace(/.*\/src\//, "src/")}:${i + 1}  aria-label="${nazwa}"`);
    }
    for (const [, szablon] of linia.matchAll(Z_SZABLONU)) {
      const bezWstawek = szablon.replace(/\$\{[^}]*\}/g, " ");
      if (!WYRAZ.test(bezWstawek)) continue;
      potkniecia.push(`${plik.replace(/.*\/src\//, "src/")}:${i + 1}  aria-label={\`${szablon}\`}`);
    }
  });
}

if (potkniecia.length) {
  console.error("Nazwa dla czytnika ekranu wpisana na sztywno, wiec w jednym jezyku:");
  potkniecia.forEach((p) => console.error("  " + p));
  console.error("\nWez ja ze slownika: `aria-label={t.a11y.klucz}`.");
  process.exit(1);
}

console.log("Nazwy dla czytnika ekranu: wszystkie ze slownika.");
