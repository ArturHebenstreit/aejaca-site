// Retencja kasuje dane bezpowrotnie, wiec sprawdzamy nie tylko to, CO usuwa,
// ale przede wszystkim czego NIE rusza. Zapytania sprawdzamy bez bazy: liczy
// sie ich tresc, a nie to, ze Postgres je wykona.

import assert from "node:assert/strict";
import { runRetention, RETENTION_DAYS, ANONYMISED_EMAIL } from "./retention.js";

function fakePool() {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
      return { rowCount: 1 };
    },
  };
}

const pool = fakePool();
const removed = await runRetention(pool);

// LISTE TRZYMAMY WPROST, a nie wyprowadzamy z kodu, i to jest celowe.
// Dopisanie kategorii kasujacej dane ma ZATRZYMAC ten test, zeby ktos musial
// swiadomie potwierdzic, ze wolno ja kasowac. Lista wyprowadzona z `removed`
// przyklepywalaby kazde nowe kasowanie sama z siebie.
assert.deepEqual(Object.keys(removed).sort(),
  ["conversations", "events", "leads", "orderPersonalData", "paymentPayloads",
   "quotes", "savedQuotes", "uploads"]);
// Liczbe zapytan wiazemy z liczba kategorii, zeby nie zostawala przy dawnej
// stalej. Kategoria bez zapytania albo zapytanie bez kategorii to blad.
assert.equal(pool.queries.length, Object.keys(removed).length,
  "kazda kategoria to dokladnie jedno zapytanie");

const q = (fragment) => pool.queries.find((x) => x.sql.includes(fragment));

// --- Czego NIE wolno ruszyc ---
assert.equal(q("DELETE FROM orders"), undefined, "wiersza zamowienia nie wolno skasowac, to dokument sprzedazy");
assert.equal(q("DELETE FROM payment_notifications"), undefined, "slad po platnosci zostaje");
assert.equal(q("FROM subscribers"), undefined, "zapisani do newslettera zostaja do wycofania zgody");
assert.equal(q("FROM discount_codes"), undefined);
assert.equal(q("FROM order_items"), undefined);

// --- Warunki chroniace dane powiazane z transakcja ---
const uploads = q("FROM uploads");
assert.match(uploads.sql, /order_id IS NULL/, "plik przypiety do zamowienia zyje razem z nim");
assert.deepEqual(uploads.params, ["30"]);

const leads = q("FROM leads");
assert.match(leads.sql, /quote_ref IS NULL/, "zapytanie zamienione w wycene to juz slad po transakcji");
assert.match(leads.sql, /contacted_at/, "liczy sie ostatni kontakt, nie sama data zalozenia");
assert.deepEqual(leads.params, ["730"]);

const conversations = q("FROM conversations");
assert.deepEqual(conversations.params, ["365"], "12 miesiecy, tak jak mowi polityka");

const events = q("FROM events");
assert.deepEqual(events.params, ["730"]);

// --- Wyceny: dwa terminy, jedna tabela ---
// `quotes` sprzata sie DWOMA zapytaniami, bo wycena zapisana z kalkulatora
// zyje 90 dni, a zapytanie o wycene reczna 24 miesiace. Gdyby ktores z nich
// zgubilo warunek na `source`, krotszy termin zjadlby dluzszy albo odwrotnie,
// i to bez sladu: kasowanie nie zglasza, ze skasowalo za duzo.
const wyceny = pool.queries.filter((x) => x.sql.includes("FROM quotes"));
assert.equal(wyceny.length, 2, "osobne zapytanie dla wyceny zapisanej i dla zapytania o wycene");

const zapisana = wyceny.find((x) => /source = 'saved'/.test(x.sql));
const reczna = wyceny.find((x) => /source, ''\) <> 'saved'/.test(x.sql));
assert.ok(zapisana, "brak zapytania obejmujacego wyceny zapisane z kalkulatora");
assert.ok(reczna, "brak zapytania obejmujacego zapytania o wycene reczna");
assert.deepEqual(zapisana.params, ["90"]);
assert.deepEqual(reczna.params, ["730"]);

// NAJWAZNIEJSZY WARUNEK W CALEJ RETENCJI WYCEN. Wycena przekuta w zamowienie
// przestaje byc zapytaniem, a staje sie czescia dokumentacji transakcji i ma
// zyc razem z nia. Bez tego warunku kasowalibysmy podstawe zlozonego
// zamowienia po 90 dniach, a wiersz zamowienia zostawalby bez tego, co
// klient faktycznie zamowil.
for (const w of wyceny) {
  assert.match(w.sql, /converted_order_id IS NULL/,
    "wycena, z ktorej powstalo zamowienie, nie moze byc kasowana");
}

// --- Terminy zgodne z tym, co obiecuje polityka prywatnosci ---
assert.equal(RETENTION_DAYS.quotes, 730);
assert.equal(RETENTION_DAYS.savedQuotes, 90);
assert.equal(RETENTION_DAYS.conversations, 365);
assert.equal(RETENTION_DAYS.leads, 730);
assert.equal(RETENTION_DAYS.events, 730);
assert.equal(RETENTION_DAYS.uploads, 30);

// --- Awaria jednej kategorii nie moze zatrzymac pozostalych ---
const kapryśny = {
  async query(sql) {
    if (sql.includes("FROM events")) throw new Error("relation does not exist");
    return { rowCount: 2 };
  },
};
const wynik = await runRetention(kapryśny);
assert.equal(wynik.events, null, "kategoria, ktora sie wywrocila, jest oznaczona");
assert.equal(wynik.conversations, 2, "reszta idzie dalej");

// --- Brak bazy nie moze wywrocic uslugi ---
assert.deepEqual(await runRetention(null), {});

// --- Kupujacy: dane osoby znikaja, dokument sprzedazy zostaje ---
const orders = q("UPDATE orders");
assert.ok(orders, "po terminie zamowienie musi zostac zanonimizowane");
assert.match(orders.sql, /customer_name = NULL/);
assert.match(orders.sql, /customer_phone = NULL/);
assert.match(orders.sql, /address_line1 = NULL/);
assert.match(orders.sql, /postal_code = NULL/);
assert.match(orders.sql, /city = NULL/);
assert.match(orders.sql, /ip_hash = NULL/);
assert.match(orders.sql, /customer_email = \$2/, "adresu nie da sie wyzerowac, kolumna jest NOT NULL");
assert.deepEqual(orders.params, ["2190", ANONYMISED_EMAIL], "szesc lat, czyli dluzszy z dwoch terminow");

// Kwoty, daty i numer zamowienia maja przetrwac: bez nich nie ma dokumentu sprzedazy
for (const kolumna of ["total_grosze", "order_ref", "paid_at", "status"]) {
  assert.doesNotMatch(orders.sql, new RegExp(`${kolumna}\\s*=`), `${kolumna} musi zostac nietkniete`);
}

// Powtarzalnosc: drugi przebieg nie moze liczyc w kolko tych samych wierszy
assert.match(orders.sql, /customer_email <> \$2/, "juz zanonimizowane wiersze wypadaja z warunku");

// Termin liczy sie od zaplaty, a przy zamowieniu nieoplaconym od zalozenia
assert.match(orders.sql, /COALESCE\(paid_at, created_at\)/);

// --- Zaladunek od bramki znika, sam slad po platnosci zostaje ---
const payments = q("UPDATE payment_notifications");
assert.match(payments.sql, /raw_xml = NULL/);
assert.deepEqual(payments.params, ["365"]);
assert.doesNotMatch(payments.sql, /payment_status\s*=/, "status platnosci zostaje");

assert.equal(RETENTION_DAYS.orderPersonalData, 2190);
assert.equal(RETENTION_DAYS.paymentPayloads, 365);
assert.match(ANONYMISED_EMAIL, /\.invalid$/, "adres zastepczy nie moze prowadzic do prawdziwej skrzynki");

console.log("Retencja: wszystkie sprawdzenia przeszly");
