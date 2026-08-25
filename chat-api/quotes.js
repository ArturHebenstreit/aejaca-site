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

import { generateToken, priceItem } from "./orders.js";
import { CAD_CONFIG } from "./pricing/cadDesign.js";

/** Ile dni obowiazuje wyslana wycena, jesli nie podano inaczej */
export const QUOTE_VALIDITY_DAYS = 14;

/**
 * Wycena zapisana przez klienta z kalkulatora, a nie zapytanie o wycene reczna.
 *
 * Roznica jest zasadnicza i dlatego ma wlasne zrodlo: tutaj kwote liczy nasz
 * silnik od razu, wiec wycena rodzi sie w stanie `priced`. Przy `source`
 * innym niz ten kwote wpisuje czlowiek i pusta kwota znaczy "jeszcze nic
 * nie obiecalismy".
 */
export const SAVED_QUOTE_SOURCE = "saved";

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
 * @param {Array}  [input.items]   pozycje: { calculator, title, qty, params, description, uploadId, fileName, scale }
 * @param {string} [input.ipHash]
 * @param {object} [input.ratesSnapshot] kursy kruszcow z chwili zapisu
 * @param {boolean} [input.allowAnonymous] wolno zapisac bez adresu e-mail
 * @returns {Promise<{id:number, quoteRef:string, accessToken:string}>}
 */
export async function createQuote(pool, input) {
  if (!pool) throw new QuoteError("no_db", "Baza niedostepna");
  // Zapytanie o wycene reczna bez adresu jest bez sensu, bo nie ma jak odpisac.
  // Wycena zapisana z kalkulatora sensu nie traci: klient moze chciec sam link,
  // i zmuszanie go do podania adresu za mozliwosc wrocenia do wlasnej kalkulacji
  // to zbieranie danych na zapas.
  if (!input?.email && !input?.allowAnonymous) throw new QuoteError("no_email", "Brak adresu e-mail");

  const quoteRef = generateQuoteRef();
  const accessToken = generateToken();
  const lang = ["pl", "en", "de"].includes(input.lang) ? input.lang : "pl";

  const { rows } = await pool.query(
    `INSERT INTO quotes (quote_ref, lang, source, customer_email, customer_name, customer_phone,
       message, access_token, ip_hash, rates_snapshot)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [quoteRef, lang, input.source || "quote",
     input.email ? String(input.email).trim().toLowerCase() : null,
     input.name || null, input.phone || null,
     input.message || null, accessToken, input.ipHash || null,
     input.ratesSnapshot ? JSON.stringify(input.ratesSnapshot) : null]
  );
  const quoteId = rows[0].id;

  for (const item of input.items || []) {
    await pool.query(
      `INSERT INTO quote_items (quote_id, calculator, title, qty, params, description, upload_id, file_name, scale)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [quoteId,
       item.calculator || null,
       String(item.title || "Zapytanie").slice(0, 255),
       Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 1,
       item.params ? JSON.stringify(item.params) : null,
       item.description || null,
       item.uploadId || null,
       item.fileName ? String(item.fileName).slice(0, 255) : null,
       Number.isFinite(Number(item.scale)) && Number(item.scale) > 0 ? Number(item.scale) : null]
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

  // Klucze liczbowe po obu stronach. `quote_items.id` to BIGSERIAL, a
  // node-postgres oddaje bigint jako TEKST, wiec mapa po surowym `i.id`
  // miala klucze "1", a odpytywana byla liczba 1 i nie trafiala nigdy.
  // Kazde wycenianie konczylo sie wtedy bledem "pozycja nie nalezy do wyceny".
  const byId = new Map(quote.items.map((i) => [Number(i.id), i]));
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

/**
 * Cena zapisanej pozycji w dniu otwarcia linku.
 *
 * Zasada jest jedna i wynika z tego, czym ryzykujemy: **robocizna jest
 * wiazaca przez caly okres waznosci, kruszec liczy sie z dnia zamowienia**.
 * Praca warsztatu nie drozeje przez dwa tygodnie, ale zloto potrafi ruszyc
 * sie o kilka procent, a blokujac jego cene bralibysmy na siebie pozycje
 * na rynku towarowym, ktorej nikt tu nie chce miec.
 *
 * Roznicy NIE liczymy jako "przelicz wszystko od nowa", bo wtedy zmiana
 * naszego wlasnego cennika po cichu podniloslaby tez robocizne, ktora
 * obiecalismy. Liczymy wiec **wylacznie ruch kruszcu**: te sama pozycje
 * wyceniamy dwa razy, kursami z chwili zapisu i kursami z dzisiaj, a do
 * zapisanej kwoty dokladamy sama roznice.
 *
 * @returns {{unitGrosze:number, metalDeltaGrosze:number, repriced:boolean}}
 */
export function repriceSavedItem(item, { ratesAtSave, ratesNow, lang = "pl" } = {}) {
  const saved = Number(item?.unit_grosze) || 0;
  const calculator = String(item?.calculator || "");
  const flat = { unitGrosze: saved, metalDeltaGrosze: 0, repriced: false };

  // Kruszec dotyczy wylacznie bizuterii. Druk i laser licza sie z materialow,
  // ktorych ceny nie sledzimy na biezaco, wiec nie ma czego przeliczac.
  if (!saved || !calculator.startsWith("jewelry_")) return flat;
  if (!ratesNow || !ratesAtSave) return flat;

  const params = item.params && typeof item.params === "object" ? item.params : null;
  if (!params) return flat;

  let before, after;
  try {
    before = priceItem({ calculator, params, lang, rates: ratesAtSave });
    after = priceItem({ calculator, params, lang, rates: ratesNow });
  } catch {
    // Kalkulator sie zmienil na tyle, ze stare parametry juz nie przechodza.
    // Wtedy trzymamy sie kwoty zapisanej: obiecana cena jest obiecana,
    // a nie okazja do podniesienia jej przy okazji awarii.
    return flat;
  }

  const delta = after.unitGrosze - before.unitGrosze;
  if (!Number.isFinite(delta) || delta === 0) return flat;

  // Cena nie schodzi ponizej grosza nawet przy gwaltownym spadku kursu.
  const unit = Math.max(1, saved + delta);
  return { unitGrosze: unit, metalDeltaGrosze: unit - saved, repriced: true };
}

/**
 * Nierozliczone odliczenie z oplaconego projektu 3D tego klienta.
 *
 * Kto zaplacil za projekt, ma go za darmo, jesli zamowi u nas wykonanie.
 * Odliczenie jest jednorazowe i wygasa po CAD_CONFIG.CREDIT_DAYS dniach,
 * bo po pol roku to juz nie jest ta sama rozmowa i nie te same ceny metalu.
 *
 * @returns {Promise<{orderId:number, orderRef:string, grosze:number}|null>}
 */
export async function availableDesignCredit(pool, email) {
  if (!pool || !email || !CAD_CONFIG.CREDIT_RATE) return null;

  const { rows } = await pool.query(
    `SELECT o.id, o.order_ref, o.items_total_grosze
       FROM orders o
       JOIN order_items i ON i.order_id = o.id AND i.calculator = 'cad_design'
      WHERE o.customer_email = $1
        AND o.status = 'paid'
        AND o.credit_consumed_by IS NULL
        AND o.paid_at > NOW() - ($2 || ' days')::interval
        -- Doplaty za poprawki wisza przy projekcie i nie tworza wlasnego odliczenia.
        AND o.parent_order_id IS NULL
      ORDER BY o.paid_at
      LIMIT 1`,
    [String(email).trim().toLowerCase(), String(CAD_CONFIG.CREDIT_DAYS)]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    orderId: row.id,
    orderRef: row.order_ref,
    grosze: Math.round(row.items_total_grosze * CAD_CONFIG.CREDIT_RATE),
  };
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
 * Pozycje wyceny w postaci, ktorej oczekuje rachunek znizki.
 *
 * Kod rabatowy potrafi obejmowac wylacznie dzial albo wylacznie uslugi, wiec
 * musi wiedziec, czym jest kazda linia. Wycena zna kalkulator, a z niego
 * wynika dzial, tak samo jak w kasie sklepu.
 */
export function quoteItemsForDiscount(quote) {
  return quote.items.map((i) => ({
    lineGrosze: i.line_grosze ?? (i.unit_grosze ?? 0) * i.qty,
    source: "service",
    category: String(i.calculator || "").startsWith("jewelry") ? "jewelry" : "studio",
  }));
}

/**
 * Przekuwa wycene w zamowienie do zaplaty.
 *
 * Kwota pochodzi z wyceny, nie z kalkulatora: to jest caly sens tej sciezki.
 * Zamowienie powstaje w stanie `awaiting_payment`, wiec dalej idzie dokladnie
 * ta sama droga co zakup ze sklepu, razem z ITN i mailami.
 *
 * CALOSC IDZIE W JEDNEJ TRANSAKCJI. Rezerwacja kodu rabatowego blokuje wiersz
 * kodu przez `FOR UPDATE`, a blokada poza transakcja zwalnia sie natychmiast
 * po zapytaniu, wiec dwie osoby z tym samym kodem jednorazowym zabralyby go
 * obie. Zapis zamowienia i rezerwacja kodu musza wiec zyc albo zginac razem.
 *
 * @param {object} opcje
 * @param {string} opcje.orderRef
 * @param {object} [opcje.delivery]
 * @param {object} [opcje.customer]  dane wysylki podane przez klienta na stronie oferty
 * @param {object} [opcje.discount]  { code, reserve } gdzie `reserve` rezerwuje kod w tej transakcji
 * @param {string} [opcje.paymentMethod] 'autopay' albo 'bank_transfer'
 * @returns {Promise<{orderRef:string, accessToken:string, totalGrosze:number}>}
 */
export async function convertQuoteToOrder(
  pool, quoteRef,
  { orderRef, delivery = {}, customer = {}, discount = null, consents = null, paymentMethod = "autopay", validityDays = 7 }
) {
  const quote = await getQuoteByRef(pool, quoteRef);
  if (!quote) throw new QuoteError("not_found", "Nie ma takiej wyceny");
  if (quote.converted_order_id) throw new QuoteError("already_converted", "Ta wycena ma juz zamowienie");
  if (!quote.total_grosze) throw new QuoteError("not_priced", "Najpierw wpisz kwoty w wycenie");

  const shipping = Number.isInteger(delivery.shippingGrosze) ? delivery.shippingGrosze : 0;

  // Odliczenie nigdy nie schodzi ponizej zera i nie obejmuje dostawy.
  const credit = await availableDesignCredit(pool, quote.customer_email);
  const creditGrosze = credit ? Math.min(credit.grosze, quote.total_grosze) : 0;
  const accessToken = generateToken();
  const expiresAt = new Date(Date.now() + validityDays * 86400_000);

  // Dane kontaktowe: to, co klient wpisal na stronie oferty, ma pierwszenstwo
  // przed tym, co zanotowalismy przy rozmowie. Adres e-mail zostaje jednak
  // ten z wyceny, jesli byl, bo to na niego poszla oferta i to on wiaze
  // zamowienie z korespondencja.
  const email = quote.customer_email || (customer.email || "").trim().toLowerCase() || null;
  const name = (customer.name || "").trim() || quote.customer_name || null;
  const phone = (customer.phone || "").trim() || quote.customer_phone || null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Zamowienie powstaje najpierw bez znizki, bo rezerwacja kodu potrzebuje
    // numeru zamowienia, ktory nadaje dopiero ten INSERT. Suma schodzi o kwote
    // znizki chwile pozniej, w tej samej transakcji, wiec na zewnatrz nie ma
    // momentu, w ktorym zamowienie ma kod bez odliczenia albo odwrotnie.
    const total = quote.total_grosze - creditGrosze + shipping;

    const { rows } = await client.query(
      `INSERT INTO orders (order_ref, status, kind, lang, items_total_grosze, shipping_grosze, total_grosze,
         customer_email, customer_name, customer_phone,
         delivery_method, delivery_point, address_line1, address_line2, postal_code, city, country,
         access_token, ip_hash, expires_at, credit_applied_grosze, payment_method,
         accepted_terms_at, waived_withdrawal_at)
       -- 'quoted' jest jedyna dopuszczona przez CHECK w orders.kind obok 'instant'
       VALUES ($1,'awaiting_payment','quoted',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING id`,
      [orderRef, quote.lang, quote.total_grosze, shipping, total,
       email, name, phone,
       delivery.method || null, delivery.point || null, delivery.addressLine1 || null,
       delivery.addressLine2 || null, delivery.postalCode || null, delivery.city || null,
       delivery.country || "PL",
       accessToken, quote.ip_hash, expiresAt, creditGrosze || null,
       paymentMethod === "bank_transfer" ? "bank_transfer" : "autopay",
       // Zgody zapisujemy z chwila zlozenia zamowienia. Wycena przekuta z
       // panelu ich nie niesie, bo tam zamawia czlowiek z naszej strony, i
       // wtedy oba pola zostaja puste zamiast udawac zgode, ktorej nikt nie dal.
       consents?.terms ? new Date() : null,
       consents?.waiveWithdrawal ? new Date() : null]
    );
    const orderId = rows[0].id;

    let discountGrosze = 0;
    let discountCode = null;
    let doZaplaty = total;
    if (discount?.code && typeof discount.reserve === "function") {
      const uzyty = await discount.reserve(client, {
        code: discount.code,
        email,
        items: quoteItemsForDiscount(quote),
        orderId,
        paymentMethod,
      });
      discountGrosze = uzyty.discountGrosze;
      discountCode = uzyty.code;
      // Znizka nie schodzi ponizej zera i nie dotyka dostawy: kurier kosztuje
      // nas tyle samo niezaleznie od tego, jaki kod wpisal klient.
      doZaplaty = Math.max(0, quote.total_grosze - creditGrosze - discountGrosze) + shipping;
      await client.query(
        `UPDATE orders SET discount_code = $2, discount_grosze = $3, total_grosze = $4 WHERE id = $1`,
        [orderId, discountCode, discountGrosze, doZaplaty]
      );
    }

    for (const item of quote.items) {
      await client.query(
        `INSERT INTO order_items (order_id, item_type, calculator, title, qty, unit_grosze, line_grosze,
           params, file_name, upload_id)
         VALUES ($1,'service',$2,$3,$4,$5,$6,$7,$8,$9)`,
        [orderId, item.calculator, item.title, item.qty,
         item.unit_grosze, item.line_grosze,
         JSON.stringify({ ...(item.params ?? {}), description: item.description, fromQuote: quote.quote_ref }),
         item.file_name, item.upload_id]
      );
      if (item.upload_id) {
        await client.query(`UPDATE uploads SET status = 'ordered', order_id = $2 WHERE id = $1`, [item.upload_id, orderId]);
      }
    }

    if (creditGrosze) {
      // Zuzyty zostaje STARY projekt: to on wskazuje, ktore zamowienie zjadlo
      // jego kredyt. Zamiana miejscami tych dwoch liczb oznaczalaby, ze ten
      // sam projekt da sie odliczyc drugi raz.
      await client.query(`UPDATE orders SET credit_consumed_by = $2 WHERE id = $1`, [credit.orderId, orderId]);
    }

    await client.query(
      `UPDATE quotes SET status = 'converted', converted_order_id = $2, converted_at = NOW() WHERE id = $1`,
      [quote.id, orderId]
    );

    await client.query("COMMIT");
    return {
      orderRef, accessToken, totalGrosze: doZaplaty, orderId,
      creditGrosze, creditFrom: credit?.orderRef ?? null,
      discountCode, discountGrosze,
    };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
