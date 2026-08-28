// ============================================================
// WARIANTY OBRAZOW W KAFELKACH: CZY LEZA I CZY KTOS Z NICH KORZYSTA
// ============================================================
// `src/data/obrazyWarianty.js` jest generowany przez
// `scripts/build-card-images.mjs` i mowi, w jakich szerokosciach lezy kazdy
// obraz. Rozjazd miedzy ta lista a dyskiem jest CICHY: `srcset` wskazujacy
// plik, ktorego nie ma, nie wywala strony, tylko po cichu wraca do oryginalu.
// Wszyscy widza obraz, nikt nie widzi, ze wariantow nie ma.
//
// Sprawdzamy dwie rzeczy:
//   1. kazdy wariant z listy naprawde lezy w `public/img/w/`,
//   2. lista opisuje obraz, ktory nadal istnieje.
//
//   node scripts/check-card-images.mjs

import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WARIANTY_OBRAZOW, FORMATY_WARIANTOW } from "../src/data/obrazyWarianty.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

const problemy = [];
let plikow = 0;
let bajtow = 0;

for (const [src, szerokosci] of Object.entries(WARIANTY_OBRAZOW)) {
  if (!existsSync(join(PUBLIC, src.slice(1)))) {
    problemy.push(`${src}: oryginalu juz nie ma, a lista wariantow o nim mowi`);
    continue;
  }
  const bez = src.replace(/\.[a-z0-9]+$/i, "");
  for (const w of szerokosci) {
    for (const format of FORMATY_WARIANTOW) {
      const plik = join(PUBLIC, "img", "w", `${bez}-${w}.${format}`.slice(1));
      if (!existsSync(plik)) problemy.push(`brak public/img/w${bez}-${w}.${format}`);
      else { plikow++; bajtow += statSync(plik).size; }
    }
  }
}

if (problemy.length) {
  console.error(`\nWarianty obrazow w kafelkach sie nie zgadzaja: ${problemy.length}\n`);
  for (const p of problemy.slice(0, 20)) console.error("  " + p);
  if (problemy.length > 20) console.error(`  ...i ${problemy.length - 20} wiecej`);
  console.error("\nUruchom: node scripts/build-card-images.mjs\n");
  process.exit(1);
}

console.log(
  `Kafelki: ${Object.keys(WARIANTY_OBRAZOW).length} obrazow, ${plikow} wariantow, ` +
  `${(bajtow / 1024 / 1024).toFixed(1)} MB.`,
);
