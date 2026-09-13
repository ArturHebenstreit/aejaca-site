#!/usr/bin/env node
// ============================================================
// PRZYJECIE MODELU KLIENTA DO ODLEWU: DEKLARACJA, NADDATEK, BRAMKA
// ============================================================
// Trzy rodziny przypadkow, kazda pilnuje innego rodzaju straty:
//
// 1. PODWOJNA KOMPENSACJA. Klient skaluje model o skurcz, my skalujemy drugi
//    raz i obraczka wychodzi o dwa do czterech rozmiarow za duza. Test liczy
//    mnoznik, ktorym naprawde ruszamy plik, i wymaga jedynki tam, gdzie stop
//    deklaracji zgadza sie ze stopem zamowienia.
//
// 2. NADDATEK NA SZLIF OTWORU. Szlif otwor POWIEKSZA, wiec model musi miec
//    otwor mniejszy. Znak tego dzialania jest cala trudnoscia rachunku i
//    dlatego stoi tu przyklad z briefu, liczba w liczbe.
//
// 3. BRAMKA NA PLIKU. Model nieszczelny, zlozony z kilku bryl, za cienki albo
//    z otworem niezgodnym z podanym rozmiarem palca nie ma ceny, tylko usterke.
//    Sprawdzamy takze pomiar geometryczny na PRAWDZIWEJ bryle z generatora
//    pierscionkow, bo wlasny pomiar wolno sprawdzac tylko czyms, czego ten
//    pomiar nie liczyl.
//
// Uruchamiany w `npm run build`.

import assert from "node:assert/strict";
import {
  przeliczWymiar,
  roznicaSkurczu,
  skurczKruszcu,
  kategoriaZOtworem,
  NADDATKI_MM,
  MIN_GRUBOSC_MM,
  PROG_ROZBIEZNOSCI_OTWORU_MM,
  naddatekZewnetrzny,
} from "../src/data/castingSpec.js";
import { CASTING_ALLOYS } from "../src/data/castingAlloys.js";
import { sprawdzModelDoOdlewu, wierszePrzeliczenia } from "../src/pricing/castingIntake.js";
import { missingCastingParams } from "../src/pricing/preciousMetalCasting.js";
import { analyzeSolids, analyzeAxialHole, analyzeTopology } from "../src/analysis/printability.js";

let bledy = 0;
function sekcja(nazwa) { console.log(`\n${nazwa}`); }
function ok(opis) { console.log(`  ✓ ${opis}`); }
function zle(opis, e) { bledy++; console.log(`  ✗ ${opis}: ${e.message}`); }
function test(opis, fn) { try { fn(); ok(opis); } catch (e) { zle(opis, e); } }

// Pozycja kompletna, z ktorej kolejne przypadki psuja po jednej rzeczy.
const BAZA = {
  variantId: "model_3d",
  materialSourceId: "aejaca",
  metalId: "gold_14k",
  finishId: "polished",
  wyrobId: "ring",
  modelStanId: "finished",
  otworMm: 17,
  otworWPlikuId: "asModelled",
  powierzchniaId: "gladka",
  qtyId: "1",
};

const GEOMETRIA = {
  volumeCm3: 0.9,
  bbox: { x: 2.0, y: 2.0, z: 0.6 },
  surfaceAreaCm2: 8,
  triangleCount: 5000,
  watertight: true,
  boundaryEdges: 0,
  nonManifoldEdges: 0,
  reversedFaces: 0,
  solids: 1,
  thinnestMm: 1.6,
  hole: { axis: "z", diameterMm: 17.0, ovality: 0.01 },
};

const z = (params = {}, geo = {}) => sprawdzModelDoOdlewu({ ...BAZA, ...params }, { ...GEOMETRIA, ...geo }, "pl");
const maBlokade = (w, id) => w.blokady.some((b) => b.id === id);
const maOstrzezenie = (w, id) => w.ostrzezenia.some((o) => o.id === id);

// ============================================================
sekcja("1. Skurcz: jedna tabela, zero podwojnej kompensacji");

test("skurcz bierze sie z castingAlloys, nie z drugiej kopii", () => {
  assert.equal(skurczKruszcu("gold_14k"), CASTING_ALLOYS.au585.shrink);
  assert.equal(skurczKruszcu("silver"), CASTING_ALLOYS.ag925.shrink);
  // Srebro 800 nie ma wiersza w tabeli skurczu i celowo bierze wspolczynnik
  // srebra 925 zamiast zmyslonej liczby.
  assert.equal(skurczKruszcu("silver_800"), CASTING_ALLOYS.ag925.shrink);
});

test("plik w wymiarach gotowych: mnozymy pelnym skurczem", () => {
  const p = przeliczWymiar({ docelowy: 17, metalId: "gold_14k", naddatek: 0.15, kierunek: "otwor" });
  assert.equal(p.korekta, CASTING_ALLOYS.au585.shrink);
  assert.equal(p.skurczKlienta, null);
});

test("plik juz przeskalowany dla TEGO SAMEGO stopu: nie ruszamy go wcale", () => {
  const p = przeliczWymiar({
    docelowy: 17, metalId: "gold_14k", naddatek: 0.15, kierunek: "otwor", skompensowanyDla: "au585",
  });
  // To jest sedno calego zadania: mnoznik ma wyjsc dokladnie jeden.
  assert.ok(Math.abs(p.korekta - 1) < 1e-12, `korekta ${p.korekta}, a ma byc 1`);
  assert.equal(roznicaSkurczu("gold_14k", "au585"), null);
});

test("plik przeskalowany dla INNEGO stopu: doskalujemy sama roznice", () => {
  const p = przeliczWymiar({
    docelowy: 17, metalId: "gold_14k", naddatek: 0.15, kierunek: "otwor", skompensowanyDla: "ag925",
  });
  const oczekiwana = CASTING_ALLOYS.au585.shrink / CASTING_ALLOYS.ag925.shrink;
  assert.ok(Math.abs(p.korekta - oczekiwana) < 1e-12);
  // Podwojna kompensacja daloby 1,0196 zamiast 1,0036, czyli 0,27 mm na
  // obraczce 17 mm, a to juz jest polowa rozmiaru.
  assert.ok(p.korekta < 1.005, `korekta ${p.korekta} wyglada na pelny skurcz, czyli kompensacje drugi raz`);
});

test("rozjazd stopow jest OSTRZEZENIEM, nie cicha poprawka", () => {
  // Plik zadeklarowany jako powiekszony dla Ag 925 ma TEZ powiekszony otwor.
  // Pierwsza wersja tej proby podawala otwor 17,00 mm i bramka slusznie
  // zatrzymala zamowienie: 0,27 mm rozjazdu to polowa rozmiaru.
  const otwor = 17 * CASTING_ALLOYS.ag925.shrink;
  const w = z({ modelStanId: "compensated", modelStopId: "ag925" }, { hole: { axis: "z", diameterMm: otwor, ovality: 0.01 } });
  assert.ok(maOstrzezenie(w, "inny_stop_kompensacji"));
  assert.equal(w.blokady.length, 0, JSON.stringify(w.blokady));
});

// ============================================================
sekcja("2. Naddatek na szlif otworu");

test("przyklad z briefu: 17,00 mm w Au 585 daje model 17,18 mm", () => {
  const p = przeliczWymiar({ docelowy: 17, metalId: "gold_14k", naddatek: NADDATKI_MM.otwor, kierunek: "otwor" });
  assert.equal(p.przedSkurczem.toFixed(2), "16.85");
  assert.equal(p.model.toFixed(2), "17.18");
});

test("naddatek otworu ODEJMUJEMY, bo szlif otwor powieksza", () => {
  const p = przeliczWymiar({ docelowy: 17, metalId: "silver", naddatek: 0.15, kierunek: "otwor" });
  assert.ok(p.przedSkurczem < 17);
});

test("naddatek zewnetrzny DODAJEMY, bo szlif zdejmuje material", () => {
  const p = przeliczWymiar({ docelowy: 20, metalId: "silver", naddatek: 0.1, kierunek: "zewnetrzny" });
  assert.ok(p.przedSkurczem > 20);
});

test("powierzchnia zdobiona nie dostaje naddatku nigdy", () => {
  assert.equal(naddatekZewnetrzny("polished", true), 0);
  assert.equal(naddatekZewnetrzny("polished", false), NADDATKI_MM.polerZewnetrzny);
  // Bez poleru lustrzanego naddatku tez nie ma: nie ma czego szlifowac.
  assert.equal(naddatekZewnetrzny("clean", false), 0);
});

test("naddatek otworu dotyczy tylko tego, co wchodzi na palec", () => {
  assert.equal(kategoriaZOtworem("ring"), true);
  assert.equal(kategoriaZOtworem("bangle"), true);
  assert.equal(kategoriaZOtworem("pendant"), false);
  const w = z({ wyrobId: "pendant", otworMm: undefined });
  assert.equal(w.przeliczenie, null);
  assert.equal(maBlokade(w, "otwor_niezgodny"), false);
});

test("otwor juz pomniejszony przez klienta: drugi raz nie odejmujemy", () => {
  const w = z({ otworWPlikuId: "withAllowance" }, { hole: { axis: "z", diameterMm: 16.85, ovality: 0.01 } });
  assert.equal(w.blokady.length, 0, JSON.stringify(w.blokady));
  assert.equal(w.przeliczenie.naddatek, 0);
});

test("blok przeliczenia konczy sie wymiarem wyrobu, a nie modelu", () => {
  const wiersze = wierszePrzeliczenia(z().przeliczenie, "pl");
  assert.ok(wiersze.length >= 4);
  assert.equal(wiersze[wiersze.length - 1].wartosc, "17.00 mm");
  assert.ok(wiersze.some((w) => w.wartosc === "17.18 mm"), "brakuje wymiaru modelu do druku");
});

// ============================================================
sekcja("3. Bramka na pliku");

test("model kompletny i zdrowy przechodzi bez slowa", () => {
  const w = z();
  assert.equal(w.blokady.length, 0, JSON.stringify(w.blokady));
  assert.equal(w.ostrzezenia.length, 0, JSON.stringify(w.ostrzezenia));
});

test("model nieszczelny: blokada", () => {
  assert.ok(maBlokade(z({}, { watertight: false, boundaryEdges: 412 }), "nieszczelny"));
});

test("kilka przenikajacych sie bryl: blokada", () => {
  assert.ok(maBlokade(z({}, { solids: 3 }), "kilka_bryl"));
});

test("model wiekszy od kolby: blokada", () => {
  assert.ok(maBlokade(z({}, { bbox: { x: 9, y: 9, z: 9 } }), "za_duzy"));
});

test("scianka ponizej minimum: blokada", () => {
  const cienka = MIN_GRUBOSC_MM.sciana.min - 0.1;
  const w = z({}, { thinnestMm: cienka });
  assert.ok(maBlokade(w, "za_cienko"));
});

test("scianka miedzy minimum a wartoscia pewna: samo ostrzezenie", () => {
  const posrednia = (MIN_GRUBOSC_MM.sciana.min + MIN_GRUBOSC_MM.sciana.pewne) / 2;
  const w = z({}, { thinnestMm: posrednia });
  assert.equal(w.blokady.length, 0);
  assert.ok(maOstrzezenie(w, "cienko"));
});

test("pomiar pominiety mowi wprost, ze go nie bylo", () => {
  const w = z({}, { thicknessSkipped: true, thinnestMm: undefined });
  assert.ok(maOstrzezenie(w, "grubosc_niesprawdzona"));
  assert.equal(maBlokade(w, "za_cienko"), false);
});

test("kruszec spoza tabeli skurczu: blokada zamiast wyceny", () => {
  assert.ok(maBlokade(z({ metalId: "platinum" }), "metal_bez_skurczu"));
});

test("duza objetosc ostrzega, ale nie zatrzymuje", () => {
  const w = z({}, { volumeCm3: 14 });
  assert.equal(w.blokady.length, 0);
  assert.ok(maOstrzezenie(w, "duza_objetosc"));
});

// ============================================================
sekcja("4. Otwor w pliku wobec podanego rozmiaru");

test("zgodny otwor przechodzi", () => {
  assert.equal(z({}, { hole: { axis: "z", diameterMm: 17.05, ovality: 0.01 } }).blokady.length, 0);
});

test("rozjazd ponad prog zatrzymuje zamowienie", () => {
  const poza = 17 + PROG_ROZBIEZNOSCI_OTWORU_MM + 0.05;
  assert.ok(maBlokade(z({}, { hole: { axis: "z", diameterMm: poza, ovality: 0.01 } }), "otwor_niezgodny"));
});

test("przy pliku juz przeskalowanym porownujemy z wymiarem PO skurczu", () => {
  // Plik powiekszony dla Ag 925 ma otwor 17 x 1,016 = 17,272 mm. Porownanie
  // wprost z 17 mm zglaszaloby rozjazd tam, gdzie wszystko sie zgadza.
  const otwor = 17 * CASTING_ALLOYS.ag925.shrink;
  const w = z({ modelStanId: "compensated", modelStopId: "ag925" }, { hole: { axis: "z", diameterMm: otwor, ovality: 0.01 } });
  assert.equal(maBlokade(w, "otwor_niezgodny"), false, JSON.stringify(w.blokady));
});

test("otworu nie dalo sie zmierzyc: ostrzezenie, nie blokada", () => {
  const w = z({}, { hole: undefined });
  assert.equal(w.blokady.length, 0);
  assert.ok(maOstrzezenie(w, "otwor_niezmierzony"));
});

// ============================================================
sekcja("5. Czego brakuje do wyceny");

const bezPliku = { ...BAZA, stlData: { volumeCm3: 1, bbox: { x: 1, y: 1, z: 1 } } };

test("brak deklaracji stanu pliku jest brakiem parametru", () => {
  const braki = missingCastingParams({ ...bezPliku, modelStanId: undefined });
  assert.ok(braki.includes("modelStanId"), braki.join(","));
});

test("deklaracja o kompensacji pociaga pytanie o stop", () => {
  const braki = missingCastingParams({ ...bezPliku, modelStanId: "compensated", modelStopId: undefined });
  assert.ok(braki.includes("modelStopId"), braki.join(","));
});

test("obraczka bez podanego otworu nie ma ceny", () => {
  const braki = missingCastingParams({ ...bezPliku, otworMm: undefined });
  assert.ok(braki.includes("otworMm"), braki.join(","));
});

test("zawieszka o otwor nie jest pytana", () => {
  const braki = missingCastingParams({ ...bezPliku, wyrobId: "pendant", otworMm: undefined });
  assert.equal(braki.includes("otworMm"), false, braki.join(","));
});

test("wzorzec powierzony nie jest pytany o skale pliku", () => {
  const braki = missingCastingParams({ ...bezPliku, variantId: "ready_pattern", modelStanId: undefined, wyrobId: undefined });
  assert.equal(braki.includes("modelStanId"), false, braki.join(","));
  assert.equal(braki.includes("wyrobId"), false, braki.join(","));
});

// ============================================================
sekcja("6. Pomiar geometryczny na prawdziwej bryle");

// Kostka 10 mm: lita, wiec NIE MA otworu, i jest jedna bryla.
function kostka(o, bok) {
  const p = (x, y, zz) => [o[0] + x * bok, o[1] + y * bok, o[2] + zz * bok];
  const v = [p(0, 0, 0), p(1, 0, 0), p(1, 1, 0), p(0, 1, 0), p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)];
  const f = [[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4],
    [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]];
  return f.map((t) => t.map((i) => v[i]));
}

// Pierscien: walec zewnetrzny minus wewnetrzny, zamkniety dwoma wiencami.
function pierscien(rZew, rWew, wysokosc, segmentow = 96) {
  const tri = [];
  const kat = (i) => (2 * Math.PI * i) / segmentow;
  const pkt = (r, i, zz) => [r * Math.cos(kat(i)), r * Math.sin(kat(i)), zz];
  const h = wysokosc / 2;
  for (let i = 0; i < segmentow; i++) {
    const j = (i + 1) % segmentow;
    // sciana zewnetrzna
    tri.push([pkt(rZew, i, -h), pkt(rZew, j, -h), pkt(rZew, j, h)]);
    tri.push([pkt(rZew, i, -h), pkt(rZew, j, h), pkt(rZew, i, h)]);
    // sciana wewnetrzna, nawinieta w druga strone
    tri.push([pkt(rWew, j, -h), pkt(rWew, i, -h), pkt(rWew, i, h)]);
    tri.push([pkt(rWew, j, -h), pkt(rWew, i, h), pkt(rWew, j, h)]);
    // wieniec gorny i dolny
    tri.push([pkt(rWew, i, h), pkt(rZew, i, h), pkt(rZew, j, h)]);
    tri.push([pkt(rWew, i, h), pkt(rZew, j, h), pkt(rWew, j, h)]);
    tri.push([pkt(rZew, i, -h), pkt(rWew, i, -h), pkt(rWew, j, -h)]);
    tri.push([pkt(rZew, i, -h), pkt(rWew, j, -h), pkt(rZew, j, -h)]);
  }
  return tri;
}

test("obraczka: zmierzony otwor zgadza sie ze srednica wewnetrzna", () => {
  const tri = pierscien(10.6, 8.6, 4);
  const otwor = analyzeAxialHole(tri);
  assert.ok(otwor, "otworu nie zmierzono wcale");
  // Wielokat wpisany w kolo jest nieco mniejszy od kola, wiec bierzemy zapas
  // dyskretyzacji. Wazne, zeby blad byl DUZO mniejszy od progu rozbieznosci.
  const blad = Math.abs(otwor.diameterMm - 17.2);
  assert.ok(blad < PROG_ROZBIEZNOSCI_OTWORU_MM / 4, `blad pomiaru ${blad.toFixed(3)} mm`);
  assert.equal(otwor.axis, "z");
});

test("lita bryla nie udaje obraczki", () => {
  assert.equal(analyzeAxialHole(kostka([0, 0, 0], 10)), null);
});

test("dwie przenikajace sie bryly sa policzone jako dwie", () => {
  const dwie = [...kostka([0, 0, 0], 10), ...kostka([5, 5, 5], 10)];
  assert.equal(analyzeSolids(dwie).solids, 2);
  assert.equal(analyzeSolids(kostka([0, 0, 0], 10)).solids, 1);
});

test("siatka z wyrwanym trojkatem jest nieszczelna", () => {
  const pelna = kostka([0, 0, 0], 10);
  assert.equal(analyzeTopology(pelna).isWatertight, true);
  assert.equal(analyzeTopology(pelna.slice(0, -1)).isWatertight, false);
});

console.log(bledy === 0
  ? "\nPrzyjecie modelu do odlewu: wszystko sie zgadza"
  : `\nPrzyjecie modelu do odlewu: ${bledy} bledow`);
process.exit(bledy === 0 ? 0 : 1);
