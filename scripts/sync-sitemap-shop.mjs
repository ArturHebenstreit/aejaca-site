#!/usr/bin/env node
// ============================================================
// ADRESY SKLEPU W MAPIE WITRYNY
// ============================================================
// Strony sklepu zyly i byly prerenderowane, ale w sitemap.xml nie bylo ani
// jednej, wiec wyszukiwarki o nich nie wiedzialy. Recznie dopisana lista
// odjechalaby przy pierwszej nowej usludze, dlatego generujemy ja z tych
// samych katalogow, ktore rysuja sklep.
//
// Koszyk, kasa i status zamowienia zostaja poza mapa: to strony sesyjne,
// bez wlasnej tresci, ktore nie maja czego szukac w wynikach.
//
//   node scripts/sync-sitemap-shop.mjs          zapisuje blok
//   node scripts/sync-sitemap-shop.mjs --check  weryfikuje, kod wyjscia 1 przy dryfie

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { PRODUCTS, SHOP_CATEGORIES } from "../src/data/shopCatalog.js";
import { SERVICES_FULL } from "../src/data/serviceCatalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = join(ROOT, "public", "sitemap.xml");
const SITE = "https://www.aejaca.com";

const BEGIN = "  <!-- SHOP:BEGIN, generowane przez scripts/sync-sitemap-shop.mjs -->";
const END = "  <!-- SHOP:END -->";

/** Data zmiany bierzemy z argumentu, zeby build byl powtarzalny */
const dateArg = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

function entry({ path, priority, changefreq, lastmod, comment }) {
  return [
    `  <!-- ${comment} -->`,
    "  <url>",
    `    <loc>${SITE}${path}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "",
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${path}" />`,
    "  </url>",
  ].join("\n");
}

function build(lastmod) {
  const out = [];

  out.push(entry({
    path: "/shop/", priority: "0.90", changefreq: "weekly", lastmod,
    comment: "Shop: products and services hub",
  }));

  for (const c of SHOP_CATEGORIES) {
    out.push(entry({
      path: c.path, priority: "0.80", changefreq: "weekly", lastmod,
      comment: `Shop category: ${c.id}`,
    }));
  }

  for (const p of PRODUCTS) {
    out.push(entry({
      path: `/shop/${p.slug}/`, priority: "0.70", changefreq: "weekly", lastmod,
      comment: `Product: ${p.slug}`,
    }));
  }

  for (const s of SERVICES_FULL) {
    out.push(entry({
      // Usluga z wycena automatyczna prowadzi wprost do zakupu, wiec waży wiecej
      // niz taka, ktora konczy sie formularzem.
      path: `/shop/service/${s.id}/`, priority: s.quoteOnly ? "0.60" : "0.70",
      changefreq: "monthly", lastmod,
      comment: `Service: ${s.id}`,
    }));
  }

  return [BEGIN, "", out.join("\n\n"), "", END].join("\n");
}

const check = process.argv.includes("--check");
const source = readFileSync(SITEMAP, "utf8");

const from = source.indexOf(BEGIN);
const to = source.indexOf(END);
const existing = from !== -1 && to !== -1 ? source.slice(from, to + END.length) : null;

// Przy pierwszym uruchomieniu bierzemy dzisiejsza date, potem zachowujemy
// ta, ktora juz jest, zeby lastmod nie skakal przy kazdym buildzie.
const previousDate = existing?.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)?.[1];
const lastmod = dateArg || previousDate || new Date().toISOString().slice(0, 10);
const block = build(lastmod);

if (existing === block) {
  console.log(`Mapa witryny zawiera aktualne adresy sklepu (lastmod ${lastmod}).`);
  process.exit(0);
}

if (check) {
  console.error("Adresy sklepu w sitemap.xml rozjechaly sie z katalogiem.");
  console.error("Uruchom: npm run sitemap:shop");
  process.exit(1);
}

const next = existing
  ? source.replace(existing, block)
  : source.replace("</urlset>", `${block}\n\n</urlset>`);

writeFileSync(SITEMAP, next);
const count = (block.match(/<url>/g) || []).length;
console.log(`Zapisano ${count} adresow sklepu w public/sitemap.xml (lastmod ${lastmod}).`);
