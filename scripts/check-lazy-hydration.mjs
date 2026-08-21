#!/usr/bin/env node
// ============================================================
// HYDRATACJA NIE MOZE PORZUCAC PRERENDERU
// ============================================================
// Kazda strona poza glowna wchodzi przez `lazy()`. Gdy hydratacja rusza,
// zanim fragment trasy sie sciagnie, granica `Suspense` zawiesza sie w jej
// trakcie, React porzuca gotowy HTML i rysuje strone od nowa po stronie
// klienta. W konsoli zostaja bledy #421 i #418.
//
// AWARIA JEST CICHA: strona dziala, tylko przestaje sluzyc to, po co
// prerender istnieje. Zmierzone przed poprawka: przy szybkim laczu padalo
// mniej wiecej co trzecie wejscie na `/studio/`, przy fragmencie opoznionym
// o 300 ms KAZDE. Po poprawce zero na dziewiecdziesieciu wejsciach.
//
// Wystarczy dopisac nowa strone zwyklym `lazy()`, zeby wrocila. Nic sie przy
// tym nie wywali, wiec pilnujemy tego tutaj.
//
//   node scripts/check-lazy-hydration.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(ROOT, "src/main.jsx"), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };

// --- 1. Zadna trasa nie omija opakowania z `preload` ----------------------
// Liste wyprowadzamy z pliku, a nie spisujemy: spisana zostalaby przy
// stronach, ktore akurat istnialy w dniu pisania.
const przezStrona = [...src.matchAll(/=\s*strona\(\(\)\s*=>\s*import\(["']([^"']+)["']/g)].map((m) => m[1]);
const przezLazy = [...src.matchAll(/=\s*lazy\(\(\)\s*=>\s*import\(["']([^"']+)["']/g)].map((m) => m[1]);

if (!przezStrona.length) zle("zadna trasa nie idzie przez strona(): opakowanie z preload zniknelo");
if (przezLazy.length) {
  zle(`trasy omijaja preload i wchodza wprost przez lazy(): ${przezLazy.join(", ")}`);
}

// --- 2. Opakowanie faktycznie wystawia preload -----------------------------
if (!/function strona\([^)]*\)\s*\{[\s\S]{0,400}?\.preload\s*=/.test(src)) {
  zle("strona() nie ustawia .preload, wiec nie ma czego wczytac przed hydratacja");
}

// --- 3. Hydratacja czeka na fragment --------------------------------------
// To jest cala poprawka. Samo `hydrateRoot(root, app)` bez czekania przywraca
// stary blad, a wyglada zupelnie niewinnie.
const hydratacje = [...src.matchAll(/hydrateRoot\s*\(/g)].length;
if (hydratacje !== 1) zle(`hydrateRoot wolane ${hydratacje} razy, spodziewane raz`);
if (!/wczytajTraseBiezaca\(\)\s*\.then\(\s*\(\)\s*=>\s*hydrateRoot\(/.test(src)) {
  zle("hydrateRoot nie czeka na wczytajTraseBiezaca(): hydratacja znowu wyprzedzi fragment trasy");
}

// --- 4. Dopasowanie idzie po TEJ SAMEJ deklaracji tras --------------------
// Druga lista sciezek rozjechalaby sie przy pierwszej nowej stronie, i to po
// cichu: brakujaca pozycja nie jest bledem, tylko powrotem do starej awarii.
if (!/matchRoutes\(\s*createRoutesFromElements\(\s*trasy\s*\)/.test(src)) {
  zle("wczytajTraseBiezaca nie dopasowuje po `trasy`, wiec gdzies powstala druga lista sciezek");
}
if (!/<Routes>\{trasy\}<\/Routes>/.test(src)) {
  zle("<Routes> nie renderuje `trasy`: deklaracja tras rozeszla sie z ta, po ktorej szukamy fragmentu");
}

// --- 5. Granica Suspense nadal stoi ---------------------------------------
// Bez niej leniwa trasa wywala cala aplikacje zamiast pokazac kreciolek.
if (!/<Suspense\s/.test(src)) zle("zniknela granica <Suspense> wokol tras");

// --- 6. Kazda sciezka z main.jsx ma swoj komponent -------------------------
// Tanie sprawdzenie spojnosci samej deklaracji: `path` bez `element` to trasa,
// ktora dopasuje sie i nie narysuje niczego.
const bezElementu = [...src.matchAll(/<Route\s+path="([^"]+)"(?![^>]*element=)[^>]*>/g)].map((m) => m[1]);
if (bezElementu.length) zle(`trasy bez element=: ${bezElementu.join(", ")}`);

if (bledy) {
  console.error(`\nHydratacja: ${bledy} bledow.`);
  process.exit(1);
}
console.log(`Hydratacja: ${przezStrona.length} tras leniwych, kazda wczytywana przed hydratacja`);
