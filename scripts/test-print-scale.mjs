#!/usr/bin/env node
// ============================================================
// WIELKOSC WYDRUKU A POLE ROBOCZE MASZYNY
// ============================================================
// Po wgraniu pliku cena liczy sie z JEGO wymiarow, a nie z listy rozmiarow.
// Klient moze te wielkosc zmienic, ale tylko w granicach, w ktorych wydruk
// jeszcze miesci sie na stole. Bez tej granicy suwak obiecywalby kwote wiazaca
// za rzecz, ktorej nie da sie wykonac, a odkrylibysmy to przy realizacji,
// czyli juz po zaplacie.
//
// Granica ma byc policzona RAZ i obowiazywac po obu stronach. Przegladarka
// pilnuje suwaka, serwer pilnuje kwoty. Gdyby liczyly ja osobno, wystarczylby
// jeden inny wzor, zeby klient wybral skale, ktorej wycena nie przyjmie.
//
//   node scripts/test-print-scale.mjs

import {
  MSLA_BUILD_VOL_CM, BUILD_VOL_CM, PRINTER_BUILD_VOL_CM,
  maxScaleForBuildVolume, maxScaleForBBox, fitsBuildVolume,
} from "../src/pricing/print3d.js";
import { priceItem } from "../chat-api/orders.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);
const blisko = (a, b) => Math.abs(a - b) < 0.005;

// ------------------------------------------------------------
// 1. Granica skali
// ------------------------------------------------------------
console.log("\n1. Granica skali");

// Szescian 1 cm na drukarce zywicznej 21.8 x 12.3 x 25.0: ogranicza go
// najkrotszy bok stolu, czyli 12.3.
const szescian = { x: 1, y: 1, z: 1 };
if (blisko(maxScaleForBuildVolume(szescian, MSLA_BUILD_VOL_CM), 12.3)) {
  ok("szescian 1 cm skaluje sie do najkrotszego boku stolu");
} else {
  zle(`szescian 1 cm: granica ${maxScaleForBuildVolume(szescian, MSLA_BUILD_VOL_CM)}, ma byc 12.3`);
}

// WYMIARY POROWNUJEMY POSORTOWANE, bo czesc ustawiamy na stole tak, jak nam
// wygodnie. Slupek 24 x 2 x 2 cm nie miesci sie wzdluz osi X drukarki
// zywicznej (21.8), ale postawiony pionowo miesci sie w 25.0.
const slupek = { x: 24, y: 2, z: 2 };
const granicaSlupka = maxScaleForBuildVolume(slupek, MSLA_BUILD_VOL_CM);
if (granicaSlupka >= 1) ok("slupek dluzszy niz stol, ale krotszy niz jego wysokosc, miesci sie po obroceniu");
else zle(`slupek 24 cm odrzucony, granica ${granicaSlupka}: porownanie nie sortuje wymiarow`);

// Model wiekszy od stolu w kazdym ustawieniu ma granice ponizej jedynki, i to
// jest sygnal dla interfejsu, ze oryginalu nie wydrukujemy w calosci.
const kloc = { x: 40, y: 40, z: 40 };
if (maxScaleForBBox(kloc, "print3d_msla") < 1) ok("model wiekszy od stolu ma granice ponizej oryginalu");
else zle("model 40 cm miesci sie na stole 21.8 cm, cos jest nie tak z granica");

if (maxScaleForBBox(szescian, "print3d_fdm") > maxScaleForBBox(szescian, "print3d_msla")) {
  ok("drukarka FDM ma wieksze pole robocze niz zywiczna");
} else {
  zle("pola robocze obu maszyn sie pomylily");
}

// Nieznana maszyna nie moze zablokowac wyceny: brak granicy znaczy brak
// ograniczenia, a nie odmowa.
if (maxScaleForBBox(szescian, "laser_co2") === null && fitsBuildVolume(szescian, "laser_co2", 99)) {
  ok("usluga bez pola roboczego nie jest ograniczana skala");
} else {
  zle("usluga bez pola roboczego zachowuje sie jak drukarka");
}

// ------------------------------------------------------------
// 2. Obie maszyny maja swoje pole
// ------------------------------------------------------------
console.log("\n2. Pola robocze");
for (const [kalkulator, pole] of [["print3d_msla", MSLA_BUILD_VOL_CM], ["print3d_fdm", BUILD_VOL_CM]]) {
  if (PRINTER_BUILD_VOL_CM[kalkulator] === pole) ok(`${kalkulator} ma przypisane wlasne pole robocze`);
  else zle(`${kalkulator} nie ma pola roboczego albo ma cudze`);
}

// ------------------------------------------------------------
// 3. Serwer odmawia kwoty wiazacej za model ponad pole robocze
// ------------------------------------------------------------
// To jest ta polowa reguly, ktora naprawde chroni: suwak w przegladarce jest
// o jedno zapytanie od podmiany, a kwote wiazaca wystawia serwer.
console.log("\n3. Odmowa po stronie serwera");

const geometria = {
  volumeCm3: 12,
  bbox: { x: 5, y: 4, z: 3 },
  surfaceAreaCm2: 60,
  triangleCount: 1000,
  sha256: "test",
};
const parametry = { applicationId: "prototype", resinKey: "standard", layerId: "standard", quantityId: "proto" };

const wycen = (scale) => {
  try {
    priceItem({ calculator: "print3d_msla", params: parametry, lang: "pl", geometry: geometria, scale });
    return null;
  } catch (e) {
    return e.code || "blad";
  }
};

const granica = maxScaleForBBox(geometria.bbox, "print3d_msla");
if (wycen(1) === null) ok("oryginalna wielkosc wycenia sie normalnie");
else zle(`oryginalna wielkosc odrzucona kodem ${wycen(1)}`);

if (wycen(Math.floor(granica * 100) / 100) === null) ok(`skala dokladnie na granicy (${Math.floor(granica * 100)}%) przechodzi`);
else zle("skala na granicy pola roboczego jest odrzucana, granica gryzie za wczesnie");

const ponad = wycen(granica + 0.5);
if (ponad === "too_large_for_printer") ok("skala ponad pole robocze jest odrzucana z wlasnym kodem bledu");
else zle(`skala ponad pole robocze dala ${ponad}, a ma dac too_large_for_printer`);

console.log(bledy ? `\n${bledy} bledow\n` : "\nWielkosc wydruku: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
