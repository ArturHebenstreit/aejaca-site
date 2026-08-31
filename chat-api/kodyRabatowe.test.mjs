// ============================================================
// KOD RABATOWY PAMIETA, W JAKIM JEZYKU GO WYSTAWILISMY
// ============================================================
// Przypomnienie o kodzie wychodzi czterdziesci dni po zapisie. Nie ma juz wtedy
// ani zapytania z formularza, ani sesji, z ktorej dalo sie odczytac jezyk, wiec
// przez jakis czas szlo na sztywno po polsku. Niemiec dostawal niemieckie
// powitanie z kodem, a potem polskie przypomnienie o tym samym kodzie.
//
// Jezyk musi wiec siedziec PRZY KODZIE, w tabeli, a nie byc zgadywany w chwili
// wysylki. Ten sprawdzian oglada zrodla, bo cala rzecz dzieje sie w zapytaniach
// do bazy i w cronie, ktorego nie da sie zawolac bez bazy.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KATALOG = dirname(fileURLToPath(import.meta.url));
const server = readFileSync(join(KATALOG, "server.js"), "utf8");
const discounts = readFileSync(join(KATALOG, "discounts.js"), "utf8");

// Kolumna dokladana migracja przy starcie, jak reszta. Stare kody nie maja
// jezyka i to jest w porzadku: leca po polsku, jak przed zmiana.
assert.match(server, /ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS lang/,
  "tabela kodow ma kolumne jezyka");

// Wystawianie kodu stoi w jednym miejscu dla obu kampanii, wiec jezyk tez
// zapisuje sie w jednym miejscu.
assert.match(discounts, /issueSingleUseCode\(pool, \{ email, percent, days, campaign, prefix, note, lang \}\)/,
  "wystawianie kodu przyjmuje jezyk");
assert.match(discounts, /issued_to, note, lang\)/, "jezyk wchodzi do INSERT-a");

// Oba miejsca, ktore kod wystawiaja: powitanie w newsletterze i rabat doklejony
// do wyceny sprzed tygodnia.
assert.match(server, /campaign: "newsletter", prefix: "AEJ10", lang: jezykZadania\(req\.body\?\.lang\)/,
  "kod powitalny zapisuje jezyk zapisu do newslettera");
assert.match(server, /campaign: "quote-followup", prefix: `AEJ\$\{procent\}`, lang,/,
  "rabat po tygodniu zapisuje jezyk wyceny");

// Przypomnienie czyta jezyk z kodu. Sprawdzamy jedno i drugie: ze kolumna jest
// w zapytaniu ORAZ ze nie ma juz wpisanego na sztywno polskiego.
assert.match(server, /SELECT code, issued_to, value, valid_to, lang/,
  "zapytanie o kody do przypomnienia bierze jezyk");
assert.match(server, /const jezyk = jezykZadania\(k\.lang\);/,
  "przypomnienie ustala jezyk z kodu");
assert.doesNotMatch(server, /przypomnienieKodu\(\{\s*\n\s*lang: "pl"/,
  "przypomnienie nie wysyla po polsku niezaleznie od kodu");

// Wartosc z bazy albo z webhooka bywa czymkolwiek. Slownik maila szuka klucza,
// wiec "fr" oddalby `undefined`, czyli mail bez tresci.
assert.match(server, /function jezykZadania\(wartosc\) \{\s*\n\s*return \["pl", "en", "de"\]\.includes\(wartosc\) \? wartosc : "pl";/,
  "jezyk spoza trojki schodzi na polski, zamiast rozsypac mail");

console.log("Kody rabatowe: jezyk zapisany przy kodzie, przypomnienie idzie w nim");
