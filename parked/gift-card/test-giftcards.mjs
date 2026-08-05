// Karty podarunkowe: arytmetyka i kolejnosc naliczania.
//
// Testujemy to, bo blad w tym miejscu kosztuje realne pieniadze w jedna albo
// w druga strone. Karta pokrywajaca za duzo to strata dla nas, karta
// pokrywajaca za malo to klient, ktory zaplacil dwa razy za to samo.
//
// Sprawdzana regula jest jedna i jest twarda:
//
//   rabat od pozycji  ->  plus wysylka  ->  karta od kwoty do zaplaty
//
// Karta jako jedyna pokrywa wysylke, bo jest przedplata. Rabat nie pokrywa
// jej nigdy, w zadnym wariancie.

import assert from "node:assert/strict";
import {
  coverFor, normalizeGiftCode, validUntil, randomGiftCode,
  VALIDITY_MONTHS, MIN_AMOUNT_GROSZE, MAX_AMOUNT_GROSZE,
} from "../chat-api/giftcards.js";

const saldo = (available) => ({ available_grosze: available });

// ------------------------------------------------------------
// Pokrycie
// ------------------------------------------------------------

assert.equal(coverFor(saldo(50000), 32000), 32000, "karta wieksza od zamowienia pokrywa calosc zamowienia");
assert.equal(coverFor(saldo(50000), 80000), 50000, "karta mniejsza od zamowienia oddaje tylko swoje saldo");
assert.equal(coverFor(saldo(50000), 50000), 50000, "karta rowna zamowieniu pokrywa je co do grosza");
assert.equal(coverFor(saldo(0), 32000), 0, "wyzerowana karta nie pokrywa niczego");
assert.equal(coverFor(saldo(50000), 0), 0, "przy zerowej kwocie do zaplaty karta nie schodzi");

// Ujemna kwota do zaplaty nie powinna sie zdarzyc, ale gdyby doszlo do niej
// przez blad w liczeniu wysylki, karta nie ma prawa "oddac" pieniedzy.
assert.equal(coverFor(saldo(50000), -1000), 0, "ujemna kwota nie zwieksza salda karty");

// ------------------------------------------------------------
// Kolejnosc: rabat, wysylka, karta
// ------------------------------------------------------------

/** Odwzorowanie tego, co robi serwer przy skladaniu zamowienia. */
function doZaplaty({ pozycje, rabat = 0, wysylka = 0, saldoKarty = 0 }) {
  const przedKarta = pozycje - rabat + wysylka;
  const karta = coverFor(saldo(saldoKarty), przedKarta);
  return { przedKarta, karta, total: przedKarta - karta, resztaNaKarcie: saldoKarty - karta };
}

{
  // Koszyk 400 zl, rabat 10% (40 zl), wysylka 19,49 zl, karta 500 zl.
  const r = doZaplaty({ pozycje: 40000, rabat: 4000, wysylka: 1949, saldoKarty: 50000 });
  assert.equal(r.przedKarta, 37949, "rabat schodzi od pozycji, wysylka dochodzi po nim");
  assert.equal(r.karta, 37949, "karta pokrywa TAKZE wysylke, bo jest przedplata");
  assert.equal(r.total, 0, "nie zostaje nic do doplaty");
  assert.equal(r.resztaNaKarcie, 12051, "reszta zostaje na karcie, a nie przepada");
}

{
  // Ta sama karta na drugie zamowienie: reszta z poprzedniego ma dzialac.
  const r = doZaplaty({ pozycje: 20000, wysylka: 1649, saldoKarty: 12051 });
  assert.equal(r.karta, 12051, "karta oddaje caly pozostaly ulamek salda");
  assert.equal(r.total, 9598, "reszte klient doplaca normalnie");
  assert.equal(r.resztaNaKarcie, 0, "po drugim zamowieniu karta jest pusta");
}

{
  // Karta mniejsza niz zamowienie: klient doplaca, karta schodzi do zera.
  const r = doZaplaty({ pozycje: 120000, rabat: 0, wysylka: 1949, saldoKarty: 30000 });
  assert.equal(r.total, 91949);
  assert.equal(r.resztaNaKarcie, 0);
}

{
  // Rabat NIE moze zejsc od wysylki. Gdyby zszedl, kwota przed karta bylaby
  // mniejsza i karta pokrylaby zamowienie, ktorego nie powinna pokryc.
  const r = doZaplaty({ pozycje: 10000, rabat: 10000, wysylka: 1949, saldoKarty: 1000 });
  assert.equal(r.przedKarta, 1949, "przy rabacie 100% zostaje do zaplaty sama wysylka");
  assert.equal(r.total, 949, "karta 10 zl zbija wysylke do 9,49 zl");
}

// ------------------------------------------------------------
// Numer karty
// ------------------------------------------------------------

assert.equal(normalizeGiftCode("  aej-abcd-1234 "), "AEJ-ABCD-1234", "numer normalizujemy do wielkich liter");
assert.equal(normalizeGiftCode("AEJ ABCD 1234"), "AEJABCD1234", "spacje w srodku znikaja");
assert.equal(normalizeGiftCode(null), "", "brak numeru to pusty ciag, nie wyjatek");

const wzor = /^AEJ-[ACDEFGHJKMNPQRTUVWXY2346789]{4}-[ACDEFGHJKMNPQRTUVWXY2346789]{4}$/;
const kody = new Set();
for (let i = 0; i < 2000; i++) {
  const kod = randomGiftCode();
  assert.match(kod, wzor, `numer ${kod} nie trzyma formatu`);
  // Znaki mylace sie przy przepisywaniu z wydrukowanej karty maja nie wystepowac.
  assert.ok(!/[01ILOSB5]/.test(kod.slice(4)), `numer ${kod} zawiera znak mylacy sie przy przepisywaniu`);
  kody.add(kod);
}
assert.ok(kody.size > 1990, `na 2000 losowan powtorzylo sie ${2000 - kody.size} numerow, generator jest podejrzany`);

// ------------------------------------------------------------
// Waznosc
// ------------------------------------------------------------

{
  const od = new Date("2026-08-05T12:00:00Z");
  const do_ = validUntil(od);
  assert.equal(do_.getFullYear(), 2027);
  assert.equal(do_.getMonth(), od.getMonth(), "waznosc konczy sie w tym samym miesiacu rok pozniej");
  assert.equal(VALIDITY_MONTHS, 12);
}

{
  // 31 stycznia plus 12 miesiecy to 31 stycznia, a nie 3 marca. Gdyby
  // przesuniecie liczylo w dniach, luty zjadlby te roznice.
  const do_ = validUntil(new Date("2026-01-31T10:00:00Z"));
  assert.equal(do_.getFullYear(), 2027);
  assert.equal(do_.getMonth(), 0, "styczen ma zostac styczniem");
}

assert.ok(MIN_AMOUNT_GROSZE < MAX_AMOUNT_GROSZE);
assert.equal(MIN_AMOUNT_GROSZE, 100_00, "dolny nominal to 100 zl");
assert.equal(MAX_AMOUNT_GROSZE, 10_000_00, "gorny nominal to 10 000 zl");

console.log("Karty podarunkowe: pokrycie, kolejnosc naliczania, numer i waznosc zgodne");
