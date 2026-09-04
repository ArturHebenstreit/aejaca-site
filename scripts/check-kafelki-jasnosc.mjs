#!/usr/bin/env node
// ============================================================
// JASNOSC KAFELKA: WYBRANY I POD MYSZKA
// ============================================================
// Wlasciciel zglaszal szesc razy to samo: kafelek wybrany i kafelek pod
// myszka sa ciemne. Za kazdym razem poprawka trafiala w jedna rodzine
// kafelkow, a rodzin jest kilkanascie, wiec skarga wracala. Pomiar prawdziwych
// pikseli z 2026-09-04 pokazal skale: w motywie ciemnym najazd zmienial tlo
// o 0,0000, bo ruszala sie wylacznie obwodka, a w jasnym kafelek WYBRANY mial
// 0,777 jasnosci przy wygaszonych 0,938, czyli zaznaczenie bylo ciemniejsze od
// reszty siatki.
//
// Dwie przyczyny, obie ciche, i ta bramka pilnuje obu.
//
// 1. WARSTWA SWIATLA BYLA KOPIOWANA, NIE WSPOLDZIELONA. Znacznik kafelka ze
//    zdjeciem stoi w pieciu plikach, bo powstawal przez kopiowanie. Warstwe
//    `tile-lift` mial jeden z nich. Kolejna kopia rodzi sie ciemna i nikt tego
//    nie widzi, bo kafelek wyglada poprawnie, tylko nie odpowiada na kursor.
//    Dlatego: plik, ktory wygasza zdjecia (`tile-dim`), musi tez dokladac
//    swiatlo (`tile-lift`).
//
// 2. ODCIEN ZAZNACZENIA W MOTYWIE JASNYM BYWA CIEMNIEJSZY OD TLA. Paleta ma
//    dwa konce i siegniecie po ciemniejszy stopien wyglada w kodzie tak samo
//    dobrze jak po jasniejszy. Dlatego liczymy tu jasnosc wzgledna odcienia
//    zlozonego z biala kartka i wymagamy, zeby zaznaczenie nie schodzilo
//    ponizej progu, a najazd nigdy nie byl ciemniejszy od spoczynku.
//
// Uruchamiana w `npm run build`.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const CSS = readFileSync(join(SRC, "index.css"), "utf8");

/** Prog jasnosci dla zaznaczenia w motywie jasnym. Wygaszone kafelki maja
 *  zmierzone 0,89 do 0,95, wiec 0,80 zostawia margines na odcien, ale nie na
 *  zalanie kafelka ciemnym kolorem. */
const PROG_JASNY = 0.80;

const bledy = [];

/** Jasnosc wzgledna wedlug WCAG. */
const jasnosc = ([r, g, b]) => {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
/** Odcien polozony na podkladzie. Podklad ma znaczenie i to jest sedno:
 *  stara regula lala `rgba(180,83,9,0.08)` BEZ wlasnego tla, wiec siadala na
 *  kremowej kartce (#f6ede4) i dawala zmierzone 0,777. Ta sama liczba na bieli
 *  wychodzi 0,905, czyli mieszczaca sie w progu. Dlatego bramka liczy na bieli
 *  tylko wtedy, gdy regula sama tej bieli pod soba nie zapomniala. */
const KARTKA = [246, 237, 228];
const naPodkladzie = ([r, g, b, a], [pr, pg, pb]) =>
  [r * a + pr * (1 - a), g * a + pg * (1 - a), b * a + pb * (1 - a)];

// ── 1. Kazdy plik, ktory wygasza kafelki, musi tez dokladac swiatla ────────
function jsxy(dir, out = []) {
  for (const nazwa of readdirSync(dir)) {
    const pelna = join(dir, nazwa);
    if (statSync(pelna).isDirectory()) jsxy(pelna, out);
    else if (nazwa.endsWith(".jsx")) out.push(pelna);
  }
  return out;
}
for (const plik of jsxy(SRC)) {
  const tresc = readFileSync(plik, "utf8");
  if (!/tile-dim/.test(tresc)) continue;
  if (!/tile-lift/.test(tresc)) {
    bledy.push(`${relative(ROOT, plik)}: kafelki ze zdjeciem bez warstwy swiatla (tile-lift), wiec najazd i wybor nie rozjasniaja`);
    continue;
  }
  // Warstwa renderowana warunkowo (`{active && ...}`) znaczy, ze regula
  // najazdu nie ma na czym zadzialac: kafelek niewybrany jej nie ma.
  if (/\{\s*active\s*&&\s*<div[^>]*tile-lift/.test(tresc)) {
    bledy.push(`${relative(ROOT, plik)}: warstwa tile-lift stoi tylko przy wybranym, wiec najazd na niewybrany nic nie rozjasni`);
  }
}

// ── 2. Cztery stany warstwy swiatla musza istniec i rosnac ────────────────
const wartosc = (selektor) => {
  const re = new RegExp(selektor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{[^}]*background:\\s*rgba\\(255,\\s*255,\\s*255,\\s*([0-9.]+)\\)");
  const m = CSS.match(re);
  return m ? Number(m[1]) : null;
};
const spoczynek = wartosc(".tile-lift");
const najazd = wartosc("button:hover .tile-lift");
const wybrany = wartosc(".tile-lift-on");
const wybranyNajazd = wartosc("button:hover .tile-lift-on");
if (spoczynek === null || najazd === null || wybrany === null || wybranyNajazd === null) {
  bledy.push("src/index.css: brak ktoregos z czterech stanow warstwy tile-lift (spoczynek, najazd, wybrany, wybrany pod myszka)");
} else if (!(spoczynek < najazd && najazd < wybrany && wybrany < wybranyNajazd)) {
  bledy.push(`src/index.css: stany tile-lift nie rosna: ${spoczynek} -> ${najazd} -> ${wybrany} -> ${wybranyNajazd}`);
}

// ── 3. Zaznaczenie w motywie jasnym nie moze byc ciemniejsze od siatki ────
const bloki = [...CSS.matchAll(/\[data-theme="light"\][^{}]*button\.border-(amber|blue)-400[^{}]*\{([^}]*)\}/g)];
if (bloki.length < 4) {
  bledy.push(`src/index.css: motyw jasny opisuje ${bloki.length} regul zaznaczenia kafelka, spodziewane cztery (dwa akcenty, spoczynek i najazd)`);
}
const zmierzone = { amber: {}, blue: {} };
const podklad = { amber: KARTKA, blue: KARTKA };
// Najpierw podklady: regula najazdu tla nie powtarza, dziedziczy je po spoczynku.
for (const b of bloki) {
  if (/:hover/.test(b[0].slice(0, b[0].indexOf("{")))) continue;
  if (/background-color:\s*#(fff|ffffff)\b/i.test(b[2])) podklad[b[1]] = [255, 255, 255];
}
for (const b of bloki) {
  const akcent = b[1];
  const najazdowa = /:hover/.test(b[0].slice(0, b[0].indexOf("{")));
  const m = b[2].match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
  if (!m) { bledy.push(`src/index.css: regula zaznaczenia ${akcent} bez czytelnego odcienia rgba()`); continue; }
  const L = jasnosc(naPodkladzie([+m[1], +m[2], +m[3], +m[4]], podklad[akcent]));
  zmierzone[akcent][najazdowa ? "najazd" : "spoczynek"] = L;
  if (L < PROG_JASNY) {
    bledy.push(`src/index.css: zaznaczenie ${akcent}${najazdowa ? " pod myszka" : ""} w motywie jasnym ma jasnosc ${L.toFixed(3)}, prog to ${PROG_JASNY}`);
  }
}
for (const akcent of ["amber", "blue"]) {
  const { spoczynek: s, najazd: n } = zmierzone[akcent];
  if (s != null && n != null && n < s) {
    bledy.push(`src/index.css: najazd na wybrany kafelek ${akcent} w motywie jasnym CIEMNIEJE (${s.toFixed(3)} -> ${n.toFixed(3)})`);
  }
}

if (bledy.length) {
  console.error("\nJasnosc kafelkow:\n");
  for (const b of bledy) console.error(`  ✗ ${b}`);
  process.exit(1);
}
console.log("OK jasnosc kafelkow: warstwa swiatla wszedzie, cztery stany rosna, motyw jasny nie ciemnieje");
