// ============================================================
// STRAZNIK ZGODNOSCI REGULAMINU MIEDZY JEZYKAMI
// ============================================================
// Regulamin zyje w trzech wersjach jezykowych w jednym pliku i kazda zmiana
// dotyka wszystkich trzech. Wersja polska jest wiazaca, ale angielska i
// niemiecka nie sa ozdoba: klient czytajacy serwis po niemiecku zawiera umowe
// na podstawie tego, co przeczytal, i brakujaca sekcja to nie literowka, tylko
// dokument, ktory w jednym jezyku mowi cos innego niz w drugim.
//
// Ryzyko jest realne i wynika z ksztaltu pliku. Sekcje sa wklejane w trzech
// miejscach, a dodanie jednej i pominiecie dwoch pozostalych niczego nie
// wywala: strona sie zbuduje, prerender przejdzie, a regulamin bedzie
// niekompletny w dwoch jezykach na trzy.
//
// Sprawdzamy:
//   1. te same numery sekcji, w tej samej kolejnosci
//   2. te same tytuly pol (title niepuste)
//   3. te sama liczbe ustepow w kazdej sekcji
//   4. te sama liczbe punktow w listach wypunktowanych
//   5. brak pustych ustepow, ktore po cichu znikaja przy renderowaniu
//
// Nie sprawdzamy tresci: to tlumaczenie, a nie kopia.

import { TERMS, TERMS_EFFECTIVE_DATE } from "../src/data/termsContent.js";

const LANGS = ["pl", "en", "de"];
const BAZA = "pl"; // wersja wiazaca
const problems = [];

for (const lang of LANGS) {
  if (!TERMS[lang]) problems.push(`brak calej wersji jezykowej: ${lang}`);
}

/** Ksztalt sekcji: ile ustepow i ile punktow w kazdej liscie. */
function shape(section) {
  const paragraphs = section.items.filter((i) => typeof i === "string").length;
  const lists = section.items.filter(Array.isArray).map((l) => l.length);
  return { paragraphs, lists };
}

if (!problems.length) {
  const baseSections = TERMS[BAZA].sections;
  const baseNumbers = baseSections.map((s) => s.n);

  for (const lang of LANGS.filter((l) => l !== BAZA)) {
    const sections = TERMS[lang].sections;
    const numbers = sections.map((s) => s.n);

    const missing = baseNumbers.filter((n) => !numbers.includes(n));
    const extra = numbers.filter((n) => !baseNumbers.includes(n));
    if (missing.length) problems.push(`${lang}: brakuje sekcji ${missing.join(", ")}`);
    if (extra.length) problems.push(`${lang}: sekcje spoza wersji ${BAZA}: ${extra.join(", ")}`);

    if (!missing.length && !extra.length && numbers.join("|") !== baseNumbers.join("|")) {
      problems.push(`${lang}: sekcje sa w innej kolejnosci niz w wersji ${BAZA}`);
    }

    for (const base of baseSections) {
      const other = sections.find((s) => s.n === base.n);
      if (!other) continue;
      const a = shape(base);
      const b = shape(other);
      if (a.paragraphs !== b.paragraphs) {
        problems.push(
          `${lang}, sekcja ${base.n}: ${b.paragraphs} ustepow zamiast ${a.paragraphs} ` +
          `(wersja ${BAZA}: "${base.title}")`
        );
      }
      if (a.lists.join(",") !== b.lists.join(",")) {
        problems.push(
          `${lang}, sekcja ${base.n}: listy maja ${b.lists.join("/") || "brak"} punktow ` +
          `zamiast ${a.lists.join("/") || "brak"}`
        );
      }
    }
  }

  // Puste ustepy i puste tytuly przechodza przez render bez sladu.
  for (const lang of LANGS) {
    for (const s of TERMS[lang].sections) {
      if (!String(s.title || "").trim()) problems.push(`${lang}, sekcja ${s.n}: pusty tytul`);
      s.items.forEach((item, i) => {
        if (typeof item === "string" && !item.trim()) {
          problems.push(`${lang}, sekcja ${s.n}: pusty ustep na pozycji ${i + 1}`);
        }
        if (Array.isArray(item) && item.some((p) => !String(p).trim())) {
          problems.push(`${lang}, sekcja ${s.n}: pusty punkt w liscie`);
        }
      });
    }
  }
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(TERMS_EFFECTIVE_DATE)) {
  problems.push(`TERMS_EFFECTIVE_DATE ma byc data RRRR-MM-DD, jest "${TERMS_EFFECTIVE_DATE}"`);
}

if (problems.length) {
  console.error("check-terms-parity: wersje jezykowe regulaminu sie rozjechaly\n");
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nWersja polska jest wiazaca, ale klient czytajacy po angielsku lub niemiecku" +
    "\nzawiera umowe na podstawie tego, co przeczytal. Sekcja musi byc w kazdym jezyku."
  );
  process.exit(1);
}

const n = TERMS[BAZA].sections.length;
console.log(`check-terms-parity: OK (${n} sekcji zgodnych w pl, en i de, obowiazuje od ${TERMS_EFFECTIVE_DATE})`);
