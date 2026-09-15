#!/usr/bin/env node
// ============================================================
// SZYBKA WYCENA ODDAJE ODPOWIEDZI TRYBOWI ZAAWANSOWANEMU
// ============================================================
// Do 15 wrzesnia 2026 przejscie miedzy trybami kalkulatora jubilerskiego
// gubilo cala rozmowe: klient wybieral pierscionek, srebro i kamien, klikal
// "Dla zaawansowanych" i dostawal pusty formularz od zera. Teraz odpowiedzi
// jada razem z nim.
//
// Ten sprawdzian pilnuje rzeczy, ktorej oko nie wylapie: czy KLUCZE, ktore
// przenosimy, nadal istnieja w katalogu pytan. Karta uslugi zmienia sie
// czesto (14 wrzesnia 2026 wypadl z niej `complexityId`, doszly wymiary),
// a przeniesienie pola, o ktore juz nie pytamy, jest ciche: formularz
// wyglada poprawnie, a nieznany parametr jedzie az do tresci zamowienia.
//
// Uruchamiany w `npm run build`.

import assert from "node:assert/strict";
import { przekazanieDoZaawansowanego } from "../src/data/przekazanieTrybu.js";
import { getService } from "../src/data/orderCatalog.js";

let bledy = 0;
function sekcja(nazwa) { console.log(`\n${nazwa}\n`); }
function ok(opis) { console.log(`  ✓ ${opis}`); }
function zle(opis, e) { bledy++; console.log(`  ✗ ${opis}: ${e.message}`); }
function test(opis, fn) { try { fn(); ok(opis); } catch (e) { zle(opis, e); } }

/** Karta uslugi, ktora obsluguje dany tryb kalkulatora. */
const KARTA = { new: "jewelry_plain", renovation: "jewelry_renovation", repair: "jewelry_repair" };

/** Odpowiedzi szybkiej wyceny w ksztalcie, ktory oddaje `resolveJewelryParams`. */
const NOWY_Z_KAMIENIEM = {
  flow: "new",
  params: {
    lineId: "woman", typeId: "pendant", metalId: "gold_14k", weightId: "standard",
    methodId: "cast", platingId: "none", qtyId: "1",
    gemId: "sapphire", stoneSizeId: "medium", stoneCountId: "3", qualityId: "AA", certId: "none",
  },
};

sekcja("1. Nowy wyrob: parametry katalogowe osobno, kamienie osobno");

test("wyrob przenosi sie razem z linia, rodzajem, kruszcem i metoda", () => {
  const p = przekazanieDoZaawansowanego(NOWY_Z_KAMIENIEM);
  assert.equal(p.serviceId, "new");
  assert.equal(p.params.lineId, "woman");
  assert.equal(p.params.typeId, "pendant");
  assert.equal(p.params.metalId, "gold_14k");
  assert.equal(p.params.methodId, "cast");
});

test("kamien NIE zostaje w parametrach wyrobu", () => {
  const p = przekazanieDoZaawansowanego(NOWY_Z_KAMIENIEM);
  for (const klucz of ["gemId", "stoneSizeId", "stoneCountId", "qualityId", "certId"]) {
    assert.equal(p.params[klucz], undefined, `${klucz} przeciekl do parametrow wyrobu`);
  }
});

test("kamien staje sie wierszem listy kamieni", () => {
  const p = przekazanieDoZaawansowanego(NOWY_Z_KAMIENIEM);
  assert.equal(p.stoneRows.length, 1);
  const w = p.stoneRows[0];
  assert.equal(w.gemId, "sapphire");
  assert.equal(w.stoneSizeId, "medium");
  assert.equal(w.count, 3, "liczba kamieni nie przeszla");
  assert.equal(w.cutId, "brilliant", "brak szlifu odniesienia");
  assert.equal(w.suppliedBy, "studio");
});

test("wyrob bez kamienia nie dokłada pustego wiersza", () => {
  const p = przekazanieDoZaawansowanego({ flow: "new", params: { ...NOWY_Z_KAMIENIEM.params, gemId: "none" } });
  assert.equal(p.stoneRows, null);
});

test("naklad jedzie osobno, bo tryb zaawansowany liczy prog z liczby sztuk", () => {
  const p = przekazanieDoZaawansowanego(NOWY_Z_KAMIENIEM);
  assert.equal(p.qtyId, "1");
  assert.equal(p.params.qtyId, undefined);
});

sekcja("2. Renowacja i naprawa");

test("renowacja przenosi rodzaj, kruszec i zakres uslug", () => {
  const p = przekazanieDoZaawansowanego({
    flow: "renovation",
    params: { jewTypeId: "ring_g", metalTypeId: "silver_g", services: ["clean", "rhodium_r"], qtyId: "2-5" },
  });
  assert.equal(p.serviceId, "renovation");
  assert.deepEqual(p.params.services, ["clean", "rhodium_r"]);
  assert.equal(p.qtyId, "2-5");
});

test("naprawa przenosi rodzaj usterki", () => {
  const p = przekazanieDoZaawansowanego({
    flow: "repair",
    params: { jewTypeId: "ring_g", metalTypeId: "gold_g", repairId: "resize", qtyId: "1" },
  });
  assert.equal(p.serviceId, "repair");
  assert.equal(p.params.repairId, "resize");
});

sekcja("3. Nie ma czego albo nie ma dokad przeniesc");

test("niepelne odpowiedzi nie daja przeniesienia", () => {
  assert.equal(przekazanieDoZaawansowanego({ custom: true }), null);
  assert.equal(przekazanieDoZaawansowanego(null), null);
});

test("bizuteria na sznurku nie ma odpowiednika w trybie zaawansowanym", () => {
  // Przeniesienie klienta do formularza, ktory nie zna jego wyrobu, byloby
  // gorsze od zostawienia go w szybkiej wycenie.
  assert.equal(przekazanieDoZaawansowanego({ flow: "cord", piece: "cord_bracelet", quality: "standard" }), null);
});

sekcja("4. Przenosimy tylko to, o co karta uslugi naprawde pyta");

for (const [flow, zrodlo] of [
  ["new", NOWY_Z_KAMIENIEM],
  ["renovation", { flow: "renovation", params: { jewTypeId: "ring_g", metalTypeId: "silver_g", services: ["clean"], qtyId: "1" } }],
  ["repair", { flow: "repair", params: { jewTypeId: "ring_g", metalTypeId: "gold_g", repairId: "resize", qtyId: "1" } }],
]) {
  test(`${flow}: kazdy przeniesiony klucz istnieje w karcie uslugi`, () => {
    const p = przekazanieDoZaawansowanego(zrodlo);
    const karta = getService(KARTA[flow]);
    assert.ok(karta, `brak karty uslugi ${KARTA[flow]}`);
    const znane = new Set(karta.fields.map((f) => f.key));
    for (const klucz of Object.keys(p.params)) {
      assert.ok(znane.has(klucz), `karta ${KARTA[flow]} nie pyta juz o "${klucz}"`);
    }
  });
}

test("przeniesienie NIE odpowiada za klienta na pytania o zakres wyrobu", () => {
  // Czyj projekt, co jest w wyrobie i jakie ma wymiary rozstrzygaja o kwocie
  // wiazacej (ADR-0049), a szybka wycena o zadne z nich nie pyta. Podstawienie
  // ich tutaj byloby wystawieniem ceny wiazacej za klienta.
  const p = przekazanieDoZaawansowanego(NOWY_Z_KAMIENIEM);
  assert.equal(p.params.projektId, undefined);
  assert.equal(p.params.cechyWyrobu, undefined);
  for (const klucz of Object.keys(p.params)) {
    assert.ok(!klucz.startsWith("wym"), `wymiar "${klucz}" nie moze pochodzic z szybkiej wyceny`);
  }
});

console.log(bledy === 0
  ? "\nPrzekazanie odpowiedzi miedzy trybami: wszystko sie zgadza\n"
  : `\nPrzekazanie odpowiedzi miedzy trybami: ${bledy} bledow\n`);
process.exit(bledy === 0 ? 0 : 1);
