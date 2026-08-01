#!/usr/bin/env node
// ============================================================
// JADRO CAD DLA PRZEGLADARKI
// ============================================================
// occt-import-js sklada sie z modulu JS i pliku .wasm, ktory ten modul
// sciaga w czasie dzialania. Bundler nie umie go sam wystawic, wiec
// kopiujemy go do public/wasm/ i stamtad podajemy adres (src/pricing/step.js).
//
// 7 MB nie trafia do glownej paczki: modul ladujemy leniwie, dopiero gdy
// klient naprawde wgra plik STEP.

import { copyFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "node_modules", "occt-import-js", "dist", "occt-import-js.wasm");
const DEST_DIR = join(ROOT, "public", "wasm");
const DEST = join(DEST_DIR, "occt-import-js.wasm");

if (!existsSync(SRC)) {
  console.error("Brak occt-import-js w node_modules. Uruchom: npm install");
  process.exit(1);
}

mkdirSync(DEST_DIR, { recursive: true });

const fresh = existsSync(DEST) && statSync(DEST).size === statSync(SRC).size;
if (fresh) {
  console.log("Jadro CAD dla przegladarki juz aktualne (public/wasm/).");
  process.exit(0);
}

copyFileSync(SRC, DEST);
console.log(`Skopiowano jadro CAD: ${(statSync(DEST).size / 1024 / 1024).toFixed(1)} MB do public/wasm/`);
