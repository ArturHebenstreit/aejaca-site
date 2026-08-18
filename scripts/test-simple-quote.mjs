#!/usr/bin/env node
// ============================================================
// SZYBKA WYCENA MUSI LICZYC Z WGRANEGO PLIKU
// ============================================================
// Awaria, ktora ten test zamyka, byla cicha i kosztowna. Tryb uproszczony
// odczytywal plik, pokazywal jego objetosc i wymiary, po czym je wyrzucal
// i bral cene z kafelka "jak duze". Dla plaskiej plyty 30 x 2 x 14 cm o
// objetosci 420 cm3 dawalo to 187 do 374 zl, podczas gdy tryb zaawansowany
// dla tego samego pliku podawal 36 do 71 zl. Przedzial "pudelko po butach"
// zaklada bryle wypelniajaca pudelko, a deska go nie wypelnia.
//
// Nic sie przy tym nie wywalalo. Klient widzial kwote piec razy za wysoka,
// uznawal, ze go nie stac, i wychodzil. Bledu nie zglosil nikt, bo nie bylo
// bledu do zgloszenia.
//
// Test pilnuje trzech rzeczy naraz:
//   1. geometria dociera do silnika wyceny, a nie ginie po drodze,
//   2. tryb uproszczony i zaawansowany daja dla tego samego pliku TE SAMA
//      kwote, bo licza tym samym silnikiem z tych samych danych,
//   3. zmiana wielkosci wykonania rzeczywiscie zmienia cene.
//
//   node scripts/test-simple-quote.mjs

import { resolveTechAndParams, runCalc } from "../src/pricing/simpleQuote.js";
import { calculate as calcPrint3D } from "../src/pricing/print3d.js";
import { scaleMesh, scaleVector, meshMaxCm, vectorMaxCm } from "../src/pricing/scaleGeometry.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

/** Plyta 30 x 2 x 14 cm, objetosc 420 cm3, czyli przypadek zgloszony przez wlasciciela. */
const PLYTA = {
  volumeCm3: 420,
  bbox: { x: 30, y: 2, z: 14 },
  triangleCount: 24,
  triangles: [],
};

const ODPOWIEDZI = {
  item: "part", size: "box", material: "plastic",
  finish: "standard", quantity: "one", fileType: "stl",
};

/** Kwota wiazaca w groszach. Widelki obok niej opisuja tylko niepewnosc szacunku. */
const kwota = (wynik) => (wynik?.type === "calculated" ? wynik.unitGrosze ?? null : null);

// ------------------------------------------------------------
// 1. Geometria dociera do silnika
// ------------------------------------------------------------
console.log("\n1. Czy plik w ogole dojezdza do wyceny");

const zPliku = resolveTechAndParams({ ...ODPOWIEDZI, stlData: PLYTA });
if (zPliku.params?.stlData) ok("parametry niosa geometrie wgranego modelu");
else zle("geometria zniknela miedzy plikiem a kalkulatorem, cena bedzie z przedzialu");

const bezPliku = resolveTechAndParams({ ...ODPOWIEDZI, fileType: null, stlData: null });
if (!bezPliku.params?.stlData) ok("bez pliku parametry nie udaja, ze geometria istnieje");
else zle("bez pliku pojawila sie geometria znikad");

// ------------------------------------------------------------
// 2. Oba tryby licza to samo
// ------------------------------------------------------------
// To jest wlasciwy test, bo porownuje nasza odpowiedz z nasza wlasna
// odpowiedzia podana inna droga. Rozjazd znaczy, ze jedna z dwoch stron
// klamie klientowi, i nie wiadomo ktora.
console.log("\n2. Tryb uproszczony kontra zaawansowany, ten sam plik");

const uproszczony = runCalc(zPliku, "pl");
const zaawansowany = calcPrint3D({ ...zPliku.params }, "pl");

if (kwota(uproszczony) != null && kwota(uproszczony) === kwota(zaawansowany)) {
  ok(`obie drogi daja te sama kwote (${kwota(uproszczony)})`);
} else {
  zle(`uproszczony ${kwota(uproszczony)}, zaawansowany ${kwota(zaawansowany)}`);
}

// Kontrola sensu: wycena z przedzialu dla TEJ plyty musi sie roznic od wyceny
// z geometrii. Gdyby wychodzila tak samo, test z punktu 1 nie mialby wagi.
const zPrzedzialu = runCalc(bezPliku, "pl");
if (kwota(zPrzedzialu) != null && kwota(zPrzedzialu) !== kwota(uproszczony)) {
  ok(`przedzial dalby ${kwota(zPrzedzialu)}, geometria daje ${kwota(uproszczony)}, roznica jest realna`);
} else {
  zle("wycena z przedzialu i z geometrii wychodza identycznie, test niczego nie sprawdza");
}

// ------------------------------------------------------------
// 3. Wielkosc wykonania zmienia cene
// ------------------------------------------------------------
console.log("\n3. Suwak wielkosci a kwota");

const polowa = scaleMesh(PLYTA, 0.5);
const zPolowy = runCalc(resolveTechAndParams({ ...ODPOWIEDZI, stlData: polowa }), "pl");

if (Math.abs(polowa.volumeCm3 - 52.5) < 0.01) ok("polowa wielkosci to jedna osma objetosci");
else zle(`skalowanie objetosci: ${polowa.volumeCm3} cm3, ma byc 52.5`);

if (kwota(zPolowy) != null && kwota(zPolowy) < kwota(uproszczony)) {
  ok(`pomniejszenie obniza cene (${kwota(uproszczony)} do ${kwota(zPolowy)})`);
} else {
  zle(`pomniejszenie nie obnizylo ceny: ${kwota(uproszczony)} do ${kwota(zPolowy)}`);
}

// ------------------------------------------------------------
// 4. Rysunek wektorowy tez niesie geometrie
// ------------------------------------------------------------
console.log("\n4. Rysunek wektorowy");

const RYSUNEK = { bboxMm: { x: 200, y: 100 }, pathLengthCm: 150, engravAreaCm2: 120 };
const wektor = resolveTechAndParams({
  item: "sign", size: "book", material: "wood",
  finish: "standard", quantity: "one", fileType: "svg", svgData: RYSUNEK,
});
if (wektor.params?.svgData) ok("parametry niosa geometrie rysunku");
else zle("geometria rysunku ginie, cena bedzie z przedzialu");

const wektorDuzy = scaleVector(RYSUNEK, 2);
if (Math.abs(wektorDuzy.engravAreaCm2 - 480) < 0.01 && Math.abs(wektorDuzy.pathLengthCm - 300) < 0.01) {
  ok("dwa razy wieksze pole rosnie kwadratowo, a sciezka liniowo");
} else {
  zle(`skalowanie wektora: pole ${wektorDuzy.engravAreaCm2}, sciezka ${wektorDuzy.pathLengthCm}`);
}

// ------------------------------------------------------------
// 5. Najwiekszy wymiar, czyli to, czym steruje suwak
// ------------------------------------------------------------
console.log("\n5. Najwiekszy wymiar");

if (meshMaxCm(PLYTA) === 30) ok("najwiekszy wymiar siatki liczy sie ze wszystkich trzech osi");
else zle(`najwiekszy wymiar siatki: ${meshMaxCm(PLYTA)}, ma byc 30`);

if (vectorMaxCm(RYSUNEK) === 20) ok("najwiekszy wymiar rysunku przelicza milimetry na centymetry");
else zle(`najwiekszy wymiar rysunku: ${vectorMaxCm(RYSUNEK)}, ma byc 20`);

console.log(bledy ? `\n${bledy} bledow\n` : "\nSzybka wycena: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
