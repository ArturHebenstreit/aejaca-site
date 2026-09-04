#!/usr/bin/env node
// ============================================================
// ODLEW Z METALI SZLACHETNYCH: ROZMIAR, CENA I JEZYK ZGADZAJA SIE Z KOLBA
// ============================================================
// Limit modelu ma sie liczyc wylacznie z wymiarow kolby odlewniczej, a nie
// stac obok niej jako druga liczba wpisana z reki: poprzednia wersja trzymala
// je osobno i rozjechaly sie po pierwszej zmianie sprzetu. Test pilnuje
// takze, ze skala maksymalna liczy sie z NAJCIASNIEJSZEJ osi po obrocie: do
// 3 wrzesnia 2026 zakladala z gory, ze wiaze glebokosc, co bylo prawda tylko
// przy plytszej kolbie i po poglebieniu dawalo zawyzony limit.
//
// Druga rodzina przypadkow to jezyk rozpiski cenowej: przygotowanie wzorca
// i wykonczenie mialy walute "PLN" wpisana na sztywno, wiec klient czytajacy
// po angielsku widzial euro w kruszcu i zlotowki dwa wiersze nizej, bez
// zadnego bledu w konsoli. Dolozono tez proge ilosciowe: kalkulator odlewu
// i kalkulator studyjny maja rozne listy progow, a pomylenie ich daje `null`
// zamiast ceny, po cichu.
//
// Uruchamiany w `npm run build`.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculate,
  fitsCastingFlask,
  maxCastingScaleForBBox,
  missingCastingParams,
  describeMissingCastingParams,
  CASTING_FINISHES,
  CASTING_FLASK_MM,
  castingFinishesFor,
  CASTING_PLATINGS,
  castingPlatingAvailable,
  CASTING_ENVELOPE_MM,
  CASTING_ENVELOPE_LABEL,
  PRECIOUS_METAL_CASTING_BUILD,
} from "../src/pricing/preciousMetalCasting.js";
import { priceItem } from "../chat-api/orders.js";
import { SUPPORTED_EXTENSIONS } from "../src/pricing/mesh.js";
import { QTY_TIERS } from "../src/pricing/jewelryConfig.js";
import { QUANTITY_TIERS } from "../src/pricing/config.js";

assert.equal(PRECIOUS_METAL_CASTING_BUILD, "1.009");

// KOLBA JEST JEDYNYM ZRODLEM ROZMIARU. Limit modelu ma sie z niej liczyc, a nie
// stac obok niej wpisany z reki: przy poprzedniej wersji te dwie liczby zyly
// osobno i rozjechaly sie po pierwszej zmianie sprzetu.
assert.deepEqual(CASTING_FLASK_MM, { diameter: 80, depth: 90 });
const swiatlo = CASTING_FLASK_MM.diameter - 20;
assert.deepEqual(CASTING_ENVELOPE_MM, [
  Math.floor(swiatlo / Math.SQRT2),
  Math.floor(swiatlo / Math.SQRT2),
  CASTING_FLASK_MM.depth - 25,
]);
// Kwadrat o tym boku musi zmiescic sie w swietle kolby, inaczej limit obiecuje
// wiecej, niz kolba przyjmie.
assert.ok(Math.hypot(CASTING_ENVELOPE_MM[0], CASTING_ENVELOPE_MM[1]) <= swiatlo);
assert.ok(CASTING_ENVELOPE_MM.every((v, i, a) => i === 0 || a[i - 1] <= v), "limit musi byc posortowany rosnaco");
assert.equal(CASTING_ENVELOPE_LABEL, `${CASTING_ENVELOPE_MM.join(" x ")} mm`);

assert.equal(fitsCastingFlask({ x: 2.0, y: 2.2, z: 3.0 }), true);
assert.equal(fitsCastingFlask({ x: 4.5, y: 4.4, z: 3.0 }), false);
assert.equal(fitsCastingFlask({ x: 4.5, y: 4.4, z: 3.0 }, 0.9), true);

// NAJWIEKSZA SKALA TO NAJCIASNIEJSZA OS PO OBROCIE, i nie wolno zakladac,
// KTORA to os. Do 3 wrzesnia 2026 test porownywal wynik z `ENVELOPE[2] / 30`,
// czyli z gory przyjmowal, ze wiaze glebokosc. Bylo to prawda tylko przy kolbie
// 80 x 80: po poglębieniu do 90 mm limit wysokosci urosl do 65 i dla modelu
// 30 x 20 x 10 mm wiaze juz szerokosc (42/20 = 2,1 wobec 65/30 = 2,17).
// Liczymy wiec minimum ze wszystkich osi, tak jak robi to sam silnik.
{
  const bok = [10, 20, 30]; // milimetry, posortowane rosnaco, jak w silniku
  const oczekiwana = Math.min(...bok.map((mm, i) => CASTING_ENVELOPE_MM[i] / mm));
  assert.ok(Math.abs(maxCastingScaleForBBox({ x: 3.0, y: 2.0, z: 1.0 }) - oczekiwana) < 1e-9);
  // Model dokladnie na granicy limitu ma dostac skale 1, ani mniej, ani wiecej.
  const naGranicy = { x: CASTING_ENVELOPE_MM[0] / 10, y: CASTING_ENVELOPE_MM[1] / 10, z: CASTING_ENVELOPE_MM[2] / 10 };
  assert.ok(Math.abs(maxCastingScaleForBBox(naGranicy) - 1) < 1e-9, "model rowny limitowi ma miescic sie w skali 1");
}

// PIEC POZIOMOW OBROBKI, drozej za kazdy kolejny. Identyfikatory `raw`,
// `clean` i `polished` zostaja, bo leza w zapisanych zamowieniach i w mapie
// z szybkiej wyceny: ich przemianowanie zabiloby wycene starego koszyka.
assert.equal(CASTING_FINISHES.length, 5);
for (const id of ["raw", "clean", "polished"]) {
  assert.ok(CASTING_FINISHES.some((v) => v.id === id), `zniknal identyfikator wykonczenia "${id}"`);
}
assert.equal(CASTING_FINISHES[0].extraGrosze, 0, "pierwszy poziom to odlew bez obrobki, czyli bez doplaty");
for (let i = 1; i < CASTING_FINISHES.length; i += 1) {
  assert.ok(
    CASTING_FINISHES[i].extraGrosze > CASTING_FINISHES[i - 1].extraGrosze,
    `poziom "${CASTING_FINISHES[i].id}" ma byc drozszy od poprzedniego`,
  );
}
for (const opcja of CASTING_FINISHES) {
  for (const jezyk of ["pl", "en", "de"]) {
    assert.ok(opcja.label?.[jezyk], `wykonczenie "${opcja.id}" bez nazwy w ${jezyk}`);
    assert.ok(opcja.sub?.[jezyk], `wykonczenie "${opcja.id}" bez wyjasnienia w ${jezyk}`);
  }
}

// KOMUNIKAT O BRAKACH MA NAZYWAC BRAKI. Kontrola negatywna nizej pilnuje, ze
// nie zadamy pliku tam, gdzie wycena i tak idzie do czlowieka.
assert.deepEqual(
  missingCastingParams({ variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver" }),
  ["finishId", "stlData"],
);
assert.deepEqual(missingCastingParams({ variantId: "ready_pattern", materialSourceId: "aejaca", metalId: "silver", finishId: "raw" }), []);
for (const jezyk of ["pl", "en", "de"]) {
  const zdanie = describeMissingCastingParams({ variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver", finishId: "raw" }, jezyk);
  assert.match(zdanie, /STL/, `komunikat o brakach w ${jezyk} nie mowi, jaki plik wgrac`);
}
assert.equal(
  describeMissingCastingParams({ variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver", finishId: "raw", stlData: { volumeCm3: 1, bbox: { x: 1, y: 1, z: 1 } } }, "pl"),
  null,
);

const base = { metalId: "silver", finishId: "clean", qtyId: "1" };
assert.equal(calculate({ ...base, variantId: "ready_pattern", materialSourceId: "aejaca" }, "pl").type, "custom");
assert.equal(calculate({ ...base, variantId: "model_3d", materialSourceId: "client" }, "pl").type, "custom");

const priced = calculate({
  ...base,
  variantId: "model_3d",
  materialSourceId: "aejaca",
  stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
}, "pl");
assert.equal(priced.type, "calculated");
assert.ok(priced.unitGrosze > 0);
assert.ok(Math.abs(priced.finalMassG - 4.144) < 0.001);
assert.ok(priced.requiredMassG > priced.finalMassG);

// Rozpiska musi trzymac jedna walute w calosci. Przygotowanie wzorca i
// wykonczenie mialy koncowke "PLN" wpisana na sztywno, wiec klient czytajacy
// po angielsku widzial euro w kruszcu i zlotowki dwa wiersze nizej. Nic sie
// przy tym nie wywalalo, dlatego mierzymy to testem, a nie okiem.
for (const lang of ["en", "de"]) {
  const obcy = calculate({
    ...base,
    variantId: "model_3d",
    materialSourceId: "aejaca",
    stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
  }, lang);
  const waluty = new Set(obcy.breakdown.map((row) => String(row.value).replace(/[\d\s.,-]/g, "")).filter(Boolean));
  assert.deepEqual([...waluty], ["EUR"], `rozpiska odlewu w ${lang} miesza waluty: ${[...waluty].join(", ")}`);
}
const rodzima = calculate({
  ...base,
  variantId: "model_3d",
  materialSourceId: "aejaca",
  stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
}, "pl");
assert.deepEqual(
  [...new Set(rodzima.breakdown.map((row) => String(row.value).replace(/[\d\s.,-]/g, "")).filter(Boolean))],
  ["PLN"],
);

// Widelki i kwota wiazaca musza opisywac to samo. Doplaty za wzorzec i
// wykonczenie wchodza do `unitGrosze`, wiec musza wejsc takze do zakresu:
// inaczej kalkulator pokazuje zakres, ktorego kwota do zaplaty nie dotyka.
assert.ok(
  priced.perPcPLN.min <= priced.unitGrosze / 100 && priced.unitGrosze / 100 <= priced.perPcPLN.max,
  `kwota wiazaca ${priced.unitGrosze / 100} poza widelkami ${priced.perPcPLN.min}-${priced.perPcPLN.max}`,
);
// `raw` przy kruszcu AEJaCA juz nie istnieje (metal z kanalow wraca do
// przetopu), wiec najtanszym poziomem tej sciezki jest odciecie kanalow.
const najtanszy = calculate({
  ...base, finishId: "sprue_cut",
  variantId: "model_3d", materialSourceId: "aejaca",
  stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
}, "pl");
assert.ok(
  priced.perPcPLN.min > najtanszy.perPcPLN.min,
  "drozsze wykonczenie musi podniesc takze dolna granice widelek, a nie tylko kwote wiazaca",
);
assert.equal(priced.totalPLN.min, priced.perPcPLN.min * priced.qty);

const startingPrice = calculate({
  metalId: "silver", finishId: "sprue_cut", qtyId: "1",
  variantId: "model_3d", materialSourceId: "aejaca",
  stlData: { volumeCm3: 0.2, bbox: { x: 2.0, y: 1.5, z: 0.6 } },
}, "pl");
// Cena wejsciowa urosla o 30 zl 3 wrzesnia 2026: przy kruszcu AEJaCA znika
// poziom bez doplaty (surowy z kanalami), wiec najtansza droga zaczyna sie od
// odciecia kanalow. `priceFromGrosze` na karcie uslugi idzie za tym.
assert.ok(startingPrice.unitGrosze >= 23000 && startingPrice.unitGrosze <= 26000,
  `cena wejsciowa ${startingPrice.unitGrosze} poza oczekiwanym zakresem`);

// POZIOMY ZALEZNE OD ZRODLA KRUSZCU
assert.ok(!castingFinishesFor("aejaca").some((f) => f.id === "raw"),
  "przy kruszcu AEJaCA nie wydajemy odlewu z kanalami wlewowymi");
assert.ok(castingFinishesFor("client").some((f) => f.id === "raw"),
  "przy kruszcu powierzonym kanaly sa z metalu klienta, wiec zostaja do wyboru");
assert.equal(
  calculate({ ...base, finishId: "raw", variantId: "model_3d", materialSourceId: "aejaca" }, "pl").type,
  "custom",
  "kosz sprzed zmiany z niedostepnym poziomem ma isc do czlowieka, a nie liczyc sie po staremu",
);

// POWLOKA GALWANICZNA: te same pozycje i ceny co w kalkulatorze jubilerskim.
assert.deepEqual(CASTING_PLATINGS.map((v) => v.id), ["none", "rhodium", "gold_pl", "rose_pl"]);
assert.ok(CASTING_PLATINGS.every((v) => typeof v.cost === "number"),
  "kazda oferowana powloka musi miec cene, inaczej kwota wiazaca nie jest wiazaca");
assert.ok(castingPlatingAvailable("polished") && !castingPlatingAvailable("ground"),
  "powloka klada sie tylko na wypolerowana powierzchnie");
{
  // `base` nie niesie modelu, a bez zmierzonej objetosci silnik oddaje `null`,
  // wiec kazdy przypadek cenowy musi dolozyc `stlData`.
  const zModelem = {
    ...base, variantId: "model_3d", materialSourceId: "aejaca",
    stlData: { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } },
  };
  const bezPowloki = calculate({ ...zModelem, finishId: "polished", platingId: "none" }, "pl");
  const zRodem = calculate({ ...zModelem, finishId: "polished", platingId: "rhodium" }, "pl");
  const szlifZRodem = calculate({ ...zModelem, finishId: "ground", platingId: "rhodium" }, "pl");
  const szlif = calculate({ ...zModelem, finishId: "ground", platingId: "none" }, "pl");
  assert.ok(zRodem.unitGrosze > bezPowloki.unitGrosze, "rodowanie musi podniesc kwote");
  assert.equal(szlifZRodem.unitGrosze, szlif.unitGrosze,
    "powloka wybrana poza wykonczeniem jubilerskim nie moze wejsc do ceny");
}

assert.throws(
  () => priceItem({
    calculator: "jewelry_casting",
    params: { ...base, variantId: "model_3d", materialSourceId: "aejaca" },
    lang: "en",
    geometry: { volumeCm3: 0.2, bbox: { x: 5.0, y: 5.0, z: 6.0 } },
  }),
  (error) => error.code === "too_large_for_casting"
    && error.message.startsWith("At this scale the model exceeds"),
);

assert.throws(
  () => priceItem({
    calculator: "jewelry_casting",
    params: { variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver" },
    lang: "en",
  }),
  (error) => error.code === "incomplete_params"
    && /3D model file/.test(error.message),
);

// PROGI ILOSCI SA DWIE LISTY I NIE WOLNO ICH POMYLIC. Odlew liczy `calcNew`,
// ktore zna wylacznie `QTY_TIERS`. Kalkulator sTuDiO ma pod reka `QUANTITY_TIERS`
// z innymi identyfikatorami; podane silnikowi daja `null`, czyli cena po cichu
// znika z ekranu i nikt nie dostaje bledu. Raz juz tak bylo.
const modelDoProgow = { volumeCm3: 0.4, bbox: { x: 2.0, y: 2.0, z: 0.8 } };
for (const prog of QTY_TIERS.filter((q) => !q.custom)) {
  const wynik = calculate({
    ...base, qtyId: prog.id, variantId: "model_3d", materialSourceId: "aejaca", stlData: modelDoProgow,
  }, "pl");
  assert.equal(wynik?.type, "calculated", `prog "${prog.id}" nie daje ceny, a jest do wyboru w kalkulatorze`);
}
for (const prog of QUANTITY_TIERS.filter((q) => !QTY_TIERS.some((j) => j.id === q.id))) {
  const wynik = calculate({
    ...base, qtyId: prog.id, variantId: "model_3d", materialSourceId: "aejaca", stlData: modelDoProgow,
  }, "pl");
  assert.equal(wynik, null, `prog studyjny "${prog.id}" nie jest zrozumialy dla silnika odlewu i tak ma zostac`);
}

// Liczy sie RZECZYWISTA liczba sztuk, a nie naklad reprezentatywny progu.
// Patrz Brand_Reference 6.0g. Bez przekazania `qty` klient zamawiajacy dwie
// sztuki dostawalby kwote policzona dla trzech.
const dwieSztuki = calculate({
  ...base, qtyId: "2-5", qty: 2, variantId: "model_3d", materialSourceId: "aejaca", stlData: modelDoProgow,
}, "pl");
assert.equal(dwieSztuki.qty, 2, "silnik odlewu ma liczyc zamowione sztuki, a nie naklad progu");
assert.equal(dwieSztuki.lineGrosze, dwieSztuki.unitGrosze * 2);

assert.deepEqual([...SUPPORTED_EXTENSIONS].sort(), ["3mf", "obj", "step", "stl", "stp"]);
const controls = readFileSync(new URL("../src/components/shop/ConfigControls.jsx", import.meta.url), "utf8");
assert.match(controls, /disabled=\{zaDuzy && purpose !== "casting"\}/);
assert.match(controls, /Dostosuj możliwości techniczne/);
assert.match(controls, /purpose === "casting" \? Math\.max\(gora, 1\) : gora/);
assert.match(controls, /onDrop=\{/);

console.log("OK: odlew z metali szlachetnych, skala, formaty, lokalizacja, cena, masa i limity kolby");
