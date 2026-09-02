#!/usr/bin/env node
// ============================================================
// STRAZNIK PELNYCH ADRESOW W DANYCH STRUKTURALNYCH
// ============================================================
// `SITE.url` z `src/seo/seoData.js` to goly adres serwisu, czyli adres
// POLSKI. Kazde miejsce, ktore skleja `${SITE.url}/about/` z reki, produkuje
// adres polski takze na stronie niemieckiej.
//
// W `SEOHead` bylo to zrobione dobrze od poczatku, bo prefiks doklada sie tam
// raz, dla kanonicznego i dla wszystkich `alternate`. Poza `SEOHead` juz nie:
// trzydziesci stron liczylo sobie `pageUrl` wlasnorecznie i wkladalo go do
// danych strukturalnych, wiec niemiecka strona niosla schemat mowiacy "ta
// strona to https://www.aejaca.com/about/", czyli wskazujacy na polska.
//
// Wykryl to audyt SEO 2 wrzesnia 2026: 252 strony, caly `/en/` i caly `/de/`.
// Nic sie przy tym nie psulo. Build byl zielony, prerender wypisywal 318 stron
// i zero bledow, przeglad stron nie mial czego zobaczyc, bo JSON-LD nie ma
// reprezentacji wizualnej. Dwie trzecie serwisu przez tydzien mowilo
// wyszukiwarce, ze jest wersja polska.
//
// Dlatego regula jest prosta i sprawdzalna: POZA `src/seo/` NIE WOLNO tknac
// `SITE.url`. Strony biora jeden z dwoch pomocnikow:
//
//   adresStrony("/about/", lang)     strona, dostaje prefiks jezyka
//   adresZasobu("/og-about.jpg")     plik, prefiksu nie dostaje, bo obraz
//                                    jest jeden dla trzech jezykow
//
// Druga polowa tej samej reguly: `adresStrony` bez drugiego argumentu cofa nas
// dokladnie tam, skad wyszlismy, bo domyslnym jezykiem jest polski. Wywolanie
// z jednym argumentem jest wiec bledem, nawet jesli wyglada niewinnie.
//
//   node scripts/check-adresy-seo.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(KORZEN, "src");

/** Jedyny katalog, ktoremu wolno znac goly adres serwisu. */
const WOLNO = "seo/";

const pliki = [];
(function zbierz(katalog) {
  for (const wpis of readdirSync(katalog)) {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) zbierz(sciezka);
    else if (/\.(jsx?|mjs)$/.test(wpis)) pliki.push(sciezka);
  }
})(SRC);

const bledy = [];

for (const plik of pliki) {
  const wzgledny = relative(SRC, plik).split("\\").join("/");
  const tresc = readFileSync(plik, "utf8");

  if (!wzgledny.startsWith(WOLNO)) {
    tresc.split("\n").forEach((wiersz, i) => {
      if (/\bSITE\.url\b/.test(wiersz)) {
        bledy.push(`src/${wzgledny}:${i + 1}  SITE.url poza src/seo/\n      ${wiersz.trim().slice(0, 110)}`);
      }
    });
  }

  // `adresStrony(cos)` bez jezyka. Drugiego argumentu szukamy po przecinku na
  // poziomie zerowym nawiasow, bo pierwszym argumentem bywa szablon z wyrazeniem
  // w srodku, a w nim przecinki i nawiasy wystepuja normalnie.
  for (const m of tresc.matchAll(/\badresStrony\(/g)) {
    let i = m.index + m[0].length;
    let glebokosc = 0;
    let maJezyk = false;
    for (; i < tresc.length; i++) {
      const z = tresc[i];
      if (z === "(" || z === "{" || z === "[") glebokosc++;
      else if (z === ")" && glebokosc === 0) break;
      else if (z === ")" || z === "}" || z === "]") glebokosc--;
      else if (z === "," && glebokosc === 0) { maJezyk = true; break; }
    }
    if (!maJezyk) {
      const wiersz = tresc.slice(0, m.index).split("\n").length;
      bledy.push(`src/${wzgledny}:${wiersz}  adresStrony bez jezyka, wiec adres wyjdzie polski`);
    }
  }
}

if (bledy.length) {
  console.error(`\nAdresy sklejane z golego SITE.url: ${bledy.length}\n`);
  for (const b of bledy.slice(0, 30)) console.error(`  ${b}`);
  if (bledy.length > 30) console.error(`\n  ...i ${bledy.length - 30} wiecej`);
  console.error("\nStrona bierze adres z pomocnikow w src/seo/seoData.js:");
  console.error("  adresStrony(\"/about/\", lang)   strona, z prefiksem jezyka");
  console.error("  adresZasobu(\"/og-about.jpg\")   plik, bez prefiksu\n");
  process.exit(1);
}

console.log(`Adresy SEO: ${pliki.length} plikow, SITE.url tylko w src/seo/, kazdy adresStrony z jezykiem`);
