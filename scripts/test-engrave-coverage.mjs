// ============================================================
// POKRYCIE RYSUNKU W GRAWERZE: czy liczymy droge glowicy, a nie kartke
// ============================================================
// Do 2026-08-21 grawer liczyl sie z PROSTOKATA OPISANEGO na rysunku. Wlasciciel
// zglosil skutek: ten sam plik 592 x 308 mm wyciety kosztowal 18 zl, a
// wygrawerowany 157. Ciecie liczylo droge glowicy, grawer cala kartke razem
// z pustka miedzy liniami.
//
// Poprawka moze sie zepsuc na trzy sposoby i ZADEN nie rzuca wyjatku:
//
//   1. LICZENIE PROCENTA ZACZERNIENIA zamiast rozpietosci sladu w wierszach.
//      Prostokatna ramka ma tuszu ulamek pola (na realnym rysunku procent, na
//      masce w sekcji 2 dziesiec procent), a glowica i tak
//      przejezdza cala szerokosc w kazdym wierszu miedzy jej bokami. Taki blad
//      obcialby cene pieciodziesieciokrotnie i przyjelibysmy zlecenie ponizej
//      kosztu maszyny.
//   2. PRZELOZENIE POKRYCIA NA MATERIAL. Plyte kupujemy w calosci niezaleznie
//      od tego, jak gesty jest wzor.
//   3. POTRAKTOWANIE BRAKU POMIARU JAK ZEROWEGO POKRYCIA. Rysunek DXF i plik
//      siegajacy po zewnetrzne zasoby nie da sie zmierzyc; wtedy ma zostac
//      stary wzor, czyli kwota zawyzona, a nie darmowy grawer.

import { sweptFraction } from "../src/utils/svgCoverage.js";
import { coverageOf, sweptAreaCm2, coverageMeasured } from "../src/pricing/engraveCoverage.js";
import { calcEngrave } from "../src/pricing/laserCo2.js";
import { calculate as calcFiber } from "../src/pricing/laserFiber.js";
import { readFileSync } from "node:fs";

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const ok = (m) => console.log(`  OK ${m}`);
const sekcja = (n) => console.log(`\n${n}`);
const blisko = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

/** Maska z rysunku ASCII: znak inny niz kropka znaczy slad. */
function maska(wiersze) {
  const w = wiersze[0].length;
  const h = wiersze.length;
  const m = new Uint8Array(w * h);
  wiersze.forEach((r, y) => [...r].forEach((c, x) => { if (c !== ".") m[y * w + x] = 1; }));
  return { m, w, h };
}
const tuszu = ({ m }) => m.reduce((a, v) => a + v, 0) / m.length;

// --- 1. Rdzen pomiaru -----------------------------------------------------
sekcja("1. Suma rozpietosci sladu w wierszach");
{
  const pelny = maska(Array(8).fill("########"));
  if (!blisko(sweptFraction(pelny.m, pelny.w, pelny.h).coverage, 1)) zle("pelne pole nie daje pokrycia 1");

  const pusty = maska(Array(8).fill("........"));
  const p = sweptFraction(pusty.m, pusty.w, pusty.h);
  if (p.coverage !== 0 || p.inkRows !== 0) zle(`pusty rysunek daje pokrycie ${p.coverage}`);

  // Znaczek w rogu duzego arkusza: dwa wiersze po dwa piksele z szesnastu.
  const znaczek = maska(["##..............", "##..............", ...Array(14).fill("................")]);
  const z = sweptFraction(znaczek.m, znaczek.w, znaczek.h);
  if (!blisko(z.coverage, 4 / 256)) zle(`znaczek w rogu daje pokrycie ${z.coverage}, a ma 4/256`);
  ok("pelne pole, pusty rysunek i znaczek w rogu liczą się tak, jak jeżdżą");
}

// --- 2. RAMKA. Najwazniejszy przypadek w calym pliku ----------------------
sekcja("2. Ramka pokrywa cale pole");
{
  const N = 40;
  const ramka = maska([
    "#".repeat(N),
    ...Array(N - 2).fill(`#${".".repeat(N - 2)}#`),
    "#".repeat(N),
  ]);
  const r = sweptFraction(ramka.m, ramka.w, ramka.h);
  if (!blisko(r.coverage, 1)) {
    zle(`ramka daje pokrycie ${r.coverage}, a glowica przejezdza cale pole (ma byc 1)`);
  }
  // Kontrola sensu: gdyby ktos liczyl procent zaczernienia, wyszloby ponizej
  // polowy tego, i to jest DOKLADNIE ten blad, ktory ta sekcja ma lapac.
  const zaczernienie = tuszu(ramka);
  if (zaczernienie >= 0.9) zle("maska testowa nie jest ramka, tylko plama");
  if (blisko(r.coverage, zaczernienie)) zle("pokrycie liczy sie procentem zaczernienia zamiast rozpietoscia w wierszu");
  ok(`ramka: tuszu ${(zaczernienie * 100).toFixed(0)}%, a przejazdu 100%`);
}

// --- 3. Rozbieg glowicy ---------------------------------------------------
sekcja("3. Rozbieg dochodzi raz na wiersz i nie wychodzi poza pole");
{
  const kreska = maska([...Array(3).fill("................"), "....####........", ...Array(12).fill("................")]);
  const bez = sweptFraction(kreska.m, kreska.w, kreska.h, 0);
  const zRozbiegiem = sweptFraction(kreska.m, kreska.w, kreska.h, 4);
  if (!(zRozbiegiem.coverage > bez.coverage)) zle("rozbieg glowicy nie podnosi przejazdu");
  if (!blisko(zRozbiegiem.sweptPx, 8)) zle(`rozbieg policzony ${zRozbiegiem.sweptPx} razy zamiast raz na wiersz (ma byc 8)`);

  const pelny = maska(Array(8).fill("########"));
  if (sweptFraction(pelny.m, pelny.w, pelny.h, 20).coverage > 1) zle("rozbieg wyprowadza przejazd poza pole robocze");
  ok("rozbieg dochodzi raz na wiersz i jest przycinany do szerokosci pola");
}

// --- 4. Brak pomiaru znaczy pelny prostokat, a nie zero -------------------
sekcja("4. Brak pomiaru");
{
  for (const [opis, dane] of [["brak svgData", null], ["DXF bez rastra", { engravAreaCm2: 10 }], ["pomiar nieudany", { coverage: null }], ["pomiar zerowy", { coverage: 0 }]]) {
    if (!blisko(coverageOf(dane), 1)) zle(`${opis}: pokrycie ${coverageOf(dane)}, a ma byc pelny prostokat`);
    if (coverageMeasured(dane)) zle(`${opis}: raportuje sie jako zmierzone`);
  }
  if (!blisko(sweptAreaCm2(100, { coverage: 0.25 }), 25)) zle("pole przejazdu nie skaluje sie pokryciem");
  if (!blisko(coverageOf({ coverage: 1.7 }), 1)) zle("pokrycie powyzej jedynki nie jest przycinane");
  ok("nieznane pokrycie liczy sie jak caly prostokat, czyli po staremu");
}

// --- 5. Cena: czas idzie z pokrycia, material z prostokata ----------------
sekcja("5. Wycena CO2");
{
  const wspolne = { matId: "wood", detailId: "standard", quantityId: "proto", extended: false, podloze: "own_item" };
  const pole = { engravAreaCm2: 400, bboxMm: { x: 200, y: 200 }, pathLengthCm: 100, pathCount: 4 };

  const pelne = calcEngrave({ ...wspolne, svgData: { ...pole, coverage: 1 } }, "pl");
  const rzadkie = calcEngrave({ ...wspolne, svgData: { ...pole, coverage: 0.2 } }, "pl");
  const bezPomiaru = calcEngrave({ ...wspolne, svgData: pole }, "pl");

  if (pelne?.type !== "calculated" || rzadkie?.type !== "calculated") zle("wycena nie doszla do kwoty");
  if (pelne.unitGrosze !== bezPomiaru.unitGrosze) zle("brak pomiaru zmienia kwote wzgledem pelnego pokrycia");
  if (!(rzadkie.unitGrosze < pelne.unitGrosze)) zle("rzadki rysunek nie jest tanszy od pelnego pola");

  const czas = (w) => Number(w.breakdown.find((b) => b.label === "Czas grawerowania")?.value.replace(" min", ""));
  if (!blisko(czas(rzadkie), czas(pelne) * 0.2, 0.05)) {
    zle(`czas grawerowania ${czas(rzadkie)} min zamiast piatej czesci z ${czas(pelne)} min`);
  }
  // Przygotowanie materialu obejmuje CALY prostokat, wiec ma zostac bez zmian.
  const przyg = (w) => w.breakdown.find((b) => b.label === "Przygotowanie mat.")?.value;
  if (przyg(rzadkie) !== przyg(pelne)) zle(`pokrycie zjechalo na przygotowanie materialu: ${przyg(pelne)} -> ${przyg(rzadkie)}`);

  const linia = (w) => w.breakdown.find((b) => b.label === "Pokrycie rysunku")?.value;
  if (linia(rzadkie) !== "20%") zle(`rozpiska nie pokazuje zmierzonego pokrycia (jest ${linia(rzadkie)})`);
  if (linia(pelne)) zle("rozpiska pokazuje pokrycie 100%, czyli szum przy kazdej wycenie");
  ok(`rysunek w 20% przejazdu: ${(pelne.unitGrosze / 100).toFixed(2)} -> ${(rzadkie.unitGrosze / 100).toFixed(2)} zl, przygotowanie bez zmian`);
}

// --- 6. Przedzialy z listy zostaja nietkniete -----------------------------
sekcja("6. Wycena bez pliku");
{
  const bezPliku = calcEngrave({ matId: "wood", areaId: "M", detailId: "standard", quantityId: "proto", extended: false, podloze: "own_item" }, "pl");
  if (bezPliku?.type !== "calculated") zle("wycena z przedzialow przestala liczyc");
  if (bezPliku.breakdown.some((b) => b.label === "Pokrycie rysunku")) {
    zle("wycena z przedzialow pokazuje pokrycie, ktorego nie zmierzylismy");
  }
  // Przedzial "M" to 250 cm2 POLA GRAWERU, ktore klient podaje sam, wiec
  // pustki w nim nie ma i pokrycie musi zostac pelne.
  const czas = Number(bezPliku.breakdown.find((b) => b.label === "Czas grawerowania").value.replace(" min", ""));
  if (!blisko(czas, 250 * 0.07 * 1.0, 0.05)) zle(`przedzial M liczy ${czas} min zamiast ${250 * 0.07}`);
  ok("przedzialy z listy liczą się dokladnie tak, jak przed zmiana");
}

// --- 7. Fiber czyta te sama regule ---------------------------------------
sekcja("7. Fiber");
{
  const wspolne = { matId: "stainless", lensId: "150mm", markId: "surface", quantityId: "proto", podloze: "own_item" };
  const pole = { engravAreaCm2: 40, bboxMm: { x: 63, y: 63 }, pathLengthCm: 30, pathCount: 3 };
  const pelne = calcFiber({ ...wspolne, svgData: { ...pole, coverage: 1 } }, "pl");
  const rzadkie = calcFiber({ ...wspolne, svgData: { ...pole, coverage: 0.25 } }, "pl");
  if (pelne?.type !== "calculated" || rzadkie?.type !== "calculated") zle(`fiber nie doszedl do kwoty: ${pelne?.type} / ${rzadkie?.type}`);
  else {
    if (!(rzadkie.unitGrosze < pelne.unitGrosze)) zle("fiber nie taniej przy rzadkim wzorze");
    if (!rzadkie.breakdown.some((b) => b.label === "Pokrycie rysunku")) zle("fiber nie pokazuje pokrycia w rozpisce");
  }
  ok("fiber liczy z tej samej reguly co CO2");
}

// --- 8. Jedno zrodlo reguly ----------------------------------------------
sekcja("8. Regula stoi w jednym pliku");
{
  for (const plik of ["src/pricing/laserCo2.js", "src/pricing/laserFiber.js"]) {
    const tresc = readFileSync(new URL(`../${plik}`, import.meta.url), "utf8");
    if (!tresc.includes('from "./engraveCoverage.js"')) zle(`${plik} nie czyta reguly pokrycia ze wspolnego pliku`);
    if (/coverage\s*\)\s*\?\s*Number/.test(tresc)) zle(`${plik} ma wlasna kopie reguly pokrycia`);
  }
  // Rysunek moze siegac po zewnetrzne zasoby, ktore nie zaladuja sie z adresu
  // `data:`. Milczace pominiecie ich dawaloby zdjecie na caly arkusz policzone
  // jak pusta kartka, wiec pomiar ma sie wtedy PODDAC, a nie zgadnac.
  const cov = readFileSync(new URL("../src/utils/svgCoverage.js", import.meta.url), "utf8");
  if (!cov.includes("image, foreignObject")) zle("pomiar nie odrzuca rysunkow z osadzonym zdjeciem");
  ok("obie maszyny czytaja te sama regule, a niemierzalny plik nie dostaje zgadnietej liczby");
}

console.log(bledy ? `\n${bledy} bledow` : "\nPokrycie rysunku: wszystko sie zgadza");
process.exit(bledy ? 1 : 0);
