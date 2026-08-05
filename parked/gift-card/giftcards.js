// ============================================================
// KARTY PODARUNKOWE
// ============================================================
// Karta podarunkowa jest przedplata, a nie znizka, i to zmienia trzy rzeczy
// wzgledem `discounts.js`:
//
//   1. Pokrywa TAKZE wysylke, bo klient juz za nia zaplacil. Rabat nie
//      pokrywa wysylki w zadnym wariancie.
//   2. Ma saldo. Karta 500 zl uzyta na zamowienie 320 zl zostawia 180 zl na
//      pozniej, wiec ta sama karta pojawia sie w kasie wiele razy.
//   3. Schodzi na samym koncu, od sumy do zaplaty juz po rabacie i po
//      wysylce. Odwrotna kolejnosc doplacalaby rabat, ktorego nikt nie kupil.
//
// Rezerwacja dziala tak samo, jak przy rabatach i przy towarze: powstaje przy
// skladaniu zamowienia, wygasa sama, a saldo schodzi dopiero przy zaplacie.
// Porzucony koszyk nie zjada karty. Termin rezerwacji jest ten sam, co przy
// rabacie i przy towarze, wiec klient dostaje jedna date, a nie trzy.

import { randomInt } from "node:crypto";
import { redemptionExpiry } from "./discounts.js";

export class GiftCardError extends Error {
  constructor(message, code, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}

/** Ile miesiecy karta jest wazna od wydania. */
export const VALIDITY_MONTHS = 12;

/** Dopuszczalny nominal: od 100 do 10 000 zl. Dolna granica bierze sie z tego,
 *  ze ponizej stu zlotych karta nie pokryje nawet najtanszej pozycji z polki,
 *  a gorna z limitu, powyzej ktorego wolimy rozmowe niz formularz. */
export const MIN_AMOUNT_GROSZE = 100_00;
export const MAX_AMOUNT_GROSZE = 10_000_00;

export function normalizeGiftCode(raw) {
  return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function validUntil(from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + VALIDITY_MONTHS);
  return d;
}

// Ten sam alfabet, co przy kodach rabatowych: bez znakow, ktore myla sie przy
// przepisywaniu z wydrukowanej karty (0/O, 1/I/L, 5/S, 8/B).
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY2346789";

/**
 * Karta podarunkowa to pieniadz na okaziciela, wiec losujemy generatorem
 * kryptograficznym. `Math.random()` odpada: kto zna kilka wynikow, odtworzy
 * stan generatora i wyliczy kolejne kody, a tu kazdy trafiony kod to realna
 * kwota do wydania w sklepie.
 *
 * Osiem znakow z 27-znakowego alfabetu to okolo 40 bitow. Przy limicie prob
 * na adres IP zgadywanie jest bez sensu, a kod pozostaje przepisywalny
 * przez telefon.
 */
export function randomGiftCode() {
  const pick = (n) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `AEJ-${pick(4)}-${pick(4)}`;
}

// ------------------------------------------------------------
// Odczyt
// ------------------------------------------------------------

async function fetchCard(db, code, { lock = false } = {}) {
  const normalized = normalizeGiftCode(code);
  if (!normalized) throw new GiftCardError("Podaj numer karty", "empty");

  // Przy blokadzie czytamy z tabeli, bo `FOR UPDATE` nie dziala na widoku
  // agregujacym. Dostepna kwote liczymy wtedy osobnym zapytaniem, juz pod
  // blokada, wiec wynik jest spojny.
  const { rows } = await db.query(
    lock
      ? `SELECT * FROM gift_cards WHERE code = $1 FOR UPDATE`
      : `SELECT * FROM gift_cards_available WHERE code = $1`,
    [normalized]
  );
  const row = rows[0];
  if (!row) throw new GiftCardError("Nie znamy takiej karty", "not_found");

  if (lock) {
    const { rows: r } = await db.query(
      `SELECT COALESCE(SUM(amount_grosze), 0)::INTEGER AS held
         FROM gift_card_redemptions
        WHERE card_id = $1 AND consumed_at IS NULL AND released_at IS NULL AND expires_at > NOW()`,
      [row.id]
    );
    row.available_grosze = Math.max(row.balance_grosze - r[0].held, 0);
  }
  return row;
}

function assertUsable(row) {
  if (!row.active) throw new GiftCardError("Ta karta zostala zablokowana", "inactive");
  if (new Date(row.valid_to) <= new Date()) {
    throw new GiftCardError("Waznosc tej karty uplynela", "expired", { validTo: row.valid_to });
  }
  if (row.available_grosze <= 0) {
    throw new GiftCardError("Ta karta zostala juz w calosci wykorzystana", "empty_balance");
  }
}

/**
 * Ile karta pokryje z podanej kwoty do zaplaty.
 *
 * `payableGrosze` to suma PO rabacie i Z wysylka, czyli dokladnie to, co
 * klient ma zaplacic. Karta nie zna pozycji koszyka i nie ma powodu ich znac.
 */
export function coverFor(row, payableGrosze) {
  return Math.max(0, Math.min(row.available_grosze, payableGrosze));
}

/** Podglad dla kasy i dla sprawdzenia salda na stronie karty. */
export async function previewGiftCard(pool, { code, payableGrosze = 0 }) {
  const row = await fetchCard(pool, code);
  assertUsable(row);
  return {
    code: row.code,
    availableGrosze: row.available_grosze,
    initialGrosze: row.initial_grosze,
    validTo: row.valid_to,
    coverGrosze: coverFor(row, payableGrosze),
  };
}

// ------------------------------------------------------------
// Rezerwacja i rozliczenie
// ------------------------------------------------------------

/**
 * Rezerwacja karty pod zamowienie. Wiersz karty blokujemy na czas sprawdzenia,
 * wiec dwa rownolegle zamowienia na te sama karte ustawiaja sie w kolejce
 * zamiast obydwa zobaczyc pelne saldo.
 *
 * Wywolywac wewnatrz tej samej transakcji, co zapis zamowienia.
 */
export async function reserveGiftCard(client, { code, email, payableGrosze, orderId, paymentMethod }) {
  const row = await fetchCard(client, code, { lock: true });
  assertUsable(row);

  const cover = coverFor(row, payableGrosze);
  if (cover <= 0) throw new GiftCardError("Ta karta nie pokryje tego zamowienia", "no_cover");

  await client.query(
    `INSERT INTO gift_card_redemptions (card_id, order_id, email, amount_grosze, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [row.id, orderId, String(email || "").trim().toLowerCase(), cover, redemptionExpiry(paymentMethod)]
  );

  return { code: row.code, giftGrosze: cover };
}

/**
 * Zamiana rezerwacji na obciazenie. Raz, przy potwierdzonej platnosci.
 *
 * Saldo schodzi tutaj, a nie przy rezerwacji, i dlatego `balance_grosze`
 * odpowiada wylacznie na pytanie "ile z tej karty faktycznie wydano".
 */
export async function consumeGiftCard(pool, orderId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE gift_card_redemptions SET consumed_at = NOW()
        WHERE order_id = $1 AND consumed_at IS NULL AND released_at IS NULL
        RETURNING card_id, amount_grosze`,
      [orderId]
    );
    for (const r of rows) {
      // GREATEST chroni przed zejsciem ponizej zera, gdyby dwie rezerwacje
      // przezyly wygasniecie i rozliczyly sie obie. Warunek na tabeli i tak
      // by to zatrzymal, ale wtedy kosztem nierozliczonej platnosci.
      await client.query(
        `UPDATE gift_cards
            SET balance_grosze = GREATEST(balance_grosze - $2, 0), updated_at = NOW()
          WHERE id = $1`,
        [r.card_id, r.amount_grosze]
      );
    }
    await client.query("COMMIT");
    return rows.length;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Karty z porzuconych zamowien wracaja do pelnego salda. Uruchamiane z crona. */
export async function releaseExpiredGiftRedemptions(pool) {
  const { rowCount } = await pool.query(
    `UPDATE gift_card_redemptions SET released_at = NOW()
      WHERE consumed_at IS NULL AND released_at IS NULL AND expires_at <= NOW()`
  );
  if (rowCount) console.log(`[karty] zwolniono ${rowCount} wygaslych rezerwacji kart`);
  return rowCount;
}

export async function releaseOrderGiftRedemptions(pool, orderId) {
  const { rowCount } = await pool.query(
    `UPDATE gift_card_redemptions SET released_at = NOW()
      WHERE order_id = $1 AND consumed_at IS NULL AND released_at IS NULL`,
    [orderId]
  );
  return rowCount;
}

// ------------------------------------------------------------
// Wydanie karty
// ------------------------------------------------------------

/**
 * Wydanie karty po zaksiegowaniu wplaty. Na dzis wywolywane recznie z panelu,
 * bo sprzedaz kart idzie przez zapytanie i przelew, a nie przez kase.
 *
 * Kolizja kodu jest praktycznie niemozliwa (40 bitow), ale `UNIQUE` na
 * kolumnie i tak by ja wylapal, wiec probujemy kilka razy zamiast wywalac
 * blad w twarz osobie wydajacej karte.
 */
export async function issueGiftCard(pool, { amountGrosze, purchaserEmail, purchaserName, recipientEmail, recipientName, message, note }) {
  const amount = Math.round(Number(amountGrosze) || 0);
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT_GROSZE || amount > MAX_AMOUNT_GROSZE) {
    throw new GiftCardError(
      `Nominal musi miescic sie w przedziale ${MIN_AMOUNT_GROSZE / 100} do ${MAX_AMOUNT_GROSZE / 100} zl`,
      "bad_amount"
    );
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomGiftCode();
    try {
      const { rows } = await pool.query(
        `INSERT INTO gift_cards
           (code, initial_grosze, balance_grosze, valid_to,
            purchaser_email, purchaser_name, recipient_email, recipient_name, message, note)
         VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, code, initial_grosze, balance_grosze, valid_to`,
        [
          code, amount, validUntil(),
          purchaserEmail || null, purchaserName || null,
          recipientEmail || null, recipientName || null,
          message || null, note || null,
        ]
      );
      return rows[0];
    } catch (e) {
      if (e.code !== "23505") throw e; // 23505 = naruszenie UNIQUE
    }
  }
  throw new GiftCardError("Nie udalo sie wygenerowac unikalnego kodu", "code_collision");
}
