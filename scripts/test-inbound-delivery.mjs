// ============================================================
// DEKLARACJA DOSTARCZENIA PRZEDMIOTU PRZEZ KLIENTA
// ============================================================
// Zasada wlasciciela z 2026-08-16: gdy klient ma nam COS PRZYSLAC (wlasna deska
// pod grawer, wlasne kamienie, bizuteria do naprawy), musi PRZED ZAPLATA
// powiedziec, jak to zrobi. Polska: paczkomat albo osobiscie. Zagranica:
// wylacznie kurier.
//
// Sprawdzian pilnuje trzech rzeczy naraz, bo kazda z nich zawiodlaby po cichu:
// samej reguly krajowej, tego, ze przeglada­rka i serwer licza ja TYM SAMYM
// kodem, oraz tego, ze serwer nie przyjmie zamowienia bez deklaracji.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { INBOUND_METHODS, inboundOptionsFor, inboundAllowed, wymagaPrzesylki } from "../src/data/inboundDelivery.js";
import { SUBSTRATES } from "../src/data/laserSubstrate.js";

const tu = path.dirname(fileURLToPath(import.meta.url));
const czytaj = (p) => readFileSync(path.resolve(tu, "..", p), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

// --- Regula krajowa ---
const wPolsce = inboundOptionsFor("PL").map((m) => m.id).sort();
assert.deepEqual(wPolsce, ["in_person", "inpost_locker"], "w Polsce paczkomat albo osobiscie");
ok(`Polska: ${wPolsce.join(", ")}`);

for (const kraj of ["DE", "GB", "US", "CZ", "FR"]) {
  const poza = inboundOptionsFor(kraj).map((m) => m.id);
  assert.deepEqual(poza, ["courier"], `z ${kraj} wylacznie kurier`);
}
ok("zagranica: wylacznie kurier, sprawdzone na pieciu krajach");

// Wybory NIEDOZWOLONE musza odpasc, i to jest wazniejsze od tego, ze dozwolone
// przechodza: to one sa droga, ktora zle zamowienie weszloby do pracowni.
assert.equal(inboundAllowed("courier", "PL"), false, "kurier z Polski jest wylaczony celowo");
assert.equal(inboundAllowed("inpost_locker", "DE"), false, "paczkomat nie istnieje dla klienta z Niemiec");
assert.equal(inboundAllowed("in_person", "DE"), false, "nikt nie przyjedzie z Berlina z deska pod pache");
assert.equal(inboundAllowed("", "PL"), false, "brak wyboru to nie jest wybor");
assert.equal(inboundAllowed(null, "DE"), false);
ok("wybory niedozwolone odpadaja, lacznie z brakiem wyboru");

// Brak kraju znaczy Polske, bo tak samo zaklada koszyk. Rozjazd tego zalozenia
// dalby klientowi liste, ktorej serwer nie zaakceptuje.
assert.deepEqual(inboundOptionsFor(undefined).map((m) => m.id).sort(), wPolsce);
assert.deepEqual(inboundOptionsFor("pl").map((m) => m.id).sort(), wPolsce, "kod kraju bez wzgledu na wielkosc liter");
ok("brak kraju i maly zapis kodu znacza to samo co PL");

// --- Kazdy sposob ma etykiete w trzech jezykach ---
for (const m of INBOUND_METHODS) {
  for (const jez of ["pl", "en", "de"]) {
    if (!m.label?.[jez] || !m.note?.[jez]) {
      zle(`${m.id}: brak tekstu w jezyku ${jez}`);
    }
  }
}
if (!bledy) ok(`${INBOUND_METHODS.length} sposoby opisane w trzech jezykach`);

// --- Kto wymaga przesylki ---
assert.equal(wymagaPrzesylki({ calculator: "jewelry_repair" }), true, "naprawa: klient przysyla swoja bizuterie");
assert.equal(wymagaPrzesylki({ calculator: "jewelry_renovation" }), true, "renowacja: to samo");
assert.equal(wymagaPrzesylki({ calculator: "laser_co2_engrave", params: { podloze: "own_item" } }), true,
  "grawer na przedmiocie klienta: klient przysyla rzecz");
assert.equal(wymagaPrzesylki({ calculator: "laser_co2_engrave", params: { podloze: "own_stock" } }), true,
  "material powierzony: klient przysyla arkusz");
assert.equal(wymagaPrzesylki({ calculator: "laser_co2_engrave", params: { podloze: "our_stock" } }), false,
  "material nasz: klient niczego nie przysyla");
assert.equal(wymagaPrzesylki({ calculator: "print3d_fdm", params: {} }), false, "druk z pliku: nic nie przysyla");
assert.equal(wymagaPrzesylki(null), false);
// Napis zamiast wartosci logicznej to najkrotsza droga do cichej awarii:
// wybor przechodzi przez formularz, koszyk i JSON.
assert.equal(wymagaPrzesylki({ params: { ownMaterial: "true" } }), true, "napis tez ma zadzialac");
ok("wymagaPrzesylki rozpoznaje naprawe, renowacje i material powierzony");

// Podloza musza miec identyfikatory tekstowe, bo jada przez formularz, koszyk
// i JSON. Wartosc logiczna po tej drodze zamienia sie w napis, i wlasnie na tym
// polegla poprzednia wersja tego pola.
const idki = SUBSTRATES.map((o) => o.id);
assert.deepEqual(idki, ["own_item", "own_stock", "our_stock"], "podloza sa napisami, nie wartosciami logicznymi");
ok("katalog podloz trzyma identyfikatory tekstowe");

// --- Serwer liczy regule TYM SAMYM kodem, a nie wlasnym ---
// Gdyby serwer mial wlasna kopie listy krajow, obie zaczelyby sie rozjezdzac
// przy pierwszej zmianie i klient dostawalby blad dopiero przy platnosci.
const server = czytaj("chat-api/server.js");
if (!/inboundAllowed/.test(server)) {
  zle("serwer nie sprawdza deklaracji dostarczenia, wiec formularz da sie ominac");
} else {
  ok("serwer sprawdza deklaracje dostarczenia");
}
if (!/code: "inbound_required"/.test(server)) {
  zle("serwer nie odrzuca zamowienia bez deklaracji dostarczenia");
} else {
  ok("serwer odrzuca zamowienie bez deklaracji dostarczenia");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nDeklaracja dostarczenia: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
