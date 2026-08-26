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

import { readFileSync } from "node:fs";
import { resolveTechAndParams, runCalc } from "../src/pricing/simpleQuote.js";
import { calculate as calcPrint3D, BUILD_VOL_CM, MSLA_BUILD_VOL_CM, maxScaleForBuildVolume } from "../src/pricing/print3d.js";
import { scaleMesh, scaleVector, meshMaxCm, vectorMaxCm } from "../src/pricing/scaleGeometry.js";
import { calculate as calcCasting, maxCastingScaleForBBox } from "../src/pricing/preciousMetalCasting.js";

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


// ------------------------------------------------------------
// 6. Filament kontra zywica: obie technologie z tych samych odpowiedzi
// ------------------------------------------------------------
// Szybka wycena wybierala technologie po cichu, a klient, ktory z niej
// korzysta, zwykle nie wie, ze filament i zywica to dwie rozne rzeczy: inny
// wyglad, inna wytrzymalosc, inna cena. Do tego zywica byla osiagalna
// wylacznie przez kafelek "Figurka z zywicy" i wylacznie BEZ pliku, wiec kto
// wgral miniaturke, nie mial jak zobaczyc jej ceny.
//
// Nic sie przy tym nie wywalalo. Klient dostawal wyrob wykonany inaczej, niz
// sadzil, i dowiadywal sie o tym po odbiorze.
console.log("\n6. Wybor technologii druku");

const FIGURKA = { item: "figurine", size: "palm", material: "plastic", finish: "standard", quantity: "one" };
const MODEL = { volumeCm3: 60, bbox: { x: 8, y: 5, z: 6 }, triangleCount: 100, triangles: [] };

for (const [opis, wej] of [
  ["bez pliku", FIGURKA],
  ["z plikiem", { ...FIGURKA, fileType: "stl", stlData: MODEL }],
]) {
  const zFilamentu = resolveTechAndParams({ ...wej, printTech: "fdm" });
  const zZywicy = resolveTechAndParams({ ...wej, printTech: "msla" });

  if (zFilamentu.tech === "3dprint") ok(`${opis}: wymuszenie filamentu daje druk FDM`);
  else zle(`${opis}: wymuszenie filamentu dalo ${zFilamentu.tech ?? "custom"}`);

  if (zZywicy.tech === "msla") ok(`${opis}: wymuszenie zywicy daje MSLA`);
  else zle(`${opis}: wymuszenie zywicy dalo ${zZywicy.tech ?? "custom"}`);

  const a = kwota(runCalc(zFilamentu, "pl"));
  const b = kwota(runCalc(zZywicy, "pl"));
  if (a != null && b != null && a !== b) ok(`${opis}: obie kwoty policzone i rozne (${a} gr vs ${b} gr)`);
  else zle(`${opis}: filament ${a}, zywica ${b}`);
}

// Zywica z pliku musi liczyc z GEOMETRII, a nie z przedzialu wielkosci.
// Inaczej wrocilaby awaria, ktora zamyka punkt 1 tego pliku, tyle ze druga
// technologia i po cichu.
const zywicaZPliku = resolveTechAndParams({ ...FIGURKA, fileType: "stl", stlData: MODEL, printTech: "msla" });
if (zywicaZPliku.params?.stlData) ok("wycena zywiczna z pliku niesie geometrie, a nie przedzial");
else zle("wycena zywiczna zgubila geometrie i policzy z przedzialu");

const zywicaMniejsza = kwota(runCalc(
  resolveTechAndParams({ ...FIGURKA, fileType: "stl", stlData: scaleMesh(MODEL, 0.5), printTech: "msla" }), "pl"));
const zywicaPelna = kwota(runCalc(zywicaZPliku, "pl"));
if (zywicaMniejsza != null && zywicaPelna != null && zywicaMniejsza < zywicaPelna) {
  ok(`zmniejszenie obniza takze cene zywicy (${zywicaPelna} do ${zywicaMniejsza})`);
} else {
  zle(`cena zywicy nie reaguje na wielkosc: ${zywicaPelna} do ${zywicaMniejsza}`);
}

// ------------------------------------------------------------
// 7. Kazda maszyna ma WLASNE pole robocze
// ------------------------------------------------------------
// Szybka wycena sprawdzala zawsze pole drukarki filamentowej (Bambu H2D,
// 30 x 32 x 32.5 cm), takze po przelaczeniu na zywice. Saturn 4 Ultra ma
// 21.8 x 12.3 x 25 cm, czyli w osi Y niemal trzy razy mniej, wiec model,
// ktory na filamencie przechodzil, na zywicy nie mial prawa sie zmiescic.
//
// Nic sie nie wywalalo. Cena byla, a dodanie do koszyka odbijalo sie dopiero
// o serwer zamowien, komunikatem, ktory niczego nie tlumaczyl.
console.log("\n7. Pole robocze zalezy od maszyny");

const dwaPolaRozne = ["x", "y", "z"].some((os) => BUILD_VOL_CM[os] !== MSLA_BUILD_VOL_CM[os]);
if (dwaPolaRozne) ok("pola robocze obu maszyn sa rozne, wiec jest czego pilnowac");
else zle("obie maszyny maja to samo pole, test nic nie sprawdza");

// Klocek 20 x 20 x 20 cm: miesci sie na filamencie, na zywicy nie ma szans.
const KLOCEK = { x: 20, y: 20, z: 20 };
const naFdm = maxScaleForBuildVolume(KLOCEK, BUILD_VOL_CM);
const naZywicy = maxScaleForBuildVolume(KLOCEK, MSLA_BUILD_VOL_CM);

if (naFdm >= 1) ok(`klocek 20 cm miesci sie na filamencie (skala do ${naFdm.toFixed(2)})`);
else zle(`klocek 20 cm nie miesci sie na filamencie, skala ${naFdm}`);

if (naZywicy < 1) ok(`ten sam klocek NIE miesci sie na zywicy (skala tylko do ${naZywicy.toFixed(2)})`);
else zle(`klocek 20 cm przeszedl na zywicy ze skala ${naZywicy}, a Saturn ma tylko 12.3 cm w osi Y`);

// Widok ma wybierac pole wedlug technologii, nie na sztywno.
const WIDOK = readFileSync(new URL("../src/components/calculators/SimpleStudioCalc.jsx", import.meta.url), "utf8");
if (/const fitCm = naZywicy \? fitCmMsla : fitCmFdm/.test(WIDOK)) {
  ok("szybka wycena bierze pole robocze wybranej maszyny");
} else {
  zle("szybka wycena wrocila do jednego pola dla obu technologii");
}
if (/MSLA_BUILD_VOL_CM/.test(WIDOK)) ok("pole drukarki zywicznej jest w ogole znane widokowi");
else zle("widok nie zna pola drukarki zywicznej");

// ------------------------------------------------------------
// ODLEW W KRUSZCU: SZYBKA WYCENA NIE MOZE ZGADYWAC MASY
// ------------------------------------------------------------
// Odlew wszedl do szybkiej wyceny jako szosty material. Trzy rzeczy musza sie
// zgadzac, bo kazda z nich zawodzi po cichu:
//   1. bez modelu nie ma masy, wiec nie ma kwoty, tylko wycena indywidualna,
//   2. kwota jest ta sama, co w trybie zaawansowanym i w sklepie,
//   3. progi ilosci ida ze slownika jubilerskiego, nie studyjnego.
{
  const kostka = { volumeCm3: 1.728, bbox: { x: 1.2, y: 1.2, z: 1.2 }, triangleCount: 12 };
  const odp = { item: "jewelry", size: "coin", material: "precious", finish: "standard", quantity: "one" };

  const bezPliku = resolveTechAndParams({ ...odp });
  if (bezPliku?.custom) ok("odlew bez modelu idzie do wyceny indywidualnej, zamiast zgadywac mase");
  else zle(`odlew bez modelu dostal kwote: ${JSON.stringify(bezPliku)}`);

  const zPlikiem = resolveTechAndParams({ ...odp, fileType: "stl", stlData: kostka });
  if (zPlikiem?.tech === "cast") ok("model 3D w kruszcu trafia do silnika odlewu");
  else zle(`model 3D w kruszcu poszedl gdzie indziej: ${JSON.stringify(zPlikiem)}`);

  const szybka = runCalc(zPlikiem, "pl");
  const zaawansowana = calcCasting({
    variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver", finishId: "clean", qtyId: "1", stlData: kostka,
  }, "pl");
  if (szybka?.unitGrosze === zaawansowana?.unitGrosze) {
    ok(`szybka wycena odlewu zgadza sie z trybem zaawansowanym (${szybka.unitGrosze} gr)`);
  } else {
    zle(`odlew rozjechal sie miedzy trybami: ${szybka?.unitGrosze} wobec ${zaawansowana?.unitGrosze}`);
  }

  // Wybor kruszcu MUSI zmieniac kwote. Gdyby przepadl po drodze, klient
  // zamawiajacy zloto widzialby cene srebra i nikt by tego nie zauwazyl.
  const zlote = runCalc(resolveTechAndParams({ ...odp, fileType: "stl", stlData: kostka, alloyId: "gold_18k" }), "pl");
  if (zlote?.unitGrosze > szybka.unitGrosze * 3) ok("wybor zlota zmienia kwote, wiec kruszec dociera do silnika");
  else zle(`zloto policzone jak srebro: ${zlote?.unitGrosze} wobec ${szybka.unitGrosze}`);

  // Model ponad kolba nie moze dostac kwoty automatycznej.
  const zaDuzy = resolveTechAndParams({
    ...odp, fileType: "stl", stlData: { volumeCm3: 40, bbox: { x: 6, y: 6, z: 6 }, triangleCount: 12 },
  });
  if (zaDuzy?.custom) ok("model ponad limit kolby idzie do oceny indywidualnej");
  else zle(`model 60 x 60 x 60 mm dostal kwote automatyczna: ${JSON.stringify(zaDuzy)}`);

  // Progi ilosci: silnik jubilerski zna "1" i "2-5", a nie "proto" i "micro".
  const kilka = runCalc(resolveTechAndParams({ ...odp, quantity: "few", fileType: "stl", stlData: kostka }), "pl");
  if (kilka?.type === "calculated" && kilka.qty === 3) ok("prog kilku sztuk liczy sie po jubilersku (3 szt.)");
  else zle(`prog kilku sztuk nie policzyl sie: ${JSON.stringify(kilka?.type)} qty=${kilka?.qty}`);

  const wiele = runCalc(resolveTechAndParams({ ...odp, quantity: "many", fileType: "stl", stlData: kostka }), "pl");
  if (wiele?.type === "custom") ok("seria ponad dziesiec sztuk odlewu idzie do wyceny indywidualnej");
  else zle(`seria dostala kwote automatyczna: ${JSON.stringify(wiele?.type)}`);
}

// ------------------------------------------------------------
// OBA TRYBY MUSZA REAGOWAC TAK SAMO NA MODEL PONAD KOLBA
// ------------------------------------------------------------
// Tryb zaawansowany pokazywal ostrzezenie i przycisk zmniejszenia, a szybka
// wycena po prostu przestawala podawac kwote i nie mowila dlaczego. Ten sam
// plik konczyl w dwoch trybach inaczej, wiec wygladalo to jak usterka jednego
// z nich. Granica jest jedna funkcja, wiec liczba musi sie zgadzac, a widok
// musi ja pokazac.
{
  // Dlugi walek: miesci sie przekrojem, nie miesci dlugoscia. Sprawdza, ze
  // limit dziala na kazdej osi z osobna, a nie na samej najwiekszej.
  const dlugi = { volumeCm3: 0.29, bbox: { x: 7.0, y: 1.0, z: 1.9 }, triangleCount: 12 };
  const odp = { item: "jewelry", size: "palm", material: "precious", finish: "standard", quantity: "one", fileType: "stl" };

  const wOryginale = resolveTechAndParams({ ...odp, stlData: dlugi });
  if (wOryginale?.custom) ok("model ponad kolba nie dostaje kwoty automatycznej w szybkiej wycenie");
  else zle("model 70 x 10 x 19 mm przeszedl przez automat odlewu");

  const max = maxCastingScaleForBBox(dlugi.bbox);
  const doGranicy = Math.floor(max * 1000) / 1000;
  const zmniejszony = {
    volumeCm3: dlugi.volumeCm3 * doGranicy ** 3,
    bbox: { x: dlugi.bbox.x * doGranicy, y: dlugi.bbox.y * doGranicy, z: dlugi.bbox.z * doGranicy },
    triangleCount: 12,
  };
  const poZmniejszeniu = runCalc(resolveTechAndParams({ ...odp, stlData: zmniejszony }), "pl");
  if (poZmniejszeniu?.type === "calculated") {
    ok(`po zmniejszeniu do ${(doGranicy * 100).toFixed(0)}% kwota wraca (${(poZmniejszeniu.unitGrosze / 100).toFixed(2)} zl)`);
  } else {
    zle("przycisk zmniejszenia prowadzilby donikad: przy granicy nadal nie ma kwoty");
  }

  if (/const castOverFlask = material === "precious"/.test(WIDOK)) ok("szybka wycena wie, ze model nie miesci sie w kolbie");
  else zle("szybka wycena nie rozpoznaje modelu ponad kolba");
  if (/setSizeCm\(castFitCm\)/.test(WIDOK)) ok("szybka wycena oferuje zmniejszenie do granicy kolby");
  else zle("szybka wycena nie oferuje zmniejszenia, wiec ostrzezenie jest slepym zaulkiem");
  if (/castOverFlaskTitle/.test(WIDOK)) ok("ostrzezenie o kolbie ma wlasny komunikat");
  else zle("brak komunikatu o kolbie: klient nie dowie sie, dlaczego nie ma ceny");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nSzybka wycena: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
