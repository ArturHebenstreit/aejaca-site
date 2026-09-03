// ============================================================
// HOOK PO WCZESNYM WYJSCIU Z KOMPONENTU
// ============================================================
// Komponent, ktory ma `return` w polowie, a hook ponizej niego, dziala
// dopoki warunek wyjscia sie nie zmieni przy zywym komponencie. W chwili
// zmiany React liczy mniej hookow niz w poprzednim renderze, zglasza
// "Rendered fewer hooks than expected" i ODMONTOWUJE CALE DRZEWO. Klient
// widzi puste miejsce, a nie zepsuty jeden napis.
//
// Tak stalo sie w `CalcToCart`: przy wyborze lancuszka w kalkulatorze
// jubilerskim `blocked` przechodzilo z falszu w prawde, panel wychodzil
// wczesniej, a efekt zglaszajacy kwote stal ponizej. Gasl caly kalkulator
// jubilerski, przy zielonym buildzie i zielonym prerenderze: prerender rysuje
// pierwszy ekran, a ta usterka wymaga klikniecia.
//
// Bramka szuka wzorca STATYCZNIE: wciecie dwoch spacji to poziom ciala
// komponentu, wiec `  if (...) return` i `  return` na tym poziomie sa
// wyjsciami, a wywolanie hooka po pierwszym z nich jest bledem.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tu = path.dirname(fileURLToPath(import.meta.url));
const zrodla = path.resolve(tu, "..", "src");

const HOOK = /^\s{2,}(?:const|let)?\s*[[{\w\s,:]*=?\s*(use[A-Z]\w*)\s*\(/;
const WYJSCIE = /^ {2}(?:if\s*\([^)]*\)\s*)?return[\s(;]/;

function plikiJsx(katalog) {
  const out = [];
  for (const wpis of readdirSync(katalog)) {
    const p = path.join(katalog, wpis);
    if (statSync(p).isDirectory()) out.push(...plikiJsx(p));
    else if (wpis.endsWith(".jsx")) out.push(p);
  }
  return out;
}

let bledow = 0;
for (const plik of plikiJsx(zrodla)) {
  const linie = readFileSync(plik, "utf8").split("\n");
  let wyjscie = null;
  for (let i = 0; i < linie.length; i += 1) {
    const linia = linie[i];
    // NOWA FUNKCJA ZERUJE LICZNIK, bo kazda ma wlasne hooki. Liczy sie
    // deklaracja bez wciecia: `function X`, `const X = () =>`, `const X =
    // memo(`. Bez tego `return` z komponentu wyzej wyglada jak wyjscie
    // z nastepnego w pliku, a plik z kontekstem ma ich zwykle dwa.
    if (/^(export\s+)?(default\s+)?(async\s+)?function\s+\w/.test(linia)
      || /^(export\s+)?const\s+\w+\s*=\s*(\(|async|function|memo|forwardRef|React\.)/.test(linia)) {
      wyjscie = null;
    }
    if (wyjscie === null && WYJSCIE.test(linia)) { wyjscie = i + 1; continue; }
    if (wyjscie !== null) {
      const m = linia.match(HOOK);
      if (m) {
        console.error(`  ✗ ${path.relative(path.resolve(tu, ".."), plik)}:${i + 1}`);
        console.error(`     ${m[1]} stoi po wczesnym wyjsciu z linii ${wyjscie}`);
        bledow += 1;
      }
    }
  }
}

if (bledow) {
  console.error(`\nHooki po wczesnym wyjsciu: ${bledow}. Przenies je nad wyjscie.`);
  process.exit(1);
}
console.log("Hooki: zaden nie stoi po wczesnym wyjsciu z komponentu");
