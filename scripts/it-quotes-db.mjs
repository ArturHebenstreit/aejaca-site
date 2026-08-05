// ============================================================
// ZAPISANA WYCENA: TEST NA PRAWDZIWEJ BAZIE
// ============================================================
// Sprawdza SQL, a nie arytmetyke: kolejnosc pozycji, nowe kolumny, zlaczenie
// z uploadami, sciezke migracji ze starego ksztaltu tabeli i retencje.
//
// TEN TEST NIE WCHODZI DO BUILDA, bo wymaga bazy, ktorej build nie ma.
// Znalazl blad, ktorego zaden test arytmetyki nie mial szansy zlapac:
// `quote_items.id` wraca z bazy jako TEKST, wiec mapa po surowym id nie
// trafiala nigdy i kazde wycenianie konczylo sie bledem. Wart uruchomienia
// przy kazdej zmianie w `quotes.js`.
//
// Uruchomienie (Postgres na gniezdzie uniksowym):
//   psql -h /pgtest -p 5433 -U postgres -c "CREATE DATABASE aejaca_test"
//   for f in orders uploads quotes; do psql ... -f scripts/$f-schema.sql; done
//   node scripts/it-quotes-db.mjs
//
// UWAGA: skrypt CZYSCI tabele quotes, quote_items, uploads i orders.
// Nigdy nie kieruj go na baze produkcyjna.

import pg from "pg";
import { createQuote, priceQuote, getQuoteByRef, repriceSavedItem, SAVED_QUOTE_SOURCE } from "../chat-api/quotes.js";
import { priceItem } from "../chat-api/orders.js";
import { runRetention } from "../chat-api/retention.js";
import { SERVICES } from "../src/data/orderCatalog.js";

const pool = new pg.Pool({ host: "/pgtest", port: 5433, user: "postgres", database: "aejaca_test" });

let failed = 0;
const ok = (name, cond, detail = "") => {
  console.log(`${cond ? "  ok" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  if (!cond) failed++;
};

function paramsFor(calculator) {
  const svc = SERVICES.find((s) => s.calculator === calculator);
  const p = { ...(svc.defaults || {}), ...(svc.fixed || {}) };
  for (const f of svc.fields || []) {
    if (p[f.key] !== undefined) continue;
    const opts = f.optionsFrom ? f.optionsFrom(svc.defaults) : f.options;
    if (!opts?.length) continue;
    p[f.key] = f.multi ? [opts[0].id] : opts[0].id;
  }
  return p;
}

const RATES = { au_pln_per_g: 300, ag_pln_per_g: 10, pln_per_eur: 4.25 };
const RATES_UP = { ...RATES, au_pln_per_g: 360, ag_pln_per_g: 12 };

// ------------------------------------------------------------
// 0. Sciezka migracji: baza produkcyjna ma STARY ksztalt
// ------------------------------------------------------------
console.log("Zapisana wycena na prawdziwej bazie\n");
await pool.query("TRUNCATE quotes, quote_items, uploads, orders, order_items RESTART IDENTITY CASCADE");
{
  await pool.query(`ALTER TABLE quotes DROP COLUMN IF EXISTS rates_snapshot`);
  await pool.query(`ALTER TABLE quote_items DROP COLUMN IF EXISTS scale`);
  await pool.query(`ALTER TABLE quotes ALTER COLUMN customer_email SET NOT NULL`);

  // Dokladnie te zapytania, ktore odpala chat-api przy starcie.
  await pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rates_snapshot JSONB`);
  await pool.query(`ALTER TABLE quotes ALTER COLUMN customer_email DROP NOT NULL`);
  await pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS scale NUMERIC(6,3)`);

  const { rows } = await pool.query(`
    SELECT column_name, is_nullable FROM information_schema.columns
     WHERE table_name IN ('quotes','quote_items')
       AND column_name IN ('rates_snapshot','scale','customer_email')`);
  const by = Object.fromEntries(rows.map((r) => [r.column_name, r.is_nullable]));
  ok("migracja dodaje rates_snapshot", by.rates_snapshot === "YES");
  ok("migracja dodaje scale", by.scale === "YES");
  ok("migracja zdejmuje NOT NULL z adresu e-mail", by.customer_email === "YES");
}

// ------------------------------------------------------------
// 1. Zapis bez adresu e-mail
// ------------------------------------------------------------
const jewelryParams = paramsFor("jewelry_new");
const printParams = paramsFor("print3d_fdm");

let ref, tokenA;
{
  const up = await pool.query(
    `INSERT INTO uploads (token, status, file_name) VALUES ('tok-test-1','pending','model.stl') RETURNING id`
  );
  const uploadId = up.rows[0].id;

  const unitJewelry = priceItem({ calculator: "jewelry_new", params: jewelryParams, rates: RATES }).unitGrosze;

  const created = await createQuote(pool, {
    email: null, allowAnonymous: true, lang: "pl", source: SAVED_QUOTE_SOURCE,
    ratesSnapshot: RATES,
    items: [
      { calculator: "jewelry_new", title: "Bizuteria", qty: 1, params: jewelryParams },
      { calculator: "print3d_fdm", title: "Druk", qty: 2, params: printParams, uploadId, fileName: "model.stl", scale: 1.5 },
    ],
  });
  ref = created.quoteRef;
  tokenA = created.accessToken;

  ok("zapis bez adresu e-mail przechodzi", Boolean(ref), ref);
  ok("numer wyceny ma wlasciwy ksztalt", /^WY\d{8}-[A-Z0-9]{8}$/.test(ref), ref);

  await priceQuote(pool, ref, [], null, 14).catch(() => {});
  const stored = await getQuoteByRef(pool, ref);
  await priceQuote(pool, ref, [
    { id: stored.items[0].id, unitGrosze: unitJewelry },
    { id: stored.items[1].id, unitGrosze: 5000 },
  ], null, 14);
}

// ------------------------------------------------------------
// 2. Odczyt: kolejnosc, skala, plik, kursy
// ------------------------------------------------------------
{
  const q = await getQuoteByRef(pool, ref);
  ok("wycena jest wyceniona od razu", q.status === "priced", q.status);
  ok("kolejnosc pozycji sie nie przestawia", q.items[0].calculator === "jewelry_new" && q.items[1].calculator === "print3d_fdm");
  ok("skala wraca z bazy", Number(q.items[1].scale) === 1.5, String(q.items[1].scale));
  ok("plik jest zlaczony po tokenie", q.items[1].upload_token === "tok-test-1");
  ok("kursy z chwili zapisu sa zachowane", Number(q.rates_snapshot?.ag_pln_per_g) === 10);
  ok("suma to suma pozycji", q.total_grosze === q.items[0].line_grosze + q.items[1].line_grosze,
     `${q.total_grosze} = ${q.items[0].line_grosze} + ${q.items[1].line_grosze}`);
  ok("naklad mnozy pozycje", q.items[1].line_grosze === 5000 * 2);

  const validUntil = new Date(q.valid_until);
  const days = Math.round((validUntil - new Date()) / 86400_000);
  ok("waznosc to 14 dni", days >= 13 && days <= 14, `${days} dni`);
}

// ------------------------------------------------------------
// 3. Przeliczenie przy otwarciu, na danych z bazy
// ------------------------------------------------------------
{
  const q = await getQuoteByRef(pool, ref);
  const jew = repriceSavedItem(q.items[0], { ratesAtSave: q.rates_snapshot, ratesNow: RATES_UP, lang: "pl" });
  const prn = repriceSavedItem(q.items[1], { ratesAtSave: q.rates_snapshot, ratesNow: RATES_UP, lang: "pl" });

  ok("bizuteria z bazy przelicza sie po kursie", jew.repriced && jew.unitGrosze > q.items[0].unit_grosze,
     `${(q.items[0].unit_grosze / 100).toFixed(2)} -> ${(jew.unitGrosze / 100).toFixed(2)} PLN`);
  ok("druk z bazy zostaje bez zmian", !prn.repriced && prn.unitGrosze === 5000);
}

// ------------------------------------------------------------
// 4. Retencja: znika stare, zostaje przekute w zamowienie
// ------------------------------------------------------------
{
  const old = await createQuote(pool, {
    email: "stary@example.com", lang: "pl", source: SAVED_QUOTE_SOURCE,
    items: [{ calculator: "print3d_fdm", title: "Stare", qty: 1, params: printParams }],
  });
  await pool.query(`UPDATE quotes SET created_at = NOW() - INTERVAL '200 days' WHERE quote_ref = $1`, [old.quoteRef]);

  const converted = await createQuote(pool, {
    email: "kupil@example.com", lang: "pl", source: SAVED_QUOTE_SOURCE,
    items: [{ calculator: "print3d_fdm", title: "Kupione", qty: 1, params: printParams }],
  });
  const ord = await pool.query(
    `INSERT INTO orders (order_ref, status, kind, lang, items_total_grosze, shipping_grosze, total_grosze, customer_email, access_token)
     VALUES ('ZM-TEST-1','paid','quoted','pl',1000,0,1000,'kupil@example.com','tok-order-1') RETURNING id`
  );
  await pool.query(
    `UPDATE quotes SET created_at = NOW() - INTERVAL '200 days', converted_order_id = $2 WHERE quote_ref = $1`,
    [converted.quoteRef, ord.rows[0].id]
  );

  const rfq = await createQuote(pool, {
    email: "pytanie@example.com", lang: "pl", source: "contact",
    items: [{ calculator: "print3d_fdm", title: "Zapytanie", qty: 1, params: printParams }],
  });
  await pool.query(`UPDATE quotes SET created_at = NOW() - INTERVAL '200 days' WHERE quote_ref = $1`, [rfq.quoteRef]);

  const itemsBefore = Number((await pool.query(`SELECT COUNT(*)::int c FROM quote_items`)).rows[0].c);
  await runRetention(pool);

  const alive = async (r) => Number((await pool.query(`SELECT COUNT(*)::int c FROM quotes WHERE quote_ref = $1`, [r])).rows[0].c);
  ok("zapisana wycena po 200 dniach znika", (await alive(old.quoteRef)) === 0);
  ok("wycena przekuta w zamowienie zostaje", (await alive(converted.quoteRef)) === 1);
  ok("zapytanie o wycene reczna zostaje do 24 miesiecy", (await alive(rfq.quoteRef)) === 1);
  ok("swieza wycena zostaje", (await alive(ref)) === 1);

  const itemsAfter = Number((await pool.query(`SELECT COUNT(*)::int c FROM quote_items`)).rows[0].c);
  ok("pozycje znikaja razem z wycena", itemsAfter === itemsBefore - 1, `${itemsBefore} -> ${itemsAfter}`);
}

await pool.end();
console.log(failed ? `\n${failed} bledow` : "\nWszystko sie zgadza");
process.exit(failed ? 1 : 0);
