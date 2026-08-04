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

assert.deepEqual(Object.keys(removed).sort(),
  ["conversations", "events", "leads", "orderPersonalData", "paymentPayloads", "uploads"]);
assert.equal(pool.queries.length, 6, "szesc kategorii, szesc zapytan");

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

// --- Terminy zgodne z tym, co obiecuje polityka prywatnosci ---
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
