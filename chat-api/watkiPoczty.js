// ============================================================
// ROZSTRZYGNIECIE O WATKU MAILOWYM
// ============================================================
// Jedno miejsce na decyzje "to jest zapytanie / to nie jest zapytanie / to
// spam", bo podejmuja ja DWIE rzeczy: klasyfikacja automatyczna przy pierwszej
// wiadomosci i czlowiek w panelu, ktory ja poprawia. Dwie kopie tej samej
// decyzji rozjechalyby sie przy pierwszej zmianie, i to po cichu: klasyfikacja
// zakladalaby sprawe inaczej niz klikniecie, a wygladaloby to tak samo.
//
// Uznanie watku za zapytanie ZAKLADA sprawe z numerem. Do 1 wrzesnia 2026
// sprawe zakladal sam fakt, ze mail przyszedl, wiec numer dostawal newsletter
// i faktura od dostawcy, a przyciski w panelu zmienialy sam kolor plakietki.
//
// Cofniecie decyzji ("jednak nie zapytanie") NIE kasuje zalozonej sprawy:
// numer moze byc juz w korespondencji, a numer raz podany jest obietnica.
// Blokuje natomiast robienie z niej oferty, i to widac w panelu.

import { generateQuoteRef } from "./quotes.js";
import { extractEmail } from "./gmail.js";

export const ZNACZNIKI_WATKU = ["unclassified", "lead", "not_lead", "spam"];

/**
 * Nadaje watkowi znacznik, a przy "lead" zaklada sprawe z numerem.
 *
 * @param {object} pool
 * @param {number} threadId
 * @param {string} tag jeden z ZNACZNIKI_WATKU
 * @param {object|null} awaryjna dane pierwszej wiadomosci, gdy nie ma jej
 *   jeszcze w tabeli. Klasyfikacja automatyczna biegnie PRZED zapisem
 *   wiadomosci, wiec bez tego zakladalaby sprawe bez adresu i bez tresci.
 * @returns {Promise<{tag:string, leadId:number|null, quoteRef:string|null, zalozono:boolean}>}
 */
export async function oznaczWatek(pool, threadId, tag, awaryjna = null) {
  if (!ZNACZNIKI_WATKU.includes(tag)) {
    const e = new Error("Nie znamy takiego oznaczenia");
    e.code = "bad_tag";
    throw e;
  }

  const { rows } = await pool.query(
    "SELECT id, lead_id, subject FROM email_threads WHERE id = $1", [threadId]
  );
  const watek = rows[0];
  if (!watek) {
    const e = new Error("Nie ma takiego watku");
    e.code = "not_found";
    throw e;
  }

  let leadId = watek.lead_id;
  let quoteRef = null;
  let zalozono = false;

  if (tag === "lead" && !leadId) {
    // Pierwsza wiadomosc PRZYCHODZACA: to ona jest zapytaniem. Nasza wlasna
    // odpowiedz w tym samym watku nie jest niczyim pytaniem.
    const { rows: wiadomosci } = await pool.query(
      `SELECT from_addr, subject, body_text FROM email_messages
        WHERE thread_id = $1 AND direction = 'inbound'
        ORDER BY received_at ASC LIMIT 1`, [threadId]
    );
    const pierwsza = wiadomosci[0] || awaryjna;
    const adres = extractEmail(pierwsza?.from_addr || "");
    if (!adres) {
      const e = new Error("Watek nie ma adresu nadawcy, wiec nie ma z czego zrobic sprawy");
      e.code = "no_sender";
      throw e;
    }

    // Ten sam klient piszacy drugi raz to TA SAMA sprawa, a nie nowa.
    const { rows: istnieje } = await pool.query(
      "SELECT id, quote_ref FROM leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1", [adres]
    );
    if (istnieje[0]) {
      leadId = istnieje[0].id;
      quoteRef = istnieje[0].quote_ref;
    } else {
      const temat = String(pierwsza.subject || watek.subject || "Zapytanie mailem").slice(0, 400);
      const { rows: nowy } = await pool.query(
        `INSERT INTO leads (email, lang, calculator, source, params, description, quote_ref, status)
         VALUES ($1, 'pl', 'email', 'email', $2, $3, $4, 'new') RETURNING id, quote_ref`,
        [adres, temat, String(pierwsza.body_text || "").slice(0, 8000), generateQuoteRef()]
      );
      leadId = nowy[0].id;
      quoteRef = nowy[0].quote_ref;
      zalozono = true;
    }
  }

  await pool.query(
    "UPDATE email_threads SET tag = $1, lead_id = COALESCE(lead_id, $2) WHERE id = $3",
    [tag, leadId, threadId]
  );
  return { tag, leadId: leadId ?? null, quoteRef, zalozono };
}
