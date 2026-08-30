// ============================================================
// KTO WOZI CALY ZBIOR PYTAN
// ============================================================
// Pytania mieszkaja przy swoich dziedzinach, a `src/data/faq/index.js` scala je
// w komplet. Ten komplet ma prawo ciagnac WYLACZNIE `/faq/`, bo tylko ona go
// pokazuje. Kazdy inny import robi ze strony platnosci nosnika pytan o skurcz
// odlewniczy, i to po cichu: nic sie nie psuje, strona tylko cichnie i rosnie.
//
// Wpadka juz byla: wspolny widok listy siegnal po `odpowiedz` do `index.js`
// i wciagnal caly zbior na strone platnosci. Stad `pomoc.js`, ktory nie
// importuje niczego, i stad ta bramka.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(KORZEN, "src");

/** Jedyny plik, ktoremu wolno siegnac po komplet. */
const WOLNO = ["pages/Faq.jsx"];

const pliki = [];
(function zbierz(katalog) {
  for (const wpis of readdirSync(katalog)) {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) zbierz(sciezka);
    else if (/\.(jsx?|mjs)$/.test(wpis)) pliki.push(sciezka);
  }
})(SRC);

const winni = [];
for (const plik of pliki) {
  const wzgledny = relative(SRC, plik).split("\\").join("/");
  if (WOLNO.includes(wzgledny)) continue;
  if (wzgledny === "data/faq/index.js") continue;
  const tresc = readFileSync(plik, "utf8");
  if (/from\s+["'][^"']*data\/faq\/index\.js["']/.test(tresc)) winni.push(wzgledny);
}

// Druga strona tej samej reguly: `pomoc.js` musi zostac lisciem. Jeden import
// w nim i bramka wyzej przestaje cokolwiek chronic, bo caly zbior wroci
// tylnymi drzwiami.
const pomoc = readFileSync(join(SRC, "data/faq/pomoc.js"), "utf8");
if (/^\s*import\s/m.test(pomoc)) winni.push("data/faq/pomoc.js importuje cokolwiek, a ma byc lisciem");

if (winni.length) {
  console.error("\nZbior pytan wchodzi tam, gdzie nie ma prawa:");
  winni.forEach((w) => console.error("  " + w));
  console.error(`\nKomplet pytan wolno importowac tylko z ${WOLNO.join(", ")}.`);
  console.error("Strona tematyczna bierze SWOJ plik, np. src/data/faq/bizuteria.js,");
  console.error("a pomocnikow szuka w src/data/faq/pomoc.js.\n");
  process.exit(1);
}
console.log(`Zbior pytan: komplet ciagnie tylko ${WOLNO.join(", ")}, pomoc.js jest lisciem.`);
