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

// ============================================================
// HARMONOGRAM: dwa warunki, ktore musi spelniac naraz
// ============================================================
import {
  RATE_FETCH_SLOTS, METAL_API_MONTHLY_LIMIT, METAL_API_SAFE_FRACTION,
  fetchCronExpressions, monthlyRequests, longestGapH,
} from "./rates.js";

// 1. Limit dostawcy. Bez tego testu kazde dolozenie pobrania jest o jedno
//    zapytanie blizej wyczerpania puli, a dowiadujemy sie o tym dopiero,
//    gdy kurs przestaje sie odswiezac.
const naMiesiac = monthlyRequests();
const prog = METAL_API_MONTHLY_LIMIT * METAL_API_SAFE_FRACTION;
assert.ok(naMiesiac < prog,
  `harmonogram zjada ${naMiesiac.toFixed(1)} zapytan/mies, a prog bezpieczenstwa to ${prog}`);

// Cztery pobrania KAZDEGO dnia przekraczaja limit, co latwo przeoczyc.
const czteryDziennie = monthlyRequests([{ days: [0, 1, 2, 3, 4, 5, 6], hourUTC: 0 },
  { days: [0, 1, 2, 3, 4, 5, 6], hourUTC: 6 }, { days: [0, 1, 2, 3, 4, 5, 6], hourUTC: 12 },
  { days: [0, 1, 2, 3, 4, 5, 6], hourUTC: 18 }]);
assert.ok(czteryDziennie > METAL_API_MONTHLY_LIMIT,
  "cztery pobrania dziennie musza byc rozpoznane jako przekroczenie limitu");

// 2. Przerwa nie moze przekroczyc progu przeterminowania, inaczej sami
//    wywolalibysmy ostrzezenie o starym kursie w kazdy poniedzialek.
const luka = longestGapH();
assert.ok(luka < RATE_STALE_AFTER_H,
  `najdluzsza przerwa to ${luka} h, a kurs uznajemy za stary po ${RATE_STALE_AFTER_H} h`);

// Sam weekend bez pobrania: piatek 16:00 do poniedzialku 8:00 to 64 h, za duzo.
const bezNiedzieli = longestGapH(RATE_FETCH_SLOTS.filter((s) => !s.days.includes(0)));
assert.ok(bezNiedzieli > RATE_STALE_AFTER_H,
  "bez pobrania weekendowego przerwa musi wyjsc za dluga, inaczej test niczego nie pilnuje");

// Wyrazenia cron musza byc skladniowo poprawne dla node-cron.
for (const expr of fetchCronExpressions()) {
  assert.match(expr, /^0 \d{1,2} \* \* [0-6](,[0-6])*$/, `podejrzane wyrazenie cron: ${expr}`);
}

console.log(`rates.test.mjs: harmonogram ${naMiesiac.toFixed(1)} zapytan/mies (limit ${METAL_API_MONTHLY_LIMIT}), najdluzsza przerwa ${luka} h`);
