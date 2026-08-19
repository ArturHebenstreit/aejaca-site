#!/usr/bin/env node
// ============================================================
// ROZPISKA CENY NIE MOZE NAZYWAC RABATU, ALE MUSI GO ZAWIERAC
// ============================================================
// Rynek polski ma 15 procent taniej. Wczesniej stalo to w rozpisce osobnym
// wierszem "Rabat rynek polski (-15%)". Sprzedawalo to zle: klient czyta taki
// wiersz jako cene wyjsciowa podbita po to, zeby bylo co odejmowac, i zaczyna
// szukac haczyka. Rabat zszedl wiec rowno ze wszystkich kwot rozpiski.
//
// Ta zmiana ma dokladnie jedna grozna awarie i jest cicha: gdyby rabat zniknal
// z PREZENTACJI, ale zostal w CENIE (albo odwrotnie), rozpiska pokazywalaby co
// innego niz kwota do zaplaty. Nic by sie nie wywalilo. Klient zobaczylby
// spojne, ladne liczby, ktore nie sumuja sie do tego, co placi.
//
// Dlatego test nie sprawdza wygladu, tylko zgodnosc dwoch drog do tej samej
// liczby: kwoty policzonej przez silnik i kwoty wypisanej w rozpisce.
//
//   node scripts/test-price-breakdown.mjs

import { resolveTechAndParams, runCalc } from "../src/pricing/simpleQuote.js";
import { CONFIG } from "../src/pricing/config.js";

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

/** Nazwy, ktore po tej zmianie nie maja prawa pojawic sie w rozpisce. */
const ZAKAZANE = [/rabat rynek polski/i, /polish market discount/i, /rabatt polnischer markt/i];

const PRZYPADKI = [
  { nazwa: "druk 3D (FDM)", item: "part",         material: "plastic" },
  { nazwa: "druk 3D (MSLA)", item: "figurine_msla", material: "plastic" },
  { nazwa: "laser CO2",     item: "sign",         material: "wood" },
  { nazwa: "laser swiatlowodowy", item: "jewelry", material: "metal" },
  { nazwa: "odlew zywiczny", item: "gift",        material: "resin" },
];

const WSPOLNE = { size: "palm", finish: "standard", quantity: "few" };

/** "123.45 PLN" albo "29.05 EUR" na liczbe. */
function kwotaZWiersza(value) {
  const m = String(value).match(/(\d+(?:\.\d+)?)\s*(PLN|EUR)/);
  return m ? { liczba: Number(m[1]), waluta: m[2] } : null;
}

/** Wiersz "Koszt szacunkowy", czyli jedyny pogrubiony wiersz z kwota. */
function wierszKosztu(breakdown) {
  return (breakdown || []).find((r) => r.bold && kwotaZWiersza(r.value));
}

for (const p of PRZYPADKI) {
  console.log(`\n${p.nazwa}`);
  const resolved = resolveTechAndParams({ ...WSPOLNE, item: p.item, material: p.material });
  const wynik = runCalc(resolved, "pl");

  if (wynik?.type !== "calculated") {
    zle(`nie policzylo sie w ogole (${wynik?.type ?? "brak wyniku"}), test nic nie sprawdza`);
    continue;
  }

  // 1. Zadna pozycja nie nazywa rabatu po imieniu
  const nazwane = (wynik.breakdown || []).filter((r) => ZAKAZANE.some((z) => z.test(r.label || "")));
  if (nazwane.length === 0) ok("rozpiska nie nazywa rabatu rynku polskiego");
  else zle(`rabat wrocil do rozpiski jako "${nazwane[0].label}"`);

  // 2. Kwota z rozpiski zgadza sie z kwota, ktora realnie obciazamy klienta.
  //    unitGrosze = kosztSzacunkowy * (1 - rabat servijny) * 100, przy czym
  //    kosztSzacunkowy jest juz po rabacie rynku polskiego. Jesli rabat
  //    wyparowal z prezentacji, ale zostal w cenie, ta rownosc peka.
  const wiersz = wierszKosztu(wynik.breakdown);
  if (!wiersz) {
    zle("w rozpisce nie ma pogrubionego wiersza z kosztem szacunkowym");
    continue;
  }
  const { liczba, waluta } = kwotaZWiersza(wiersz.value);
  if (waluta !== "PLN") {
    zle(`rozpiska po polsku podaje ${waluta} zamiast PLN`);
    continue;
  }
  const zRozpiski = Math.round(liczba * (1 - (wynik.discount || 0)) * 100);
  // Tolerancja jednego grosza: wiersz jest zaokraglony do dwoch miejsc,
  // a kwota wiazaca liczona z pelnej precyzji.
  if (Math.abs(zRozpiski - wynik.unitGrosze) <= 1) {
    ok(`rozpiska prowadzi do tej samej kwoty co silnik (${wynik.unitGrosze} gr)`);
  } else {
    zle(`rozpiska daje ${zRozpiski} gr, silnik ${wynik.unitGrosze} gr, rozjazd ${Math.abs(zRozpiski - wynik.unitGrosze)} gr`);
  }

  // 3. Kontrola sensu: polska rozpiska musi byc TANSZA od tej samej rozpiski
  //    dla rynku zewnetrznego. Bez tego punkty 1 i 2 przeszlyby rowniez
  //    wtedy, gdyby rabat po prostu przestal istniec.
  const wynikEn = runCalc(resolveTechAndParams({ ...WSPOLNE, item: p.item, material: p.material }), "en");
  const wierszEn = wierszKosztu(wynikEn?.breakdown);
  if (!wierszEn) {
    zle("brak wiersza kosztu w rozpisce dla rynku zewnetrznego");
    continue;
  }
  const plnZEuro = kwotaZWiersza(wierszEn.value).liczba * CONFIG.EUR_PLN_RATE;
  const oczekiwane = plnZEuro * (1 - CONFIG.PL_MARKET_DISCOUNT);
  if (Math.abs(liczba - oczekiwane) < 0.05) {
    ok(`polska rozpiska jest o ${Math.round(CONFIG.PL_MARKET_DISCOUNT * 100)}% nizsza i nigdzie tego nie oglasza`);
  } else {
    zle(`polska rozpiska ${liczba.toFixed(2)} PLN, oczekiwane ${oczekiwane.toFixed(2)} PLN po rabacie`);
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nRozpiska ceny: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
