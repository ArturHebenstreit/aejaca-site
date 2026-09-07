#!/usr/bin/env node
// ============================================================
// ZAPYTANIA PUSZCZONE NA PRAWDZIWYM POSTGRESIE
// ============================================================
// Ta proba istnieje, bo dwa razy z rzedu naprawilismy blad, ktorego zaden
// sprawdzian nie umial potwierdzic ani obalic.
//
// 6 wrzesnia 2026 kazda zaplata z oferty konczyla sie piecsetka:
//   column "amount_eur_cents" is of type integer but expression is of type text
// Poprawilismy INSERT. 7 wrzesnia ta sama piecsetka wracala nadal, bo drugi
// zapis, ten z rabatem, mial ten sam blad w innym ksztalcie i wykonywal sie
// WYLACZNIE przy kodzie rabatowym.
//
// Czego nie widzi reszta naszych bramek: skladnia jest poprawna, `node --check`
// przechodzi, testy chodza na ATRAPACH bazy, a `check-parametry-sql.mjs` czyta
// ksztalt tekstu. Typ parametru rozstrzyga dopiero serwer Postgresa, wiec
// jedynym miejscem, w ktorym ten blad jest widoczny, jest Postgres.
//
// Ta proba bierze zapytania Z KODU (nie z kopii w tym pliku), zaklada tabele
// z prawdziwymi typami kolumn i puszcza je tym samym sterownikiem, ktorego
// uzywa produkcja.
//
// NIE STOI W `npm run build`: build leci na Cloudflare Pages, gdzie nie ma bazy.
// Uruchamia sie recznie, przy zmianie zapytania:
//
//   scripts/postgres-do-proby.sh start     # podnosi lokalny Postgres
//   npm run proba:sql
//   scripts/postgres-do-proby.sh stop
//
// Adres bazy bierze z PROBA_DATABASE_URL albo z domyslnego gniazda proby.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "../chat-api/node_modules/pg/lib/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const zrodlo = readFileSync(join(ROOT, "chat-api/quotes.js"), "utf8");

/** Zapytanie wyjete ze zrodla po fragmencie, ktory je rozpoznaje. */
function zapytanie(rozpoznanie, opis) {
  for (const m of zrodlo.matchAll(/`([^`]+)`/g)) {
    if (rozpoznanie.test(m[1])) return m[1];
  }
  console.error(`\nNie znalazlem w chat-api/quotes.js zapytania: ${opis}.`);
  console.error("Zapytanie zmienilo ksztalt, wiec ta proba przestala sprawdzac to, co miala.\n");
  process.exit(1);
}

const INSERT_ZAMOWIENIA = zapytanie(/INSERT INTO orders[\s\S]*amount_eur_cents/, "zapis zamowienia z oferty");
const UPDATE_RABATU = zapytanie(/UPDATE orders SET discount_code/, "zejscie rabatu z kwoty");

const pool = new pg.Pool(
  process.env.PROBA_DATABASE_URL
    ? { connectionString: process.env.PROBA_DATABASE_URL }
    : { host: process.env.PROBA_PGHOST || "/tmp/pg", port: Number(process.env.PROBA_PGPORT || 55432), user: "postgres", database: "postgres" }
);

let bledy = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const zle = (m, e) => { console.error(`  ✗ ${m}`); if (e) console.error(`      ${e.message} (kod ${e.code})`); bledy++; };

// Tabela z TYMI SAMYMI typami, co produkcja. Typ kolumny jest tu cala trescia
// proby: to o niego rozbija sie parametr wyslany bez typu.
await pool.query(`DROP TABLE IF EXISTS orders`);
await pool.query(`
  CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_ref VARCHAR(40) UNIQUE, status VARCHAR(30), kind VARCHAR(20), lang VARCHAR(5),
    items_total_grosze INTEGER, shipping_grosze INTEGER, total_grosze INTEGER,
    customer_email TEXT, customer_name TEXT, customer_phone TEXT,
    delivery_method TEXT, delivery_point TEXT, address_line1 TEXT, address_line2 TEXT,
    postal_code TEXT, city TEXT, country TEXT,
    access_token TEXT, ip_hash TEXT, expires_at TIMESTAMPTZ,
    credit_applied_grosze INTEGER, payment_method VARCHAR(20),
    amount_eur_cents INTEGER, eur_rate NUMERIC(10,4), eur_rate_locked_at TIMESTAMPTZ,
    accepted_terms_at TIMESTAMPTZ, waived_withdrawal_at TIMESTAMPTZ,
    lead_days INTEGER, requires_details BOOLEAN NOT NULL DEFAULT FALSE,
    discount_code VARCHAR(32), discount_grosze INTEGER NOT NULL DEFAULT 0
  )`);

const parametry = (ref, przelew) => [
  ref, "pl", 50000, 1949, 51949,
  "klient@example.com", "Klient", "+48111222333",
  "courier", null, "Ulica 1", null, "00-001", "Warszawa", "PL",
  "zeton", "haslo-ip", new Date(Date.now() + 900000), null,
  przelew ? "bank_transfer" : "autopay",
  new Date(), null,
  przelew ? 12000 : null,
  przelew ? 4.3 : null,
  przelew ? "awaiting_transfer" : "awaiting_payment",
  7, false,
];

console.log("\n1. Zamowienie z oferty ma sie zapisac obiema metodami platnosci\n");
const numery = {};
for (const [nazwa, przelew] of [["karta", false], ["przelew", true]]) {
  try {
    const { rows } = await pool.query(INSERT_ZAMOWIENIA, parametry(`ZAM-${nazwa}`, przelew));
    numery[nazwa] = rows[0].id;
    ok(`${nazwa}: zamowienie zapisane`);
  } catch (e) {
    zle(`${nazwa}: zapis zamowienia`, e);
  }
}

console.log("\n2. Rabat schodzi z kwoty, takze przy platnosci w euro\n");
for (const [nazwa, centy] of [["karta", null], ["przelew", 10800]]) {
  if (!numery[nazwa]) continue;
  try {
    await pool.query(UPDATE_RABATU, [numery[nazwa], "PROBA10", 5000, 46949, centy]);
    ok(`${nazwa}: rabat zapisany`);
  } catch (e) {
    zle(`${nazwa}: rabat`, e);
  }
}

console.log("\n3. W bazie stoi to, co mialo stac\n");
const { rows } = await pool.query(
  `SELECT order_ref, payment_method, total_grosze, discount_grosze, amount_eur_cents FROM orders ORDER BY id`
);
for (const r of rows) {
  const zgadza = r.total_grosze === 46949 && r.discount_grosze === 5000
    && (r.payment_method === "bank_transfer" ? r.amount_eur_cents === 10800 : r.amount_eur_cents === null);
  if (zgadza) ok(`${r.order_ref}: kwota po rabacie ${r.total_grosze}, w euro ${r.amount_eur_cents ?? "puste"}`);
  else zle(`${r.order_ref}: ${JSON.stringify(r)}`);
}

await pool.end();
console.log(bledy ? `\n${bledy} bledow\n` : "\nZapytania przechodza na zywym Postgresie\n");
process.exit(bledy ? 1 : 0);
