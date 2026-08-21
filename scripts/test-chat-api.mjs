#!/usr/bin/env node
// ============================================================
// TESTY BACKENDU IDA RAZEM Z BUILDEM STRONY
// ============================================================
// `chat-api` ma wlasny zestaw testow i wlasny `npm test`, ktory trzeba bylo
// pamietac, zeby uruchomic. Skutek dal sie zobaczyc: `retention.test.mjs`
// stal czerwony w repozytorium, bo retencja dostala dwie nowe kategorie
// (wyceny zapisane i zapytania o wycene), a test zostal przy szesciu. Nikt
// tego nie widzial, bo build strony o tym zestawie nie wiedzial.
//
// To sa testy pilnujace miedzy innymi NIEODWRACALNEGO kasowania danych, wiec
// najgorszym miejscem na nie jest zestaw uruchamiany z pamieci.
//
// Zaleznosci backendu wdrazaja sie osobno (Railway), wiec w czystym klonie
// katalog `node_modules` tam nie istnieje. Wtedy NIE UDAJEMY, ze sprawdzilismy:
// mowimy wprost, ze zestaw pominieto.
//
//   node scripts/test-chat-api.mjs

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = join(ROOT, "chat-api");

if (!existsSync(join(API, "node_modules"))) {
  console.log("Testy chat-api: pominiete, brak chat-api/node_modules (npm install w chat-api/)");
  process.exit(0);
}

const wynik = spawnSync("npm", ["test", "--silent"], { cwd: API, encoding: "utf8" });
const wyjscie = `${wynik.stdout || ""}${wynik.stderr || ""}`;

if (wynik.status !== 0) {
  console.error(wyjscie.trimEnd());
  console.error("\n  ✗ Testy chat-api nie przeszly.");
  process.exit(1);
}

// Liczymy potwierdzenia z samego wyjscia, zeby nie trzymac tu drugiej listy
// plikow testowych, ktora zostalaby przy dawnym zestawie.
const przeszlo = (wyjscie.match(/wszystkie sprawdzenia przeszly/gi) || []).length;
console.log(`Testy chat-api: ${przeszlo} zestawow przeszlo`);
