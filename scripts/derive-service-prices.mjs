#!/usr/bin/env node
// ============================================================
// CENY "OD" NA KARTACH USLUG, WYPROWADZONE Z SILNIKA
// ============================================================
// Etykieta "od X PLN" byla wpisywana recznie i rozjechala sie z cennikiem:
// jedne uslugi obiecywaly cene, ktorej nie dalo sie kupic, inne odstraszaly
// progiem dwa razy wyzszym niz prawdziwy. Tutaj liczymy ja tym samym kodem,
// ktory obciaza klienta, przeszukujac przestrzen opcji konfiguratora.
//
// Liczymy dla JEDNEJ sztuki. Rabat nakladu obniza cene jednostkowa, ale
// klient czytajacy "od" mysli o pojedynczym zamowieniu, a nie o partii 50 szt.
//
//   node scripts/derive-service-prices.mjs          zapisuje do serviceCatalog.js
//   node scripts/derive-service-prices.mjs --check  tylko weryfikuje, kod wyjscia 1 przy dryfie

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { SERVICES } from "../src/data/orderCatalog.js";
import { SERVICES_FULL } from "../src/data/serviceCatalog.js";
import * as print3d from "../src/pricing/print3d.js";
import * as jewelry from "../src/pricing/jewelry.js";
import * as laserCo2 from "../src/pricing/laserCo2.js";
import * as laserFiber from "../src/pricing/laserFiber.js";
import * as epoxy from "../src/pricing/epoxy.js";
import * as cadDesign from "../src/pricing/cadDesign.js";
import * as preciousMetalCasting from "../src/pricing/preciousMetalCasting.js";
import { seedAsStock } from "../src/pricing/materialStockSeed.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "src", "data", "serviceCatalog.js");

/** Ten sam rejestr, co w chat-api/orders.js */
const FN = {
  print3d_fdm: print3d.calculate,
  print3d_msla: print3d.calculateMSLA,
  jewelry_new: jewelry.calcNew,
  jewelry_chain: jewelry.calcChain,
  jewelry_renovation: jewelry.calcRenovation,
  jewelry_repair: jewelry.calcRepair,
  laser_co2_engrave: laserCo2.calcEngrave,
  laser_co2_cut: laserCo2.calcCut,
  laser_fiber: laserFiber.calculate,
  epoxy: epoxy.calculate,
  cad_design: cadDesign.calculate,
  jewelry_casting: preciousMetalCasting.calculate,
};

/** Powyzej tego progu przechodzimy na losowanie, zeby build nie stanal */
const EXHAUSTIVE_LIMIT = 400_000;
const SAMPLE_COUNT = 150_000;

/** Deterministyczny generator, zeby ten sam katalog dawal ten sam wynik */
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function optionsOf(field, defaults) {
  const opts = field.optionsFrom ? field.optionsFrom(defaults) : field.options;
  const ids = (opts || []).map((o) => o.id);
  // Pole wielokrotnego wyboru oczekuje tablicy. Bez tego kalkulator dostaje
  // goly identyfikator, nie rozpoznaje zadnej pozycji i zwraca grosze.
  return field.multi ? ids.map((id) => [id]) : ids;
}

/**
 * Cena z zapasem, zaokraglona w gore.
 *
 * Etykieta "od" ma byc osiagalna takze jutro. Uslugi jubilerskie licza sie
 * od biezacego kursu kruszcu, ktorego skrypt buildu nie zna, wiec dostaja
 * dodatkowy margines, zeby wzrost ceny srebra nie zrobil z etykiety obietnicy
 * bez pokrycia.
 */
function labelPrice(grosze, calculator) {
  const rateDependent = calculator.startsWith("jewelry_");
  const withHeadroom = rateDependent ? grosze * 1.1 : grosze;
  const step = rateDependent ? 500 : 100; // 5 PLN dla bizuterii, 1 PLN dla reszty
  return Math.ceil(withHeadroom / step) * step;
}

function cheapest(svc) {
  const fn = FN[svc.calculator];
  if (!fn) return null;

  const fields = svc.fields
    .map((f) => ({ key: f.key, opts: optionsOf(f, svc.defaults) }))
    .filter((f) => f.opts.length > 0);

  // Naklad ustawiamy na sztywno na jedna sztuke.
  for (const f of fields) if (f.key === "quantityId") f.opts = ["proto"];

  const total = fields.reduce((a, f) => a * f.opts.length, 1);
  let min = Infinity;
  let best = null;

  // ETYKIETA MUSI LICZYC SIE Z TEJ SAMEJ TABELI, CO KWOTA W KOSZYKU.
  // Uslugi laserowe CO2 doliczaja material z naszego magazynu, a jego stawka
  // stoi w tabeli, nie w kodzie. Bez tego argumentu silnik zjezdza na stawke
  // domyslna i etykieta obiecuje cene, ktorej w kalkulatorze nie ma. Blad
  // cichy w obie strony: raz obietnica bez pokrycia, raz prog odstraszajacy.
  const stock = svc.calculator.startsWith("laser_") ? seedAsStock() : null;

  const price = (acc) => {
    try {
      const r = fn({ ...acc, ...(svc.fixed || {}) }, "pl", stock);
      if (r && r.type !== "custom" && r.unitGrosze > 0 && r.unitGrosze < min) {
        min = r.unitGrosze;
        best = { ...acc };
      }
    } catch {
      // Niepelna kombinacja parametrow, kalkulator ma prawo jej nie obsluzyc.
    }
  };

  if (total <= EXHAUSTIVE_LIMIT) {
    const walk = (i, acc) => {
      if (i === fields.length) return price(acc);
      for (const v of fields[i].opts) walk(i + 1, { ...acc, [fields[i].key]: v });
    };
    walk(0, {});
    return { grosze: min, best, method: "pelne", checked: total };
  }

  const rng = makeRng(0x5eed);
  for (let n = 0; n < SAMPLE_COUNT; n++) {
    const acc = {};
    for (const f of fields) acc[f.key] = f.opts[Math.floor(rng() * f.opts.length)];
    price(acc);
  }
  return { grosze: min, best, method: "losowanie", checked: SAMPLE_COUNT };
}

const check = process.argv.includes("--check");
let source = readFileSync(CATALOG, "utf8");
const drift = [];
const rows = [];

for (const card of SERVICES_FULL) {
  // Cena tej uslugi wymaga geometrii pliku, ktorej katalog nie ma. Wartosc
  // "od" jest osobnym, przetestowanym przypadkiem referencyjnym.
  if (card.quoteOnly || card.geometryPriced) continue;
  const svc = SERVICES.find((s) => s.id === card.service || s.id === card.id);
  if (!svc) {
    console.warn(`- ${card.id}: brak definicji w orderCatalog, pomijam`);
    continue;
  }

  const found = cheapest(svc);
  if (!found || !Number.isFinite(found.grosze)) {
    console.warn(`- ${card.id}: nie udalo sie policzyc zadnej ceny, pomijam`);
    continue;
  }

  const label = labelPrice(found.grosze, svc.calculator);
  const current = card.priceFromGrosze ?? null;
  rows.push({ id: card.id, current, next: label, raw: found.grosze, method: found.method, checked: found.checked });

  if (current === label) continue;
  drift.push(card.id);

  if (!check) {
    // Podmieniamy wylacznie pole tej uslugi, po zakotwiczeniu na jej id.
    const anchor = new RegExp(`(id:\\s*"${card.id}",[\\s\\S]{0,2000}?priceFromGrosze:\\s*)(\\d+)`);
    const before = source;
    source = source.replace(anchor, `$1${label}`);
    if (source === before) {
      console.error(`- ${card.id}: nie znalazlem pola priceFromGrosze, popraw recznie`);
      process.exitCode = 1;
    }
  }
}

const fmt = (g) => (g == null ? "brak" : `${(g / 100).toFixed(2)} PLN`);
console.log("usluga".padEnd(24) + "karta".padEnd(14) + "silnik".padEnd(14) + "etykieta".padEnd(14) + "metoda");
for (const r of rows) {
  const mark = r.current === r.next ? " " : "*";
  console.log(`${mark}${r.id.padEnd(23)}${fmt(r.current).padEnd(14)}${fmt(r.raw).padEnd(14)}${fmt(r.next).padEnd(14)}${r.method} (${r.checked})`);
}

if (!drift.length) {
  console.log("\nCeny 'od' zgodne z silnikiem.");
  process.exit(0);
}

if (check) {
  console.error(`\nCeny 'od' rozjechaly sie z silnikiem: ${drift.join(", ")}`);
  console.error("Uruchom: npm run prices:derive");
  process.exit(1);
}

writeFileSync(CATALOG, source);
console.log(`\nZaktualizowano ${drift.length} pozycji w src/data/serviceCatalog.js`);
