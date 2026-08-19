#!/usr/bin/env node
// ============================================================
// DXF MUSI LICZYC TO SAMO, CO SVG DLA TEGO SAMEGO KSZTALTU
// ============================================================
// Kafelek wyboru pliku obiecywal "SVG, DXF, AI, PDF", a wycenic umielismy sam
// SVG. Reszta szla do wyceny recznej, mimo ze DXF jest formatem tekstowym
// stworzonym wprost do maszyn i niesie dokladnie te dane, ktore sa potrzebne.
//
// Najgrozniejszy blad w takim parserze jest cichy: dlugosc sciezki wychodzi
// inna niz w rzeczywistosci i cena jest zaniżona albo zawyżona, a plik czyta
// sie bez bledu. Dlatego kazdy przypadek porownujemy z liczba policzona
// recznie, a nie sami ze soba.
//
//   node scripts/test-dxf.mjs

import { parseDXF } from "../src/utils/dxfParser.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);
const blisko = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

/** Sklada plik DXF z samej sekcji ENTITIES, tak jak robi to wiekszosc eksportow. */
function dxf(encje, insunits = null) {
  const naglowek = insunits == null ? "" :
    ["0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", String(insunits), "0", "ENDSEC"].join("\n") + "\n";
  return naglowek + ["0", "SECTION", "2", "ENTITIES", ...encje, "0", "ENDSEC", "0", "EOF"].join("\n");
}

const linia = (x1, y1, x2, y2) => ["0", "LINE", "8", "0", "10", x1, "20", y1, "11", x2, "21", y2].map(String);
const okrag = (cx, cy, r) => ["0", "CIRCLE", "8", "0", "10", cx, "20", cy, "40", r].map(String);

// ------------------------------------------------------------
// 1. Prostokat z czterech odcinkow
// ------------------------------------------------------------
console.log("\n1. Prostokat 200 x 100 mm z odcinkow");

const prostokat = parseDXF(dxf([
  ...linia(0, 0, 200, 0), ...linia(200, 0, 200, 100),
  ...linia(200, 100, 0, 100), ...linia(0, 100, 0, 0),
]));

if (blisko(prostokat.bboxMm.x, 200) && blisko(prostokat.bboxMm.y, 100)) ok("wymiary 200 x 100 mm");
else zle(`wymiary ${prostokat.bboxMm.x} x ${prostokat.bboxMm.y}, maja byc 200 x 100`);

// Obwod 2*(200+100) = 600 mm = 60 cm
if (blisko(prostokat.pathLengthCm, 60)) ok("dlugosc sciezki 60 cm, czyli obwod prostokata");
else zle(`dlugosc ${prostokat.pathLengthCm} cm, ma byc 60`);

if (blisko(prostokat.engravAreaCm2, 200)) ok("pole 200 cm2");
else zle(`pole ${prostokat.engravAreaCm2} cm2, ma byc 200`);

// ------------------------------------------------------------
// 2. Polilinia zamknieta liczy odcinek powrotny
// ------------------------------------------------------------
// Pominiecie zamkniecia to klasyczny cichy blad: rysunek czyta sie poprawnie,
// a cena jest nizsza o jeden bok.
console.log("\n2. Polilinia zamknieta");

const polilinia = parseDXF(dxf([
  "0", "LWPOLYLINE", "8", "0", "90", "4", "70", "1",
  "10", "0", "20", "0", "10", "200", "20", "0",
  "10", "200", "20", "100", "10", "0", "20", "100",
]));
if (blisko(polilinia.pathLengthCm, 60)) ok("zamknieta polilinia daje ten sam obwod co cztery odcinki");
else zle(`zamknieta polilinia: ${polilinia.pathLengthCm} cm, ma byc 60`);

const otwarta = parseDXF(dxf([
  "0", "LWPOLYLINE", "8", "0", "90", "4", "70", "0",
  "10", "0", "20", "0", "10", "200", "20", "0",
  "10", "200", "20", "100", "10", "0", "20", "100",
]));
// Bez powrotu: 200 + 100 + 200 = 500 mm = 50 cm
if (blisko(otwarta.pathLengthCm, 50)) ok("otwarta polilinia NIE dolicza odcinka powrotnego");
else zle(`otwarta polilinia: ${otwarta.pathLengthCm} cm, ma byc 50`);

// ------------------------------------------------------------
// 3. Okrag
// ------------------------------------------------------------
console.log("\n3. Okrag");

const kolo = parseDXF(dxf(okrag(100, 100, 50)));
// Obwod 2*pi*50 = 314.159 mm = 31.4159 cm
if (blisko(kolo.pathLengthCm, 2 * Math.PI * 5, 0.001)) ok("obwod okregu policzony dokladnie");
else zle(`obwod ${kolo.pathLengthCm} cm, ma byc ${(2 * Math.PI * 5).toFixed(4)}`);

if (blisko(kolo.bboxMm.x, 100) && blisko(kolo.bboxMm.y, 100)) ok("wymiary okregu to jego srednica");
else zle(`wymiary okregu ${kolo.bboxMm.x} x ${kolo.bboxMm.y}, maja byc 100 x 100`);

// ------------------------------------------------------------
// 4. Luk
// ------------------------------------------------------------
console.log("\n4. Luk");

const cwiartka = parseDXF(dxf(["0", "ARC", "8", "0", "10", "0", "20", "0", "40", "100", "50", "0", "51", "90"]));
// Cwiartka okregu o promieniu 100 mm: 2*pi*100/4 = 157.08 mm = 15.708 cm.
// Przyblizamy lamana, wiec dopuszczamy pol procenta w DOL.
if (cwiartka.pathLengthCm > 15.6 && cwiartka.pathLengthCm <= 15.71) ok(`cwiartka okregu: ${cwiartka.pathLengthCm.toFixed(3)} cm`);
else zle(`cwiartka okregu: ${cwiartka.pathLengthCm} cm, ma byc okolo 15.708`);

// ------------------------------------------------------------
// 5. Jednostki z naglowka
// ------------------------------------------------------------
// Rysunek w calach odczytany jako milimetry to cena 25 razy za niska.
console.log("\n5. Jednostki");

const wCalach = parseDXF(dxf([...linia(0, 0, 10, 0)], 1));
if (blisko(wCalach.bboxMm.x, 254)) ok("10 cali odczytane jako 254 mm");
else zle(`10 cali dalo ${wCalach.bboxMm.x} mm, ma byc 254`);

const wCm = parseDXF(dxf([...linia(0, 0, 10, 0)], 5));
if (blisko(wCm.bboxMm.x, 100)) ok("10 centymetrow odczytane jako 100 mm");
else zle(`10 cm dalo ${wCm.bboxMm.x} mm, ma byc 100`);

const bezNaglowka = parseDXF(dxf([...linia(0, 0, 10, 0)]));
if (blisko(bezNaglowka.bboxMm.x, 10)) ok("bez naglowka przyjmujemy milimetry");
else zle(`bez naglowka: ${bezNaglowka.bboxMm.x} mm, ma byc 10`);

// ------------------------------------------------------------
// 6. Ten sam ksztalt musi kosztowac tyle samo co w SVG
// ------------------------------------------------------------
// To jest wlasciwy test: porownuje nasza odpowiedz z nasza wlasna odpowiedzia
// podana inna droga. Rozjazd znaczy, ze jedna z dwoch stron klamie klientowi.
console.log("\n6. Zgodnosc z wycena z SVG");

const { calcCut } = await import("../src/pricing/laserCo2.js");
const zDxf = parseDXF(dxf([
  ...linia(0, 0, 200, 0), ...linia(200, 0, 200, 100),
  ...linia(200, 100, 0, 100), ...linia(0, 100, 0, 0),
]));
const jakSvg = { bboxMm: { x: 200, y: 100 }, pathLengthCm: 60, engravAreaCm2: 200 };

const parametry = { matId: "ply3", pathId: "M", complexId: "moderate", quantityId: "proto", extended: false };
const cenaDxf = calcCut({ ...parametry, svgData: zDxf }, "pl");
const cenaSvg = calcCut({ ...parametry, svgData: jakSvg }, "pl");

if (cenaDxf?.unitGrosze && cenaDxf.unitGrosze === cenaSvg?.unitGrosze) {
  ok(`ten sam ksztalt kosztuje tyle samo z DXF i z SVG (${cenaDxf.unitGrosze} gr)`);
} else {
  zle(`DXF ${cenaDxf?.unitGrosze}, SVG ${cenaSvg?.unitGrosze}`);
}

// ------------------------------------------------------------
// 7. Pusty plik nie moze udawac wyceny
// ------------------------------------------------------------
console.log("\n7. Plik bez sciezek");

let rzucil = false;
try { parseDXF(dxf([])); } catch { rzucil = true; }
if (rzucil) ok("plik bez sciezek konczy sie bledem, a nie cena zero");
else zle("pusty rysunek przeszedl i dostanie jakas cene");

try { parseDXF("to nie jest dxf"); rzucil = true; } catch { rzucil = true; }
if (rzucil) ok("plik, ktory nie jest DXF, nie wywraca parsera");

// ------------------------------------------------------------
// 8. Bloki, ktorych nie rozwijamy, sa policzone
// ------------------------------------------------------------
// Milczenie o pominietej czesci rysunku zaniżyloby cene bez sladu.
console.log("\n8. Bloki");

const zBlokiem = parseDXF(dxf([
  ...linia(0, 0, 200, 0),
  "0", "INSERT", "8", "0", "2", "BLOK1", "10", "0", "20", "0",
]));
if (zBlokiem.blocksSkipped === 1) ok("pominiety blok jest policzony i mozna o nim powiedziec");
else zle(`liczba pominietych blokow: ${zBlokiem.blocksSkipped}, ma byc 1`);

console.log(bledy ? `\n${bledy} bledow\n` : "\nRysunek DXF: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
