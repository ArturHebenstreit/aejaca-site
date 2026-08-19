#!/usr/bin/env node
// ============================================================
// PLIK W METRACH NIE MOZE PRZEJSC ZA MODEL DWUMILIMETROWY
// ============================================================
// STL i OBJ nie niosa jednostki, wiec czytamy je jak milimetry. Blender,
// Meshy i generatory AI zapisuja w metrach, wiec relief o wysokosci 20 cm
// przychodzi jako 0.2 i wyglada na model o boku dwoch milimetrow.
//
// Zgloszenie wlasciciela: plik .obj z Meshy pokazal 0.2 x 0.2 x 0.0 cm i
// objetosc 0.0 cm3. Cena spadla do minimum zamowienia. Nic sie nie wywalilo.
//
// Test pilnuje dwoch rzeczy naraz, bo obie kosztuja:
//   1. nieprawdopodobny rozmiar zostaje wychwycony i dostaje poprawke,
//   2. rozmiar wiarygodny NIE jest ruszany, bo falszywy alarm przy kazdym
//      breloczku nauczylby klienta klikac "tak" bez czytania.
//
//   node scripts/test-mesh-units.mjs

import { suspectUnits, looksTooSmall, PLAUSIBLE_CM } from "../src/pricing/meshUnits.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

// ------------------------------------------------------------
// 1. Przypadek zgloszony: plik z Meshy odczytany jako 0.2 cm
// ------------------------------------------------------------
console.log("\n1. Model odczytany jako dwa milimetry");

if (looksTooSmall(0.2)) ok("0.2 cm zglaszane jako nieprawdopodobne");
else zle("0.2 cm przeszlo bez slowa, klient dostanie cene za pylek");

const meshy = suspectUnits(0.2);
const idki = meshy.map((c) => c.id).join(",");
// Metry daly by 200 cm, czyli poza tym, co robimy, wiec maja odpasc.
if (idki === "cm,in") ok(`proponowane odczyty: ${idki}`);
else zle(`proponowane odczyty: ${idki || "brak"}, oczekiwane "cm,in"`);

const wCm = meshy.find((c) => c.id === "cm");
if (wCm && Math.abs(wCm.correctedCm - 2) < 1e-9) ok("odczyt w centymetrach daje 2 cm");
else zle(`odczyt w centymetrach daje ${wCm?.correctedCm}`);

// ------------------------------------------------------------
// 2. Plik naprawde zapisany w metrach
// ------------------------------------------------------------
console.log("\n2. Plik zapisany w metrach");

const wMetrach = suspectUnits(0.02);
if (wMetrach[0]?.id === "m" && Math.abs(wMetrach[0].correctedCm - 20) < 1e-9) {
  ok("0.02 cm to najpewniej 20 cm w metrach, i ta odpowiedz jest pierwsza");
} else {
  zle(`0.02 cm dalo ${wMetrach[0]?.id} -> ${wMetrach[0]?.correctedCm} cm`);
}

// ------------------------------------------------------------
// 3. Brak falszywych alarmow
// ------------------------------------------------------------
// Alarm przy kazdym breloczku nauczylby klienta klikac bez czytania, wiec
// milczenie przy wiarygodnym rozmiarze jest tak samo wazne jak wykrycie.
console.log("\n3. Rozmiary wiarygodne zostaja w spokoju");

for (const cm of [0.5, 1, 2.5, 8, 30, 99.9, 250]) {
  if (!looksTooSmall(cm) && suspectUnits(cm).length === 0) ok(`${cm} cm nie budzi podejrzen`);
  else zle(`${cm} cm niepotrzebnie zgloszone jako zla jednostka`);
}

if (suspectUnits(PLAUSIBLE_CM.min).length === 0) ok(`dolna granica (${PLAUSIBLE_CM.min} cm) jest jeszcze wiarygodna`);
else zle("dolna granica zglaszana jako podejrzana");

// ------------------------------------------------------------
// 4. Milczenie zamiast podpowiedzi z sufitu
// ------------------------------------------------------------
console.log("\n4. Brak podpowiedzi wzietej z sufitu");

if (suspectUnits(0.0000001).length === 0) ok("gdy zadna poprawka nie ratuje, nie proponujemy nic");
else zle("podpowiedz wzieta z sufitu przy skrajnie malym modelu");

for (const zly of [0, -5, NaN, null, undefined, "abc"]) {
  if (suspectUnits(zly).length === 0 && !looksTooSmall(zly)) ok(`wejscie ${JSON.stringify(zly)} nie wywraca wykrywacza`);
  else zle(`wejscie ${JSON.stringify(zly)} dalo podpowiedz`);
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nJednostki pliku: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
