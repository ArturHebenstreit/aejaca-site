// ============================================================
// WYCENY INDYWIDUALNE
// ============================================================
// Wycena to zamowienie bez jednej rzeczy: kwoty, ktora musi podac czlowiek.
// Cala reszta jest identyczna, wiec zapisujemy ja tak samo strukturalnie
// i konwertujemy w zamowienie przepisaniem wierszy, zamiast prosic klienta,
// zeby wprowadzil wszystko od nowa.
//
// Pusta `total_grosze` znaczy "jeszcze niczego nie obiecalismy". Dopiero
// wpisanie kwoty czyni z wyceny oferte, i dopiero wtedy da sie ja przekuc
// w zamowienie do zaplaty.

import { generateToken } from "./orders.js";

/** Ile dni obowiazuje wyslana wycena, jesli nie podano inaczej */
export const QUOTE_VALIDITY_DAYS = 14;

export class QuoteError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function generateQuoteRef(now = new Date()) {
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `WY${stamp}-${generateToken().slice(0, 8).toUpperCase()}`;
}

/**
 * Zapisuje zapytanie o wycene razem z pozycjami.
 *
 * @param {object} pool
 * @param {object} input
 * @param {string} input.email
 * @param {string} [input.name]
 * @param {string} [input.phone]
 * @param {string} [input.lang]
 * @param {string} [input.source]  contact | quote | configurator | chat
 * @param {string} [input.message] pelna tresc od klienta
 * @param {Array}  [input.items]   pozycje: { calculator, title, qty, params, description, uploadId, fileName }
 * @param {string} [input.ipHash]
 * @returns {Promise<{id:number, quoteRef:string, accessToken:string}>}
 */
export async function createQuote(pool, input) {
  if (!pool) throw new QuoteError("no_db", "Baza niedostepna");
  if (!input?.email) throw new QuoteError("no_email", "Brak adresu e-mail");

  const quoteRef = generateQuoteRef();
  const accessToken = generateToken();
  const lang = ["pl", "en", "de"].includes(input.lang) ? input.lang : "pl";

  const { rows } = await pool.query(
    `INSERT INTO quotes (quote_ref, lang, source, customer_email, customer_name, customer_phone,
       message, access_token, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [quoteRef, lang, input.source || "quote",
     String(input.email).trim().toLowerCase(),
     input.name || null, input.phone || null,
     input.message || null, accessToken, input.ipHash || null]
  );
  const quoteId = rows[0].id;

  for (const item of input.items || []) {
    await pool.query(
      `INSERT INTO quote_items (quote_id, calculator, title, qty, params, description, upload_id, file_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [quoteId,
       item.calculator || null,
       String(item.title || "Zapytanie").slice(0, 255),
       Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 1,
       item.params ? JSON.stringify(item.params) : null,
       item.description || null,
       item.uploadId || null,
       item.fileName ? String(item.fileName).slice(0, 255) : null]
    );
  }

  return { id: quoteId, quoteRef, accessToken };
}

/**
 * Wpisuje kwoty do wyceny. Pozycje podaje sie po id, zeby pomylka w kolejnosci
 * nie przypisala ceny nie tej rzeczy.
 *
 * @param {Array<{id:number, unitGrosze:number}>} lines
 */
export async function priceQuote(pool, quoteRef, lines, note = null, validDays = QUOTE_VALIDITY_DAYS) {
  const quote = await getQuoteByRef(pool, quoteRef);
  if (!quote) throw new QuoteError("not_found", "Nie ma takiej wyceny");
  if (quote.status === "converted") throw new QuoteError("already_converted", "Ta wycena stala sie juz zamowieniem");

  const byId = new Map(quote.items.map((i) => [i.id, i]));
  let total = 0;

  for (const line of lines || []) {
    const item = byId.get(Number(line.id));
    if (!item) throw new QuoteError("unknown_item", `Pozycja ${line.id} nie nalezy do wyceny ${quoteRef}`);
    const unit = Math.round(Number(line.unitGrosze));
    if (!Number.isFinite(unit) || unit <= 0) throw new QuoteError("bad_amount", "Kwota pozycji musi byc dodatnia");

    const lineTotal = unit * item.qty;
    total += lineTotal;
    await pool.query(
      `UPDATE quote_items SET unit_grosze = $2, line_grosze = $3 WHERE id = $1`,
      [item.id, unit, lineTotal]
    );
  }

  if (!total) throw new QuoteError("no_amount", "Wycena bez kwoty nie jest oferta");

  const validUntil = new Date(Date.now() + validDays * 86400_000);
  await pool.query(
    `UPDATE quotes SET status = 'priced', total_grosze = $2, price_note = $3, valid_until = $4
      WHERE id = $1`,
    [quote.id, total, note, validUntil.toISOString().slice(0, 10)]
  );

  return { quoteRef, totalGrosze: total, validUntil: validUntil.toISOString().slice(0, 10) };
}

export async function getQuoteByRef(pool, quoteRef) {
  if (!pool) return null;
  const { rows } = await pool.query(`SELECT * FROM quotes WHERE quote_ref = $1`, [String(quoteRef || "")]);
  const quote = rows[0];
  if (!quote) return null;

  const { rows: items } = await pool.query(
    `SELECT i.*, u.token AS upload_token, u.drive_url
       FROM quote_items i
       LEFT JOIN uploads u ON u.id = i.upload_id
      WHERE i.quote_id = $1
      ORDER BY i.id`,
    [quote.id]
  );
  return { ...quote, items };
}

/**
 * Przekuwa wycene w zamowienie do zaplaty.
 *
 * Kwota pochodzi z wyceny, nie z kalkulatora: to jest caly sens tej sciezki.
 * Zamowienie powstaje w stanie `awaiting_payment`, wiec dalej idzie dokladnie
 * ta sama droga co zakup ze sklepu, razem z ITN i mailami.
 *
 * @returns {Promise<{orderRef:string, accessToken:string, totalGrosze:number}>}
 */
export async function convertQuoteToOrder(pool, quoteRef, { orderRef, delivery = {}, validityDays = 7 }) {
  const quote = await getQuoteByRef(pool, quoteRef);
  if (!quote) throw new QuoteError("not_found", "Nie ma takiej wyceny");
  if (quote.converted_order_id) throw new QuoteError("already_converted", "Ta wycena ma juz zamowienie");
  if (!quote.total_grosze) throw new QuoteError("not_priced", "Najpierw wpisz kwoty w wycenie");

  const shipping = Number.isInteger(delivery.shippingGrosze) ? delivery.shippingGrosze : 0;
  const total = quote.total_grosze + shipping;
  const accessToken = generateToken();
  const expiresAt = new Date(Date.now() + validityDays * 86400_000);

  const { rows } = await pool.query(
    `INSERT INTO orders (order_ref, status, kind, lang, items_total_grosze, shipping_grosze, total_grosze,
       customer_email, customer_name, customer_phone,
       delivery_method, delivery_point, address_line1, address_line2, postal_code, city, country,
       access_token, ip_hash, expires_at)
     -- 'quoted' jest jedyna dopuszczona przez CHECK w orders.kind obok 'instant'
     VALUES ($1,'awaiting_payment','quoted',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING id`,
    [orderRef, quote.lang, quote.total_grosze, shipping, total,
     quote.customer_email, quote.customer_name, quote.customer_phone,
     delivery.method || null, delivery.point || null, delivery.addressLine1 || null,
     delivery.addressLine2 || null, delivery.postalCode || null, delivery.city || null,
     delivery.country || "PL",
     accessToken, quote.ip_hash, expiresAt]
  );
  const orderId = rows[0].id;

  for (const item of quote.items) {
    await pool.query(
      `INSERT INTO order_items (order_id, item_type, calculator, title, qty, unit_grosze, line_grosze,
         params, file_name, upload_id)
       VALUES ($1,'service',$2,$3,$4,$5,$6,$7,$8,$9)`,
      [orderId, item.calculator, item.title, item.qty,
       item.unit_grosze, item.line_grosze,
       JSON.stringify({ ...(item.params ?? {}), description: item.description, fromQuote: quote.quote_ref }),
       item.file_name, item.upload_id]
    );
    if (item.upload_id) {
      await pool.query(`UPDATE uploads SET status = 'ordered', order_id = $2 WHERE id = $1`, [item.upload_id, orderId]);
    }
  }

  await pool.query(
    `UPDATE quotes SET status = 'converted', converted_order_id = $2, converted_at = NOW() WHERE id = $1`,
    [quote.id, orderId]
  );

  return { orderRef, accessToken, totalGrosze: total, orderId };
}
