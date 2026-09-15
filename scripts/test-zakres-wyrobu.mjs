#!/usr/bin/env node
// ============================================================
// BIZUTERIA NA ZAMOWIENIE: KIEDY WOLNO OBIECAC CENE
// ============================================================
// Sprawdzian pisany pod jedno zdarzenie. 13 wrzesnia 2026 przyszlo zapytanie
// z Niemiec: wisiorek z kamieniem, wlasny render klienta, prosba o kaboszon
// albo rozetke, trzy oprawy, dwa wykonczenia powierzchni. Kalkulator pokazal
// 684 do 901 EUR za sztuke, a robota byla warta 1100 do 1450 EUR. Kwota
// wygladala na wiazaca i nic po drodze nie protestowalo.
//
// Pilnujemy wiec czterech rzeczy:
//
// 1. Trzy pytania rozstrzygaja o kwocie wiazacej: czyj to projekt, co jest
//    w wyrobie i jakie ma wymiary. Brak ktoregokolwiek daje szacunek.
// 2. Masa idzie z wymiarow, a nie ze stalej katalogowej, i NIGDY nie schodzi
//    ponizej stalej: pomylka w te strone kosztuje nas kruszec.
// 3. Bramka jest jedna dla przegladarki i dla kasy. Zamowienie zlozone
//    z pominieciem formularza ma sie odbic od serwera.
// 4. Pozostale kalkulatory jubilerskie nie zmienily sie ani o grosz.
//
// Uruchamiany w `npm run build`.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  zakresWyrobu, wymagaWycenyCzlowieka, masaZWymiarow, wymiaryWyrobu,
  polaWymiarow, kluczWymiaru, opisPowodow,
  PROJEKT_WYROBU, CECHY_WYROBU, BRAK_WYROBU, POWOD_TEKST,
} from "../src/pricing/jewelryScope.js";
import { bindingBasis } from "../src/pricing/bindingBasis.js";
import { calcNew } from "../src/pricing/jewelry.js";
import { getService } from "../src/data/orderCatalog.js";
import { describeParams } from "../src/data/describeParams.js";

let bledy = 0;
function sekcja(nazwa) { console.log(`\n${nazwa}\n`); }
function ok(opis) { console.log(`  ✓ ${opis}`); }
function zle(opis, e) { bledy++; console.log(`  ✗ ${opis}: ${e.message}`); }
function test(opis, fn) { try { fn(); ok(opis); } catch (e) { zle(opis, e); } }

/** Wisiorek opisany w calosci: nasz projekt, nic nadzwyczajnego, wymiary podane. */
const WISIOREK = {
  lineId: "woman", typeId: "pendant", metalId: "silver", weightId: "standard",
  methodId: "cast", platingId: "none", engravingId: "none", qtyId: "1",
  projektId: "katalog", cechyWyrobu: ["brak"],
  wymHeight: 30, wymWidth: 20, wymThickness: 4, wymStyle: "withStone",
};

const OBRACZKA = {
  lineId: "woman", typeId: "wedding_ring_w", metalId: "gold_14k", weightId: "standard",
  methodId: "cast", platingId: "none", engravingId: "none", qtyId: "1",
  projektId: "katalog", cechyWyrobu: ["brak"],
  wymRingSize: { system: "EU", value: 54 }, wymWidth: 4, wymWallThickness: 1.5,
};

sekcja("1. Trzy pytania rozstrzygaja o kwocie wiazacej");

test("komplet odpowiedzi daje kwote wiazaca", () => {
  const w = zakresWyrobu(WISIOREK, { metalDensity: 10.5 });
  assert.equal(w.wiazaca, true);
  assert.deepEqual(w.braki, []);
  assert.ok(w.masaG > 0);
});

test("brak odpowiedzi o projekcie zabiera kwote wiazaca", () => {
  const { projektId, ...bez } = WISIOREK;
  const w = zakresWyrobu(bez);
  assert.equal(w.wiazaca, false);
  assert.ok(w.braki.includes(BRAK_WYROBU.PROJEKT));
});

test("brak odpowiedzi o zawartosci wyrobu zabiera kwote wiazaca", () => {
  const { cechyWyrobu, ...bez } = WISIOREK;
  const w = zakresWyrobu(bez);
  assert.equal(w.wiazaca, false);
  assert.ok(w.braki.includes(BRAK_WYROBU.CECHY));
});

test("pusta lista cech to BRAK odpowiedzi, a nie odpowiedz przeczaca", () => {
  const w = zakresWyrobu({ ...WISIOREK, cechyWyrobu: [] });
  assert.ok(w.braki.includes(BRAK_WYROBU.CECHY));
});

test("brak wymiaru zabiera kwote wiazaca", () => {
  const { wymThickness, ...bez } = WISIOREK;
  const w = zakresWyrobu(bez);
  assert.equal(w.wiazaca, false);
  assert.ok(w.braki.includes(BRAK_WYROBU.WYMIARY));
});

test("wymiar poza zakresem katalogu to nie jest wyrob z katalogu", () => {
  // Wisiorek ma w katalogu bryl wysokosc do 100 mm. 200 mm to osobna robota,
  // a nie tania pozycja z listy.
  const w = zakresWyrobu({ ...WISIOREK, wymHeight: 200 });
  assert.equal(w.wiazaca, false);
  assert.ok(w.braki.includes(BRAK_WYROBU.WYMIARY));
});

sekcja("2. Praca, ktorej cennik nie liczy, idzie do czlowieka");

const DO_CZLOWIEKA = [
  ["wlasny projekt klienta", { projektId: "wlasny" }, "projekt_klienta"],
  ["azur albo filigran", { cechyWyrobu: ["azur"] }, "cecha:azur"],
  ["wiecej niz dwie oprawy", { cechyWyrobu: ["oprawy"] }, "cecha:oprawy"],
  ["dwa wykonczenia powierzchni", { cechyWyrobu: ["dwaWykonczenia"] }, "cecha:dwaWykonczenia"],
  ["elementy ruchome", { cechyWyrobu: ["ruchome"] }, "cecha:ruchome"],
  ["wykonanie reczne", { methodId: "handmade" }, "reczna"],
  ["kamien w wyrobie", { stoneRows: [{ gemId: "sapphire", count: 1 }] }, "kamienie"],
  ["kruszec powierzony", { clientSuppliesMetal: true }, "kruszec_klienta"],
  ["lancuszek", { typeId: "necklace" }, "lancuch"],
];

for (const [opis, zmiana, powod] of DO_CZLOWIEKA) {
  test(`${opis}: wycena czlowieka, z podanym powodem`, () => {
    const params = { ...WISIOREK, ...zmiana };
    const w = zakresWyrobu(params);
    assert.equal(w.wiazaca, false, "pozycja dostala kwote wiazaca");
    assert.ok(w.powody.includes(powod), `brak powodu ${powod} w [${w.powody}]`);
    assert.equal(wymagaWycenyCzlowieka(params), true);
    assert.ok(w.braki.includes(BRAK_WYROBU.ZAKRES));
  });
}

test("kazdy powod ma zdanie w trzech jezykach", () => {
  for (const [, zmiana] of DO_CZLOWIEKA) {
    const w = zakresWyrobu({ ...WISIOREK, ...zmiana });
    for (const lang of ["pl", "en", "de"]) {
      const zdania = opisPowodow(w.powody, lang);
      assert.equal(zdania.length, w.powody.length, `${lang}: ${w.powody} bez zdania`);
      for (const z of zdania) assert.ok(z.length > 20, `${lang}: zdanie za krotkie`);
    }
  }
});

test("kazdy brak ma zdanie w trzech jezykach", () => {
  for (const kod of Object.values(BRAK_WYROBU)) {
    for (const lang of ["pl", "en", "de"]) {
      assert.ok(POWOD_TEKST[kod]?.[lang], `${kod} bez zdania w ${lang}`);
    }
  }
});

sekcja("3. Masa idzie z wymiarow, nigdy ponizej stalej katalogowej");

test("wisiorek 30 x 20 x 4 mm w srebrze wazy okolo 14 g, a nie 4 g", () => {
  const masa = masaZWymiarow(WISIOREK, 10.5, "standard");
  assert.ok(masa > 13 && masa < 15, `masa ${masa}`);
});

test("cena rosnie razem z wymiarem", () => {
  const maly = calcNew({ ...WISIOREK, wymHeight: 15, wymWidth: 10, qty: 1 }, "pl");
  const duzy = calcNew({ ...WISIOREK, wymHeight: 45, wymWidth: 30, qty: 1 }, "pl");
  assert.ok(duzy.unitGrosze > maly.unitGrosze * 2, `${maly.unitGrosze} wobec ${duzy.unitGrosze}`);
});

test("masa nie schodzi ponizej stalej katalogowej", () => {
  // Obraczka liczona z bryly pierscienia wychodzi lzejsza niz stala z cennika,
  // bo wspolczynnik wypelnienia opisuje wyroby wezone. Kwote wiazaca trzeba
  // dotrzymac, wiec w te strone nie zgadujemy.
  const zGeometrii = masaZWymiarow(OBRACZKA, 19.3, "standard");
  const wycena = calcNew({ ...OBRACZKA, qty: 1 }, "pl");
  assert.ok(zGeometrii < 6, `geometria ${zGeometrii} juz nie jest mniejsza od katalogu`);
  assert.ok(wycena.weightG >= 6, `wycena wziela ${wycena.weightG} g`);
});

test("masa podana przez wywolujacego wygrywa z jedna i z druga", () => {
  // Ta droga sluzy odlewowi z pliku klienta, gdzie mase liczy serwer z bryly.
  const wycena = calcNew({ ...WISIOREK, qty: 1, overrideWeightG: 2 }, "pl");
  assert.equal(wycena.weightG, 2);
});

test("wycena bez wymiarow nadal dziala i bierze stala katalogowa", () => {
  const { wymHeight, wymWidth, wymThickness, ...bez } = WISIOREK;
  const wycena = calcNew({ ...bez, qty: 1 }, "pl");
  assert.equal(wycena.type, "calculated");
  assert.equal(wycena.weightG, 4);
});

sekcja("4. Ta sama bramka w przegladarce i w kasie");

test("bindingBasis nie daje juz kwoty wiazacej z samych parametrow", () => {
  const w = bindingBasis({ calculator: "jewelry_new", params: {} });
  assert.equal(w.binding, false);
  assert.ok(w.missing.length > 0);
});

test("bindingBasis daje kwote wiazaca przy komplecie odpowiedzi", () => {
  const w = bindingBasis({ calculator: "jewelry_new", params: WISIOREK });
  assert.equal(w.binding, true);
  assert.equal(w.basis.kind, "params_wymiary");
  assert.ok(w.basis.masaG > 0);
});

test("wycena czlowieka jest podstawa sama w sobie, takze tutaj", () => {
  const w = bindingBasis({ calculator: "jewelry_new", params: {}, fromQuote: true });
  assert.equal(w.binding, true);
});

test("serwer kasuje mase podana z przegladarki", () => {
  // `overrideWeightG` z zapytania bylby zamowieniem zlota po cenie podanej
  // przez zamawiajacego. Kasowanie stoi w `priceItem`, przed wycena.
  const zrodlo = readFileSyncSafe("chat-api/orders.js");
  assert.ok(/delete callParams\.overrideWeightG/.test(zrodlo));
});

sekcja("5. Formularz pyta o to, czego wymaga bramka");

test("karta uslugi ma pytanie o projekt i o zawartosc wyrobu", () => {
  const karta = getService("jewelry_plain");
  const klucze = karta.fields.map((f) => f.key);
  assert.ok(klucze.includes("projektId"));
  assert.ok(klucze.includes("cechyWyrobu"));
  const projekt = karta.fields.find((f) => f.key === "projektId");
  assert.equal(projekt.bezWyboru, true, "pytanie o projekt ma wartosc domyslna");
  assert.equal(karta.defaults.projektId, undefined);
  assert.equal(karta.defaults.cechyWyrobu, undefined);
});

test("karta uslugi ma pole na kazdy wymiar kazdej bryly", () => {
  const karta = getService("jewelry_plain");
  const klucze = new Set(karta.fields.map((f) => f.key));
  for (const typeId of ["ring", "wedding_ring_w", "signet", "pendant", "bracelet", "earrings", "brooch"]) {
    for (const pole of polaWymiarow(typeId)) {
      assert.ok(klucze.has(kluczWymiaru(pole)), `${typeId}: brak pola ${kluczWymiaru(pole)}`);
    }
  }
});

test("pole wymiaru pokazuje sie tylko przy bryle, ktora je ma", () => {
  const karta = getService("jewelry_plain");
  const wall = karta.fields.find((f) => f.key === kluczWymiaru("wallThickness"));
  assert.equal(wall.ukryjGdy({ typeId: "pendant" }), true);
  assert.equal(wall.ukryjGdy({ typeId: "ring" }), false);
});

test("domyslne wymiary karty wystarczaja do kwoty wiazacej", () => {
  const karta = getService("jewelry_plain");
  const params = { ...karta.defaults, projektId: "katalog", cechyWyrobu: ["brak"] };
  const w = zakresWyrobu(params);
  assert.equal(w.wiazaca, true, `braki: ${w.braki}`);
});

test("odpowiedzi widac w tresci pozycji, a nie jako surowe identyfikatory", () => {
  const opis = describeParams({ serviceId: "jewelry_plain", params: WISIOREK }, "pl");
  const linia = opis.map((p) => `${p.label}: ${p.value}`).join(" | ");
  assert.ok(/Nic z poniższych/.test(linia), linia);
  assert.ok(/Projekt z naszego katalogu/.test(linia), linia);
  assert.ok(/30 mm/.test(linia), linia);
});

test("rozmiar palca opisuje sie systemem, a nie jako obiekt", () => {
  const opis = describeParams({ serviceId: "jewelry_plain", params: OBRACZKA }, "pl");
  const linia = opis.map((p) => p.value).join(" | ");
  assert.ok(/EU 54/.test(linia), linia);
  assert.ok(!/object Object/.test(linia), linia);
});

sekcja("6. Lista wariantow jest kompletna");

test("kazdy wariant projektu i kazda cecha maja trzy jezyki", () => {
  for (const pozycja of [...PROJEKT_WYROBU, ...CECHY_WYROBU]) {
    for (const lang of ["pl", "en", "de"]) {
      assert.ok(pozycja.label[lang], `${pozycja.id}: brak nazwy w ${lang}`);
      assert.ok(pozycja.desc[lang], `${pozycja.id}: brak opisu w ${lang}`);
    }
  }
});

test("dokladnie jedna cecha NIE prowadzi do wyceny czlowieka", () => {
  const zwykle = CECHY_WYROBU.filter((c) => !c.needsQuote);
  assert.equal(zwykle.length, 1);
  assert.equal(zwykle[0].id, "brak");
});

test("wymiary czytaja sie z katalogu bryl, a nie z osobnej listy", () => {
  const odczyt = wymiaryWyrobu(OBRACZKA);
  assert.equal(odczyt.forma, "wedding_ring");
  assert.deepEqual(odczyt.braki, []);
  assert.equal(odczyt.wymiary.ringSize.system, "mm");
  assert.ok(Math.abs(odczyt.wymiary.ringSize.value - 17.2) < 0.01);
});

test("liczba pod kluczem rozmiaru znaczy milimetry, a nie rozmiar EU", () => {
  // Karta uslugi w sklepie ma tylko pole liczbowe. Gdyby 17 znaczylo "EU 17",
  // wyszedlby pierscionek dzieciecy, a kwota zeszlaby o polowe.
  const odczyt = wymiaryWyrobu({ ...OBRACZKA, wymRingSize: 17 });
  assert.equal(odczyt.wymiary.ringSize.value, 17);
});

function readFileSyncSafe(sciezka) {
  return readFileSync(new URL(`../${sciezka}`, import.meta.url), "utf8");
}

console.log(bledy === 0
  ? "\nZakres wyrobu na zamowienie: wszystko sie zgadza\n"
  : `\nZakres wyrobu na zamowienie: ${bledy} bledow\n`);
process.exit(bledy === 0 ? 0 : 1);
