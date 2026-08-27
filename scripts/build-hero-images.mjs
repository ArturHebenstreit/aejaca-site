// ============================================================
// WARIANTY OBRAZOW BOHATERSKICH
// ============================================================
// Obrazy hero sa kandydatami na LCP: to one wyznaczaja moment, w ktorym
// przegladarka uznaje strone za narysowana. Do 27 sierpnia 2026 kazdy z nich
// szedl w jednej wersji, w pelnej rozdzielczosci, do kazdego urzadzenia.
// `hero-studio.webp` wazyl 663 kB przy 2752 px szerokosci, a na telefonie
// wyswietlal sie na 390 px. Dla porownania caly arkusz stylow serwisu wazy
// 25 kB po spakowaniu.
//
// Ten skrypt tnie kazdy oryginal na kilka szerokosci w AVIF i WebP. Reszte
// robi `<HeroObraz>`, ktory podaje je przez `srcset`, a przegladarka bierze
// najmniejszy plik, ktory jej wystarczy. Oryginal zostaje na dysku jako
// zapasowe `src` dla przegladarek bez AVIF i bez `srcset`.
//
// Uruchamiany RECZNIE, po podmianie ktoregos oryginalu:
//
//   node scripts/build-hero-images.mjs
//
// Wyniki ida do `public/img/hero/` i sa w repozytorium, bo build na
// Cloudflare nie ma sharpa i nie ma ich jak wygenerowac.

import sharp from "sharp";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ZRODLO = join(ROOT, "public");
const CEL = join(ROOT, "public", "img", "hero");

// Szerokosci dobrane do tego, jak obraz jest naprawde pokazywany, a nie do
// tego, jaki jest plik. Panorama idzie przez cala szerokosc okna, kafelki na
// stronie glownej maja polowe kontenera 1024 px, banery narzedzi to paski.
const ZESTAWY = [
  { pliki: ["hero-studio.webp", "hero-jewelry.webp"], szerokosci: [768, 1152, 1536, 1920, 2560] },
  { pliki: ["hero-home-jewelry.webp", "hero-home-studio.webp", "hero-print-settings.webp"], szerokosci: [384, 512, 768, 1024, 1536] },
  { pliki: ["hero-toolstudio.webp", "hero-toolsjewelry.webp"], szerokosci: [640, 960, 1280, 1584] },
];

mkdirSync(CEL, { recursive: true });

let bylo = 0, jest = 0, sztuk = 0;

for (const { pliki, szerokosci } of ZESTAWY) {
  for (const plik of pliki) {
    const wejscie = join(ZRODLO, plik);
    if (!existsSync(wejscie)) { console.error(`  brak ${plik}`); continue; }
    const nazwa = plik.replace(/\.(webp|jpg|jpeg|png)$/i, "");
    const meta = await sharp(wejscie).metadata();
    bylo += statSync(wejscie).size;

    for (const w of szerokosci) {
      if (w > meta.width) continue;
      for (const format of ["avif", "webp"]) {
        const wyjscie = join(CEL, `${nazwa}-${w}.${format}`);
        const obraz = sharp(wejscie).resize({ width: w, withoutEnlargement: true });
        await (format === "avif"
          ? obraz.avif({ quality: 48, effort: 6 })
          : obraz.webp({ quality: 74, effort: 6 })).toFile(wyjscie);
        jest += statSync(wyjscie).size;
        sztuk++;
      }
    }
    const najwiekszy = Math.min(Math.max(...szerokosci), meta.width);
    const kb = (p) => (statSync(p).size / 1024).toFixed(0);
    console.log(
      `${plik.padEnd(26)} ${meta.width}px ${kb(wejscie)} kB  ->  ` +
      `${najwiekszy}px avif ${kb(join(CEL, `${nazwa}-${najwiekszy}.avif`))} kB, ` +
      `najmniejszy ${Math.min(...szerokosci)}px avif ${kb(join(CEL, `${nazwa}-${Math.min(...szerokosci)}.avif`))} kB`
    );
  }
}

console.log(`\nWariantow: ${sztuk}. Oryginaly razem ${(bylo / 1024).toFixed(0)} kB.`);
