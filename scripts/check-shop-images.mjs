// ============================================================
// KONTROLA ZDJEC PRODUKTOW
// ============================================================
// Zdjecia produktow leza w repozytorium, a baza trzyma do nich sciezki. Te dwa
// miejsca moga sie rozjechac na trzy sposoby i kazdy widzi klient: sciezka bez
// pliku (pusta ramka na karcie), produkt bez zdjecia (kafel bez obrazka i pusty
// obrazek w wynikach Google), zdjecie wagi zdjecia z aparatu (karta laduje sie
// sekundami na telefonie).
//
// Skrypt wchodzi do budowania, wiec taka pomylka zatrzymuje wdrozenie zamiast
// wyjsc na produkcji.
//
// Uzycie: npm run check:images

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PRODUCTS_FROM_DB } from "../src/data/products.generated.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");

/** Ile zdjec ma sens na karcie produktu: jedno to minimum, piec to komplet. */
const MIN_IMAGES = 1;
const MAX_IMAGES = 5;
/** Powyzej tego karta zauwazalnie zwalnia na telefonie w sieci komorkowej. */
const WARN_KB = 200;
const FAIL_KB = 400;

const errors = [];
const warnings = [];

for (const p of PRODUCTS_FROM_DB) {
  const images = p.images || [];

  if (images.length < MIN_IMAGES) {
    errors.push(`${p.slug}: brak zdjecia, wymagane co najmniej ${MIN_IMAGES}`);
    continue;
  }
  if (images.length > MAX_IMAGES) {
    errors.push(`${p.slug}: ${images.length} zdjec, dopuszczamy ${MAX_IMAGES}`);
  }

  for (const img of images) {
    if (!img.startsWith("/img/")) {
      errors.push(`${p.slug}: sciezka spoza /img/ (${img}), zdjecia trzymamy w repozytorium`);
      continue;
    }
    const file = path.join(PUBLIC_DIR, img);
    if (!fs.existsSync(file)) {
      errors.push(`${p.slug}: brak pliku ${img}`);
      continue;
    }
    const kb = Math.round(fs.statSync(file).size / 1024);
    if (kb > FAIL_KB) {
      errors.push(`${p.slug}: ${img} wazy ${kb} kB, limit ${FAIL_KB} kB (npm run optimize:images)`);
    } else if (kb > WARN_KB) {
      warnings.push(`${p.slug}: ${img} wazy ${kb} kB, warto scisnac ponizej ${WARN_KB} kB`);
    }
    if (!/\.webp$/i.test(img)) {
      warnings.push(`${p.slug}: ${img} nie jest w formacie webp`);
    }
  }
}

for (const w of warnings) console.warn(`[zdjecia] uwaga: ${w}`);

if (errors.length) {
  console.error(`\n[zdjecia] ${errors.length} bledow:`);
  for (const e of errors) console.error(`  ${e}`);
  console.error("\nOdcisk katalogu odswiezasz komenda `npm run products:pull`.");
  process.exit(1);
}

console.log(`[zdjecia] sprawdzono ${PRODUCTS_FROM_DB.length} produktow, wszystko na miejscu`);
