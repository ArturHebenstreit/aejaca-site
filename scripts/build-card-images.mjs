#!/usr/bin/env node
// ============================================================
// WARIANTY OBRAZOW W KAFELKACH
// ============================================================
// Kafelki bloga, uslug i kalkulatorow pokazuja obraz na 150 do 350 pikseli
// szerokosci, a pliki maja od 1200 do 1408 pikseli. Pierwsze wejscie na strone
// glowna z telefonu pobieralo z tego powodu 699 kB obrazow, prawie w calosci
// niewidocznych na pierwszym ekranie. `loading="lazy"` tego nie ratuje, bo
// przegladarka i tak pobiera kilka ekranow do przodu, a kazdy z nich w pelnej
// rozdzielczosci.
//
// Ten skrypt tnie kazdy obraz kafelka na kilka szerokosci w AVIF i WebP, tak
// samo jak `build-hero-images.mjs` robi to dla obrazow bohaterskich. Wyniki ida
// do `public/img/w/`, z zachowaniem sciezki oryginalu, a lista trafia do
// `src/data/obrazyWarianty.js`, skad czyta ja komponent `<Obraz>`.
//
// Oryginaly zostaja: uzywa ich `<img src>` jako zapas i naglowek wpisu na blogu,
// gdzie obraz naprawde jest szeroki.
//
//   node scripts/build-card-images.mjs

import sharp from "sharp";
import { mkdirSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const CEL = join(PUBLIC, "img", "w");

// Idziemy po calym `public/img`, z dwoma wyjatkami: `img/hero` ma wlasny skrypt
// (inne szerokosci, obraz jest kandydatem na LCP), a `img/w` to wynik tego
// skryptu i cieciu go po raz drugi nie byloby konca.
const KATALOG = "img";
const POMIJANE = new Set(["img/hero", "img/w"]);
const SZEROKOSCI = [256, 384, 512, 768, 1200];
const FORMATY = ["avif", "webp"];

function zbierz(katalog, out = []) {
  if (POMIJANE.has(katalog)) return out;
  const pelny = join(PUBLIC, katalog);
  if (!existsSync(pelny)) return out;
  for (const wpis of readdirSync(pelny)) {
    const p = join(pelny, wpis);
    if (statSync(p).isDirectory()) zbierz(join(katalog, wpis), out);
    else if (/\.(webp|jpe?g|png)$/i.test(wpis)) out.push(join(katalog, wpis));
  }
  return out;
}

const pliki = zbierz(KATALOG);
const mapa = {};
let bylo = 0, jest = 0, sztuk = 0;

for (const wzgledny of pliki) {
  const wejscie = join(PUBLIC, wzgledny);
  const meta = await sharp(wejscie).metadata();
  // Obrazy juz male nie zyskuja na cieciu, a mnoza pliki.
  if (!meta.width || meta.width <= 384) continue;

  const bezRozszerzenia = join(dirname(wzgledny), basename(wzgledny, extname(wzgledny)));
  const katalogWyjscia = join(CEL, dirname(wzgledny));
  mkdirSync(katalogWyjscia, { recursive: true });
  bylo += statSync(wejscie).size;

  const zrobione = [];
  for (const w of SZEROKOSCI) {
    if (w > meta.width) continue;
    for (const format of FORMATY) {
      const wyjscie = join(CEL, `${bezRozszerzenia}-${w}.${format}`);
      const obraz = sharp(wejscie).resize({ width: w, withoutEnlargement: true });
      await (format === "avif" ? obraz.avif({ quality: 50, effort: 4 }) : obraz.webp({ quality: 76, effort: 6 })).toFile(wyjscie);
      jest += statSync(wyjscie).size;
      sztuk++;
    }
    zrobione.push(w);
  }
  if (zrobione.length) mapa["/" + wzgledny] = zrobione;
}

const wpisy = Object.entries(mapa)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `  ${JSON.stringify(k)}: [${v.join(", ")}],`)
  .join("\n");

writeFileSync(
  join(ROOT, "src", "data", "obrazyWarianty.js"),
  `// PLIK GENEROWANY przez scripts/build-card-images.mjs. Nie poprawiaj recznie.
//
// Klucz to adres oryginalu, wartosc to szerokosci, w ktorych lezy jego wariant
// w \`public/img/w/\`. Komponent \`src/components/Obraz.jsx\` sklada z tego
// \`srcset\`; obraz spoza tej listy rysuje sie zwyczajnie, z oryginalu.

export const WARIANTY_OBRAZOW = {
${wpisy}
};

export const FORMATY_WARIANTOW = ${JSON.stringify(FORMATY)};

/** "/img/blog/x.webp" -> "/img/w/img/blog/x-384.avif 384w, ..." */
export function zestawWariantow(src, format) {
  const szerokosci = WARIANTY_OBRAZOW[src];
  if (!szerokosci) return "";
  const bez = src.replace(/\\.[a-z0-9]+$/i, "");
  return szerokosci.map((w) => \`/img/w\${bez}-\${w}.\${format} \${w}w\`).join(", ");
}
`,
);

console.log(
  `Kafelki: ${Object.keys(mapa).length} obrazow, ${sztuk} wariantow.\n` +
  `Oryginaly ${(bylo / 1024 / 1024).toFixed(1)} MB, warianty ${(jest / 1024 / 1024).toFixed(1)} MB.`,
);
