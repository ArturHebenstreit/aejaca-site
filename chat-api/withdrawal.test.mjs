import assert from "node:assert/strict";
import { REGIME, regimeForItem, withdrawalSummary } from "./withdrawal.js";

const pierscionek = { item_type: "product", product_kind: "physical", product_offer: "ready", title: "Pierścionek z granatem" };
const szkatulka = { item_type: "product", product_kind: "physical", product_offer: "personalized", title: "Szkatułka z grawerem" };
const plik = { item_type: "product", product_kind: "digital", product_offer: "ready", title: "Model do druku" };
const grawer = { item_type: "service", calculator: "laser_co2_engrave", title: "Grawer CO2" };

// --- Pojedyncza pozycja ---
assert.equal(regimeForItem(pierscionek), REGIME.STANDARD, "rzecz z polki: pelne prawo odstapienia");
assert.equal(regimeForItem(szkatulka), REGIME.MADE_TO_ORDER);
assert.equal(regimeForItem(plik), REGIME.DIGITAL, "przy tresci cyfrowej decyduje rodzaj, nie sposob sprzedazy");
assert.equal(regimeForItem(grawer), REGIME.MADE_TO_ORDER, "usluga z kalkulatora zawsze powstaje pod klienta");
assert.equal(regimeForItem({}), REGIME.MADE_TO_ORDER, "brak danych nie moze dac przypadkiem 'przysluguje'");

// --- Zamowienie jednorodne ---
const tylkoPolka = withdrawalSummary([pierscionek, pierscionek]);
assert.equal(tylkoPolka.single, REGIME.STANDARD);
assert.equal(tylkoPolka.hasCovered, true);
assert.equal(tylkoPolka.hasExcluded, false);
assert.equal(tylkoPolka.mixed, false);

const tylkoNaZamowienie = withdrawalSummary([grawer, szkatulka]);
assert.equal(tylkoNaZamowienie.single, REGIME.MADE_TO_ORDER);
assert.equal(tylkoNaZamowienie.hasCovered, false, "tu naprawde nie ma od czego odstapic");
assert.equal(tylkoNaZamowienie.hasExcluded, true);

const tylkoCyfrowe = withdrawalSummary([plik]);
assert.equal(tylkoCyfrowe.single, REGIME.DIGITAL);
assert.equal(tylkoCyfrowe.hasCovered, false);

// --- Zamowienie mieszane, czyli przypadek, ktory stary mail opisywal falszywie ---
const mieszane = withdrawalSummary([pierscionek, grawer]);
assert.equal(mieszane.mixed, true);
assert.equal(mieszane.single, null);
assert.equal(mieszane.hasCovered, true, "pierscionek z polki zostaje objety prawem");
assert.equal(mieszane.hasExcluded, true);
assert.deepEqual(mieszane.covered.map((i) => i.title), ["Pierścionek z granatem"]);
assert.deepEqual(mieszane.excluded.map((i) => i.title), ["Grawer CO2"]);

// Trzy rezimy naraz tez musza sie ulozyc
const wszystko = withdrawalSummary([pierscionek, szkatulka, plik]);
assert.equal(wszystko.regimes.length, 3);
assert.equal(wszystko.covered.length, 1);
assert.equal(wszystko.excluded.length, 2);

// Puste zamowienie nie moze wywrocic wysylki maila
const puste = withdrawalSummary([]);
assert.equal(puste.hasCovered, false);
assert.equal(puste.hasExcluded, false);
assert.equal(puste.single, null);
assert.deepEqual(withdrawalSummary().regimes, []);

console.log("Prawo odstapienia: wszystkie sprawdzenia przeszly");
