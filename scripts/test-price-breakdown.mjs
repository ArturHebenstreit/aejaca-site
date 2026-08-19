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
import { plFactorFor, CONFIG } from "../src/pricing/config.js";

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
  // Rabat na rynek polski wlacza sie dopiero od progu wartosci zlecenia, wiec
  // rozpiska ma byc nizsza dokladnie o tyle, ile silnik realnie odliczyl,
  // a nie zawsze o pelne 15%. Czynnik bierzemy z tej samej funkcji, ktora
  // liczy cene: przepisana tu regula rozjechalaby sie przy pierwszej zmianie.
  // Czynnik mierzymy WPROST z silnika: kwota wiazaca po polsku podzielona
  // przez te sama kwote bez rabatu. Wyliczanie go tu jeszcze raz znaczyloby
  // porownywanie kodu z jego wlasna kopia, a nie z rzeczywistoscia.
  const czynnik = wynikEn?.unitGrosze ? wynik.unitGrosze / wynikEn.unitGrosze : 1;
  const oczekiwane = plnZEuro * czynnik;
  if (czynnik > 1.0001) zle(`polska cena jest WYZSZA od zewnetrznej (czynnik ${czynnik.toFixed(4)})`);
  if (czynnik < 1 - CONFIG.PL_MARKET_DISCOUNT - 0.0001) zle(`rabat wyszedl wiekszy niz ${Math.round(CONFIG.PL_MARKET_DISCOUNT * 100)}% (czynnik ${czynnik.toFixed(4)})`);
  if (Math.abs(liczba - oczekiwane) < 0.05) {
    const ile = Math.round((1 - oczekiwane / plnZEuro) * 100);
    ok(ile > 0
      ? `polska rozpiska jest o ${ile}% nizsza i nigdzie tego nie oglasza`
      : "zlecenie ponizej progu, wiec rabatu nie ma i rozpiska tego nie udaje");
  } else {
    zle(`polska rozpiska ${liczba.toFixed(2)} PLN, oczekiwane ${oczekiwane.toFixed(2)} PLN`);
  }
}

// ============================================================
// PROG RABATU: PONIZEJ 150 ZL RABATU NIE MA, I BEZ USKOKU
// ============================================================
// Polecenie wlasciciela: przy drobnych zleceniach nie rabatujemy, bo 15% z
// kilkunastu zlotych to kwota bez znaczenia dla klienta i realny ubytek przy
// robociznie, ktora nie maleje razem z cena.
//
// Naiwne "ponizej 150 nie ma rabatu" tworzy jednak wade gorsza od problemu:
// zlecenie za 149 zl kosztuje 149 zl, a za 150 zl juz 127,50 zl, wiec WIEKSZE
// ZLECENIE JEST TANSZE. Klient, ktory to zauwazy, ma racje, ze cennik jest
// zepsuty. Dlatego cena po rabacie nie schodzi ponizej progu i funkcja jest
// monotoniczna. Ten test pilnuje obu rzeczy naraz.
console.log("\nProg rabatu na rynek polski");

{
  const D = CONFIG.PL_MARKET_DISCOUNT;
  const PROG = CONFIG.PL_DISCOUNT_MIN_PLN;
  const doZaplaty = (wartosc) => wartosc * plFactorFor(wartosc, D);

  if (plFactorFor(50, D) === 1) ok(`zlecenie za 50 zl nie dostaje rabatu (prog ${PROG} zl)`);
  else zle(`zlecenie za 50 zl dostalo rabat, czynnik ${plFactorFor(50, D)}`);

  if (plFactorFor(PROG - 1, D) === 1) ok("tuz pod progiem rabatu nie ma");
  else zle("tuz pod progiem rabat jednak jest");

  // Powyzej progu podzielonego przez (1-D) rabat dziala w pelni.
  const pelny = PROG / (1 - D) + 10;
  if (Math.abs(plFactorFor(pelny, D) - (1 - D)) < 1e-9) ok(`powyzej ${(PROG / (1 - D)).toFixed(2)} zl dziala pelne ${Math.round(D * 100)}%`);
  else zle(`przy ${pelny.toFixed(2)} zl czynnik to ${plFactorFor(pelny, D).toFixed(4)}, mial byc ${(1 - D).toFixed(2)}`);

  // Plaskowyz miedzy progiem a pelnym rabatem: placi sie rowno prog.
  const wSrodku = (PROG + PROG / (1 - D)) / 2;
  if (Math.abs(doZaplaty(wSrodku) - PROG) < 0.01) ok(`miedzy ${PROG} a ${(PROG / (1 - D)).toFixed(2)} zl placi sie rowne ${PROG} zl`);
  else zle(`przy ${wSrodku.toFixed(2)} zl do zaplaty ${doZaplaty(wSrodku).toFixed(2)} zl, mialo byc ${PROG}`);

  // NAJWAZNIEJSZE: nigdzie wieksze zlecenie nie moze byc tansze.
  let uskok = null;
  let poprzednia = 0;
  for (let w = 1; w <= 600; w += 0.25) {
    const teraz = doZaplaty(w);
    if (teraz < poprzednia - 1e-9) { uskok = w; break; }
    poprzednia = teraz;
  }
  if (uskok == null) ok("cena rosnie monotonicznie, wieksze zlecenie nigdy nie jest tansze");
  else zle(`uskok przy ${uskok.toFixed(2)} zl: wieksze zlecenie kosztuje mniej`);

  // Rabat nigdy nie podnosi ceny.
  let podniesienie = null;
  for (let w = 1; w <= 600; w += 0.25) {
    if (doZaplaty(w) > w + 1e-9) { podniesienie = w; break; }
  }
  if (podniesienie == null) ok("rabat nigdy nie podnosi ceny ponad kwote bez rabatu");
  else zle(`przy ${podniesienie.toFixed(2)} zl cena po rabacie jest WYZSZA niz bez rabatu`);

  if (plFactorFor(1000, 0) === 1) ok("poza rynkiem polskim czynnik zawsze wynosi 1");
  else zle("czynnik rabatu dziala poza rynkiem polskim");

  // Sprawdzenie na silniku, a nie tylko na czystej funkcji: drobne zlecenie
  // po polsku ma kosztowac tyle samo co po angielsku.
  const drobne = { item: "sign", size: "palm", material: "wood", finish: "standard", quantity: "one",
                   fileType: "svg", svgData: { bboxMm: { x: 60, y: 40 }, pathLengthCm: 20, engravAreaCm2: 24 } };
  const pl = runCalc(resolveTechAndParams({ ...drobne, co2Mode: "engrave" }), "pl");
  const en = runCalc(resolveTechAndParams({ ...drobne, co2Mode: "engrave" }), "en");
  if (pl?.unitGrosze && pl.unitGrosze === en?.unitGrosze) ok(`drobne zlecenie kosztuje tyle samo po polsku i po angielsku (${pl.unitGrosze} gr)`);
  else zle(`drobne zlecenie: pl ${pl?.unitGrosze} gr, en ${en?.unitGrosze} gr`);

  // Duze zlecenie MUSI byc tansze po polsku, inaczej rabat przestal istniec.
  const duze = { item: "sign", size: "book", material: "wood", finish: "premium", quantity: "many",
                 fileType: "svg", svgData: { bboxMm: { x: 400, y: 250 }, pathLengthCm: 900, engravAreaCm2: 1000 } };
  const duzePl = runCalc(resolveTechAndParams({ ...duze, co2Mode: "engrave" }), "pl");
  const duzeEn = runCalc(resolveTechAndParams({ ...duze, co2Mode: "engrave" }), "en");
  if (duzePl?.unitGrosze && duzeEn?.unitGrosze && duzePl.unitGrosze < duzeEn.unitGrosze) {
    ok(`duze zlecenie jest tansze po polsku (${duzePl.unitGrosze} gr wobec ${duzeEn.unitGrosze} gr)`);
  } else {
    zle(`duze zlecenie: pl ${duzePl?.unitGrosze} gr, en ${duzeEn?.unitGrosze} gr, rabat nie zadzialal`);
  }
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nRozpiska ceny: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
