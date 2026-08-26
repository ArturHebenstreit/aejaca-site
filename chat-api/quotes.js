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
import { defaultCurrency, normalizeCurrency, eurCentsFromGrosze } from "./pricing/currency.js";
import { QUOTE_VALIDITY_DAYS } from "./pricing/config.js";

/** Ile dni obowiazuje wyslana wycena, jesli nie podano inaczej */
export { QUOTE_VALIDITY_DAYS } from "./pricing/config.js";

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

  // Waluta idzie za jezykiem zapytania: kto pisze po niemiecku, ten prawie
  // zawsze placi z konta w euro. To jest wartosc DOMYSLNA, do zmiany w panelu
  // i przez samego klienta na stronie oferty.
  const currency = normalizeCurrency(input.currency, lang);

  // Termin waznosci wchodzi JUZ TERAZ, przy zakladaniu numeru, a nie dopiero
  // przy pierwszej kwocie. Wlasciciel widzi go wtedy od razu w panelu i wie,
  // co obiecuje, zamiast ogladac puste pole i "termin nieustawiony".
  //
  // Termin dostaje KAZDA wycena, niezaleznie od drogi, i to juz przy zakladaniu
  // numeru. Wycena zapisana z kalkulatora nadpisze go za chwile wlasnym z
  // `priceQuote`, ale gdyby to wycenianie padlo w polowie, zostalby w bazie
  // wiersz bez terminu, czyli oferta wiazaca nas bez konca.
  const validUntil = new Date(Date.now() + QUOTE_VALIDITY_DAYS * 86400_000)
    .toISOString().slice(0, 10);

  const { rows } = await pool.query(
    `INSERT INTO quotes (quote_ref, lang, currency, source, customer_email, customer_name, customer_phone,
       message, access_token, ip_hash, rates_snapshot, valid_until)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [quoteRef, lang, currency, input.source || "quote",
     input.email ? String(input.email).trim().toLowerCase() : null,
     input.name || null, input.phone || null,
     input.message || null, accessToken, input.ipHash || null,
     input.ratesSnapshot ? JSON.stringify(input.ratesSnapshot) : null,
     validUntil]
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
 * Rodzaje pozycji oferty.
 *
 *   fixed   - skladnik rachunku, zawsze w kwocie
 *   variant - propozycja do wyboru: z jednej grupy klient bierze DOKLADNIE JEDNA
 *   option  - dodatek: klient bierze go albo nie, niezaleznie od reszty
 *
 * Wczesniej istnial tylko podzial na poziomie CALEJ oferty (`pick_one`), wiec
 * "wydruk klucza 56 albo 68 mm, do tego opcjonalne polerowanie" nie dalo sie
 * ulozyc: albo wszystko bylo rachunkiem, albo wszystko alternatywa.
 */
export const ITEM_KINDS = ["fixed", "variant", "option"];

/** Grupa dla wariantu, ktory jej nie dostal. Jedna karta, jeden wybor. */
export const DEFAULT_GROUP = "wybor";

/** Czy pozycje niosa juz nowy podzial, czy to jeszcze stara oferta z `pick_one`. */
function maRodzaje(items) {
  return (items || []).some((i) => i.kind === "variant" || i.kind === "option");
}

function rodzajPozycji(quote, item) {
  if (maRodzaje(quote?.items)) return ITEM_KINDS.includes(item.kind) ? item.kind : "fixed";
  // Zgodnosc wsteczna: w starej ofercie `pick_one` wszystkie pozycje byly
  // wzajemnie wykluczajacymi sie propozycjami, czyli jedna grupa wariantow.
  return quote?.pick_one ? "variant" : "fixed";
}

/**
 * Pozycje, za ktore klient naprawde zaplaci.
 *
 * To jest jedyne miejsce, ktore rozstrzyga, co wchodzi do kwoty: rachunek,
 * wybrany wariant kazdej grupy i zaznaczone dodatki. Konwersja na zamowienie,
 * rabat, strona oferty i panel czytaja to samo, bo rozjazd miedzy nimi znaczy
 * zamowienie na inna rzecz niz ta, za ktora klient zaplacil.
 *
 * Wybor w grupie NIGDY nie jest pusty: bez wskazania bierzemy pierwszy
 * wyceniony wariant. Dzieki temu `total_grosze` zawsze znaczy KWOTE DO ZAPLATY
 * i zadna bramka nie musi uczyc sie stanu "jeszcze nie wybrano".
 *
 * @returns {Array<object>} pozycje w kolejnosci z wyceny
 */
export function selectedQuoteItems(quote) {
  const items = quote?.items || [];
  if (!items.length) return [];

  const wybrane = new Set();
  const grupy = new Map();

  for (const i of items) {
    const rodzaj = rodzajPozycji(quote, i);
    if (rodzaj === "fixed") { wybrane.add(Number(i.id)); continue; }
    if (rodzaj === "option") {
      // Dodatek bez kwoty nie ma czego dolozyc do rachunku.
      if (i.selected !== false && i.unit_grosze != null) wybrane.add(Number(i.id));
      continue;
    }
    const klucz = String(i.group_key || DEFAULT_GROUP);
    if (!grupy.has(klucz)) grupy.set(klucz, []);
    grupy.get(klucz).push(i);
  }

  for (const warianty of grupy.values()) {
    const wycenione = warianty.filter((i) => i.unit_grosze != null);
    if (!wycenione.length) continue;
    const zaznaczony = wycenione.find((i) => i.selected === true);
    // `chosen_item_id` to slad po starej ofercie wielowariantowej. Czytamy go
    // wylacznie wtedy, gdy nic nie jest zaznaczone, zeby oferta wyslana przed
    // ta zmiana pokazywala klientowi dokladnie to, co wybral wczesniej.
    const stary = wycenione.find((i) => Number(i.id) === Number(quote.chosen_item_id));
    wybrane.add(Number((zaznaczony || stary || wycenione[0]).id));
  }

  return items.filter((i) => wybrane.has(Number(i.id)));
}

/**
 * Kwota do zaplaty: suma wybranych pozycji.
 *
 * @returns {number|null} null, gdy nie ma jeszcze czym zaplacic
 */
export function quoteAmountGrosze(quote) {
  const suma = selectedQuoteItems(quote)
    .reduce((s, i) => s + (i.line_grosze ?? (i.unit_grosze != null ? i.unit_grosze * i.qty : 0)), 0);
  return suma > 0 ? suma : null;
}

/**
 * Grupy pozycji w postaci, ktorej potrzebuje strona oferty i panel.
 *
 * Jedna karta to jedna grupa: warianty do wyboru i dodatki, ktore da sie do
 * nich dolozyc. Pozycje rachunku (fixed) nie tworza karty i ida osobno.
 */
export function quoteGroups(quote) {
  const items = quote?.items || [];
  const karty = new Map();
  const rachunek = [];

  for (const i of items) {
    const rodzaj = rodzajPozycji(quote, i);
    if (rodzaj === "fixed") { rachunek.push(i); continue; }
    const klucz = String(i.group_key || DEFAULT_GROUP);
    if (!karty.has(klucz)) karty.set(klucz, { key: klucz, variants: [], options: [] });
    karty.get(klucz)[rodzaj === "variant" ? "variants" : "options"].push(i);
  }

  return { fixed: rachunek, groups: [...karty.values()] };
}

/** Kwota jednostkowa w postaci, ktora wolno zapisac. Jedna regula dla obu drog. */
function kwotaJednostkowa(wartosc) {
  if (wartosc === null || wartosc === "" || wartosc === undefined) return null;
  const unit = Math.round(Number(wartosc));
  if (!Number.isFinite(unit) || unit <= 0) throw new QuoteError("bad_amount", "Kwota pozycji musi byc dodatnia");
  return unit;
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
    const unit = kwotaJednostkowa(line.unitGrosze);
    if (unit == null) throw new QuoteError("bad_amount", "Kwota pozycji musi byc dodatnia");

    const lineTotal = unit * item.qty;
    total += lineTotal;
    await pool.query(
      `UPDATE quote_items SET unit_grosze = $2, line_grosze = $3 WHERE id = $1`,
      [item.id, unit, lineTotal]
    );
    // Ta sama zmiana w wczytanej kopii. Kwote do zaplaty liczymy nizej z ukladu
    // pozycji, a uklad musi juz znac swiezo wpisane kwoty.
    item.unit_grosze = unit;
    item.line_grosze = lineTotal;
  }

  if (!total) throw new QuoteError("no_amount", "Wycena bez kwoty nie jest oferta");

  // Suma pozycji nie musi byc kwota do zaplaty: wariant z tej samej grupy
  // wyklucza pozostale, a niezaznaczony dodatek nie wchodzi do rachunku.
  // Liczymy wiec z tej samej reguly, ktora widzi klient na stronie oferty.
  const doZaplaty = quoteAmountGrosze(quote);
  if (!doZaplaty) throw new QuoteError("no_amount", "Zadna wybrana pozycja nie ma kwoty");

  const validUntil = new Date(Date.now() + validDays * 86400_000);
  const wariant = selectedQuoteItems(quote).find((i) => rodzajPozycji(quote, i) === "variant") || null;
  await pool.query(
    `UPDATE quotes SET status = 'priced', total_grosze = $2, price_note = $3, valid_until = $4,
            chosen_item_id = COALESCE($5, chosen_item_id)
      WHERE id = $1`,
    [quote.id, doZaplaty, note, validUntil.toISOString().slice(0, 10), wariant ? wariant.id : null]
  );

  return {
    quoteRef,
    totalGrosze: doZaplaty,
    validUntil: validUntil.toISOString().slice(0, 10),
    pickOne: Boolean(quote.pick_one),
    chosenItemId: wariant ? Number(wariant.id) : null,
  };
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
  // Rabat dotyczy TEGO, co klient kupuje: wybranego wariantu i zaznaczonych
  // dodatkow. Podanie wszystkich pozycji dalo by znizke liczona od sumy
  // propozycji, z ktorych realizujemy jedna.
  const pozycje = selectedQuoteItems(quote);
  return pozycje.map((i) => ({
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
 * @param {number} [opcje.eurRate] kurs, po ktorym zamrazamy kwote przelewu w euro
 * @param {Date}   [opcje.expiresAt] wlasny termin waznosci zamowienia
 * @returns {Promise<{orderRef:string, accessToken:string, totalGrosze:number}>}
 */
export async function convertQuoteToOrder(
  pool, quoteRef,
  { orderRef, delivery = {}, customer = {}, discount = null, consents = null, paymentMethod = "autopay",
    validityDays = 7, eurRate = null, expiresAt: terminZlecony = null }
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
  const expiresAt = terminZlecony || new Date(Date.now() + validityDays * 86400_000);
  // Zaplata w euro idzie przelewem, a kwote w euro ZAMRAZAMY przy skladaniu
  // zamowienia, razem z kursem. Gdybysmy przeliczali ja dopiero przy ksiegowaniu,
  // klient przelalby jedna kwote, a my oczekiwalibysmy innej.
  const przelew = paymentMethod === "bank_transfer";

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
         amount_eur_cents, eur_rate, eur_rate_locked_at,
         accepted_terms_at, waived_withdrawal_at)
       -- 'quoted' jest jedyna dopuszczona przez CHECK w orders.kind obok 'instant'
       VALUES ($1,$25,'quoted',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
         $23,$24, CASE WHEN $23::INTEGER IS NULL THEN NULL ELSE NOW() END,
         $21,$22)
       RETURNING id`,
      [orderRef, quote.lang, quote.total_grosze, shipping, total,
       email, name, phone,
       delivery.method || null, delivery.point || null, delivery.addressLine1 || null,
       delivery.addressLine2 || null, delivery.postalCode || null, delivery.city || null,
       delivery.country || "PL",
       accessToken, quote.ip_hash, expiresAt, creditGrosze || null,
       przelew ? "bank_transfer" : "autopay",
       // Zgody zapisujemy z chwila zlozenia zamowienia. Wycena przekuta z
       // panelu ich nie niesie, bo tam zamawia czlowiek z naszej strony, i
       // wtedy oba pola zostaja puste zamiast udawac zgode, ktorej nikt nie dal.
       consents?.terms ? new Date() : null,
       consents?.waiveWithdrawal ? new Date() : null,
       // Kwota w euro liczy sie z sumy PLN po tym samym narzucie, co w sklepie,
       // i zamraza sie razem z kursem. Przy zaplacie bramka pole zostaje puste.
       przelew ? eurCentsFromGrosze(total, eurRate) : null,
       przelew ? eurRate : null,
       // Przelew nie ma bramki, wiec zamowienie czeka na ksiegowanie, a nie
       // na przekierowanie. To ten sam stan, ktorego uzywa sklep.
       przelew ? "awaiting_transfer" : "awaiting_payment"]
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
      // Kwota w euro idzie za kwota w zlotowkach. Bez tego wiersza rabat
      // schodzilby z sumy PLN, a przelew opiewalby na cene sprzed rabatu:
      // klient przelalby za duzo i mielibysmy nadplate do zwrotu.
      await client.query(
        `UPDATE orders SET discount_code = $2, discount_grosze = $3, total_grosze = $4,
                amount_eur_cents = CASE WHEN amount_eur_cents IS NULL THEN NULL ELSE $5 END
          WHERE id = $1`,
        [orderId, discountCode, discountGrosze, doZaplaty, przelew ? eurCentsFromGrosze(doZaplaty, eurRate) : null]
      );
    }

    // Do zamowienia idzie WYLACZNIE to, co klient wybral: rachunek, po jednym
    // wariancie z kazdej grupy i zaznaczone dodatki. Pozostale pozycje byly
    // propozycjami, a nie czescia tego samego zlecenia, wiec wpisanie ich
    // wszystkich zrobiloby zamowienie na trzy rzeczy naraz, za kwote jednej.
    const doZamowienia = selectedQuoteItems(quote);
    if (!doZamowienia.length) throw new QuoteError("no_variant", "Nie wybrano wariantu oferty");

    for (const item of doZamowienia) {
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
      paymentMethod: przelew ? "bank_transfer" : "autopay",
      amountEurCents: przelew ? eurCentsFromGrosze(doZaplaty, eurRate) : null,
      eurRate: przelew ? eurRate : null,
    };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Poprawienie zapisanej oferty: dane klienta, tresc zapytania i pozycje.
 *
 * Wycena powstaje z zapytania, ktore czlowiek przepisuje ze skrzynki albo
 * z rozmowy, wiec literowka w adresie i zle policzona ilosc sa tu norma,
 * a nie wyjatkiem. Do tej pory jedyna droga bylo zalozenie wyceny od nowa,
 * co znaczylo NOWY NUMER, czyli inny numer w watku i inny tytul platnosci
 * niz ten, ktory klient juz od nas dostal.
 *
 * Czego ta funkcja NIE robi: nie rusza kwot jednostkowych. Te wpisuje
 * `priceQuote`, bo to ona pilnuje, ze kwota jest dodatnia i ze wycena bez
 * kwoty nie staje sie oferta. Tutaj zmienia sie ilosc, wiec przeliczamy
 * `line_grosze` i sume naglowka, inaczej oferta pokazywalaby sume, ktora
 * nie zgadza sie z wlasnymi pozycjami.
 *
 * Wycena `converted` jest zamknieta, tak samo jak przy wycenianiu: stoi za
 * nia zamowienie z wlasnymi pozycjami i wlasna kwota, a edycja tutaj
 * rozjechalaby jedno z drugim bez sladu.
 *
 * @param {object} patch pola pominiete (undefined) zostaja nietkniete
 * @returns {Promise<{quoteRef:string, totalGrosze:number|null, status:string, removed:number, added:number}>}
 */
export async function updateQuote(pool, quoteRef, patch = {}) {
  const quote = await getQuoteByRef(pool, quoteRef);
  if (!quote) throw new QuoteError("not_found", "Nie ma takiej wyceny");
  if (quote.status === "converted") {
    throw new QuoteError("already_converted", "Ta wycena stala sie juz zamowieniem, wiec jej nie edytujemy");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // --- Naglowek ---------------------------------------------------------
    const pola = [];
    const wartosci = [quote.id];
    const dopisz = (kolumna, wartosc) => {
      wartosci.push(wartosc);
      pola.push(`${kolumna} = $${wartosci.length}`);
    };
    const tekst = (v, limit) => {
      const s = String(v ?? "").trim();
      return s ? s.slice(0, limit) : null;
    };
    if (patch.email !== undefined) dopisz("customer_email", tekst(patch.email, 255));
    // Notatka idzie do klienta razem z kwota, wiec zmienia sie tam, gdzie kwoty:
    // w jednym formularzu, a nie w drugim, ktory trzeba znalezc nizej.
    if (patch.note !== undefined) dopisz("price_note", tekst(patch.note, 5000));
    if (patch.name !== undefined) dopisz("customer_name", tekst(patch.name, 120));
    if (patch.phone !== undefined) dopisz("customer_phone", tekst(patch.phone, 40));
    if (patch.message !== undefined) dopisz("message", tekst(patch.message, 5000));
    if (patch.lang !== undefined) {
      const lang = ["pl", "en", "de"].includes(patch.lang) ? patch.lang : null;
      if (!lang) throw new QuoteError("bad_lang", "Jezyk oferty to pl, en albo de");
      dopisz("lang", lang);
    }
    // Waluta oferty dotyczy CALEJ oferty, nigdy pojedynczej pozycji: rachunek
    // w dwoch walutach nie ma jak sie zsumowac, a przelew wychodzi z jednego
    // konta. Zmienia sie razem ze sposobem zaplaty, wiec nie jest kosmetyka.
    if (patch.currency !== undefined) {
      const waluta = String(patch.currency || "").toUpperCase();
      if (!["PLN", "EUR"].includes(waluta)) throw new QuoteError("bad_currency", "Waluta oferty to PLN albo EUR");
      dopisz("currency", waluta);
    }
    // Termin waznosci jest obietnica handlowa i zmienia sie niezaleznie od kwot:
    // przy wyrobie, w ktorym kruszec jest glowna skladowa, bywa krotszy niz
    // domyslny. Do tej pory dalo sie go ustawic WYLACZNIE przy wycenianiu, wiec
    // skrocenie terminu wymagalo wpisania kwot od nowa.
    //
    // Dwie drogi do tego samego pola, bo tak sie o nim mysli: "wazna jeszcze
    // dziesiec dni" albo "wazna do konca miesiaca". Liczba dni ma pierwszenstwo,
    // bo stoi w formularzu obok kwot i wpisuje sie ja swiadomie.
    let terminZDni;
    if (patch.validDays !== undefined && String(patch.validDays).trim() !== "") {
      const dni = Math.floor(Number(patch.validDays));
      if (!Number.isFinite(dni) || dni < 1 || dni > 365) throw new QuoteError("bad_date", "Waznosc podaj w dniach, od 1 do 365");
      terminZDni = new Date(Date.now() + dni * 86400_000).toISOString().slice(0, 10);
      dopisz("valid_until", terminZDni);
    } else if (patch.validUntil !== undefined) {
      const dzien = String(patch.validUntil || "").trim();
      if (!dzien) {
        dopisz("valid_until", null);
      } else {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dzien)) throw new QuoteError("bad_date", "Termin podaj jako date");
        if (Number.isNaN(Date.parse(dzien))) throw new QuoteError("bad_date", "To nie jest prawdziwa data");
        dopisz("valid_until", dzien);
      }
    }
    // Stary przelacznik "cala oferta jest do wyboru". Zastapil go podzial na
    // poziomie pozycji, wiec gdy edytor przysyla rodzaje, flaga MUSI zgasnac:
    // dwie reguly na raz znaczylyby, ze pozycja oznaczona jako skladnik
    // rachunku dalej zachowuje sie jak alternatywa.
    const zRodzajami = (patch.items || []).some((p) => p.kind !== undefined);
    if (zRodzajami) dopisz("pick_one", false);
    else if (patch.pickOne !== undefined) dopisz("pick_one", Boolean(patch.pickOne));
    // Adres ani telefon nie moga zniknac oba naraz: bez zadnego z nich nie ma
    // jak przekazac oferty, a wycena zostalaby w panelu jako slepy wiersz.
    const email = patch.email !== undefined ? tekst(patch.email, 255) : quote.customer_email;
    const phone = patch.phone !== undefined ? tekst(patch.phone, 40) : quote.customer_phone;
    if (!email && !phone) throw new QuoteError("no_contact", "Zostaw adres e-mail albo telefon");

    if (pola.length) {
      await client.query(
        `UPDATE quotes SET ${pola.join(", ")}, updated_at = NOW() WHERE id = $1`,
        wartosci
      );
    }

    // --- Pozycje ----------------------------------------------------------
    const wgId = new Map(quote.items.map((i) => [Number(i.id), i]));
    // Pozycje, ktore TO zadanie kaze zaznaczyc. Potrzebne nizej, przy pilnowaniu
    // reguly "w grupie zaznaczony jest dokladnie jeden".
    const swiezoZaznaczone = new Set(
      (patch.items || []).filter((p) => p.selected === true && p.id != null).map((p) => Number(p.id))
    );
    let usuniete = 0;
    let dodane = 0;

    for (const poz of patch.items || []) {
      const id = poz.id === undefined || poz.id === null ? null : Number(poz.id);

      if (id !== null) {
        const item = wgId.get(id);
        if (!item) throw new QuoteError("unknown_item", `Pozycja ${poz.id} nie nalezy do wyceny ${quoteRef}`);

        if (poz.remove) {
          await client.query("DELETE FROM quote_items WHERE id = $1", [item.id]);
          wgId.delete(id);
          usuniete++;
          continue;
        }

        const zmiany = [];
        const wart = [item.id];
        // Rodzaj, karta i zaznaczenie: to one rozstrzygaja, co wchodzi do kwoty.
        if (poz.kind !== undefined) {
          const rodzaj = ITEM_KINDS.includes(poz.kind) ? poz.kind : null;
          if (!rodzaj) throw new QuoteError("bad_kind", "Rodzaj pozycji to skladnik, wariant albo dodatek");
          wart.push(rodzaj);
          zmiany.push(`kind = $${wart.length}`);
        }
        if (poz.groupKey !== undefined) {
          wart.push(tekst(poz.groupKey, 40));
          zmiany.push(`group_key = $${wart.length}`);
        }
        if (poz.selected !== undefined) {
          // Pozycja, ktora WLASNIE stala sie dodatkiem, nie miala w formularzu
          // pola zaznaczania, wiec przyszlaby jako odznaczona. Nowy dodatek
          // ma byc zaznaczony, wiec pierwsze zaznaczenie ustawiamy sami.
          const swiezyDodatek = poz.kind === "option" && item.kind !== "option";
          wart.push(swiezyDodatek ? true : Boolean(poz.selected));
          zmiany.push(`selected = $${wart.length}`);
        }
        // Kwota jednostkowa. Do tej pory wpisywalo sie ja osobnym formularzem,
        // nizej na stronie, wiec cena stala daleko od pozycji, ktorej dotyczy.
        // Regula zostaje ta sama co przy wycenianiu: dodatnia albo zadna.
        if (poz.unitGrosze !== undefined) {
          const unit = kwotaJednostkowa(poz.unitGrosze);
          const qty = poz.qty !== undefined ? Math.max(1, Math.floor(Number(poz.qty) || 1)) : item.qty;
          wart.push(unit);
          zmiany.push(`unit_grosze = $${wart.length}`);
          wart.push(unit == null ? null : unit * qty);
          zmiany.push(`line_grosze = $${wart.length}`);
        }
        if (poz.title !== undefined) {
          const t = tekst(poz.title, 255);
          if (!t) throw new QuoteError("bad_title", "Pozycja musi miec nazwe");
          wart.push(t);
          zmiany.push(`title = $${wart.length}`);
        }
        if (poz.description !== undefined) {
          wart.push(tekst(poz.description, 5000));
          zmiany.push(`description = $${wart.length}`);
        }
        if (poz.qty !== undefined) {
          const qty = Math.floor(Number(poz.qty));
          if (!Number.isFinite(qty) || qty < 1) throw new QuoteError("bad_qty", "Ilosc musi byc dodatnia");
          wart.push(qty);
          zmiany.push(`qty = $${wart.length}`);
          // Wartosc pozycji idzie za iloscia. Bez tego oferta na trzy sztuki
          // pokazywalaby kwote za jedna, i to bez zadnego bledu.
          // Gdy w tym samym zapisie przyszla nowa kwota, wartosc policzyla sie
          // juz wyzej, z NOWEJ ceny. Drugie przypisanie liczyloby ja ze starej.
          if (item.unit_grosze && poz.unitGrosze === undefined) {
            wart.push(item.unit_grosze * qty);
            zmiany.push(`line_grosze = $${wart.length}`);
          }
        }
        if (zmiany.length) {
          await client.query(`UPDATE quote_items SET ${zmiany.join(", ")} WHERE id = $1`, wart);
        }
        continue;
      }

      // Nowa pozycja. Kwota moze przyjsc od razu, bo teraz wpisuje sie ja przy
      // pozycji, a nie w drugim formularzu; pusta znaczy "jeszcze nie wiem".
      const t = tekst(poz.title, 255);
      if (!t) continue;
      const qty = Math.max(1, Math.floor(Number(poz.qty) || 1));
      const unit = kwotaJednostkowa(poz.unitGrosze);
      const rodzaj = poz.kind === undefined ? "fixed" : (ITEM_KINDS.includes(poz.kind) ? poz.kind : null);
      if (!rodzaj) throw new QuoteError("bad_kind", "Rodzaj pozycji to skladnik, wariant albo dodatek");
      await client.query(
        `INSERT INTO quote_items (quote_id, title, qty, description, unit_grosze, line_grosze, kind, group_key, selected)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [quote.id, t, qty, tekst(poz.description, 5000), unit, unit == null ? null : unit * qty,
         rodzaj, tekst(poz.groupKey, 40), poz.selected === undefined ? true : Boolean(poz.selected)]
      );
      dodane++;
    }

    // --- Suma naglowka ----------------------------------------------------
    // Liczymy ja z pozycji, a nie korygujemy o roznice, bo po usunieciu
    // i dodaniu pozycji w jednym zadaniu roznica przestaje byc policzalna.
    //
    // Kwota do zaplaty to nie suma wszystkiego: wariant z jednej grupy wyklucza
    // pozostale, a niezaznaczony dodatek nie wchodzi do rachunku. Zaznaczenie
    // moglo przy okazji wskazywac pozycje wlasnie usunieta, wiec czytamy wycene
    // od nowa i pozwalamy regule wybrac pierwszy pozostaly wariant.
    const { rows: poZmianie } = await client.query(
      `SELECT q.id, q.pick_one, q.chosen_item_id, q.total_grosze,
              COALESCE(json_agg(json_build_object(
                'id', i.id, 'unit_grosze', i.unit_grosze, 'line_grosze', i.line_grosze, 'qty', i.qty,
                'kind', i.kind, 'group_key', i.group_key, 'selected', i.selected
              ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
         FROM quotes q LEFT JOIN quote_items i ON i.quote_id = q.id
        WHERE q.id = $1 GROUP BY q.id`,
      [quote.id]
    );
    const wszystkie = poZmianie[0].items.length;
    if (!wszystkie) throw new QuoteError("no_items", "Wycena bez pozycji nie ma sensu");

    // W grupie wariantow zaznaczony jest DOKLADNIE JEDEN. Reguly pilnuje serwer,
    // a nie formularz: przelacznik w przegladarce nie wie o pozycjach dodanych
    // w tym samym zapisie, a dwa zaznaczenia w jednej grupie znaczylyby kwote
    // za dwie rzeczy, z ktorych realizujemy jedna.
    const grupy = new Map();
    for (const i of poZmianie[0].items) {
      if (i.kind !== "variant") continue;
      const klucz = String(i.group_key || DEFAULT_GROUP);
      if (!grupy.has(klucz)) grupy.set(klucz, []);
      grupy.get(klucz).push(i);
    }
    for (const warianty of grupy.values()) {
      const zaznaczone = warianty.filter((i) => i.selected);
      // Zaznaczenie z TEGO zapisu wygrywa z zastanym. Bez tej zasady przestawienie
      // wariantu pojedynczym zadaniem nie dzialaloby wcale: w grupie byliby wtedy
      // dwaj zaznaczeni, a regula "zostaje pierwszy" trzymalaby sie starego wyboru
      // i cicho cofala klikniecie.
      const swiezy = warianty.find((i) => swiezoZaznaczone.has(Number(i.id)));
      // Bez zaznaczenia bierzemy pierwszy wyceniony, zeby oferta nigdy nie
      // trafila do klienta z pusta karta.
      const zostaje = swiezy || zaznaczone[0] || warianty.find((i) => i.unit_grosze != null) || warianty[0];
      for (const i of warianty) {
        const ma = i === zostaje;
        if (Boolean(i.selected) !== ma) {
          await client.query(`UPDATE quote_items SET selected = $2 WHERE id = $1`, [i.id, ma]);
          i.selected = ma;
        }
      }
    }

    const doZaplaty = quoteAmountGrosze(poZmianie[0]);
    const wariant = selectedQuoteItems(poZmianie[0]).find((i) => i.kind === "variant") || null;

    if (doZaplaty == null) {
      // Nie ma czym zaplacic: to znowu jest zapytanie, nie oferta.
      await client.query(
        `UPDATE quotes SET total_grosze = NULL, valid_until = NULL, status = 'new', updated_at = NOW() WHERE id = $1`,
        [quote.id]
      );
    } else {
      // Wpisanie kwoty czyni z zapytania oferte, dokladnie tak samo jak dawniej
      // osobne wycenianie. Bez tego kwota wpisana przy pozycji zostawilaby
      // wycene w stanie "nowa", a wiec bez przycisku wysylki.
      const stan = quote.status === "new" ? "priced" : quote.status;
      // Oferta bez terminu obowiazywalaby bez konca. Domyslny wpisujemy tylko
      // wtedy, gdy kwota pojawia sie przy wycenie, ktora terminu nie ma,
      // i nikt nie podal wlasnego w tym samym zapisie.
      const bezTerminu = !quote.valid_until && terminZDni === undefined && patch.validUntil === undefined;
      const domyslny = bezTerminu
        ? new Date(Date.now() + QUOTE_VALIDITY_DAYS * 86400_000).toISOString().slice(0, 10)
        : null;
      await client.query(
        `UPDATE quotes SET total_grosze = $2, chosen_item_id = $3, status = $4,
                valid_until = COALESCE($5, valid_until), updated_at = NOW()
          WHERE id = $1`,
        [quote.id, doZaplaty, wariant ? wariant.id : null, stan, domyslny]
      );
    }

    // Stan i termin czytamy z bazy, a nie skladamy z zalozen: to ta wartosc
    // zobaczy panel w komunikacie i ona ma sie zgadzac z tym, co zapisane.
    const { rows: koniec } = await client.query(
      `SELECT status, valid_until, total_grosze FROM quotes WHERE id = $1`, [quote.id]
    );

    await client.query("COMMIT");
    return {
      quoteRef,
      totalGrosze: koniec[0].total_grosze,
      status: koniec[0].status,
      removed: usuniete,
      added: dodane,
      pickOne: Boolean(poZmianie[0].pick_one),
      validUntil: koniec[0].valid_until ? String(koniec[0].valid_until.toISOString?.().slice(0, 10) ?? koniec[0].valid_until).slice(0, 10) : null,
    };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Wybor wariantu przez klienta.
 *
 * Wybor NIE jest wiazacy: az do zaplaty klient moze wrocic i przestawic sie
 * na inny. Wiazaca staje sie dopiero konwersja, ktora bierze wariant wskazany
 * w tej chwili, w tej samej transakcji co zapis zamowienia.
 *
 * Sprawdzenie stoi po stronie serwera, a nie w interfejsie: pozycja musi
 * nalezec do TEJ wyceny i miec kwote, inaczej wybor byloby ustawieniem
 * dowolnej liczby jako naleznosci.
 */
export async function chooseQuoteOption(pool, quoteRef, itemId, selected = true) {
  const quote = await getQuoteByRef(pool, quoteRef);
  if (!quote) throw new QuoteError("not_found", "Nie ma takiej wyceny");
  if (quote.converted_order_id) throw new QuoteError("already_converted", "Ta oferta stala sie juz zamowieniem");

  const wybrany = (quote.items || []).find((i) => Number(i.id) === Number(itemId));
  if (!wybrany) throw new QuoteError("unknown_item", "Ta pozycja nie nalezy do tej oferty");

  const rodzaj = rodzajPozycji(quote, wybrany);
  if (rodzaj === "fixed") throw new QuoteError("not_multi", "Ta pozycja jest skladnikiem oferty, nie ma czego wybierac");
  if (wybrany.unit_grosze == null) throw new QuoteError("not_priced", "Ta pozycja nie ma jeszcze kwoty");

  if (rodzaj === "variant") {
    // Wariantu nie da sie odznaczyc: z grupy zawsze wychodzi jedna rzecz.
    // Zdjecie zaznaczenia zostawiloby karte pusta, a oferte bez kwoty.
    const klucz = String(wybrany.group_key || DEFAULT_GROUP);
    const wGrupie = (quote.items || [])
      .filter((i) => rodzajPozycji(quote, i) === "variant" && String(i.group_key || DEFAULT_GROUP) === klucz)
      .map((i) => i.id);
    await pool.query(
      `UPDATE quote_items SET selected = (id = $2) WHERE id = ANY($1::bigint[])`,
      [wGrupie, wybrany.id]
    );
    for (const i of quote.items) {
      if (wGrupie.includes(i.id)) i.selected = Number(i.id) === Number(wybrany.id);
    }
  } else {
    await pool.query(`UPDATE quote_items SET selected = $2 WHERE id = $1`, [wybrany.id, Boolean(selected)]);
    wybrany.selected = Boolean(selected);
  }

  // Kwote liczy serwer z zapisanego stanu, nigdy przegladarka: to ona stoi
  // potem w zamowieniu i w tytule przelewu.
  const kwota = quoteAmountGrosze(quote);
  if (!kwota) throw new QuoteError("no_amount", "Po tej zmianie oferta nie ma kwoty");
  await pool.query(
    `UPDATE quotes SET chosen_item_id = $2, total_grosze = $3, updated_at = NOW() WHERE id = $1`,
    [quote.id, rodzaj === "variant" ? wybrany.id : quote.chosen_item_id, kwota]
  );
  return {
    quoteRef,
    itemId: Number(wybrany.id),
    selected: rodzaj === "variant" ? true : Boolean(selected),
    chosenItemId: rodzaj === "variant" ? Number(wybrany.id) : (quote.chosen_item_id != null ? Number(quote.chosen_item_id) : null),
    totalGrosze: kwota,
  };
}

/**
 * Trwale usuniecie wyceny.
 *
 * Decyzja wlasciciela z 2026-08-26, ta sama co przy zamowieniach (ADR-0014).
 * Pozycje znikaja kaskadowo, a wgrane pliki zostaja: `uploads.order_id`
 * i `quote_items.upload_id` sa na `ON DELETE SET NULL`, wiec plik klienta
 * nie przepada razem z wierszem.
 *
 * Wycena `converted` stoi za prawdziwym zamowieniem. Usuniecie jej NIE kasuje
 * tego zamowienia, ale zabiera jedyny slad, skad sie ono wzielo, wiec wymaga
 * osobnego potwierdzenia przez `force`.
 */
export async function deleteQuote(pool, quoteRef, { force = false } = {}) {
  const quote = await getQuoteByRef(pool, quoteRef);
  if (!quote) throw new QuoteError("not_found", "Nie ma takiej wyceny");
  if (quote.status === "converted" && !force) {
    throw new QuoteError(
      "converted",
      "Ta wycena stala sie zamowieniem. Usuniecie zabierze slad, skad ono pochodzi. Potwierdz, jesli mimo to chcesz ja skasowac."
    );
  }
  await pool.query("DELETE FROM quotes WHERE id = $1", [quote.id]);
  return { quoteRef, wasConverted: quote.status === "converted", orderId: quote.converted_order_id ?? null };
}
