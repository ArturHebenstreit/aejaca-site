#!/usr/bin/env node
// ============================================================
// KWOTA WIAZACA WYMAGA PODSTAWY, KTORA DA SIE ZMIERZYC
// ============================================================
// Awaria, ktora ten test zamyka, byla cicha i kosztowna po naszej stronie.
// `/api/price` oddawal kwote WIAZACA za sam przedzial wielkosci: "S" dawalo
// 39,68 zl, a pod spodem silnik zakladal 150 cm3. Przedzial "M" zaklada
// 800 cm3, "L" trzy litry. W potwierdzeniu dla klienta stalo jedno slowo,
// "Jak dlon", i ani jedna z tych liczb. Zobowiazywalismy sie do kwoty za
// przedmiot, ktorego objetosci nikt nie znal.
//
// Nic sie przy tym nie wywalalo. Zamowienie przechodzilo, Autopay pobieral
// pieniadze, a roznica wychodzila dopiero przy realizacji.
//
// Test pilnuje trzech rzeczy:
//   1. sam przedzial NIE jest podstawa do kwoty wiazacej,
//   2. pomiar albo wpisane wymiary NIA sa, i cena z nich naprawde wynika,
//   3. kazdy kalkulator znany serwerowi ma rozstrzygniecie, a nieznany
//      domyslnie go nie dostaje.
//
//   node scripts/test-binding-basis.mjs

import { readFileSync } from "node:fs";
import { bindingBasis, declaredSolid, geometryFromDeclared, BRAK } from "../src/pricing/bindingBasis.js";
import { CALCULATORS, priceItem } from "../chat-api/orders.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

console.log("\n1. Sam przedzial wielkosci nie jest podstawa\n");
{
  const przypadki = [
    ["druk FDM", "print3d_fdm", { sizeId: "S", materialKey: "PLA" }, BRAK.MODEL],
    ["druk MSLA", "print3d_msla", { sizeId: "M" }, BRAK.MODEL],
    ["odlew w kruszcu", "jewelry_casting", { variantId: "model_3d" }, BRAK.MODEL],
    ["grawer CO2", "laser_co2_engrave", { areaId: "M", matId: "wood" }, BRAK.POLE],
    ["ciecie CO2", "laser_co2_cut", { pathId: "M", matId: "plywood_3" }, BRAK.RYSUNEK],
    ["znakowanie fiber", "laser_fiber", { areaId: "S" }, BRAK.POLE],
    ["odlew zywiczny", "epoxy", { volumeId: "S" }, BRAK.OBJETOSC],
  ];
  for (const [nazwa, calculator, params, oczekiwanyBrak] of przypadki) {
    const w = bindingBasis({ calculator, params });
    if (w.binding) zle(`${nazwa}: przedzial dal kwote wiazaca`);
    else if (!w.missing.includes(oczekiwanyBrak)) zle(`${nazwa}: brakuje "${oczekiwanyBrak}", a zglosil ${JSON.stringify(w.missing)}`);
    else ok(`${nazwa}: przedzial daje szacunek, brakuje "${oczekiwanyBrak}"`);
  }
}

console.log("\n2. Pomiar i wpisane wymiary sa podstawa\n");
{
  const zModelu = bindingBasis({ calculator: "print3d_fdm", geometry: { volumeCm3: 12, bbox: { x: 4, y: 2, z: 1.5 } } });
  if (zModelu.binding && zModelu.basis.kind === "model") ok("zmierzony model daje kwote wiazaca");
  else zle(`zmierzony model nie przeszedl: ${JSON.stringify(zModelu)}`);

  const zWymiarow = bindingBasis({ calculator: "print3d_fdm", params: { declaredMm: { x: 40, y: 20, z: 15 } } });
  if (zWymiarow.binding && zWymiarow.basis.kind === "declared_solid") ok("wpisane wymiary daja kwote wiazaca");
  else zle(`wpisane wymiary nie przeszly: ${JSON.stringify(zWymiarow)}`);

  // GORNA GRANICA, nie domysl. Bryla o tych gabarytach nie miesci wiecej.
  const bryla = declaredSolid({ declaredMm: { x: 40, y: 20, z: 15 } });
  if (Math.abs(bryla.volumeCm3 - 12) < 1e-9) ok("wymiary licza sie jak bryla pelna (4 x 2 x 1.5 cm = 12 cm3)");
  else zle(`objetosc z wymiarow wyszla ${bryla.volumeCm3} zamiast 12`);

  const polowa = declaredSolid({ declaredMm: { x: 40, y: 20 } });
  if (polowa === null) ok("dwa wymiary z trzech to nie jest podstawa");
  else zle("dwa wymiary wystarczyly do kwoty wiazacej");

  const zerowy = declaredSolid({ declaredMm: { x: 40, y: 20, z: 0 } });
  if (zerowy === null) ok("wymiar zerowy odrzucony");
  else zle("wymiar zerowy przeszedl jako bryla");

  const pole = bindingBasis({ calculator: "laser_co2_engrave", params: { declaredFieldMm: { w: 60, h: 40 } } });
  if (pole.binding && Math.abs(pole.basis.areaCm2 - 24) < 1e-9) ok("wpisane pole grawerowania 60 x 40 mm daje 24 cm2");
  else zle(`pole z wymiarow nie przeszlo: ${JSON.stringify(pole)}`);

  // Ciecia NIE da sie wyprowadzic z gabarytu: obrys i azur to inna droga noza.
  const ciecie = bindingBasis({ calculator: "laser_co2_cut", params: { declaredFieldMm: { w: 60, h: 40 } } });
  if (!ciecie.binding) ok("ciecie nadal wymaga rysunku, bo gabaryt nie mowi o dlugosci sciezki");
  else zle("ciecie przeszlo na sam gabaryt");

  const zWyceny = bindingBasis({ calculator: "print3d_fdm", params: {}, fromQuote: true });
  if (zWyceny.binding) ok("pozycja z wyceny czlowieka jest podstawa sama w sobie");
  else zle("wycena czlowieka nie przeszla");
}

console.log("\n3. Cena naprawde wynika z wpisanych wymiarow\n");
{
  const wspolne = { segment: "standard", materialKey: "PLA", sizeId: "S", infillId: "medium", colorId: 1, precisionId: "standard_04", quantityId: "proto" };
  const male = priceItem({ calculator: "print3d_fdm", params: { ...wspolne, declaredMm: { x: 40, y: 20, z: 15 } }, lang: "pl" });
  const duze = priceItem({ calculator: "print3d_fdm", params: { ...wspolne, declaredMm: { x: 80, y: 40, z: 30 } }, lang: "pl" });
  // Cena druku nie jest wprost proporcjonalna do objetosci: sporo w niej
  // stoi czas maszyny i przygotowanie. Wymagamy wiec tego, co naprawde musi
  // zachodzic: wpisany wymiar zmienia kwote i wieksza bryla nigdy nie jest
  // tansza. Bez tego wymiary bylyby ozdoba formularza.
  if (duze.unitGrosze > male.unitGrosze) {
    ok(`bryla osiem razy wieksza kosztuje wiecej (${(male.unitGrosze / 100).toFixed(2)} zl wobec ${(duze.unitGrosze / 100).toFixed(2)} zl)`);
  } else {
    zle(`wpisane wymiary nie ruszyly ceny: ${male.unitGrosze} wobec ${duze.unitGrosze}`);
  }
  const bezWymiarow = priceItem({ calculator: "print3d_fdm", params: { ...wspolne }, lang: "pl" });
  if (bezWymiarow.unitGrosze !== male.unitGrosze) ok("kwota z wymiarow rozni sie od kwoty z samego przedzialu");
  else zle("wymiary nie zmienily nic wobec przedzialu, wiec nie doszly do silnika");
  const geo = geometryFromDeclared({ declaredMm: { x: 40, y: 20, z: 15 } });
  if (geo?.declared === true) ok("geometria z wymiarow jest oznaczona jako wpisana, nie zmierzona");
  else zle("geometria z wymiarow udaje pomiar");
}

console.log("\n4. Kazdy kalkulator ma rozstrzygniecie\n");
{
  for (const klucz of Object.keys(CALCULATORS)) {
    const w = bindingBasis({ calculator: klucz, params: {} });
    if (typeof w.binding !== "boolean") zle(`${klucz}: brak rozstrzygniecia`);
    else if (!w.binding && w.missing.length === 0) zle(`${klucz}: odmowa bez powodu`);
  }
  if (!bledy) ok(`${Object.keys(CALCULATORS).length} kalkulatorow ma rozstrzygniecie i powod`);

  const nieznany = bindingBasis({ calculator: "cos_czego_jeszcze_nie_ma" });
  if (!nieznany.binding) ok("nieznany kalkulator NIE dostaje kwoty wiazacej z automatu");
  else zle("nieznany kalkulator dostal kwote wiazaca");
}

console.log("\n5. Serwer odmawia przyjecia zamowienia bez podstawy\n");
{
  const SERWER = readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
  if (/code: "no_binding_basis"/.test(SERWER)) ok("kasa zna odmowe `no_binding_basis`");
  else zle("kasa nie odmawia pozycji bez podstawy");

  // Kolejnosc ma znaczenie: sprawdzenie musi stac PRZED zapisem zamowienia,
  // inaczej odmowa przychodzi po utworzeniu wiersza.
  // Szukamy WEWNATRZ obslugi skladania zamowienia. `order_items` wstawia tez
  // doplata za poprawke, wczesniej w pliku, wiec porownanie na calym pliku
  // mierzylo dwie rozne rzeczy i wychodzilo czerwone bez powodu.
  const kasa = SERWER.slice(SERWER.indexOf('app.post("/api/orders", '));
  const iSprawdzenie = kasa.indexOf("no_binding_basis");
  const iZapis = kasa.indexOf("INSERT INTO order_items");
  if (iSprawdzenie > 0 && iSprawdzenie < iZapis) ok("odmowa stoi przed zapisem pozycji zamowienia");
  else zle("odmowa stoi po zapisie zamowienia albo jej nie ma");

  if (/binding: podstawa\.binding/.test(SERWER)) ok("wycena oddaje przegladarce, czy kwota jest wiazaca");
  else zle("wycena nie mowi przegladarce, czy kwota jest wiazaca");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nPodstawa kwoty wiazacej: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
