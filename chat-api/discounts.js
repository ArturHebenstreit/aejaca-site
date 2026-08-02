// ============================================================
// KODY RABATOWE
// ============================================================
// Jeden mechanizm obsluguje dwie rodziny kodow, rozroznione wylacznie
// ustawieniami:
//
//   osobisty  losowy ciag, `max_uses = 1`, wreczany konkretnej osobie
//   akcja     ladne haslo (MATKA15), okno czasowe, limit na adres e-mail
//
// Bez rejestracji uzytkownikow nie da sie zagwarantowac, ze ta sama osoba nie
// uzyje kodu akcji z drugiego adresu. Da sie natomiast zrobic dwie rzeczy,
// ktore zalatwiaja realne przypadki: kod osobisty jest jednorazowy naprawde
// (limit liczy sie globalnie, nie na osobe), a kod akcji nie da sie zmielic
// dziesiec razy z jednej skrzynki.
//
// Znizka, tak jak towar, rezerwuje sie przy zamowieniu, a zuzywa dopiero przy
// zaplacie. Porzucony koszyk nie spala kodu, a przy przelewie kod trzyma sie
// dokladnie tyle samo, co cena i towar, wiec klient dostaje jedna obietnice,
// a nie trzy o roznych terminach.

import { addBusinessDays, TRANSFER_HOLD_BUSINESS_DAYS } from "./pricing/businessDays.js";

export class DiscountError extends Error {
  constructor(message, code, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}

/** Ile trzymamy kod dla nieoplaconego zamowienia z bramka platnicza. */
const INSTANT_HOLD_MINUTES = 20;

/** Gorna granica procentu. Nie po to, zeby ograniczac akcje, tylko zeby
 *  literowka w panelu nie zrobila z 15% dziewiecdziesieciu. */
export const MAX_PERCENT = 80;

export const APPLIES_TO = ["all", "products", "services", "jewelry", "studio"];

export function normalizeCode(raw) {
  return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function redemptionExpiry(paymentMethod, now = new Date()) {
  return paymentMethod === "bank_transfer"
    ? addBusinessDays(now, TRANSFER_HOLD_BUSINESS_DAYS)
    : new Date(now.getTime() + INSTANT_HOLD_MINUTES * 60_000);
}

/**
 * Pozycje do liczenia znizki. `source` to 'product' dla rzeczy z polki
 * i 'service' dla wyceny z kalkulatora, `category` to dzial.
 */
function isEligible(item, appliesTo) {
  switch (appliesTo) {
    case "products": return item.source === "product";
    case "services": return item.source === "service";
    case "jewelry":  return item.category === "jewelry";
    case "studio":   return item.category === "studio";
    default:         return true;
  }
}

/**
 * Kwota znizki w groszach. Liczymy wylacznie od pozycji objetych kodem,
 * nigdy od wysylki: dwadziescia procent od kuriera zjada nasz koszt, a nie
 * marze. Zaokraglamy w dol, zeby znizka nigdy nie byla wyzsza niz obiecana.
 */
export function discountFor(code, items) {
  const eligible = items.filter((i) => isEligible(i, code.applies_to)).reduce((s, i) => s + i.lineGrosze, 0);
  if (eligible <= 0) return { eligible: 0, discount: 0 };
  const discount =
    code.kind === "percent"
      ? Math.floor((eligible * code.value) / 100)
      : Math.min(code.value, eligible);
  return { eligible, discount };
}

/** Powod odmowy jest ten sam po stronie podgladu i przy skladaniu zamowienia. */
function checkWindow(code, itemsTotal) {
  const now = new Date();
  if (!code.active) throw new DiscountError("Ten kod jest nieaktywny", "inactive");
  if (code.valid_from && new Date(code.valid_from) > now) throw new DiscountError("Ten kod jeszcze nie obowiazuje", "too_early");
  if (code.valid_to && new Date(code.valid_to) < now) throw new DiscountError("Ten kod juz wygasl", "expired");
  if (itemsTotal < code.min_order_grosze) {
    throw new DiscountError("Zamowienie jest za male dla tego kodu", "min_order", { minGrosze: code.min_order_grosze });
  }
}

async function fetchCode(client, code, { lock = false } = {}) {
  const { rows } = await client.query(
    `SELECT * FROM discount_codes WHERE code = $1${lock ? " FOR UPDATE" : ""}`,
    [normalizeCode(code)]
  );
  if (!rows[0]) throw new DiscountError("Nie znamy takiego kodu", "not_found");
  return rows[0];
}

/**
 * Ile uzyc jeszcze zostalo. Liczymy zuzyte razem z rezerwacjami w toku, bo
 * inaczej dwa zamowienia zlozone w tej samej sekundzie zabralyby ten sam
 * ostatni kod.
 */
async function usesTaken(client, codeId) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::INTEGER AS taken FROM discount_redemptions
      WHERE code_id = $1 AND released_at IS NULL
        AND (consumed_at IS NOT NULL OR expires_at > NOW())`,
    [codeId]
  );
  return rows[0].taken;
}

async function usesByEmail(client, codeId, email) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::INTEGER AS taken FROM discount_redemptions
      WHERE code_id = $1 AND email = $2 AND released_at IS NULL
        AND (consumed_at IS NOT NULL OR expires_at > NOW())`,
    [codeId, String(email || "").trim().toLowerCase()]
  );
  return rows[0].taken;
}

/**
 * Podglad w kasie: ta sama walidacja co przy zamowieniu, ale bez rezerwacji.
 * Klient ma zobaczyc kwote, zanim wcisnie "zamawiam", i ten sam powod odmowy,
 * zamiast dowiadywac sie o wygasnieciu kodu dopiero przy platnosci.
 */
export async function previewDiscount(pool, { code, email, items }) {
  const row = await fetchCode(pool, code);
  const itemsTotal = items.reduce((s, i) => s + i.lineGrosze, 0);
  checkWindow(row, itemsTotal);

  if (row.max_uses !== null && (await usesTaken(pool, row.id)) >= row.max_uses) {
    throw new DiscountError("Ten kod zostal juz wykorzystany", "used_up");
  }
  if (email && row.max_uses_per_email && (await usesByEmail(pool, row.id, email)) >= row.max_uses_per_email) {
    throw new DiscountError("Ten kod byl juz uzyty na tym adresie", "used_by_email");
  }

  const { eligible, discount } = discountFor(row, items);
  if (discount <= 0) throw new DiscountError("Ten kod nie obejmuje zadnej pozycji w koszyku", "not_applicable");

  return {
    code: row.code,
    kind: row.kind,
    value: row.value,
    appliesTo: row.applies_to,
    eligibleGrosze: eligible,
    discountGrosze: discount,
  };
}

/**
 * Rezerwacja kodu pod zamowienie. Wiersz kodu blokujemy na czas sprawdzenia,
 * wiec dwa rownolegle zamowienia na ten sam kod jednorazowy ustawiaja sie
 * w kolejce, zamiast obydwa zobaczyc go jako wolny.
 *
 * Wywolywac wewnatrz tej samej transakcji, co zapis zamowienia.
 */
export async function reserveDiscount(client, { code, email, items, orderId, paymentMethod }) {
  const row = await fetchCode(client, code, { lock: true });
  const itemsTotal = items.reduce((s, i) => s + i.lineGrosze, 0);
  checkWindow(row, itemsTotal);

  if (row.max_uses !== null && (await usesTaken(client, row.id)) >= row.max_uses) {
    throw new DiscountError("Ten kod zostal juz wykorzystany", "used_up");
  }
  if (row.max_uses_per_email && (await usesByEmail(client, row.id, email)) >= row.max_uses_per_email) {
    throw new DiscountError("Ten kod byl juz uzyty na tym adresie", "used_by_email");
  }

  const { discount } = discountFor(row, items);
  if (discount <= 0) throw new DiscountError("Ten kod nie obejmuje zadnej pozycji w koszyku", "not_applicable");

  await client.query(
    `INSERT INTO discount_redemptions (code_id, order_id, email, amount_grosze, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [row.id, orderId, String(email || "").trim().toLowerCase(), discount, redemptionExpiry(paymentMethod)]
  );

  return { code: row.code, discountGrosze: discount };
}

/** Zamiana rezerwacji na uzycie. Raz, przy potwierdzonej platnosci. */
export async function consumeDiscount(pool, orderId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE discount_redemptions SET consumed_at = NOW()
        WHERE order_id = $1 AND consumed_at IS NULL AND released_at IS NULL
        RETURNING code_id`,
      [orderId]
    );
    for (const r of rows) {
      await client.query(
        `UPDATE discount_codes SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1`,
        [r.code_id]
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

/** Kody z porzuconych zamowien wracaja do puli. Uruchamiane z crona. */
export async function releaseExpiredRedemptions(pool) {
  const { rowCount } = await pool.query(
    `UPDATE discount_redemptions SET released_at = NOW()
      WHERE consumed_at IS NULL AND released_at IS NULL AND expires_at <= NOW()`
  );
  if (rowCount) console.log(`[rabaty] zwolniono ${rowCount} wygaslych rezerwacji kodow`);
  return rowCount;
}

export async function releaseOrderRedemptions(pool, orderId) {
  const { rowCount } = await pool.query(
    `UPDATE discount_redemptions SET released_at = NOW()
      WHERE order_id = $1 AND consumed_at IS NULL AND released_at IS NULL`,
    [orderId]
  );
  return rowCount;
}

// ------------------------------------------------------------
// Generowanie kodow osobistych
// ------------------------------------------------------------
// Bez liter i cyfr, ktore myla sie przy przepisywaniu z maila albo z karteczki
// (0/O, 1/I/L, 5/S, 8/B). Kod ma byc przepisywalny przez telefon, nie ladny.
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY2346789";

export function randomCode(prefix = "AEJ", length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${normalizeCode(prefix)}-${out}`;
}
