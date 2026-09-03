#!/usr/bin/env node
// ============================================================
// CENNIK GRAWERU: prog, polowa ceny i doplata od sztuki
// ============================================================
// Polecenie wlasciciela, 2026-09-03: powyzej 400 zl ceny sztuki inicjaly
// wchodza w cene, a grafika i dluzszy tekst kosztuja polowe; ponizej progu
// jest to 50 i 100 zl.
//
// Trzy rzeczy, ktore ten sprawdzian trzyma na miejscu, bo kazda juz raz
// wyszla albo mogla wyjsc krzywo:
//
// 1. KWOTY SA CENAMI DLA KLIENTA. Do 2026-09-03 tabela graweru wchodzila do
//    `workCost` i dostawala czterdziestoprocentowa marze warsztatowa, wiec
//    wpis 80 konczyl sie 112 zlotymi. Test mierzy ROZNICE dwoch wycen i zada,
//    zeby wyniosla dokladnie tyle, ile mowi cennik.
//
// 2. PROG MIERZY SIE OD PELNEJ CENY SZTUKI. Przy odlewie `calcNew` nie zna
//    przygotowania wzorca ani wykonczenia, a to razem od 120 do 280 zlotych.
//    Przypadek testowy stoi tuz nad progiem wlasnie po to: jego wycena
//    z `calcNew` jest ponizej 400, a cena, ktora placi klient, powyzej.
//
// 3. STARY WYBOR MA NASTEPCE. Wariant `both` ("obie strony") wypadl z listy,
//    bo dwie strony to pojecie opakowania. Kosz zapisany przed zmiana nie moze
//    po cichu stracic platnego dodatku.
//
// Uruchamiany w `npm run build`.

import { ENGRAVING_OPTIONS, ENGRAVING_FREE_ABOVE_PLN, engravingPricePLN, normalizeEngravingId } from "../src/pricing/jewelryConfig.js";
import { calcNew } from "../src/pricing/jewelry.js";
import { calculate as odlew } from "../src/pricing/preciousMetalCasting.js";
import { getServiceCard } from "../src/data/serviceCatalog.js";
import { CONFIG } from "../src/pricing/config.js";

let bledy = 0;
const ok = (warunek, opis, got) => {
  if (warunek) console.log("  ok  " + opis);
  else { console.log("  ZLE " + opis + "  ->  " + JSON.stringify(got)); bledy += 1; }
};

console.log("1. Tabela cen");
ok(ENGRAVING_OPTIONS.length === 3, "trzy warianty, `both` wypadl", ENGRAVING_OPTIONS.map(o => o.id));
ok(!ENGRAVING_OPTIONS.some(o => o.id === "both"), "nie ma graweru dwoch stron");
ok(ENGRAVING_FREE_ABOVE_PLN === 400, "prog 400 zl");

console.log("2. Cennik ponizej progu");
ok(engravingPricePLN("text", 399) === 50, "inicjaly 50 zl", engravingPricePLN("text", 399));
ok(engravingPricePLN("pattern", 399) === 100, "grafika 100 zl", engravingPricePLN("pattern", 399));
ok(engravingPricePLN("text", 400) === 50, "rowno 400 to jeszcze nie 'przekracza'", engravingPricePLN("text", 400));
ok(engravingPricePLN("none", 900) === 0, "brak graweru nic nie kosztuje");

console.log("3. Cennik powyzej progu");
ok(engravingPricePLN("text", 401) === 0, "inicjaly w cenie", engravingPricePLN("text", 401));
ok(engravingPricePLN("pattern", 401) === 50, "grafika za polowe", engravingPricePLN("pattern", 401));

console.log("4. Stary wybor ma nastepce");
ok(normalizeEngravingId("both") === "pattern", "`both` czyta sie jako grafika");
ok(engravingPricePLN("both", 399) === 100, "stary kosz placi cene grafiki", engravingPricePLN("both", 399));
ok(normalizeEngravingId(undefined) === "none", "brak wartosci to brak graweru");

console.log("5. Grawer nie dostaje marzy warsztatowej");
const bez = calcNew({ lineId: "woman", typeId: "ring", metalId: "silver", weightId: "standard",
  methodId: "cast", platingId: "none", stoneRows: [], qtyId: "1", qty: 1,
  engravingId: "none", clientSuppliesMetal: false }, "pl", null);
const zTekstem = calcNew({ lineId: "woman", typeId: "ring", metalId: "silver", weightId: "standard",
  methodId: "cast", platingId: "none", stoneRows: [], qtyId: "1", qty: 1,
  engravingId: "text", clientSuppliesMetal: false }, "pl", null);
const cenaBez = bez.unitGrosze / 100;
const roznica = (zTekstem.unitGrosze - bez.unitGrosze) / 100;
console.log(`     cena sztuki bez graweru: ${cenaBez} zl`);
const oczekiwana = cenaBez > 400 ? 0 : 50;
ok(roznica === oczekiwana, `doplata ${oczekiwana} zl, co do zlotowki (bez marzy)`, roznica);
ok(zTekstem.engravingPLN === oczekiwana, "silnik raportuje doplate", zTekstem.engravingPLN);

console.log("6. Doplata liczy sie od sztuki");
const piec = calcNew({ lineId: "woman", typeId: "ring", metalId: "silver", weightId: "standard",
  methodId: "cast", platingId: "none", stoneRows: [], qtyId: "2-5", qty: 5,
  engravingId: "pattern", clientSuppliesMetal: false }, "pl", null);
const piecBez = calcNew({ lineId: "woman", typeId: "ring", metalId: "silver", weightId: "standard",
  methodId: "cast", platingId: "none", stoneRows: [], qtyId: "2-5", qty: 5,
  engravingId: "none", clientSuppliesMetal: false }, "pl", null);
const roznicaCalosci = piec.totalPLN.min - piecBez.totalPLN.min;
ok(roznicaCalosci === piec.engravingPLN * 5, "piec sztuk to piec doplat", { roznicaCalosci, jedna: piec.engravingPLN });

console.log("7. Odlew: prog liczy sie od PELNEJ ceny sztuki");
const odlewParams = (engravingId) => ({
  variantId: "model_3d", materialSourceId: "aejaca", metalId: "silver",
  finishId: "polished", platingId: "none", engravingId, qtyId: "1", qty: 1,
  stlData: { volumeCm3: 0.40, bbox: { x: 2.0, y: 2.0, z: 0.5 } },
});
const oBez = odlew(odlewParams("none"), "pl", null);
const oTekst = odlew(odlewParams("text"), "pl", null);
const cenaOdlewu = oBez.unitGrosze / 100;
// calcNew bez doplat odlewu, czyli kwota, wobec ktorej prog byl mierzony przed poprawka
const surowa = cenaOdlewu - 120 - 15000 / 100;
console.log(`     cena sztuki odlewu: ${cenaOdlewu} zl (z tego calcNew: ${surowa.toFixed(2)} zl)`);
ok(cenaOdlewu > 400, "przypadek testowy jest powyzej progu", cenaOdlewu);
ok(surowa <= 400, "a sama wycena calcNew jest ponizej: to byl blad przed poprawka", surowa);
ok(oTekst.engravingPLN === 0, "inicjaly w cenie, bo liczymy od pelnej ceny odlewu", oTekst.engravingPLN);
ok(oTekst.unitGrosze === oBez.unitGrosze, "cena sztuki bez zmiany", (oTekst.unitGrosze - oBez.unitGrosze) / 100);

const oGrafika = odlew(odlewParams("pattern"), "pl", null);
ok(oGrafika.engravingPLN === 50, "grafika za polowe", oGrafika.engravingPLN);
ok((oGrafika.unitGrosze - oBez.unitGrosze) / 100 === 50, "i tyle dokladnie dochodzi do ceny",
   (oGrafika.unitGrosze - oBez.unitGrosze) / 100);

// Grawer poza wykonczeniem jubilerskim nie istnieje
const oSurowy = odlew({ ...odlewParams("pattern"), finishId: "clean" }, "pl", null);
ok(!oSurowy.engravingPLN, "na nieopolerowanym odlewie graweru nie ma", oSurowy.engravingPLN);

console.log("8. Karta uslugi mowi to samo, co cennik");
// Opis uslugi i tabela danych podaja kwoty graweru trzeci i czwarty raz.
// Przepisane recznie rozjechalyby sie przy pierwszej zmianie cennika, a klient
// przeczytalby na jednej stronie dwie ceny tego samego graweru.
const karta = getServiceCard("precious_metal_casting");
const wEuro = (pln) => Math.round(pln / CONFIG.EUR_PLN_RATE);
const inicjaly = ENGRAVING_OPTIONS.find((o) => o.id === "text").pricePLN;
const grafika = ENGRAVING_OPTIONS.find((o) => o.id === "pattern").pricePLN;
const wiersz = karta.specs.find((w) => w.label.pl === "Grawer");
ok(karta.description.pl.includes(`za ${inicjaly} zł`), "opis pl niesie cene inicjalow z cennika");
ok(karta.description.pl.includes(`Powyżej ${ENGRAVING_FREE_ABOVE_PLN} zł`), "opis pl niesie prog z cennika");
ok(karta.description.de.includes(`${wEuro(grafika)} EUR`), "opis de niesie cene grafiki w euro");
ok(wiersz.value.pl.includes(`${inicjaly} zł`) && wiersz.value.pl.includes(`${grafika} zł`),
   "tabela danych niesie obie kwoty", wiersz.value.pl);
// Prog na jednym ekranie ma byc jedna liczba, a nie zlotowka obok euro.
ok(!karta.description.de.includes("400 PLN") && !wiersz.value.de.includes("400 PLN"),
   "de nie miesza zlotowek z euro przy progu");
ok(!karta.description.pl.includes("oba naraz") && !wiersz.value.pl.includes("oba"),
   "nigdzie nie obiecujemy juz graweru dwoch stron");

console.log(bledy ? `\nBLEDY: ${bledy}` : "\nWszystko sie zgadza");
process.exit(bledy ? 1 : 0);
