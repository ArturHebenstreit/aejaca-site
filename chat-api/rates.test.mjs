// ============================================================
// KURSY KRUSZCOW: kontrola wieku
// ============================================================
// `currentMetalRates` bierze najnowsza niepusta wartosc, nie patrzac na jej
// wiek. Gdy pobieranie pada od tygodni, kurs sprzed miesiaca wyglada tak samo
// jak dzisiejszy i wycena po cichu liczy ze starej ceny kruszcu. AEJaCA
// pracuje glownie w srebrze, wiec ten wlasnie kurs musi byc swiezy.

import assert from "node:assert/strict";
import { staleRates, RATE_STALE_AFTER_H } from "./rates.js";

assert.deepEqual(staleRates({ ag_pln_per_g: 1, au_pln_per_g: 2 }), [],
  "swieze kursy nie moga byc zglaszane");

assert.deepEqual(staleRates({ ag_pln_per_g: 100 }), ["ag_pln_per_g sprzed 100 h"],
  "kurs sprzed sturzech godzin musi zostac zgloszony");

assert.deepEqual(staleRates({ ag_pln_per_g: RATE_STALE_AFTER_H }), [],
  "dokladnie na progu jeszcze nie jest przeterminowany");

assert.deepEqual(staleRates({ ag_pln_per_g: RATE_STALE_AFTER_H + 0.5 }),
  [`ag_pln_per_g sprzed ${Math.round(RATE_STALE_AFTER_H + 0.5)} h`],
  "tuz za progiem juz jest");

const wiele = staleRates({ ag_pln_per_g: 200, au_pln_per_g: 1, pln_per_eur: 300 });
assert.equal(wiele.length, 2, "zglaszamy kazdy przeterminowany kurs osobno");

assert.deepEqual(staleRates({}), [], "pusty zestaw nie wywala sie");
assert.deepEqual(staleRates(null), [], "brak danych nie wywala sie");
assert.deepEqual(staleRates({ ag_pln_per_g: NaN }), [], "NaN nie udaje przeterminowania");

console.log("rates.test.mjs: kontrola wieku kursow OK");

// --- ageHours: brak wiersza znaczy "nieskonczenie stary", a nie "swiezy" ---
import { ageHours } from "./rates.js";
const teraz = Date.UTC(2026, 7, 12, 12, 0, 0);
assert.equal(ageHours(null, teraz), Infinity, "brak odczytu to nie jest swiezy kurs");
assert.equal(ageHours(undefined, teraz), Infinity, "brak daty tak samo");
assert.equal(ageHours("nie-data", teraz), Infinity, "nieparsowalna data nie moze udawac zera");
assert.equal(ageHours(new Date(teraz - 3 * 3600000).toISOString(), teraz), 3, "trzy godziny to trzy godziny");
console.log("rates.test.mjs: wiek odczytu OK");
