#!/usr/bin/env node
// ============================================================
// MAPA WITRYNY DLA TRZECH JEZYKOW
// ============================================================
// Od 27 sierpnia 2026 kazda strona stoi pod trzema adresami: polskim golym,
// angielskim pod `/en/` i niemieckim pod `/de/`. Mapa witryny musi wymienic
// wszystkie trzy i przy kazdym powiedziec, gdzie sa pozostale dwa, inaczej
// wyszukiwarka potraktuje je jak trzy osobne strony o tej samej tresci.
//
// Wczesniej mapa byla pisana recznie: 95 adresow, do ktorych blok sklepowy
// dopisywal sie osobnym skryptem. Przy trzystu adresach reka przestaje byc
// narzedziem, wiec caly plik powstaje teraz z tych samych zrodel co prerender.
//
// Co przenosimy ze starej mapy: date ostatniej zmiany, czestotliwosc,
// priorytet i obrazy. Te dane sa decyzja redakcyjna, a nie czyms, co da sie
// wyliczyc, wiec bylaby szkoda je zgubic. Klucz to polski adres.
//
//   node scripts/build-sitemap.mjs          zapisuje public/sitemap.xml
//   node scripts/build-sitemap.mjs --check  sprawdza, kod wyjscia 1 przy dryfie

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { TRASY_STALE, JEZYKI, JEZYK_DOMYSLNY, sciezkaJezyka } from "../src/routes.js";
import { POSTS_META } from "../src/blog/postsMeta.js";
import { GLOSSARY } from "../src/data/glossary.js";
import { PRODUCTS } from "../src/data/shopCatalog.js";
import { SERVICES_FULL } from "../src/data/serviceCatalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLIK = join(ROOT, "public", "sitemap.xml");
const SITE = "https://www.aejaca.com";

// Strony sesyjne: koszyk, kasa, status zamowienia, wejscie z numerem oferty
// i wersja robocza kreatora. Nie maja wlasnej tresci i nie maja czego szukac
// w wynikach wyszukiwania.
const POZA_MAPA = new Set([
  "/cart/",
  "/checkout/",
  "/order/",
  "/order/status/",
  "/oferta/",
  "/quote/",
  "/toolsjewelry/kreator/",
]);

const adresy = [
  ...TRASY_STALE,
  ...POSTS_META.map((p) => `/blog/${p.slug}/`),
  ...GLOSSARY.map((g) => `/glossary/${g.id}/`),
  ...PRODUCTS.map((p) => `/shop/${p.slug}/`),
  ...SERVICES_FULL.map((s) => `/shop/service/${s.id}/`),
].filter((p) => !POZA_MAPA.has(p));

// ------------------------------------------------------------
// Co bylo w starej mapie
// ------------------------------------------------------------
const stara = readFileSync(PLIK, "utf8");
const zachowane = new Map();
for (const blok of stara.match(/<url>[\s\S]*?<\/url>/g) || []) {
  const loc = /<loc>([^<]+)<\/loc>/.exec(blok)?.[1];
  if (!loc) continue;
  zachowane.set(loc.replace(SITE, ""), {
    lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(blok)?.[1] || null,
    changefreq: /<changefreq>([^<]+)<\/changefreq>/.exec(blok)?.[1] || null,
    priority: /<priority>([^<]+)<\/priority>/.exec(blok)?.[1] || null,
    obrazy: (blok.match(/<image:image>[\s\S]*?<\/image:image>/g) || []),
  });
}

const DOMYSLNE = { lastmod: "2026-08-27", changefreq: "monthly", priority: "0.60" };

function blokAdresu(sciezka, lang) {
  const stare = zachowane.get(sciezka) || {};
  const pelny = SITE + sciezkaJezyka(sciezka, lang);
  const wiersze = [
    "  <url>",
    `    <loc>${pelny}</loc>`,
    `    <lastmod>${stare.lastmod || DOMYSLNE.lastmod}</lastmod>`,
    `    <changefreq>${stare.changefreq || DOMYSLNE.changefreq}</changefreq>`,
    `    <priority>${stare.priority || DOMYSLNE.priority}</priority>`,
    "",
  ];
  for (const j of JEZYKI) {
    wiersze.push(`    <xhtml:link rel="alternate" hreflang="${j}" href="${SITE + sciezkaJezyka(sciezka, j)}" />`);
  }
  wiersze.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + sciezkaJezyka(sciezka, JEZYK_DOMYSLNY)}" />`);
  // Obrazy opisujemy raz, przy wersji polskiej. Ten sam plik pod trzema
  // adresami nie jest trzema obrazami.
  if (lang === JEZYK_DOMYSLNY) {
    for (const obraz of stare.obrazy || []) {
      const srodek = obraz
        .split("\n")
        .map((w) => w.trim())
        .filter(Boolean)
        .map((w, i, tab) => (i === 0 || i === tab.length - 1 ? "    " + w : "      " + w))
        .join("\n");
      wiersze.push(srodek);
    }
  }
  wiersze.push("  </url>");
  return wiersze.join("\n");
}

const tresc = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Plik generowany przez scripts/build-sitemap.mjs. Nie poprawiaj go recznie:
  najblizszy build nadpisze poprawke bez slowa. Zrodlem sa src/routes.js oraz
  katalogi bloga, slownika, produktow i uslug.
-->
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

${JEZYKI.flatMap((lang) => adresy.map((s) => blokAdresu(s, lang))).join("\n\n")}

</urlset>
`;

if (process.argv.includes("--check")) {
  if (stara.trim() !== tresc.trim()) {
    console.error("\n  ✗ public/sitemap.xml rozjechala sie ze zrodlami.");
    console.error("    Uruchom: node scripts/build-sitemap.mjs\n");
    process.exit(1);
  }
  console.log(`Mapa witryny: ${adresy.length} stron x ${JEZYKI.length} jezyki, zgodnie.`);
} else {
  writeFileSync(PLIK, tresc);
  console.log(`Mapa witryny zapisana: ${adresy.length * JEZYKI.length} adresow.`);
}
