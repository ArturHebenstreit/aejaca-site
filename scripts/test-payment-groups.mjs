#!/usr/bin/env node
// ============================================================
// PODZIAL KANALOW PLATNOSCI: BLIK NA WIERZCHU, BANKI POD ZWIJANYM WIERSZEM
// ============================================================
// Pilnowana regula jest jedna: BLIK, Google Pay i karta stoja zawsze na
// wierzchu niezaleznie od kolejnosci, w jakiej przyjda z bramki platnosci,
// a banki spoldzielcze i pozostale schodza pod zwijany wiersz z wyszukiwarka
// dzialajaca bez polskich znakow. Lista kanalow pochodzi z bramki i zmienia
// sie sama, wiec test opisuje regule porzadkowania, a nie konkretny zestaw
// bankow, ktory moglby sie zmienic w kazdej chwili.
//
// Czy jest ktos, kto tego wprost naruszyl, nie zostalo zapisane; sprawdzian
// pilnuje reguly z definicji.
//
// Uruchamiany w `npm run build`.

import assert from "node:assert/strict";
import { splitMethods, filterBanks, promotionRank } from "../src/components/shop/paymentGroups.js";

// Zestaw w kolejnosci, w jakiej potrafi przyjsc z bramki: BLIK nie jest pierwszy.
const zBramki = [
  { id: 1, name: "Płatność z ING" },
  { id: 2, name: "BLIK" },
  { id: 3, name: "Bank Spółdzielczy Wieliczka PBL" },
  { id: 4, name: "Google Pay" },
  { id: 5, name: "Płatność z mBank" },
  { id: 6, name: "Karta płatnicza" },
  { id: 7, name: "Bank Spółdzielczy w Toruniu PBL" },
];

const { promoted, banks } = splitMethods(zBramki);

assert.equal(promoted[0].name, "BLIK", "BLIK musi byc pierwszy niezaleznie od kolejnosci z bramki");
assert.deepEqual(promoted.map((m) => m.name), ["BLIK", "Google Pay", "Karta płatnicza"]);
assert.deepEqual(
  banks.map((m) => m.id),
  [1, 3, 5, 7],
  "banki zachowuja kolejnosc z bramki i nie gubia sie po drodze"
);
assert.equal(promoted.length + banks.length, zBramki.length, "zaden kanal nie moze zniknac");

// Szukanie ma dzialac bez polskich znakow, bo nikt ich nie wpisuje w polu szukania
assert.deepEqual(filterBanks(banks, "spoldzielczy").map((m) => m.id), [3, 7]);
assert.deepEqual(filterBanks(banks, "SPÓŁDZIELCZY").map((m) => m.id), [3, 7]);
assert.deepEqual(filterBanks(banks, "torun").map((m) => m.id), [7]);
assert.deepEqual(filterBanks(banks, "").map((m) => m.id), [1, 3, 5, 7], "puste pole pokazuje wszystko");
assert.deepEqual(filterBanks(banks, "   ").map((m) => m.id), [1, 3, 5, 7]);
assert.deepEqual(filterBanks(banks, "nieistniejacy"), []);

// Nazwa banku nie moze przypadkiem trafic na wierzch
assert.equal(promotionRank("Bank Spółdzielczy Biała Rawska"), null);
assert.equal(promotionRank("Płacę z PLUS BANK"), null);
assert.equal(promotionRank(undefined), null);
assert.equal(promotionRank("BLIK"), 0);
assert.equal(promotionRank("blik"), 0, "wielkosc liter nie ma znaczenia");

// Pusta lista nie moze wywrocic widoku
assert.deepEqual(splitMethods([]), { promoted: [], banks: [] });
assert.deepEqual(splitMethods(), { promoted: [], banks: [] });

console.log("Podzial kanalow platnosci: wszystkie sprawdzenia przeszly");
