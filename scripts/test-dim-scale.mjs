// ============================================================
// SKALA W OSOBNYCH OSIACH: czy liczby mowia to, co pokazujemy
// ============================================================
// Skala nierownomierna psuje sie po cichu na cztery sposoby i za kazdym razem
// kwota oraz podglad wygladaja poprawnie:
//
//   - objetosc liczona jak `s^3` zamiast `sx*sy*sz`, wiec splaszczony model
//     kosztuje tyle, co szescian,
//   - pole robocze sprawdzane os w os, wiec odrzucamy wydruk, ktory po
//     obroceniu wchodzi,
//   - "dopasuj do pola" przycinajace kazda os osobno, czyli cofajace klientowi
//     jego wlasne zniekształcenie,
//   - powrot do synchronizacji liczony jako srednia z osi, ktory zmienia
//     wielkosc wyrobu bez pytania.

import {
  uniformScale, isUniform, setAxis, dimsFor, scaleForDim, volumeFactor,
  fitsBox, maxUniformFor, shrinkToBox, resyncScale, serializeScale, parseScale,
  AXES_2D,
} from "../src/utils/dimScale.js";
import { maxScaleForBuildVolume, BUILD_VOL_CM } from "../src/pricing/print3d.js";
import { priceItem } from "../chat-api/orders.js";
import { readFileSync } from "node:fs";

let bledy = 0;
const zle = (m) => { console.error(`  BLAD: ${m}`); bledy++; };
const ok = (m) => console.log(`  OK ${m}`);
const sekcja = (n) => console.log(`\n${n}`);
const blisko = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

const BBOX = { x: 4, y: 6, z: 10 };            // cm
const POLE = BUILD_VOL_CM;                      // 30 x 32 x 32.5 cm

// --- 1. Synchronizacja ciagnie osie, brak synchronizacji nie ---------------
sekcja("1. Przelacznik synchronizacji");
{
  const zsync = setAxis(uniformScale(1), "x", 2, true);
  if (!isUniform(zsync) || !blisko(zsync.z, 2)) zle(`synchronizacja nie pociagnela pozostalych osi: ${JSON.stringify(zsync)}`);
  const bez = setAxis(uniformScale(1), "x", 2, false);
  if (!blisko(bez.x, 2) || !blisko(bez.y, 1) || !blisko(bez.z, 1)) {
    zle(`bez synchronizacji ruszyla wiecej niz jedna os: ${JSON.stringify(bez)}`);
  }
  if (isUniform(bez)) zle("skala rozjechana raportuje sie jako rownomierna");
  ok("jeden suwak ciagnie pozostale tylko przy wlaczonej synchronizacji");
}

// --- 2. Objetosc rosnie iloczynem osi -------------------------------------
sekcja("2. Objetosc");
{
  if (!blisko(volumeFactor(uniformScale(2)), 8)) zle("skala rownomierna 2 nie daje osmiokrotnej objetosci");
  const splaszczony = { x: 2, y: 2, z: 0.5 };
  if (!blisko(volumeFactor(splaszczony), 2)) {
    zle(`splaszczony model liczy objetosc ${volumeFactor(splaszczony)}, a ma 2`);
  }
  // Kontrola sensu: gdyby ktos liczyl `s^3` z osi X, wyszloby 8, czyli
  // czterokrotnie za duzo. Ta roznica to cala cena filamentu.
  if (blisko(volumeFactor(splaszczony), 8)) zle("objetosc liczy sie szescianem jednej osi");
  ok(`splaszczony model (x2, y2, z0.5) zuzywa dwa razy wiecej materialu, nie osiem`);
}

// --- 3. Pole robocze uwzglednia obrot -------------------------------------
sekcja("3. Pole robocze");
{
  // Model dluzszy niz stol w osi Y, ale krotszy niz stol w osi Z: po obroceniu
  // wchodzi. Porownanie os w os by go odrzucilo.
  const dlugi = { x: 2, y: 32.4, z: 2 };
  if (!fitsBox(dlugi, uniformScale(1), POLE)) {
    zle("model, ktory wchodzi po obroceniu, zostal odrzucony");
  }
  const zaDuzy = { x: 40, y: 40, z: 40 };
  if (fitsBox(zaDuzy, uniformScale(1), POLE)) zle("model wiekszy od stolu w kazdej osi przeszedl kontrole");
  // Rozjechana skala tez musi byc sprawdzana, a nie tylko rownomierna.
  if (fitsBox(BBOX, { x: 1, y: 1, z: 4 }, POLE)) {
    zle("wyciagniety model przekracza stol w osi Z, a przeszedl kontrole");
  }
  ok("kontrola pola roboczego dopuszcza obrot i lapie rozjechana skale");

  // Ta sama odpowiedz co w cenniku druku, zeby suwak i wycena nie klocily sie
  // o te sama maszyne.
  const zNaszego = maxUniformFor(BBOX, POLE);
  const zCennika = maxScaleForBuildVolume(BBOX, POLE);
  if (!blisko(zNaszego, zCennika, 1e-9)) {
    zle(`suwak liczy maksymalna skale ${zNaszego}, a cennik ${zCennika}`);
  }
  ok(`maksymalna skala rownomierna zgodna z cennikiem druku (${zNaszego.toFixed(3)})`);
}

// --- 4. Dopasowanie do pola zachowuje proporcje ---------------------------
sekcja("4. Dopasuj do pola");
{
  const rozjechana = { x: 8, y: 1, z: 1 };      // 32 x 6 x 10 cm, za szeroki
  const po = shrinkToBox(BBOX, rozjechana, POLE);
  if (!fitsBox(BBOX, po, POLE)) zle(`po dopasowaniu dalej nie wchodzi: ${JSON.stringify(dimsFor(BBOX, po))}`);
  // Proporcje musza zostac: klient splaszczyl model swiadomie.
  const przed = rozjechana.x / rozjechana.z;
  const potem = po.x / po.z;
  if (!blisko(przed, potem, 1e-6)) {
    zle(`dopasowanie zmienilo proporcje z ${przed.toFixed(3)} na ${potem.toFixed(3)}, czyli cofnelo decyzje klienta`);
  }
  if (shrinkToBox(BBOX, uniformScale(1), POLE) !== undefined && !fitsBox(BBOX, uniformScale(1), POLE)) {
    zle("model, ktory sie miesci, zostal mimo to zmniejszony");
  }
  ok(`dopasowanie sciaga do pola i trzyma proporcje (${Object.values(dimsFor(BBOX, po)).map((d) => d.toFixed(1)).join(" x ")} cm)`);
}

// --- 5. Powrot do synchronizacji nie zmienia wielkosci po cichu -----------
sekcja("5. Powrot do proporcji");
{
  const zapamietana = uniformScale(1.5);
  const rozjechana = { x: 1.5, y: 3.0, z: 0.4 };
  const wrocona = resyncScale(zapamietana, rozjechana);
  if (!isUniform(wrocona) || !blisko(wrocona.x, 1.5)) {
    zle(`powrot dal ${JSON.stringify(wrocona)}, a ma wrocic do skali sprzed rozjechania`);
  }
  // Srednia z osi dalaby 1.63 i cicho zmienila wielkosc wyrobu.
  const srednia = (1.5 + 3.0 + 0.4) / 3;
  if (blisko(wrocona.x, srednia, 1e-3)) zle("powrot liczy srednia z osi zamiast wracac do zapamietanej skali");
  ok("powrot wraca do skali sprzed rozjechania, a nie do sredniej");
}

// --- 6. Zapis skali nie psuje starych zamowien ----------------------------
sekcja("6. Zapis dla serwera");
{
  // Skala rownomierna MUSI jechac jako liczba: kwote wiazaca liczy serwer,
  // a w bazie leza pozycje sprzed tej zmiany.
  const rowna = serializeScale(uniformScale(2));
  if (typeof rowna !== "number" || !blisko(rowna, 2)) {
    zle(`skala rownomierna zapisala sie jako ${JSON.stringify(rowna)}, a stary odczyt oczekuje liczby`);
  }
  const rozjechana = serializeScale({ x: 2, y: 1, z: 0.5 });
  if (typeof rozjechana !== "object") zle("skala rozjechana splaszczyla sie do liczby, czyli zniekształcenie zniknelo z umowy");
  // Droga w obie strony musi byc bezstratna.
  const tam = { x: 2, y: 1, z: 0.5 };
  const zPowrotem = parseScale(serializeScale(tam));
  for (const a of ["x", "y", "z"]) {
    if (!blisko(zPowrotem[a], tam[a])) zle(`os ${a} zgubila sie w zapisie: ${zPowrotem[a]} zamiast ${tam[a]}`);
  }
  if (!blisko(parseScale(3).z, 3)) zle("stara skala liczbowa nie czyta sie jako rownomierna");
  ok("skala rownomierna jedzie liczba, rozjechana obiektem, w obie strony bez straty");
}

// --- 7. Rysunek wektorowy ma dwie osie, nie trzy --------------------------
sekcja("7. Rysunek wektorowy");
{
  const plaska = uniformScale(1, AXES_2D);
  if ("z" in plaska) zle("skala rysunku dostala os Z, ktorej rysunek nie ma");
  const po = setAxis(plaska, "y", 2, false);
  if (!blisko(volumeFactor(po), 2)) zle(`pole rysunku po rozciagnieciu w Y ma rosnac dwukrotnie, a rosnie ${volumeFactor(po)}`);
  const wymiary = dimsFor({ x: 10, y: 5 }, po);
  if (!blisko(wymiary.x, 10) || !blisko(wymiary.y, 10)) {
    zle(`wymiary rysunku po rozciagnieciu: ${JSON.stringify(wymiary)}`);
  }
  if (!blisko(scaleForDim({ x: 10, y: 5 }, "y", 20), 4)) zle("przeliczenie wymiaru docelowego na skale nie zgadza sie");
  ok("rysunek pracuje na dwoch osiach, pole rosnie iloczynem");
}

// --- 8. Kwota wiazaca liczy z tej samej skali ------------------------------
sekcja("8. Serwer");
{
  // Bryla splaszczona w Z musi kosztowac mniej niz szescienna, i to po
  // stronie serwera, bo to on wystawia kwote wiazaca.
  const geometria = { volumeCm3: 20, surfaceAreaCm2: 60, bbox: { x: 4, y: 4, z: 4 }, triangleCount: 100 };
  const wspolne = { calculator: "print3d_fdm", lang: "pl", geometry: geometria,
    params: { segment: "standard", materialKey: "PLA", infillId: "medium", colorId: 1, precisionId: "standard_04", quantityId: "proto" } };
  const rowna = priceItem({ ...wspolne, scale: 2 }).unitGrosze;
  const splaszczona = priceItem({ ...wspolne, scale: { x: 2, y: 2, z: 0.5 } }).unitGrosze;
  if (!(splaszczona < rowna)) {
    zle(`splaszczony model kosztuje ${(splaszczona / 100).toFixed(2)}, a szescienny ${(rowna / 100).toFixed(2)}: serwer nie widzi osi`);
  } else {
    ok(`serwer liczy osie osobno (splaszczony ${(splaszczona / 100).toFixed(2)} wobec ${(rowna / 100).toFixed(2)} PLN)`);
  }

  // Model rozciagniety poza stol musi zostac odrzucony, takze gdy rozciagniecie
  // dotyczy jednej osi. Porownanie z jedna maksymalna liczba by go przepuscilo.
  let odmowil = false;
  try { priceItem({ ...wspolne, scale: { x: 1, y: 1, z: 12 } }); }
  catch (e) { odmowil = e?.code === "too_large_for_printer"; }
  if (!odmowil) zle("model wyciagniety poza stol zostal wyceniony");
  else ok("model wyciagniety w jednej osi poza stol nie dostaje kwoty");

  // Transport: skala jedzie JSON-em, bo `String({...})` daje "[object Object]",
  // z ktorego serwer odczytalby NaN i po cichu wycenil skale 1.
  const cart = readFileSync(new URL("../src/components/calculators/CalcToCart.jsx", import.meta.url), "utf8");
  if (!/body\.append\("scale", JSON\.stringify\(scale\)\)/.test(cart)) {
    zle("koszyk wysyla skale bez JSON, wiec obiekt osi zamieni sie w tekst bez tresci");
  }
  const serwer = readFileSync(new URL("../chat-api/server.js", import.meta.url), "utf8");
  if (!/function odczytajSkale/.test(serwer)) zle("serwer nie ma odczytu skali obiektowej");
  if (/Number\(req\.body\?\.scale\)/.test(serwer) || /Number\(raw\?\.scale\)/.test(serwer)) {
    zle("serwer dalej rzutuje skale na liczbe, wiec obiekt osi zamieni sie w NaN");
  }
  ok("skala jedzie do serwera JSON-em i wraca jako osie");
}

// --- 9. Kalkulatory nie ustawiaja skali gola liczba ------------------------
sekcja("9. Stan skali w kalkulatorach");
// `Object.keys(1)` to pusta lista, wiec skala ustawiona liczba daje pola
// wymiarow bez ani jednej osi i gabaryt "NaN x NaN x NaN". Nic tego nie
// zglasza: komponent renderuje sie normalnie, tylko bez zawartosci.
// Zdarzylo sie to juz raz, w obsludze wgrania i usuniecia pliku.
{
  const PLIKI = [
    "src/components/calculators/Print3DCalc.jsx",
    "src/components/calculators/CO2LaserCalc.jsx",
    "src/components/calculators/FiberLaserCalc.jsx",
  ];
  for (const wzgledna of PLIKI) {
    const tresc = readFileSync(new URL(`../${wzgledna}`, import.meta.url), "utf8");
    tresc.split("\n").forEach((linia, i) => {
      const m = /set(?:Stl|MslaStl|Svg)Scale\(\s*([0-9.]+)\s*\)/.exec(linia);
      if (m) zle(`${wzgledna}:${i + 1}: skala ustawiona liczba ${m[1]} zamiast obiektem osi`);
    });
  }
  ok("skala zawsze ustawiana obiektem osi, nigdy gola liczba");
}

if (bledy) {
  console.error(`\n${bledy} bledow.`);
  process.exit(1);
}
console.log("\nOK: skala w osobnych osiach liczy sie tak, jak ja pokazujemy.");
