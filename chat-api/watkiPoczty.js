// ============================================================
// ROZSTRZYGNIECIE O WATKU MAILOWYM
// ============================================================
// Decyzje podejmuje CZLOWIEK i tylko czlowiek (wlasciciel, 2026-09-01).
// Klasyfikator automatyczny podpowiada: zapisuje `tag_sugestia`, i na tym
// konczy sie jego rola. Do 1 wrzesnia 2026 pisal wprost do `tag`, a sprawe
// z numerem zakladal sam fakt, ze mail przyszedl, wiec numer dostawal
// newsletter i faktura od dostawcy. Przyciski w panelu zmienialy przy tym sam
// kolor plakietki, czyli decyzja czlowieka nie znaczyla nic.
//
// Uznanie watku za zapytanie robi tu trzy rzeczy naraz, bo sa jedna decyzja:
// zaklada sprawe z numerem, wiaze ja z watkiem i wysyla klientowi
// podziekowanie za wiadomosc. To ostatnie jest samo w sobie stwierdzeniem
// "to jest zapytanie", wiec nie ma prawa wyjsc wczesniej.
//
// Cofniecie decyzji ("jednak nie zapytanie") NIE kasuje zalozonej sprawy:
// numer moze byc juz w korespondencji, a numer raz podany jest obietnica.
// Blokuje natomiast robienie z niej oferty, i to widac w panelu.

import { generateQuoteRef } from "./quotes.js";
import { extractEmail, maybeSendAutoReply } from "./gmail.js";

export const ZNACZNIKI_WATKU = ["unclassified", "lead", "not_lead", "spam"];

/**
 * Nadaje watkowi znacznik, a przy "lead" zaklada sprawe z numerem.
 *
 * @param {object} pool
 * @param {number} threadId
 * @param {string} tag jeden z ZNACZNIKI_WATKU
 * @param {object|null} awaryjna dane pierwszej wiadomosci, gdy nie ma jej
 *   jeszcze w tabeli. Zostawione dla wywolan sprzed zapisu wiadomosci.
 * @returns {Promise<{tag:string, leadId:number|null, quoteRef:string|null, zalozono:boolean}>}
 */
export async function oznaczWatek(pool, threadId, tag, awaryjna = null) {
  if (!ZNACZNIKI_WATKU.includes(tag)) {
    const e = new Error("Nie znamy takiego oznaczenia");
    e.code = "bad_tag";
    throw e;
  }

  const { rows } = await pool.query(
    "SELECT id, lead_id, subject, tag, lang, gmail_thread_id FROM email_threads WHERE id = $1", [threadId]
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
  // Pierwsza wiadomosc PRZYCHODZACA sluzy dwom rzeczom: zalozeniu sprawy
  // i wyslaniu podziekowania. Czytamy ja raz. To ona jest zapytaniem: nasza
  // wlasna odpowiedz w tym samym watku nie jest niczyim pytaniem.
  let pierwsza = null;

  if (tag === "lead") {
    const { rows: wiadomosci } = await pool.query(
      `SELECT from_addr, subject, body_text, snippet, gmail_message_id, message_id_header
         FROM email_messages
        WHERE thread_id = $1 AND direction = 'inbound'
        ORDER BY received_at ASC LIMIT 1`, [threadId]
    );
    pierwsza = wiadomosci[0] || awaryjna;

    if (!leadId) {
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
           VALUES ($1, $2, 'email', 'email', $3, $4, $5, 'new') RETURNING id, quote_ref`,
          [adres, watek.lang || "pl", temat,
           String(pierwsza.body_text || "").slice(0, 8000), generateQuoteRef()]
        );
        leadId = nowy[0].id;
        quoteRef = nowy[0].quote_ref;
        zalozono = true;
      }
    }
  }

  await pool.query(
    "UPDATE email_threads SET tag = $1, lead_id = COALESCE(lead_id, $2) WHERE id = $3",
    [tag, leadId, threadId]
  );

  // Podziekowanie za wiadomosc wychodzi PO potwierdzeniu (wlasciciel,
  // 2026-09-01), bo samo w sobie jest stwierdzeniem "to jest zapytanie",
  // czyli ta decyzja, ktorej automat juz nie podejmuje. Wysylka jest
  // jednorazowa: `maybeSendAutoReply` zajmuje watek atomowo, wiec ponowne
  // klikniecie "Lead" nie wysle drugiego maila.
  if (tag === "lead" && watek.tag !== "lead" && pierwsza) {
    const adresDoOdpowiedzi = extractEmail(pierwsza.from_addr || "");
    if (adresDoOdpowiedzi) {
      await maybeSendAutoReply(pool, {
        threadDbId: threadId,
        toEmail: adresDoOdpowiedzi,
        subject: pierwsza.subject || watek.subject || "",
        lang: watek.lang || "pl",
        messageIdHeader: pierwsza.message_id_header || null,
        gmailMessageId: pierwsza.gmail_message_id || null,
        gmailThreadId: watek.gmail_thread_id || null,
        snippet: pierwsza.snippet || null,
      }).catch((e) => console.error("[autoreply] po potwierdzeniu:", e.message));
    }
  }

  return { tag, leadId: leadId ?? null, quoteRef, zalozono };
}
