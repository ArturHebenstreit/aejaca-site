#!/usr/bin/env node
// ============================================================
// LASER TEZ MA POLE ROBOCZE, I TEZ NIE WOLNO GO PRZEKROCZYC
// ============================================================
// Druk 3D mial te granice od dawna. Lasery nie mialy jej w ogole, wiec
// rysunek 573,9 x 901,0 mm dostal kwote wiazaca 497,83 zl. To 57 na 90 cm,
// poza kazda nasza maszyna. Klient zaplacilby za cos, czego nie da sie
// wykonac w calosci, a dowiedzielibysmy sie o tym przy realizacji.
//
// Nic sie przy tym nie wywalalo. Wycena byla spojna, konkretna i falszywa.
//
// Test pilnuje czterech rzeczy:
//   1. rysunek w polu dostaje cene,
//   2. rysunek za duzy JEJ NIE DOSTAJE,
//   3. rysunek dlugi, ale waski, przechodzi przez przelotke, a nie odpada,
//   4. obrot sie liczy, bo material klada na stole tak, jak pasuje.
//
//   node scripts/test-laser-bed.mjs

import { bedFit, maxScaleForBed, LASER_BEDS, bedMaxCm } from "../src/pricing/laserLimits.js";
import { LENSES } from "../src/pricing/laserFiber.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

// ------------------------------------------------------------
// 1. Przypadek zgloszony przez wlasciciela
// ------------------------------------------------------------
console.log("\n1. Zgloszony rysunek 573.9 x 901.0 mm");

const ZGLOSZONY = { x: 573.9, y: 901.0 };
const co2 = bedFit(ZGLOSZONY, "co2", 1);
if (!co2.fits) ok("CO2 odmawia automatycznej ceny, bo szerokosc 573.9 mm nie miesci sie w 308 mm");
else zle("CO2 nadal wycenia rysunek szerszy niz stol");

const fiber = bedFit(ZGLOSZONY, "fiber", 1);
if (!fiber.fits) ok("laser swiatlowodowy tez odmawia");
else zle("laser swiatlowodowy wycenia rysunek 40 razy wiekszy od swojego pola");

// ------------------------------------------------------------
// 2. Prace, ktore realnie robimy, maja przejsc
// ------------------------------------------------------------
console.log("\n2. Prace w zasiegu maszyn");

for (const [opis, bbox, tech] of [
  ["wizytowka 90 x 50 mm", { x: 90, y: 50 }, "co2"],
  ["tabliczka 250 x 150 mm", { x: 250, y: 150 }, "co2"],
  ["pelne pole 600 x 308 mm", { x: 600, y: 308 }, "co2"],
  ["znacznik 40 x 40 mm", { x: 40, y: 40 }, "fiber"],
  ["pelne pole soczewki 150 x 150 mm", { x: 150, y: 150 }, "fiber"],
]) {
  const w = bedFit(bbox, tech, 1);
  if (w.fits && !w.needsExtended) ok(`${opis} (${tech}) miesci sie bez przelotki`);
  else zle(`${opis} (${tech}) odrzucone albo wymaga przelotki, a nie powinno`);
}

// ------------------------------------------------------------
// 3. Przelotka wydluza os, nie poszerza pola
// ------------------------------------------------------------
// To jest sedno roznicy miedzy "1000 x 500" a tym, co maszyna naprawde robi.
console.log("\n3. Przelotka");

const dlugi = bedFit({ x: 1200, y: 200 }, "co2", 1);
if (dlugi.fits && dlugi.needsExtended) ok("listwa 1200 x 200 mm przechodzi, ale wymaga przelotki");
else zle(`listwa 1200 x 200 mm: fits=${dlugi.fits}, przelotka=${dlugi.needsExtended}`);

const szeroki = bedFit({ x: 1200, y: 400 }, "co2", 1);
if (!szeroki.fits) ok("plyta 1200 x 400 mm odpada, bo przelotka nie poszerza pola");
else zle("plyta szersza niz 308 mm przeszla, czyli przelotka udaje wieksze pole");

// ------------------------------------------------------------
// 4. Obrot i skala
// ------------------------------------------------------------
console.log("\n4. Obrot i skala");

const poObrocie = bedFit({ x: 250, y: 550 }, "co2", 1);
if (poObrocie.fits && !poObrocie.needsExtended) ok("rysunek 250 x 550 mm miesci sie po obroceniu");
else zle("obrot nie jest brany pod uwage, odrzucamy prace, ktore umiemy zrobic");

const max = maxScaleForBed({ x: 300, y: 154 }, LASER_BEDS.co2);
if (Math.abs(max - 2) < 1e-9) ok("najwieksza skala dla rysunku 300 x 154 mm to dokladnie 2");
else zle(`najwieksza skala wyszla ${max}, ma byc 2`);

const dwaRazy = bedFit({ x: 300, y: 154 }, "co2", 2);
const troche = bedFit({ x: 300, y: 154 }, "co2", 2.01);
if (dwaRazy.fits && !troche.fits) ok("granica dziala: skala 2 przechodzi, 2.01 juz nie");
else zle(`granica nieszczelna: 2 -> ${dwaRazy.fits}, 2.01 -> ${troche.fits}`);

// ------------------------------------------------------------
// 5. Zgodnosc z danymi soczewki
// ------------------------------------------------------------
// Dwa miejsca opisuja to samo pole. Rozjazd znaczy, ze klient czyta na ekranie
// inna liczbe, niz stosuje kalkulator.
console.log("\n5. Zgodnosc z kalkulatorem fiber");

const duzaSoczewka = LENSES.find((l) => l.id === "150mm");
if (duzaSoczewka?.fieldMm === LASER_BEDS.fiber.widthMm) {
  ok(`pole soczewki (${duzaSoczewka.fieldMm} mm) zgadza sie z granica w laserLimits`);
} else {
  zle(`soczewka mowi ${duzaSoczewka?.fieldMm} mm, granica mowi ${LASER_BEDS.fiber.widthMm} mm`);
}

if (duzaSoczewka && Math.abs(duzaSoczewka.maxAreaCm2 - (duzaSoczewka.fieldMm / 10) ** 2) < 0.01) {
  ok("powierzchnia soczewki zgadza sie z jej bokiem");
} else {
  zle(`powierzchnia ${duzaSoczewka?.maxAreaCm2} cm2 nie zgadza sie z bokiem ${duzaSoczewka?.fieldMm} mm`);
}

// ------------------------------------------------------------
// 6. Brak danych nie blokuje sprzedazy
// ------------------------------------------------------------
console.log("\n6. Odpornosc");

if (bedFit(null, "co2", 1).fits) ok("brak wymiarow nie blokuje wyceny");
else zle("brak wymiarow zablokowal wycene");

if (bedFit({ x: 100, y: 100 }, "nieznana", 1).fits) ok("nieznana technologia nie blokuje wyceny");
else zle("literowka w nazwie technologii zablokowalaby sprzedaz");

if (bedMaxCm("co2") === 300) ok("najwiekszy wymiar CO2 z przelotka to 300 cm");
else zle(`najwiekszy wymiar CO2: ${bedMaxCm("co2")} cm`);

console.log(bledy ? `\n${bledy} bledow\n` : "\nPole robocze laserow: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
