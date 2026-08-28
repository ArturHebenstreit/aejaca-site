// ============================================================
// CZY WARIANTY OBRAZOW BOHATERSKICH NAPRAWDE LEZA
// ============================================================
// `src/data/heroObrazy.js` sklada `srcset` z listy szerokosci. Wskazanie na
// plik, ktorego nie ma, NIE wywala strony: przegladarka po cichu wraca do
// zapasowego `src`. Kazdy widzi wtedy obraz i nikt nie widzi, ze zestaw
// wariantow przestal dzialac.
//
// Dlatego sprawdzamy to przy buildzie, a nie okiem.
//
//   node scripts/check-hero-images.mjs

import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SZEROKOSCI_HERO, FORMATY_HERO, ZAPASOWA_SZEROKOSC } from "../src/data/heroObrazy.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KATALOG = join(ROOT, "public", "img", "hero");

const braki = [];
let plikow = 0;
let bajtow = 0;

for (const [nazwa, szerokosci] of Object.entries(SZEROKOSCI_HERO)) {
  for (const w of szerokosci) {
    for (const format of FORMATY_HERO) {
      const plik = join(KATALOG, `${nazwa}-${w}.${format}`);
      if (!existsSync(plik)) braki.push(`brak public/img/hero/${nazwa}-${w}.${format}`);
      else { plikow++; bajtow += statSync(plik).size; }
    }
  }
  const zapas = ZAPASOWA_SZEROKOSC[nazwa];
  if (!zapas) braki.push(`${nazwa}: brak szerokosci zapasowej w ZAPASOWA_SZEROKOSC`);
  else if (!szerokosci.includes(zapas)) {
    braki.push(`${nazwa}: szerokosc zapasowa ${zapas} nie jest na liscie wariantow`);
  }
}

if (braki.length) {
  console.error("\nWarianty obrazow bohaterskich sie nie zgadzaja:\n");
  for (const b of braki) console.error("  " + b);
  console.error("\nUruchom: node scripts/build-hero-images.mjs\n");
  process.exit(1);
}

console.log(`Obrazy bohaterskie: ${plikow} wariantow, ${(bajtow / 1024 / 1024).toFixed(1)} MB.`);
