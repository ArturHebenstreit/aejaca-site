#!/usr/bin/env node
// ============================================================
// ZYWE DANE MUSZA DOCIERAC DO KWOTY WIAZACEJ
// ============================================================
// Kalkulatory jubilerskie biora dane rynkowe DODATKOWYMI ARGUMENTAMI:
//
//   calcNew(params, lang, rates, gemstones)
//   calcChain(params, lang, rates)
//
// Przegladarka wola je wprost i podaje komplet. Serwer wola je przez
// `priceItem`, i to on wystawia kwote WIAZACA. Kazde pominiete argumentem
// zrodlo danych oznacza, ze klient widzi jedna cene, a placi inna.
//
// Blad tej klasy NIE RZUCA WYJATKU. Brakujacy argument jest po prostu
// `undefined`, kalkulator siega po wartosc zapasowa z konfiguracji i zwraca
// liczbe, ktora wyglada zupelnie poprawnie. Oba przypadki ponizej byly
// realnymi bledami w produkcji, zadnego nie zglosil zaden test ani log.
//
//   node scripts/test-live-pricing.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { priceItem } from "../chat-api/orders.js";
import { GEMSTONES } from "../chat-api/pricing/jewelryConfig.js";
import { SERVICES } from "../src/data/orderCatalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failed = 0;
const ok = (name, cond, detail = "") => {
  console.log(`${cond ? "  ok" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  if (!cond) failed++;
};

function paramsFor(calculator) {
  const svc = SERVICES.find((s) => s.calculator === calculator);
  if (!svc) throw new Error(`brak uslugi dla ${calculator}`);
  const p = { ...(svc.defaults || {}), ...(svc.fixed || {}) };
  for (const f of svc.fields || []) {
    if (p[f.key] !== undefined) continue;
    const opts = f.optionsFrom ? f.optionsFrom(svc.defaults) : f.options;
    if (!opts?.length) continue;
    p[f.key] = f.multi ? [opts[0].id] : opts[0].id;
  }
  return p;
}

console.log("Zywe dane w kwocie wiazacej\n");

// ------------------------------------------------------------
// 1. Kursy kruszcow
// ------------------------------------------------------------
// Bylo: `priceItem` wkladal kursy do obiektu parametrow, a `calcNew` bierze
// je trzecim argumentem. Serwer liczyl zloto po stalej 645 PLN/g niezaleznie
// od rynku, przegladarka po kursie z NBP.
{
  const params = paramsFor("jewelry_new");
  const lo = priceItem({ calculator: "jewelry_new", params, rates: { ag_pln_per_g: 1, au_pln_per_g: 100, pln_per_eur: 4.25 } }).unitGrosze;
  const hi = priceItem({ calculator: "jewelry_new", params, rates: { ag_pln_per_g: 40, au_pln_per_g: 900, pln_per_eur: 4.25 } }).unitGrosze;
  ok("kurs kruszcu zmienia kwote wiazaca", lo !== hi,
     `${(lo / 100).toFixed(2)} vs ${(hi / 100).toFixed(2)} PLN`);
}

// ------------------------------------------------------------
// 2. Ceny kamieni
// ------------------------------------------------------------
// Bylo: `priceItem` nie przekazywal czwartego argumentu w ogole, wiec kamien
// wycenial sie po cenie wpisanej w kod, a nie po tej z tabeli `gemstone_prices`.
// Przy jednym brylancie to roznica rzedu kilkunastu tysiecy zlotych.
{
  const params = {
    ...paramsFor("jewelry_new"),
    // Pelny ksztalt wiersza ma znaczenie: bez `stoneSizeId` kalkulator
    // pomija kamien i test przechodzi na zielono, niczego nie sprawdzajac.
    stoneRows: [{ gemId: "diamond", stoneSizeId: "medium", count: 1, certId: "none" }],
  };
  const rates = { ag_pln_per_g: 10.15, au_pln_per_g: 645, pln_per_eur: 4.25 };

  const stat = priceItem({ calculator: "jewelry_new", params, rates }).unitGrosze;
  const cheap = priceItem({
    calculator: "jewelry_new", params, rates,
    gemstones: GEMSTONES.map((g) => (g.id === "diamond" ? { ...g, basePLN: 1000 } : g)),
  }).unitGrosze;
  const dear = priceItem({
    calculator: "jewelry_new", params, rates,
    gemstones: GEMSTONES.map((g) => (g.id === "diamond" ? { ...g, basePLN: 25000 } : g)),
  }).unitGrosze;

  // Warunek wstepny: gdyby kamien nie wchodzil do wyceny, dwa ponizsze
  // sprawdzenia porownywalyby te sama liczbe ze soba.
  ok("kamien w ogole wchodzi do wyceny", stat > priceItem({ calculator: "jewelry_new", params: paramsFor("jewelry_new"), rates }).unitGrosze,
     `${(stat / 100).toFixed(2)} PLN z brylantem`);
  ok("cena kamienia z bazy zmienia kwote wiazaca", cheap !== dear,
     `${(cheap / 100).toFixed(2)} vs ${(dear / 100).toFixed(2)} PLN`);
  ok("drozszy kamien daje wyzsza kwote", dear > cheap);
}

// ------------------------------------------------------------
// 3. Zestaw pol kursowych po stronie serwera
// ------------------------------------------------------------
// Ceny kamieni sa w bazie w EURO i wymagaja kursu, zeby stac sie zlotowkami.
// `currentMetalRates` pobierala cztery kruszce i pomijala `pln_per_eur`,
// wiec nawet po przekazaniu kamieni nie bylo czym ich przeliczyc. Tego nie
// widac w zadnym wyniku funkcji, tylko w liscie kolumn w zapytaniu.
{
  const server = readFileSync(join(ROOT, "chat-api", "server.js"), "utf8");
  const fn = server.slice(server.indexOf("async function currentMetalRates"));
  const body = fn.slice(0, fn.indexOf("\n}"));
  for (const field of ["au_pln_per_g", "ag_pln_per_g", "pt_pln_per_g", "pd_pln_per_g", "pln_per_eur"]) {
    ok(`currentMetalRates pobiera ${field}`, body.includes(field));
  }
}

// ------------------------------------------------------------
// 4. Stawki materialow doceraja do kwoty wiazacej
// ------------------------------------------------------------
// Cena plyty zyje w tabeli `material_stock` i zmienia sie z panelu. Do
// silnika jedzie TRZECIM ARGUMENTEM, dokladnie tak jak kursy do jubilerki,
// wiec pominiecie jej nie rzuca wyjatku: wycena zjezdza do stawki domyslnej
// i zwraca kwote, ktora wyglada poprawnie. Klient widzi jedna cene, placi
// inna, i nikt sie o tym nie dowiaduje.
{
  const bazowe = {
    calculator: "laser_co2_cut",
    params: { matId: "acr5", pathId: "S", complexId: "moderate", quantityId: "proto", extended: false, podloze: "our_stock" },
    lang: "pl",
  };
  const domyslna = priceItem(bazowe).unitGrosze;
  const drozsza = priceItem({ ...bazowe, materialStock: [{ material_id: "acr5", pln_per_m2: 900 }] }).unitGrosze;

  ok("stawka z tabeli zmienia kwote wiazaca", domyslna !== drozsza,
     `${(domyslna / 100).toFixed(2)} vs ${(drozsza / 100).toFixed(2)} PLN`);
  ok("drozszy material daje wyzsza kwote", drozsza > domyslna);

  // Material klienta nie moze byc doliczany: placilby nam za plyte, ktora
  // sam przyslal.
  const swojMaterial = priceItem({
    ...bazowe,
    params: { ...bazowe.params, podloze: "own_stock" },
    materialStock: [{ material_id: "acr5", pln_per_m2: 900 }],
  }).unitGrosze;
  ok("material klienta nie jest doliczany", swojMaterial < drozsza,
     `${(swojMaterial / 100).toFixed(2)} PLN bez materialu`);

  // Grawer na NASZEJ desce tez zuzywa material.
  const grawerNasz = priceItem({
    calculator: "laser_co2_engrave", lang: "pl",
    params: { matId: "wood", areaId: "S", detailId: "standard", quantityId: "proto", extended: false, podloze: "our_stock" },
    materialStock: [{ material_id: "wood", pln_per_m2: 900 }],
  }).unitGrosze;
  const grawerKlienta = priceItem({
    calculator: "laser_co2_engrave", lang: "pl",
    params: { matId: "wood", areaId: "S", detailId: "standard", quantityId: "proto", extended: false, podloze: "own_item" },
    materialStock: [{ material_id: "wood", pln_per_m2: 900 }],
  }).unitGrosze;
  ok("grawer na naszej desce doplaca za material", grawerNasz > grawerKlienta,
     `${(grawerNasz / 100).toFixed(2)} vs ${(grawerKlienta / 100).toFixed(2)} PLN`);

  // Serwer musi te stawki w ogole pobrac i podac dalej. Sam fakt, ze silnik
  // umie je przyjac, niczego nie gwarantuje.
  const server = readFileSync(join(ROOT, "chat-api", "server.js"), "utf8");
  ok("serwer czyta tabele materialow", server.includes("async function currentMaterialStock"));
  ok("kwota wiazaca dostaje stawki materialow", /materialStock: itemStock/.test(server));
  ok("zmiana w panelu czysci obie pamieci", /_materialPriceCache = \{ ts: 0, rows: null \}/.test(server));
}

console.log(failed ? `\n${failed} bledow` : "\nWszystko sie zgadza");
process.exit(failed ? 1 : 0);
