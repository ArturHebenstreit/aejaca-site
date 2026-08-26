#!/usr/bin/env node
// ============================================================
// UKLAD WYBORU W OFERCIE: TEST NA PRAWDZIWEJ BAZIE
// ============================================================
// Sprawdza to, czego nie widac w arytmetyce: czy termin waznosci NAPRAWDE
// zapisuje sie w bazie, czy dwie niezalezne grupy wariantow zyja obok siebie
// i czy przestawienie domyslnego zaznaczenia w panelu przezywa zapis.
//
// Powstal, bo wlasciciel zglosil trzy rzeczy naraz: "termin nie zapisuje sie
// i wraca 14 dni", "nie da sie zrobic dwoch grup jednokrotnego wyboru" i "nie
// da sie ustawic domyslnie zaznaczonego pola". Zaden test tekstowy nie potrafi
// tego rozstrzygnac, bo wszystkie trzy dotycza tego, co zostaje W BAZIE po
// zapisie z formularza.
//
// TEN TEST NIE WCHODZI DO BUILDA, bo wymaga bazy, ktorej build nie ma.
//
// Uruchomienie (Postgres na gniezdzie uniksowym):
//   psql -h /pgtest -p 5433 -U postgres -c "CREATE DATABASE aejaca_test"
//   for f in orders uploads quotes; do psql ... -f scripts/$f-schema.sql; done
//   node scripts/it-offer-groups.mjs
//
// Gniazdo i port zmienia sie zmiennymi PGTEST_SOCKET i PGTEST_PORT.
//
// UWAGA: skrypt CZYSCI tabele quotes i quote_items.
// Nigdy nie kieruj go na baze produkcyjna.
import pg from "pg";
import { createQuote, updateQuote, getQuoteByRef, selectedQuoteItems, quoteAmountGrosze, chooseQuoteOption } from "../chat-api/quotes.js";

const pool = new pg.Pool({ host: process.env.PGTEST_SOCKET || "/pgtest", port: Number(process.env.PGTEST_PORT) || 5433, user: "postgres", database: "aejaca_test" });
let zle = 0;
const ok = (n, c, d = "") => { console.log(`${c ? "  ok" : "FAIL"}  ${n}${d ? `  ${d}` : ""}`); if (!c) zle++; };
const dzien = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const za = (n) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

await pool.query("TRUNCATE quotes, quote_items RESTART IDENTITY CASCADE");

const { quoteRef } = await createQuote(pool, {
  email: "test@aejaca.com", lang: "pl", source: "phone",
  items: [{ title: "Wydruk klucz 56 mm" }, { title: "Wydruk klucz 68 mm" }, { title: "Polerowanie" },
          { title: "Odlew pierscionka" }, { title: "Odlew sygnetu" }],
});
const poz = async () => (await getQuoteByRef(pool, quoteRef)).items;
const id = async (n) => (await poz())[n].id;

// --- 1. Kwoty i rodzaje jednym zapisem ------------------------------------
const P = await poz();
let r = await updateQuote(pool, quoteRef, {
  items: [
    { id: P[0].id, title: "Wydruk klucz 56 mm", qty: 1, unitGrosze: 4000, kind: "variant", groupKey: "klucz", selected: true },
    { id: P[1].id, title: "Wydruk klucz 68 mm", qty: 1, unitGrosze: 4500, kind: "variant", groupKey: "klucz", selected: false },
    { id: P[2].id, title: "Polerowanie", qty: 1, unitGrosze: 3000, kind: "option", groupKey: "klucz", selected: true },
    { id: P[3].id, title: "Odlew pierscionka", qty: 1, unitGrosze: 80000, kind: "variant", groupKey: "odlew", selected: true },
    { id: P[4].id, title: "Odlew sygnetu", qty: 1, unitGrosze: 95000, kind: "variant", groupKey: "odlew", selected: false },
  ],
});
ok("dwie niezalezne grupy jednokrotnego wyboru", r.totalGrosze === 4000 + 3000 + 80000, `${r.totalGrosze} gr`);
ok("wpisanie kwot czyni z zapytania oferte", r.status === "priced", r.status);
ok("bez podania terminu wchodzi domyslny", dzien(r.validUntil) === za(14), String(r.validUntil));

// --- 2. Termin waznosci ----------------------------------------------------
r = await updateQuote(pool, quoteRef, { validDays: "30" });
ok("waznosc w dniach zapisuje sie", dzien(r.validUntil) === za(30), String(r.validUntil));
let swiezy = await getQuoteByRef(pool, quoteRef);
ok("waznosc siedzi w bazie", dzien(swiezy.valid_until) === za(30), String(swiezy.valid_until));

r = await updateQuote(pool, quoteRef, { validUntil: "2026-12-24", validDays: "" });
ok("waznosc data zapisuje sie, gdy dni sa puste", dzien(r.validUntil) === "2026-12-24", String(r.validUntil));

// Tak wyglada zapis z panelu: OBA pola jada zawsze, dni wypelnione.
r = await updateQuote(pool, quoteRef, { validUntil: "2026-12-24", validDays: "7" });
ok("dni maja pierwszenstwo przed stara data z formularza", dzien(r.validUntil) === za(7), String(r.validUntil));

// Zapis bez dotykania terminu nie moze go zresetowac.
r = await updateQuote(pool, quoteRef, { items: [{ id: P[0].id, unitGrosze: 4100 }], validUntil: "2026-12-31", validDays: "" });
r = await updateQuote(pool, quoteRef, { items: [{ id: P[0].id, unitGrosze: 4200 }] });
ok("zapis bez pol terminu nie rusza terminu", dzien(r.validUntil) === "2026-12-31", String(r.validUntil));

// --- 2b. Waluta oferty -----------------------------------------------------
{
  const niemiecka = await createQuote(pool, {
    email: "de@aejaca.com", lang: "de", source: "email",
    items: [{ title: "Odlew sygnetu" }],
  });
  const q = await getQuoteByRef(pool, niemiecka.quoteRef);
  ok("niemiecka wycena zaczyna od euro", q.currency === "EUR", String(q.currency));

  const polska = await getQuoteByRef(pool, quoteRef);
  ok("polska wycena zaczyna od zlotowek", polska.currency === "PLN", String(polska.currency));

  await updateQuote(pool, quoteRef, { currency: "EUR" });
  ok("panel zmienia walute oferty", (await getQuoteByRef(pool, quoteRef)).currency === "EUR");

  let blad = null;
  try { await updateQuote(pool, quoteRef, { currency: "USD" }); } catch (e) { blad = e; }
  ok("waluta spoza listy jest odrzucana", blad?.code === "bad_currency", blad?.message || "brak bledu");
  await updateQuote(pool, quoteRef, { currency: "PLN" });
}

// --- 2c. Liczba dni pokazana w panelu nie przesuwa terminu ------------------
// Pole "Wazna przez, dni" pokazuje teraz liczbe dni, ktora zostala. Zapis tej
// samej liczby MUSI dawac te sama date, inaczej kazda poprawka literowki
// przedluzalaby oferte.
{
  await updateQuote(pool, quoteRef, { validDays: "21" });
  const przed = await getQuoteByRef(pool, quoteRef);
  const dzisiaj = new Date(new Date().toISOString().slice(0, 10));
  const zostalo = Math.round((new Date(dzien(przed.valid_until)) - dzisiaj) / 86400000);
  await updateQuote(pool, quoteRef, { validDays: String(zostalo) });
  const po = await getQuoteByRef(pool, quoteRef);
  ok("zapis pokazanej liczby dni nie przesuwa terminu", dzien(po.valid_until) === dzien(przed.valid_until),
     `${dzien(przed.valid_until)} -> ${dzien(po.valid_until)}, pokazane ${zostalo} dni`);
}

// --- 3. Zmiana domyslnego zaznaczenia w grupie -----------------------------
const Q = await poz();
r = await updateQuote(pool, quoteRef, {
  items: [
    { id: Q[0].id, kind: "variant", groupKey: "klucz", selected: false },
    { id: Q[1].id, kind: "variant", groupKey: "klucz", selected: true },
    { id: Q[2].id, kind: "option", groupKey: "klucz", selected: false },
    { id: Q[3].id, kind: "variant", groupKey: "odlew", selected: false },
    { id: Q[4].id, kind: "variant", groupKey: "odlew", selected: true },
  ],
});
ok("przestawienie domyslnego wariantu w obu grupach", r.totalGrosze === 4500 + 95000, `${r.totalGrosze} gr`);
const po = await getQuoteByRef(pool, quoteRef);
ok("odznaczony dodatek zostaje odznaczony", po.items[2].selected === false);
ok("w grupie klucz zaznaczony jest dokladnie jeden", po.items.filter((i) => i.group_key === "klucz" && i.kind === "variant" && i.selected).length === 1);

// --- 4. Wybor klienta ------------------------------------------------------
const w = await chooseQuoteOption(pool, quoteRef, Q[2].id, true);
ok("klient wlacza dodatek", w.totalGrosze === 4500 + 95000 + 3000, `${w.totalGrosze} gr`);
const w2 = await chooseQuoteOption(pool, quoteRef, Q[3].id, true);
ok("klient przestawia wariant w drugiej grupie", w2.totalGrosze === 4500 + 80000 + 3000, `${w2.totalGrosze} gr`);
const stan = await getQuoteByRef(pool, quoteRef);
ok("zaznaczenie w pierwszej grupie zostalo nietkniete", selectedQuoteItems(stan).map((i) => Number(i.id)).join(",") === [Q[1].id, Q[2].id, Q[3].id].map(Number).join(","),
   selectedQuoteItems(stan).map((i) => i.title).join(" + "));
ok("kwota naglowka zgadza sie z ukladem", stan.total_grosze === quoteAmountGrosze(stan), `${stan.total_grosze} vs ${quoteAmountGrosze(stan)}`);

await pool.end();
console.log(zle ? `\n${zle} bledow\n` : "\nWszystko sie zgadza\n");
process.exit(zle ? 1 : 0);
