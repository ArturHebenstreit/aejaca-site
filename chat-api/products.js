// ============================================================
// PRODUKTY: KATALOG, DOSTEPNOSC, REZERWACJE
// ============================================================
// Baza jest jedynym zrodlem prawdy o produkcie: tresc, zdjecia, cena, waga
// i stan magazynowy. Strona pobiera stad katalog przy budowaniu, a dostepnosc
// takze na zywo, zeby wyprzedany przedmiot przestal zachecac do zakupu przed
// najblizszym wdrozeniem.
//
// Przed sprzedaniem tej samej ostatniej sztuki dwa razy broni nas rezerwacja:
// powstaje przy skladaniu zamowienia, wygasa sama, a stan zmniejsza sie dopiero
// przy potwierdzonej platnosci. Sprawdzenie i zmniejszenie ida w jednej
// transakcji z blokada wiersza, wiec dwa rownolegle zamowienia nie moga obydwa
// zobaczyc tej samej wolnej sztuki.

import { addBusinessDays, TRANSFER_HOLD_BUSINESS_DAYS } from "./pricing/businessDays.js";

export class ProductError extends Error {
  constructor(message, code, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}

/** Ile trzymamy towar dla nieoplaconego zamowienia z bramka platnicza. */
export const INSTANT_HOLD_MINUTES = 20;

export function reservationExpiry(paymentMethod, now = new Date()) {
  return paymentMethod === "bank_transfer"
    ? addBusinessDays(now, TRANSFER_HOLD_BUSINESS_DAYS)
    : new Date(now.getTime() + INSTANT_HOLD_MINUTES * 60_000);
}

const PUBLIC_COLUMNS = `
  p.id, p.slug, p.kind, p.category, p.offer, p.title, p.short, p.description,
  p.specs, p.images, p.price_grosze, p.weight_g, p.stock, p.lead_time_days,
  p.personalization, p.sort_order, p.license
`;

function shape(row) {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    category: row.category,
    offer: row.offer,
    title: row.title,
    short: row.short,
    description: row.description,
    specs: row.specs,
    images: row.images || [],
    priceGrosze: row.price_grosze,
    weightG: row.weight_g,
    stock: row.stock,
    available: row.available ?? null,
    leadTimeDays: row.lead_time_days,
    personalization: row.personalization,
    license: row.license,
  };
}

/** Katalog do listy w sklepie i do prerenderu. */
export async function listProducts(pool, { category, offer } = {}) {
  const where = ["p.active = TRUE"];
  const params = [];
  if (category) { params.push(category); where.push(`p.category = $${params.length}`); }
  if (offer) { params.push(offer); where.push(`p.offer = $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, a.available
       FROM products p
       LEFT JOIN product_availability a ON a.id = p.id
      WHERE ${where.join(" AND ")}
      ORDER BY p.sort_order, p.id`,
    params
  );
  return rows.map(shape);
}

export async function getProduct(pool, slug) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, a.available
       FROM products p
       LEFT JOIN product_availability a ON a.id = p.id
      WHERE p.slug = $1 AND p.active = TRUE`,
    [String(slug || "")]
  );
  return rows[0] ? shape(rows[0]) : null;
}

/**
 * Rezerwuje sztuki pod zamowienie. Wiersz produktu blokujemy na czas
 * sprawdzenia, wiec dwa rownolegle zamowienia na ostatnia sztuke ustawiaja sie
 * w kolejce, zamiast obydwa zobaczyc ja jako wolna.
 *
 * Wywolywac wewnatrz transakcji razem z zapisem zamowienia.
 */
export async function reserveProduct(client, { slug, qty, orderId, paymentMethod }) {
  const { rows } = await client.query(
    `SELECT id, slug, title, kind, stock, price_grosze, weight_g, lead_time_days
       FROM products WHERE slug = $1 AND active = TRUE FOR UPDATE`,
    [String(slug || "")]
  );
  const product = rows[0];
  if (!product) throw new ProductError("Produkt nie istnieje", "product_not_found", { slug });

  // Produkt cyfrowy nie ma limitu, wiec nie ma czego rezerwowac.
  if (product.stock !== null) {
    const { rows: res } = await client.query(
      `SELECT COALESCE(SUM(qty), 0)::INTEGER AS reserved
         FROM product_reservations
        WHERE product_id = $1 AND consumed_at IS NULL AND released_at IS NULL AND expires_at > NOW()`,
      [product.id]
    );
    const available = Math.max(product.stock - res[0].reserved, 0);
    if (available < qty) {
      throw new ProductError("Nie mamy tylu sztuk", "out_of_stock", { slug, available, requested: qty });
    }
    await client.query(
      `INSERT INTO product_reservations (product_id, order_id, qty, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [product.id, orderId, qty, reservationExpiry(paymentMethod)]
    );
  }

  return product;
}

/**
 * Zamiana rezerwacji na sprzedaz. Wywolywane raz, przy potwierdzonej platnosci,
 * z tego samego miejsca co maile. Stan schodzi tutaj, nie przy zamowieniu.
 */
export async function consumeReservations(pool, orderId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, product_id, qty FROM product_reservations
        WHERE order_id = $1 AND consumed_at IS NULL AND released_at IS NULL
        FOR UPDATE`,
      [orderId]
    );
    for (const r of rows) {
      // GREATEST pilnuje, ze reczna korekta stanu w bazie nie zrobi liczby ujemnej.
      await client.query(
        `UPDATE products SET stock = GREATEST(COALESCE(stock, 0) - $2, 0),
                             sold_count = sold_count + $2
          WHERE id = $1 AND stock IS NOT NULL`,
        [r.product_id, r.qty]
      );
      await client.query(`UPDATE product_reservations SET consumed_at = NOW() WHERE id = $1`, [r.id]);
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

/** Zwolnienie rezerwacji po terminie. Uruchamiane z crona. */
export async function releaseExpiredReservations(pool) {
  const { rowCount } = await pool.query(
    `UPDATE product_reservations SET released_at = NOW()
      WHERE consumed_at IS NULL AND released_at IS NULL AND expires_at <= NOW()`
  );
  if (rowCount) console.log(`[produkty] zwolniono ${rowCount} wygaslych rezerwacji`);
  return rowCount;
}

/** Rezerwacje anulowanego zamowienia wracaja do puli od razu, bez czekania. */
export async function releaseOrderReservations(pool, orderId) {
  const { rowCount } = await pool.query(
    `UPDATE product_reservations SET released_at = NOW()
      WHERE order_id = $1 AND consumed_at IS NULL AND released_at IS NULL`,
    [orderId]
  );
  return rowCount;
}
