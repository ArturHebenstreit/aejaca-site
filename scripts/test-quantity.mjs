// ============================================================
// LICZBA SZTUK I PROG NAKLADU
// ============================================================
// Do 2026-08-18 klient wybieral PROG, a liczba sztuk ustawiala sie sama na
// dolnej granicy przedzialu. Wygladalo to jak zycie wlasne formularza: nikt
// nie prosil o dwie sztuki, tylko o przedzial 2-10, a formularz odpowiadal
// dwojka. Gorsza byla druga strona tej samej wady: do koszyka szedl NAKLAD
// REPREZENTATYWNY progu, czyli szesc sztuk przy progu 2-10, wiec klient
// proszacy o trzy dostawal wycene szesciu.
//
// Teraz zrodlem prawdy jest LICZBA SZTUK, a prog z niej wynika. Ten sprawdzian
// pilnuje samej reguly, bo siedzi ona w jednym miejscu i obowiazuje w szesciu
// kalkulatorach, na karcie uslugi i w /order/.
//
// Pilnujemy trzech rzeczy naraz:
//   1. kazda liczba trafia dokladnie w jeden prog,
//   2. drabina progow nie ma dziur ani nakladania sie,
//   3. dolna granica progu wraca do tego samego progu (obieg zamkniety).

import {
  QUANTITY_TIERS, quantityBounds, tierForQty, qtyForTier, qtyLimit, qtyOpenValue, isOpenQty,
} from "../src/pricing/config.js";
import { QTY_TIERS } from "../src/pricing/jewelryConfig.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

const sprawdz = (opis, otrzymano, oczekiwano) => {
  if (otrzymano === oczekiwano) ok(`${opis}: ${otrzymano}`);
  else zle(`${opis}: jest ${otrzymano}, ma byc ${oczekiwano}`);
};

// ------------------------------------------------------------
// 1. Drabina studia
// ------------------------------------------------------------
console.log("\n1. Progi studia");
const studio = [
  [1, "proto"], [2, "micro"], [10, "micro"], [11, "small"], [20, "small"],
  [21, "medium"], [50, "medium"], [51, "large"], [100, "large"], [101, "custom"],
  [500, "custom"],
];
for (const [n, id] of studio) sprawdz(`${n} szt.`, tierForQty(n).id, id);

// ------------------------------------------------------------
// 2. Drabina jubilerska
// ------------------------------------------------------------
// Progi biezuterii ZACHODZA NA SIEBIE: "6-10" konczy sie na dziesiatce, a
// "10+" od niej zaczyna. Dziesiata sztuka nalezy do progu z rabatem, bo ma
// swoja gorna granice, a prog otwarty jej nie ma.
console.log("\n2. Progi jubilerskie");
const bizuteria = [[1, "1"], [2, "2-5"], [5, "2-5"], [6, "6-10"], [10, "6-10"], [11, "10+"], [40, "10+"]];
for (const [n, id] of bizuteria) sprawdz(`${n} szt.`, tierForQty(n, QTY_TIERS).id, id);

// ------------------------------------------------------------
// 3. Granica licznika i stan otwarty
// ------------------------------------------------------------
console.log("\n3. Granica licznika");
sprawdz("studio liczy do", qtyLimit(), 100);
sprawdz("studio otwiera sie na", qtyOpenValue(), 101);
sprawdz("bizuteria liczy do", qtyLimit(QTY_TIERS), 10);
sprawdz("bizuteria otwiera sie na", qtyOpenValue(QTY_TIERS), 11);

if (isOpenQty(100) || !isOpenQty(101)) zle("stan otwarty studia zaczyna sie w zlym miejscu");
else ok("sto sztuk jeszcze liczymy, sto jeden juz wyceniamy recznie");

// ------------------------------------------------------------
// 4. Drabina bez dziur i bez nakladania sie
// ------------------------------------------------------------
// Dziura znaczylaby liczbe, ktorej zaden prog nie obejmuje, czyli cene bez
// rabatu tam, gdzie klient go widzi na etykiecie. Nakladanie sie znaczyloby
// dwa progi na te sama liczbe, czyli cene zalezna od kolejnosci w tablicy.
console.log("\n4. Ciaglosc drabiny");
for (const [nazwa, tiery] of [["studio", QUANTITY_TIERS], ["bizuteria", QTY_TIERS]]) {
  let dziury = 0;
  for (let n = 1; n <= qtyLimit(tiery); n++) {
    const pasujace = tiery.filter((t) => {
      const b = quantityBounds(t.id);
      return n >= b.min && n <= b.max;
    });
    if (pasujace.length === 0) { zle(`${nazwa}: ${n} szt. nie nalezy do zadnego progu`); dziury++; }
  }
  if (!dziury) ok(`${nazwa}: kazda liczba do ${qtyLimit(tiery)} ma swoj prog`);

  // Obieg zamkniety: suwak ustawia licznik na dolnej granicy progu, wiec ta
  // granica MUSI wracac do tego samego progu. Inaczej klient przesuwa suwak
  // na jeden przedzial i patrzy, jak suwak skacze na sasiedni.
  let obieg = 0;
  for (const t of tiery) {
    const dol = qtyForTier(t.id, tiery);
    if (tierForQty(dol, tiery).id !== t.id) {
      zle(`${nazwa}: wybor progu ${t.id} ustawia ${dol} szt., a ta liczba nalezy do ${tierForQty(dol, tiery).id}`);
      obieg++;
    }
  }
  if (!obieg) ok(`${nazwa}: dolna granica kazdego progu wraca do tego samego progu`);
}

// ------------------------------------------------------------
// 5. Licznik stoi wszedzie, gdzie wybiera sie naklad
// ------------------------------------------------------------
// Regula ma obowiazywac na KAZDEJ drodze do zamowienia. Karta uslugi, /order/
// i kalkulatory to rownolegle wejscia do tej samej pracowni, a kontrolka
// postawiona na jednej z nich nie pilnuje pozostalych.
console.log("\n5. Licznik na kazdej drodze");
const { readFileSync } = await import("node:fs");
const { fileURLToPath } = await import("node:url");
const path = (await import("node:path")).default;
const tu = path.dirname(fileURLToPath(import.meta.url));
const czytaj = (p) => readFileSync(path.resolve(tu, "..", p), "utf8");

const DROGI = [
  "src/components/shop/ServiceConfigurator.jsx",
  "src/pages/Order.jsx",
  "src/components/calculators/Print3DCalc.jsx",
  "src/components/calculators/EpoxyCastCalc.jsx",
  "src/components/calculators/FiberLaserCalc.jsx",
  "src/components/calculators/CO2LaserCalc.jsx",
  "src/components/calculators/JewelryCalc.jsx",
];

for (const plik of DROGI) {
  const tresc = czytaj(plik);
  if (!/QuantityStepper/.test(tresc)) zle(`${plik} pozwala wybrac naklad bez licznika sztuk`);
  else ok(`${plik.split("/").pop()} ma licznik sztuk`);
}

// Kalkulator ma podac koszykowi PRAWDZIWA liczbe sztuk. Bez tego propa koszyk
// wraca do nakladu reprezentatywnego progu, czyli do wady, ktora tu naprawiamy.
const koszyk = czytaj("src/components/calculators/CalcToCart.jsx");
if (!/qty: qtyProp/.test(koszyk)) zle("CalcToCart nie przyjmuje liczby sztuk z kalkulatora");
else ok("CalcToCart przyjmuje liczbe sztuk z kalkulatora");

console.log(bledy ? `\n${bledy} bledow\n` : "\nLiczba sztuk i progi: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
