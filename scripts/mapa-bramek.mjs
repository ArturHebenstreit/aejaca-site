#!/usr/bin/env node
// ============================================================
// SPIS BRAMEK BUILDU, PISANY PRZEZ BRAMKI
// ============================================================
// `npm run build` uruchamia kilkadziesiat sprawdzianow, zanim cokolwiek
// zbuduje. Kazdy powstal po awarii i kazdy niesie w naglowku opis tego, co
// poszlo zle. Ta wiedza byla dotad rozsypana po kilkudziesieciu plikach:
// zeby dowiedziec sie, czego build pilnuje, trzeba bylo otworzyc je wszystkie.
//
// Model, ktory dostaje to repozytorium pierwszy raz, potrzebuje tej listy
// zanim cokolwiek zmieni: inaczej pozna reguly dopiero przez padajacy build,
// jedna po drugiej, i za kazdym razem bedzie zgadywal, czego od niego chca.
//
// SPIS JEST GENEROWANY, a nie pisany. Recznie prowadzona lista siedemdziesieciu
// pozycji rozjezdza sie przy pierwszej dolozonej bramce i nikt tego nie
// zauwaza, bo dokument dalej wyglada poprawnie. Tytul i powod bierzemy
// z naglowka samego skryptu, kolejnosc z `package.json`.
//
//   node scripts/mapa-bramek.mjs           zapisuje MDs/MAPA_BRAMEK.md
//   node scripts/mapa-bramek.mjs --check   pada, gdy spis odjechal od buildu
//
// Wersja `--check` stoi w `npm run build`, wiec dolozona bramka wymusza
// odswiezenie spisu w tym samym commicie, w ktorym powstala.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CEL = join(ROOT, "MDs", "MAPA_BRAMEK.md");
const sprawdzenie = process.argv.includes("--check");

/** Skrypty z lancucha `npm run build`, w kolejnosci uruchamiania. */
function bramkiZBuildu() {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  return String(pkg.scripts?.build || "")
    .split("&&")
    .map((cz) => cz.trim())
    .map((cz) => (cz.match(/^node\s+([\w./-]+\.mjs)/) || [])[1])
    .filter(Boolean);
}

/**
 * Tytul i powod z naglowka skryptu.
 *
 * Naglowek ma w tym repozytorium jeden ksztalt: ramka z rownych znakow, tytul
 * wielkimi literami, ramka, potem akapit o tym, co poszlo zle. Bierzemy tytul
 * i PIERWSZE ZDANIE akapitu: dluzszy opis nalezy do pliku, a nie do spisu.
 */
function opisBramki(sciezka) {
  const pelna = join(ROOT, sciezka);
  if (!existsSync(pelna)) return null;
  // Szeroko, bo czesc testow zaczyna sie od importow, a naglowek stoi pod nimi.
  const linie = readFileSync(pelna, "utf8").split("\n").slice(0, 140);
  const komentarze = linie
    .filter((l) => l.startsWith("//"))
    .map((l) => l.replace(/^\/\/\s?/, "").trimEnd());
  const ramki = komentarze
    .map((l, i) => (/^=+$/.test(l.trim()) ? i : -1))
    .filter((i) => i >= 0);
  const tytul = ramki.length >= 2 ? komentarze.slice(ramki[0] + 1, ramki[1]).join(" ").trim() : "";
  const reszta = komentarze.slice(ramki.length >= 2 ? ramki[1] + 1 : 0);
  // Akapit konczy sie pusta linia; zdanie kropka po malej literze albo cyfrze,
  // zeby skrot "np." albo "U+2014" nie ucinal zdania w polowie.
  const akapit = [];
  for (const l of reszta) {
    if (!l.trim()) { if (akapit.length) break; continue; }
    akapit.push(l.trim());
  }
  // Zdanie konczy kropka po malej literze albo cyfrze, ale DOPIERO gdy uzbiera
  // sie kilkadziesiat znakow: inaczej skrot na poczatku ("Art. 398 Prawa
  // komunikacji...") uchodzil za cale zdanie i spis mowil "Art.".
  const caly = akapit.join(" ");
  let powod = caly;
  for (const m of caly.matchAll(/(?<=[a-z0-9)])\.\s/g)) {
    if (m.index >= 40) { powod = caly.slice(0, m.index); break; }
  }
  powod = powod.replace(/\.+$/, "");
  return { tytul, powod: powod ? `${powod}.` : "", bezNaglowka: !tytul };
}

const bramki = bramkiZBuildu();
const brakujace = bramki.filter((b) => !existsSync(join(ROOT, b)));

const opisy = bramki.map((b) => ({ plik: b, ...(opisBramki(b) || { tytul: "", powod: "", bezNaglowka: true }) }));
// BRAK NAGLOWKA JEST WIDOCZNY, a nie zamieciony pod nazwe pliku. Konwencja
// projektu mowi, ze kazda bramka niesie u gory ramke z tytulem i akapit o tym,
// co poszlo zle. Skrypt bez tego jest regula, ktorej powodu nikt juz nie pamieta.
const bezNaglowka = opisy.filter((o) => o.bezNaglowka);
const wiersze = opisy.map((o, i) =>
  `| ${i + 1} | \`${o.plik}\` | ${o.tytul || "**brak naglowka**"} | ${o.powod.replace(/\|/g, "\\|") || "nie wiadomo, po co powstala" } |`);

const tresc = `# Mapa bramek buildu

> **Ten plik jest generowany.** Nie poprawiaj go recznie: zmiany zniknie przy
> nastepnym \`node scripts/mapa-bramek.mjs\`. Tytul i powod bierza sie
> z naglowka kazdego skryptu, kolejnosc z lancucha \`build\` w \`package.json\`.
> Chcesz zmienic opis bramki, zmien komentarz na jej gorze.

\`npm run build\` uruchamia **${bramki.length}** sprawdzianow, zanim cokolwiek
zbuduje. Kazdy powstal po konkretnej awarii i pilnuje, zeby ta sama awaria nie
wrocila. Build zatrzymuje sie na pierwszym, ktory padnie, wiec kolejnosc ma
znaczenie: najtansze i najczestsze stoja z przodu.

Wszystkie sa **twarde**. Nie ma tu ostrzezen, ktore mozna zignorowac: bramka
albo przepuszcza, albo zatrzymuje wdrozenie.

| # | Skrypt | Czego pilnuje | Dlaczego powstal |
|---|---|---|---|
${wiersze.join("\n")}

${bezNaglowka.length ? `## Bramki bez naglowka (${bezNaglowka.length})

Konwencja projektu mowi, ze kazda bramka niesie u gory ramke z tytulem i akapit
o tym, co poszlo zle. Ponizsze go nie maja, wiec ich powodu nie da sie
odczytac inaczej niz czytajac caly kod. Kto bedzie przy nich pracowal, niech
dopisze naglowek: regula, ktorej powodu nikt nie pamieta, zostaje przy pierwszej
okazji wylaczona jako uciazliwa.

${bezNaglowka.map((o) => `- \`${o.plik}\``).join("\n")}
` : ""}

## Bramki spoza tego lancucha

Trzy sprawdziany NIE stoja w \`npm run build\`, bo wymagaja przegladarki,
a build leci na Cloudflare Pages, gdzie przegladarki nie ma. Uruchamia sie je
na maszynie lokalnej:

| Polecenie | Co robi |
|---|---|
| \`npm run check:jezyk\` | klika w przelacznik jezyka naprawde, w dwoch szerokosciach ekranu |
| \`npm run ux:pomiar\` | crawl ze zrzutami kazdej strony, axe-core w obu motywach, martwe klikniecia |
| \`npm run seo:audyt\` | porownuje strony ze soba: hreflang, dane strukturalne, mapa witryny |
`;

if (sprawdzenie) {
  const bledy = [];
  if (brakujace.length) bledy.push(`build wola skrypty, ktorych nie ma: ${brakujace.join(", ")}`);
  const obecna = existsSync(CEL) ? readFileSync(CEL, "utf8") : "";
  if (obecna !== tresc) bledy.push("MDs/MAPA_BRAMEK.md odjechal od lancucha build. Uruchom: npm run mapa:bramki");
  if (bledy.length) {
    for (const b of bledy) console.error(`  ✗ ${b}`);
    process.exit(1);
  }
  console.log(`Mapa bramek: ${bramki.length} sprawdzianow, spis zgodny z buildem`);
} else {
  writeFileSync(CEL, tresc);
  console.log(`Mapa bramek: zapisano ${bramki.length} pozycji do MDs/MAPA_BRAMEK.md`);
}
