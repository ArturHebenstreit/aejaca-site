#!/usr/bin/env node
// ============================================================
// FORMAT DECYZJI ARCHITEKTONICZNYCH
// ============================================================
// `MDs/decisions/README.md` opisuje jeden szablon: front matter YAML ze
// statusem, wlascicielem i data. Bez kontroli format sie rozjezdzal, bo nikt
// tego nie widzial: cztery ADR mialy status wpisany proza ("Status:
// zaakceptowany przez wlasciciela") albo punktem listy. Zaden build sie przez
// to nie wywalil i zadna strona nie wygladala inaczej, wiec rozjazd rosl.
//
// Statusu ten skrypt NIE ocenia. Decyzje akceptuje wlasciciel projektu, a nie
// walidator. Sprawdzamy wylacznie ksztalt: czy da sie odczytac status, kto
// decydowal i kiedy, oraz czy numer w nazwie pliku zgadza sie z naglowkiem.
//
//   node scripts/check-adr.mjs

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KATALOG = join(dirname(fileURLToPath(import.meta.url)), "..", "MDs", "decisions");
const STATUSY = ["draft", "accepted", "superseded"];

const bledy = [];
const numery = new Map();

const pliki = readdirSync(KATALOG).filter((n) => /^ADR-\d{4}-.+\.md$/.test(n)).sort();
if (pliki.length === 0) bledy.push("brak jakiegokolwiek ADR w MDs/decisions/");

for (const nazwa of pliki) {
  const tekst = readFileSync(join(KATALOG, nazwa), "utf8");
  const numer = nazwa.slice(4, 8);

  if (numery.has(numer)) bledy.push(`${nazwa}: numer ${numer} juz zajety przez ${numery.get(numer)}`);
  numery.set(numer, nazwa);

  const front = tekst.match(/^---\n([\s\S]*?)\n---\n/);
  if (!front) {
    bledy.push(`${nazwa}: brak front matter YAML na poczatku pliku, patrz szablon w MDs/decisions/README.md`);
    continue;
  }
  const pola = Object.fromEntries(
    front[1].split("\n")
      .map((wiersz) => wiersz.match(/^([a-z_]+):\s*(.*)$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2].trim()]),
  );

  if (!STATUSY.includes(pola.status)) {
    bledy.push(`${nazwa}: status "${pola.status ?? "(brak)"}", dozwolone: ${STATUSY.join(", ")}`);
  }
  if (!pola.owner) bledy.push(`${nazwa}: brak pola owner`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pola.date || "")) {
    bledy.push(`${nazwa}: data "${pola.date ?? "(brak)"}" nie jest w formacie YYYY-MM-DD`);
  }

  const naglowek = tekst.match(/^# ADR-(\d{4}):/m);
  if (!naglowek) bledy.push(`${nazwa}: brak naglowka "# ADR-NNNN: tytul"`);
  else if (naglowek[1] !== numer) bledy.push(`${nazwa}: naglowek mowi ADR-${naglowek[1]}, a nazwa pliku ADR-${numer}`);
}

if (bledy.length > 0) {
  console.error("Format ADR niezgodny z MDs/decisions/README.md:");
  for (const blad of bledy) console.error(`  - ${blad}`);
  process.exit(1);
}

const wgStatusu = STATUSY.map((s) => {
  const ile = pliki.filter((n) => readFileSync(join(KATALOG, n), "utf8").includes(`status: ${s}`)).length;
  return `${s}: ${ile}`;
}).join(", ");
console.log(`ADR: ${pliki.length} decyzji, format zgodny z szablonem (${wgStatusu})`);
