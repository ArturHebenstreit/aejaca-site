// ============================================================
// PRZYPOMNIENIE O NIEDOKONCZONEJ PLATNOSCI PRZELEWEM
// ============================================================
// Zamowienie kartowe trzymamy kwadrans (INSTANT_HOLD_MINUTES), wiec mail
// przy karcie dotarlby po zwolnieniu pozycji. Przelew ma trzy dni robocze
// (TRANSFER_HOLD_BUSINESS_DAYS), i tam przypomnienie ma sens: decyzja
// wlasciciela, 2026-09-06.
//
// Sprawdzian pilnuje czterech rzeczy naraz, bo kazda z nich zawiodlaby po
// cichu: ze zapytanie bierze wylacznie awaiting_transfer bez paid_at, ze
// przypomnienie jest jedno na zamowienie, ze stempel stoi PO wysylce, a nie
// przed nia, oraz ze mail istnieje w trzech jezykach.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPaymentReminder } from "../chat-api/orderMail.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const czytaj = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const serwer = czytaj("chat-api", "server.js");

let bledy = 0;
const zle = (m) => { console.error(`  ✗ ${m}`); bledy++; };
const ok = (m) => console.log(`  ✓ ${m}`);

// --- Wyodrebnienie samej funkcji, zeby nie trafiac na inne crony ----------
const funkcja = serwer.match(
  /async function przypomnijONiedokonczonejPlatnosci\(\) \{[\s\S]*?\n\}\n/
);
if (!funkcja) {
  zle("brak funkcji przypomnijONiedokonczonejPlatnosci w server.js");
} else {
  ok("funkcja przypomnijONiedokonczonejPlatnosci istnieje");
}
const cialo = funkcja ? funkcja[0] : "";

// --- 0. Niedoplata ma wlasna rozmowe --------------------------------------
// Zamowienie niedoplacone zostaje w awaiting_transfer bez paid_at, a jego termin
// przesuwa sie o DNI_NA_DOPLATE. Bez tego warunku doba przed nowym terminem
// poszlaby prosba o przelew na PELNA kwote, zaraz po prosbie o sama roznice,
// i klient mogl zaplacic drugi raz.
if (!/transfer_asked_at IS NULL/.test(cialo)) {
  zle("brak warunku transfer_asked_at IS NULL: zamowienie z prosba o doplate dostaloby prosbe o pelna kwote");
} else {
  ok("zamowienie z prosba o doplate nie dostaje tego przypomnienia");
}

// --- 1. Wylacznie awaiting_transfer bez paid_at ---------------------------
if (!/status = 'awaiting_transfer' AND paid_at IS NULL/.test(cialo)) {
  zle("zapytanie nie ogranicza sie do awaiting_transfer bez paid_at: mail o platnosci, ktora juz doszla, bylby falszem");
} else {
  ok("zapytanie bierze wylacznie awaiting_transfer bez paid_at");
}

// --- 2. Jedno przypomnienie na zamowienie ---------------------------------
if (!/payment_reminded_at IS NULL/.test(cialo)) {
  zle("brak warunku payment_reminded_at IS NULL: przypomnienie mogloby pojsc wiele razy");
} else {
  ok("warunek payment_reminded_at IS NULL pilnuje jednego przypomnienia");
}

// Doba przed koncem rezerwacji, nie wiecej i nie mniej.
assert.match(cialo, /expires_at::date - CURRENT_DATE = 1/, "przypomnienie idzie dzien przed koncem rezerwacji");
ok("przypomnienie idzie dzien przed koncem rezerwacji");

// Adres jest wymagany, inaczej nie ma dokad wyslac.
assert.match(cialo, /customer_email IS NOT NULL/, "zapytanie wymaga adresu klienta");
ok("zapytanie wymaga adresu klienta");

// Celowo BEZ limitu jednej wiadomosci na dobe i BEZ wypisu z newslettera:
// to wiadomosc transakcyjna o wlasnym zamowieniu klienta, a nie marketing.
if (/pisalismyDzisiaj/.test(cialo)) {
  zle("funkcja sprawdza pisalismyDzisiaj: to jest mail transakcyjny, limit jednej wiadomosci na dobe tu nie obowiazuje");
} else {
  ok("bez limitu jednej wiadomosci na dobe, zgodnie z zamierzeniem");
}
if (/wypisany\(/.test(cialo)) {
  zle("funkcja sprawdza wypisany(): to jest mail transakcyjny o wlasnym zamowieniu, a nie marketing");
} else {
  ok("bez sprawdzania wypisu z newslettera, zgodnie z zamierzeniem");
}

// --- 3. Stempel PO wysylce, nie przed nia ---------------------------------
const idxSend = cialo.indexOf("sendPaymentReminder(pool, order.id, tr)");
const idxStamp = cialo.indexOf("payment_reminded_at = NOW()");
if (idxSend === -1 || idxStamp === -1) {
  zle("brak wywolania wysylki albo brak stempla w funkcji");
} else if (idxStamp < idxSend) {
  zle("stempel payment_reminded_at stoi PRZED wysylka: awaria poczty zamknelaby przypomnienie na zawsze po cichu");
} else {
  ok("stempel payment_reminded_at stoi PO udanej wysylce");
}

// --- 4. Kolumna, import i harmonogram --------------------------------------
assert.match(serwer, /ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reminded_at TIMESTAMPTZ/,
  "brak kolumny payment_reminded_at");
ok("kolumna payment_reminded_at jest dopisana");

assert.match(serwer, /import \{[\s\S]{0,400}sendPaymentReminder[\s\S]{0,400}\} from "\.\/orderMail\.js"/,
  "sendPaymentReminder nie jest zaimportowany z orderMail.js");
ok("sendPaymentReminder jest zaimportowany");

assert.match(serwer, /cron\.schedule\("0 8 \* \* \*", przypomnijONiedokonczonejPlatnosci, \{ timezone: "Europe\/Warsaw" \}\)/,
  "brak harmonogramu crona dla przypomnienia o platnosci");
ok("cron uruchamia przeglad codziennie o 8:00 czasu Warszawy");

// Dane do przelewu licza sie z tej samej stalej TRANSFER, co pierwsza
// wiadomosc, a nie z wlasnej kopii.
assert.match(cialo, /\.\.\.TRANSFER,/, "tr nie korzysta ze wspolnej stalej TRANSFER");
ok("dane do przelewu ida ze wspolnej stalej TRANSFER, tak jak w pierwszej wiadomosci");

// --- 5. Mail istnieje w trzech jezykach -------------------------------------
const zamowienie = {
  order_ref: "PR20260906-A1B2C3D4-1",
  customer_email: "klient@example.com",
  expires_at: new Date("2026-09-10T00:00:00"),
};
const tr = {
  iban: "PL00 0000 0000 0000 0000 0000 0000",
  bic: "TESTPLPW",
  holder: "AEJACA",
  bank: "Test Bank",
  reference: zamowienie.order_ref,
  amountEur: "123.45",
  dueAt: zamowienie.expires_at,
};

const tematy = new Set();
for (const jezyk of ["pl", "en", "de"]) {
  const mail = buildPaymentReminder({ ...zamowienie, lang: jezyk }, tr);
  if (!mail || !mail.subject || !mail.text || !mail.html) {
    zle(`${jezyk}: brak pelnej wiadomosci`);
    continue;
  }
  if (!mail.text.includes(zamowienie.order_ref)) {
    zle(`${jezyk}: mail bez numeru zamowienia`);
  }
  if (!mail.text.includes(tr.amountEur)) {
    zle(`${jezyk}: mail bez kwoty do przelewu`);
  }
  tematy.add(mail.subject);
}
if (tematy.size === 3) {
  ok("mail o przypomnieniu platnosci istnieje w trzech jezykach, kazdy z wlasnym tematem");
} else {
  zle(`tematy w trzech jezykach powinny byc rozne, jest ${tematy.size}`);
}

console.log(bledy ? `\n${bledy} bledow\n` : "\nPrzypomnienie o platnosci: wszystko sie zgadza\n");
process.exit(bledy ? 1 : 0);
