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

// Wystawianie kodu stoi w JEDNYM miejscu dla wszystkich rodzajow, wiec jezyk
// tez zapisuje sie w jednym miejscu.
assert.match(discounts, /export async function wystawKod\(pool, \{ rodzaj, email, kind, value, days, note, lang, validFrom \}\)/,
  "wystawianie kodu przyjmuje jezyk");
assert.match(discounts, /issued_to, note, lang\)/, "jezyk wchodzi do INSERT-a");

// Warunki kazdego rodzaju stoja w tabeli, a nie w tresci trasy. Trasa podaje
// rodzaj; procent, waznosc i kampania naleza do rodzaju.
for (const rodzaj of ["newsletter", "rabat_do_wyceny", "prezent"]) {
  assert.match(discounts, new RegExp(`\\n  ${rodzaj}: \\{`), `rodzaj ${rodzaj} jest opisany w tabeli`);
}
assert.match(server, /rodzaj: "newsletter", email,/, "kod powitalny nazywa swoj rodzaj");
assert.match(server, /rodzaj: "rabat_do_wyceny", email: to, lang,/, "rabat po tygodniu nazywa swoj rodzaj");

// PRZEDROSTEK WYNIKA Z WARTOSCI, wiec nazwa kodu nie moze sklamac. Wczesniej
// kod powitalny mial "AEJ10" wpisane na sztywno, a procent brany z zadania:
// `percent: 15` dawalo kod o nazwie AEJ10 wart pietnascie procent.
assert.doesNotMatch(server, /prefix: "AEJ10"/, "przedrostek nie jest juz wpisany przy trasie");
assert.match(discounts, /return znizka === "amount" \? "AEJ" : `AEJ\$\{wartosc\}`;/,
  "przedrostek liczy sie z wartosci kodu");

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
