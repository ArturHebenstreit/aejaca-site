#!/usr/bin/env node
// ============================================================
// DOPISANIE USTALEN DO ZAMOWIENIA, KTORE POWSTALO PRZED ZNACZNIKAMI
// ============================================================
// Zamowienia zlozone przed 2026-08-30 nie maja znacznikow ustalen przy
// pozycjach, bo tych kolumn wtedy nie bylo. Takie zlecenie wpada po zaplacie
// prosto do kolejki i zegar rusza, choc czeka na rozmowe z klientem.
//
// Skrypt dopisuje znaczniki i cofa zamowienie do ustalania szczegolow. Cofa
// przy tym takze termin i slad po wyslanych przypomnieniach: termin policzony
// z pracy, ktora sie nie zaczela, jest data wymyslona, a progi raz wyslane nie
// odezwalyby sie po drugim podejsciu.
//
//   DATABASE_URL=postgres://... node scripts/napraw-ustalenia-zamowienia.mjs AE20260827-3C1A1F40
//   ... --lead-days 21                 ustawia termin realizacji
//   ... --pozycje 3,5                  tylko te pozycje wymagaja ustalen
//   ... --apply                         zapisuje; bez tego tylko pokazuje
//
// Bez `--apply` skrypt NICZEGO nie zmienia. Kasowanie i cofanie statusu
// oplaconego zamowienia to nie jest rzecz do zrobienia przez pomylke w numerze.

import pg from "pg";

const { Pool } = pg;
const args = process.argv.slice(2);
const ref = args.find((a) => !a.startsWith("--"));
const zapisz = args.includes("--apply");
const wartosc = (nazwa) => {
  const i = args.indexOf(nazwa);
  return i >= 0 ? args[i + 1] : null;
};
const dni = wartosc("--lead-days") ? Number(wartosc("--lead-days")) : null;
const wybrane = wartosc("--pozycje")
  ? wartosc("--pozycje").split(",").map((x) => Number(x.trim())).filter(Number.isInteger)
  : null;

if (!ref) {
  console.error("Podaj numer zamowienia, np. AE20260827-3C1A1F40");
  process.exit(1);
}
if (dni !== null && (!Number.isInteger(dni) || dni < 1 || dni > 365)) {
  console.error("--lead-days musi byc liczba calkowita od 1 do 365");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Brak DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway") ? { rejectUnauthorized: false } : false,
});

const klient = await pool.connect();
try {
  await klient.query("BEGIN");
  const { rows } = await klient.query(
    `SELECT id, order_ref, status, lead_days, deadline_at, requires_details
       FROM orders WHERE order_ref = $1 FOR UPDATE`,
    [ref]
  );
  const zam = rows[0];
  if (!zam) throw new Error(`Nie ma zamowienia ${ref}`);

  // Poza etapami przed praca cofanie na ustalenia znaczyloby, ze cofamy takze
  // prace, ktora juz zostala zrobiona. To jest decyzja, a nie poprawka danych.
  if (!["paid", "queued", "details"].includes(zam.status)) {
    throw new Error(`Zamowienie ma status ${zam.status}, a skrypt cofa tylko sprzed wziecia do pracy`);
  }

  const { rows: poz } = await klient.query(
    `SELECT id, title, qty, requires_details, details_settled_at
       FROM order_items WHERE order_id = $1 ORDER BY id`,
    [zam.id]
  );
  if (!poz.length) throw new Error("Zamowienie nie ma pozycji");

  const doOznaczenia = wybrane ? poz.filter((i) => wybrane.includes(Number(i.id))) : poz;
  if (!doOznaczenia.length) throw new Error("Zaden z podanych numerow pozycji nie nalezy do tego zamowienia");

  console.log(`\n${zam.order_ref}, status ${zam.status}, termin ${zam.lead_days ?? "brak"} dni, na kiedy ${zam.deadline_at ? String(zam.deadline_at).slice(0, 10) : "brak"}`);
  console.log("\nPozycje:");
  for (const i of poz) {
    const zmiana = doOznaczenia.includes(i) ? "  <- wymaga ustalen" : "";
    console.log(`  [${i.id}] ${i.qty} x ${i.title}${i.requires_details ? " (juz wymaga)" : ""}${zmiana}`);
  }
  console.log(`\nPo zmianie: status details, termin ${dni ?? zam.lead_days ?? "brak"} dni, "na kiedy" wyczyszczone do czasu domkniecia ustalen.`);

  if (!zapisz) {
    await klient.query("ROLLBACK");
    console.log("\nPodglad. Zeby zapisac, powtorz z --apply\n");
    process.exit(0);
  }

  await klient.query(
    `UPDATE order_items SET requires_details = TRUE, details_settled_at = NULL WHERE id = ANY($1::bigint[])`,
    [doOznaczenia.map((i) => i.id)]
  );
  await klient.query(
    `UPDATE orders
        SET status = 'details',
            requires_details = TRUE,
            details_at = COALESCE(details_at, NOW()),
            queued_at = NULL,
            deadline_at = NULL,
            reminders_sent = '[]'::jsonb,
            lead_days = COALESCE($2::integer, lead_days),
            updated_at = NOW()
      WHERE id = $1`,
    [zam.id, dni]
  );
  await klient.query("COMMIT");
  console.log(`\nZapisane. ${ref} czeka teraz na domkniecie ustalen w panelu, w sekcji Kolejka.\n`);
} catch (e) {
  await klient.query("ROLLBACK").catch(() => {});
  console.error(`\nBlad: ${e.message}\n`);
  process.exitCode = 1;
} finally {
  klient.release();
  await pool.end();
}
