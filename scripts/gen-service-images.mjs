#!/usr/bin/env node
// ============================================================
// OBRAZY PROCESU DLA KART USLUG
// ============================================================
// Opisy obrazow leza przy usludze w src/data/serviceCatalog.js (imagePrompt),
// zeby zdjecie i tekst karty nie rozjechaly sie przy zmianie oferty.
//
//   node scripts/gen-service-images.mjs          generuje brakujace
//   node scripts/gen-service-images.mjs --force  nadpisuje wszystkie
//   node scripts/gen-service-images.mjs print_fdm laser_cut   wybrane
//
// Wymaga GEMINI_API_KEY.

import { existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { SERVICES_FULL } from "../src/data/serviceCatalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "img", "shop", "service");

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

mkdirSync(OUT_DIR, { recursive: true });

let made = 0;
let skipped = 0;

for (const svc of SERVICES_FULL) {
  if (only.length && !only.includes(svc.id)) continue;
  if (!svc.imagePrompt) {
    console.warn(`- ${svc.id}: brak imagePrompt, pomijam`);
    continue;
  }

  const out = join(OUT_DIR, `${svc.id}.png`);
  if (existsSync(out) && !force) {
    skipped++;
    continue;
  }

  process.stdout.write(`- ${svc.id} ... `);
  try {
    execFileSync("node", [join(ROOT, "scripts", "gemini-image.mjs"), svc.imagePrompt, out, "1:1"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    made++;
    console.log("gotowe");
  } catch (e) {
    console.log(`nie powiodlo sie: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
  }
}

console.log(`\nWygenerowano: ${made}, pominieto istniejace: ${skipped}`);
console.log(`Katalog: public/img/shop/service/`);
