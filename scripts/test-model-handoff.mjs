#!/usr/bin/env node
// ============================================================
// PRZEKAZANIE MODELU I SKALA, W KTOREJ GO ANALIZUJEMY
// ============================================================
// Dwie rzeczy, ktore latwo rozjechac, bo obie zyja po dwoch stronach szwu.
//
// PIERWSZA: bramka drukowalnosci odsyla po pelna analize na osobna strone.
// Jezeli model nie pojedzie razem z odnosnikiem, klient wgrywa ten sam plik
// drugi raz i recznie ustawia te sama technologie oraz te sama dysze. Kazdy
// z tych krokow mozna wykonac inaczej, a wtedy pelna analiza odpowiada na inne
// pytanie niz to, ktore ja wywolalo.
//
// DRUGA i grozniejsza: analiza musi isc na siatce W SKALI ZAMOWIENIA. Model
// zmniejszony do polowy ma polowe grubosci muru. Kalkulatory przeliczaly przy
// skalowaniu tylko objetosc i gabaryt, wiec bramka ogladala grubosc sprzed
// zmniejszenia i przepuszczala wydruk, ktorego nie da sie wykonac. To jest
// awaria cicha: nikt nie widzi bledu, tylko werdykt jest nieprawdziwy.
//
//   node scripts/test-model-handoff.mjs

import {
  flattenTriangles, trianglesFromPositions, wantsHandoff, HANDOFF_URL,
} from "../src/analysis/modelHandoff.js";
import { analyzePrintability } from "../src/analysis/printability.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

/** Prostopadloscian jako lista trojkatow, wymiary w milimetrach. */
function plyta(x, y, z) {
  const v = [
    [0, 0, 0], [x, 0, 0], [x, y, 0], [0, y, 0],
    [0, 0, z], [x, 0, z], [x, y, z], [0, y, z],
  ];
  const sciany = [
    [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
    [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7],
  ];
  const t = [];
  for (const [a, b, c, d] of sciany) { t.push([v[a], v[b], v[c]]); t.push([v[a], v[c], v[d]]); }
  return t;
}

// ------------------------------------------------------------
// 1. Postac przesylana i postac wracajaca
// ------------------------------------------------------------
console.log("\n1. Splaszczenie i odtworzenie siatki");

const wzor = plyta(20, 20, 0.3);
const wroc = trianglesFromPositions(flattenTriangles(wzor));
if (wroc.length === wzor.length) ok("liczba trojkatow przezywa droge tam i z powrotem");
else zle(`bylo ${wzor.length} trojkatow, wrocilo ${wroc.length}`);

const tenSam = wzor.every((t, i) => t.every((p, j) => p.every((c, k) => Math.abs(c - wroc[i][j][k]) < 1e-4)));
if (tenSam) ok("wspolrzedne wracaja bez zmian");
else zle("wspolrzedne po odtworzeniu nie zgadzaja sie z oryginalem");

// ------------------------------------------------------------
// 2. Skala dziala na siatce, a nie tylko na opisie
// ------------------------------------------------------------
console.log("\n2. Skala w splaszczeniu");

const podwojona = trianglesFromPositions(flattenTriangles(wzor, 2));
const najwyzszy = (t) => Math.max(...t.flat().map((p) => p[2]));
if (Math.abs(najwyzszy(podwojona) - 0.6) < 1e-3) ok("skala 2x podwaja grubosc plyty");
else zle(`plyta 0,3 mm w skali 2x ma ${najwyzszy(podwojona)} mm, ma miec 0,6`);

if (Math.abs(najwyzszy(wroc) - 0.3) < 1e-3) ok("brak skali niczego nie rusza");
else zle("domyslna skala zmienia wymiary");

// ------------------------------------------------------------
// 3. Werdykt MUSI zalezec od skali
// ------------------------------------------------------------
// To jest sedno. Plyta 0,3 mm nie ma jak powstac przy dyszy 0,4, bo drukarka
// nie ulozy nawet jednej sciezki. Ta sama plyta powiekszona ma 0,9 mm, czyli
// dwie sciezki z zapasem, i jest poprawna. Jezeli oba przypadki dadza ten sam
// werdykt, znaczy ze skala gdzies wyparowala.
console.log("\n3. Werdykt a wielkosc wydruku");

const opcje = { tech: "fdm", nozzleId: "0.4", samples: 800 };
const blokery = (t) => analyzePrintability(t, opcje).findings.filter((f) => f.level === "blocker").map((f) => f.id);

const wOryginale = blokery(trianglesFromPositions(flattenTriangles(wzor, 1)));
const wPowiekszeniu = blokery(trianglesFromPositions(flattenTriangles(wzor, 3)));

if (wOryginale.includes("too_thin")) ok("plyta 0,3 mm przy dyszy 0,4 jest blokowana");
else zle(`plyta 0,3 mm nie zostala zablokowana, ustalenia: ${wOryginale.join(", ") || "brak"}`);

if (!wPowiekszeniu.includes("too_thin")) ok("ta sama plyta w skali 3x juz przechodzi");
else zle("skala 3x nie zmienila werdyktu, analiza nie widzi skalowania");

// ------------------------------------------------------------
// 4. Adres, po ktorym strona analizy siega po model
// ------------------------------------------------------------
console.log("\n4. Znacznik w adresie");

const pytanie = HANDOFF_URL.slice(HANDOFF_URL.indexOf("?"));
if (wantsHandoff(pytanie)) ok("strona analizy rozpoznaje adres, ktory buduje bramka");
else zle(`bramka prowadzi pod ${HANDOFF_URL}, a strona analizy tego nie rozpoznaje`);

if (!wantsHandoff("") && !wantsHandoff("?model=cos-innego")) ok("zwykle wejscie na narzedzie nie siega po rekord");
else zle("strona analizy szuka modelu takze bez znacznika");

console.log(bledy ? `\n${bledy} bledow\n` : "\nPrzekazanie modelu: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
