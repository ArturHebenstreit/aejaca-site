// Retencja kasuje dane bezpowrotnie, wiec sprawdzamy nie tylko to, CO usuwa,
// ale przede wszystkim czego NIE rusza. Zapytania sprawdzamy bez bazy: liczy
// sie ich tresc, a nie to, ze Postgres je wykona.

import assert from "node:assert/strict";
import { runRetention, RETENTION_DAYS } from "./retention.js";

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

assert.deepEqual(Object.keys(removed).sort(), ["conversations", "events", "leads", "uploads"]);
assert.equal(pool.queries.length, 4, "cztery kategorie, cztery zapytania");

const q = (fragment) => pool.queries.find((x) => x.sql.includes(fragment));

// --- Czego NIE wolno ruszyc ---
assert.equal(q("FROM orders"), undefined, "zamowien nie kasuje zadanie, trzyma je obowiazek podatkowy");
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

console.log("Retencja: wszystkie sprawdzenia przeszly");
