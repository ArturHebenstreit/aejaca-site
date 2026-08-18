// ============================================================
// PODLOZE USLUGI LASEROWEJ
// ============================================================
// Wlasciciel zglosil 2026-08-18: przy grawerze na bizuterii albo innym
// przedmiocie klienta dalo sie wybrac "wasz material". To nie byla usterka
// formularza, tylko modelu: jedno pole logiczne `ownMaterial` opisywalo dwie
// rozne sytuacje, przedmiot klienta i material klienta, i przez to trzecia,
// bezsensowna, byla wyrazalna.
//
// Sprawdzian pilnuje czterech rzeczy naraz, bo kazda z nich zawiodlaby po cichu:
//   1. samej reguly (co przy jakim podlozu jest obowiazkowe),
//   2. tego, ze kombinacja bez sensu nie przechodzi,
//   3. tego, ze przegladarka i serwer licza to TYM SAMYM kodem,
//   4. tego, ze koszyk zapisany PRZED zmiana dalej dziala.
//
// Punkt czwarty jest tu dlatego, ze koszyk siedzi w `localStorage` i przezywa
// wdrozenie. Bez przelozenia starego pola klient z odlozonym koszykiem
// dostalby blad przy platnosci za wybor, ktorego juz nie widzi na ekranie.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  SUBSTRATES, SPARE_OPTIONS, USLUGI_LASEROWE, MIN_MATERIAL_NOTE,
  substrateOf, spareOptionsFor, brakPodloza, podlozeWymagaPrzesylki,
} from "../src/data/laserSubstrate.js";
import { wymagaPrzesylki } from "../src/data/inboundDelivery.js";
import { SERVICES } from "../src/data/orderCatalog.js";

const tu = path.dirname(fileURLToPath(import.meta.url));
const czytaj = (p) => readFileSync(path.resolve(tu, "..", p), "utf8");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

const laser = (params) => ({ calculator: "laser_co2_engrave", params });

// --- 1. Trzy podloza, kazde opisane w trzech jezykach ---
assert.deepEqual(SUBSTRATES.map((s) => s.id), ["own_item", "own_stock", "our_stock"]);
for (const s of [...SUBSTRATES, ...SPARE_OPTIONS]) {
  for (const jez of ["pl", "en", "de"]) {
    if (!s.label?.[jez] || !s.note?.[jez]) zle(`${s.id}: brak tekstu w jezyku ${jez}`);
  }
}
if (!bledy) ok("trzy podloza i dwa sposoby proby, wszystkie opisane po polsku, angielsku i niemiecku");

// --- 2. Co przy jakim podlozu jest obowiazkowe ---
assert.equal(brakPodloza(laser({})), "substrate_required", "bez podloza pozycja jest niekompletna");
assert.equal(brakPodloza(laser({ podloze: "own_item" })), "spare_required");
assert.equal(brakPodloza(laser({ podloze: "own_stock" })), "spare_required");
assert.equal(brakPodloza(laser({ podloze: "our_stock" })), "material_note_required");
assert.equal(brakPodloza(laser({ podloze: "own_item", spare: "extra" })), null);
assert.equal(brakPodloza(laser({ podloze: "own_stock", spare: "extra" })), null);
assert.equal(brakPodloza(laser({ podloze: "our_stock", materialNote: "sklejka 4 mm" })), null);
ok("kazde podloze wymaga swojego: sztuki na proby albo nazwy materialu");

// --- 3. Furtka dla rzeczy jedynej TYLKO przy przedmiocie ---
// Obraczka po babci nie ma szostej sztuki. Arkusz akrylu ma zawsze, wiec tam
// tej furtki nie ma i to nie jest przeoczenie.
assert.equal(brakPodloza(laser({ podloze: "own_item", spare: "unique" })), null,
  "przedmiot niepowtarzalny wolno zadeklarowac");
assert.equal(brakPodloza(laser({ podloze: "own_stock", spare: "unique" })), "spare_required",
  "material w arkuszach nie jest niepowtarzalny, tej furtki tam nie ma");
assert.deepEqual(spareOptionsFor("own_item").map((o) => o.id), ["extra", "unique"]);
assert.deepEqual(spareOptionsFor("own_stock").map((o) => o.id), ["extra"]);
assert.deepEqual(spareOptionsFor("our_stock"), [], "przy naszym materiale klient niczego nie przysyla");
ok("furtka dla rzeczy jedynej dziala tylko przy przedmiocie klienta");

// --- 4. Krotki opis materialu to nie opis ---
assert.equal(brakPodloza(laser({ podloze: "our_stock", materialNote: "  " })), "material_note_required");
assert.equal(brakPodloza(laser({ podloze: "our_stock", materialNote: "x".repeat(MIN_MATERIAL_NOTE - 1) })),
  "material_note_required", `${MIN_MATERIAL_NOTE - 1} znakow to za malo`);
ok(`opis materialu musi miec co najmniej ${MIN_MATERIAL_NOTE} znakow`);

// --- 5. Poza laserem pole nie istnieje i niczego nie blokuje ---
assert.equal(brakPodloza({ calculator: "print3d_fdm", params: {} }), null);
assert.equal(brakPodloza({ calculator: "jewelry_repair", params: {} }), null);
assert.equal(brakPodloza(null), null);
ok("uslugi spoza lasera nie maja podloza i nie sa przez nie blokowane");

// --- 6. Deklaracja dostarczenia wynika z PODLOZA ---
// To jest szew miedzy dwiema regulami. Gdyby sie rozjechal, klient przyslalby
// nam przedmiot bez powiedzenia, jak go przysyla, albo odwrotnie: pytalibysmy
// o przesylke kogos, kto niczego nie wysyla.
assert.equal(podlozeWymagaPrzesylki(laser({ podloze: "own_item" })), true);
assert.equal(podlozeWymagaPrzesylki(laser({ podloze: "own_stock" })), true);
assert.equal(podlozeWymagaPrzesylki(laser({ podloze: "our_stock" })), false);
assert.equal(wymagaPrzesylki(laser({ podloze: "own_item", spare: "extra" })), true);
assert.equal(wymagaPrzesylki(laser({ podloze: "our_stock", materialNote: "sklejka" })), false);
ok("deklaracja dostarczenia wlacza sie z podloza, jednym kodem dla obu stron");

// --- 7. Koszyk sprzed zmiany dalej dziala ---
// Stare `ownMaterial: true` znaczylo "moj material, przysle go".
assert.equal(substrateOf(laser({ ownMaterial: true })), "own_stock");
assert.equal(substrateOf(laser({ ownMaterial: "true" })), "own_stock", "napis tez, bo JSON gubi typ");
assert.equal(substrateOf(laser({ ownMaterial: false })), "our_stock");
assert.equal(wymagaPrzesylki(laser({ ownMaterial: true })), true,
  "stara pozycja z materialem powierzonym dalej wymaga deklaracji dostarczenia");
// Nowe pole ma pierwszenstwo nad starym, inaczej pozycja poprawiona przez
// klienta wracalaby do wyboru sprzed poprawki.
assert.equal(substrateOf(laser({ ownMaterial: true, podloze: "our_stock" })), "our_stock");
ok("pozycje ze starych koszykow czytaja sie poprawnie, nowe pole ma pierwszenstwo");

// --- 8. Katalog uslug pyta o podloze przy KAZDEJ usludze laserowej ---
// Nowa usluga laserowa dodana bez tego pola weszlaby do sprzedazy bez reguly.
for (const calc of USLUGI_LASEROWE) {
  const svc = SERVICES.find((s) => s.calculator === calc);
  if (!svc) { zle(`brak uslugi o kalkulatorze ${calc} w katalogu`); continue; }
  if (!svc.fields.some((f) => f.key === "podloze")) {
    zle(`${svc.id}: katalog nie pyta o podloze, wiec zamowienie z tej drogi dostanie 400`);
  }
  const dom = svc.defaults?.podloze;
  if (!SUBSTRATES.some((s) => s.id === dom)) {
    zle(`${svc.id}: domyslne podloze "${dom}" nie istnieje`);
  }
}
if (!bledy) ok(`${USLUGI_LASEROWE.length} uslugi laserowe pytaja o podloze i maja poprawna wartosc domyslna`);

// --- 9. Serwer liczy regule TYM SAMYM kodem ---
const server = czytaj("chat-api/server.js");
if (!/brakPodloza/.test(server)) {
  zle("serwer nie sprawdza podloza, wiec formularz da sie ominac");
} else {
  ok("serwer sprawdza podloza tym samym kodem");
}
if (!/laserSubstrate\.js/.test(czytaj("scripts/sync-pricing.mjs"))) {
  zle("modul podloza nie jest lustrzany do chat-api, wiec serwer zostanie ze stara kopia");
} else {
  ok("modul podloza jedzie do chat-api przez sync:pricing");
}

// --- 10. Poczta warsztatowa pokazuje wybor po ludzku ---
// Pole, ktorego sie nie czyta, nie istnieje: to od niego zalezy, czy czekamy
// na paczke, czy kupujemy material.
const mail = czytaj("chat-api/orderMail.js");
if (!/PODLOZE/.test(mail)) {
  zle("poczta zamowieniowa nie wypisuje podloza, zostaje ono tylko w blobie JSON");
} else {
  ok("poczta zamowieniowa wypisuje podloze czytelnie");
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nPodloze uslugi laserowej: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
