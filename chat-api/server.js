import express from "express";
import cors from "cors";
import OpenAI from "openai";
import pg from "pg";
import multer from "multer";
import cron from "node-cron";
import { staleRates, ageHours, STARTUP_REFETCH_AFTER_H, fetchCronExpressions, monthlyRequests } from "./rates.js";
import { createHash } from "crypto";
import { getSystemPrompt, detectHotLead } from "./context.js";
import { createGmailClient, processHistory, setupGmailWatch, pollRecentMessages } from "./gmail.js";
import { CALCULATORS, PricingError, geometryFromFile, priceItem, checkQuarterlyLimit , generateOrderRef, generateToken, ringGeometryFromParams, RING_CALCULATORS } from "./orders.js";
import { bindingBasis } from "./pricing/bindingBasis.js";
import { OUTPUT_AVAILABLE } from "./pricing/ringConfigurator.js";
import { createQuote, priceQuote, updateQuote, deleteQuote, chooseQuoteOption, selectedQuoteItems, quoteGroups, quoteAmountGrosze, quoteOpenItems, quoteSettled, stanPozycji, quoteLeadDays, quoteRequiresDetails, getQuoteByRef, convertQuoteToOrder, quoteItemsForDiscount, availableDesignCredit, repriceSavedItem, SAVED_QUOTE_SOURCE, QUOTE_VALIDITY_DAYS, QuoteError } from "./quotes.js";
import { extraRevisionGrosze, CAD_CONFIG } from "./pricing/cadDesign.js";
import { GEMSTONES } from "./pricing/jewelryConfig.js";
import {
  autopayConfigured, buildStartTransaction, formatValidityTime,
  verifyReturn, parseITN, buildITNConfirmation, fetchGatewayList,
} from "./autopay.js";
import { packagingGrosze, sanitizePersonalization } from "./pricing/packaging.js";
import { inboundAllowed, wymagaPrzesylki } from "./pricing/inboundDelivery.js";
import { brakPodloza } from "./pricing/laserSubstrate.js";
import { MATERIAL_SEED } from "./pricing/materialStockSeed.js";
import { MATERIAL_CORRECTIONS } from "./pricing/materialCorrections.js";
import { validateCustomer, normalizePhone } from "./pricing/customerFields.js";
import { eurCentsFromGrosze, normalizeCurrency, paymentMethodForCurrency } from "./pricing/currency.js";
import { shippingGrosze as shippingCost, needsCustoms, zoneForCountry } from "./pricing/shipping.js";
import { addBusinessDays, TRANSFER_HOLD_BUSINESS_DAYS } from "./pricing/businessDays.js";
import {
  listProducts, getProduct, reserveProduct, consumeReservations,
  releaseExpiredReservations, releaseOrderReservations, ProductError, PRODUCT_STATUSES,
} from "./products.js";
import {
  previewDiscount, reserveDiscount, consumeDiscount, releaseExpiredRedemptions,
  releaseOrderRedemptions, normalizeCode, randomCode, DiscountError, APPLIES_TO, MAX_PERCENT,
} from "./discounts.js";
import {
  sendOrderPaidEmails, sendPaymentReviewAlert, sendTransferInstructions, sendQuoteLink,
  sendDeadlineReminder, sendDetailsNudge, sendStatusUpdate,
} from "./orderMail.js";
import { deletionBlockers, CANCELLABLE_STATUSES } from "./orderCleanup.js";
import {
  itnAction, paymentStartProblem, publicPaymentState,
} from "./paymentState.js";
import { orderAccessAllowed } from "./orderAccess.js";
import { findLockers, LockerError } from "./lockers.js";
import { runRetention } from "./retention.js";
import { requireAdmin, requireInvalidateToken, requireSecret, secretMatches } from "./auth.js";
import { ETAPY_PRACY, przejscie, znanyEtap, korekta, etapPoZaplacie, terminRealizacji,
         dniDoTerminu, ETAP_STARTU_ZEGARA, ETAPY_Z_ZEGAREM,
         ETAPY_PO_ZAPLACIE, ustaleniaDomkniete, ileDoUstalenia } from "./productionQueue.js";
import { progDoWyslania, szturchnacSzczegoly } from "./deadlineReminders.js";
import { extractIP, isPrivateIP, TRUSTED_PROXY_HOPS, TRUST_CLOUDFLARE_HEADERS } from "./clientIp.js";
import { createLimiter, limitBy } from "./rateLimit.js";
import { issueDownloads, takeDownload, downloadName } from "./digitalDelivery.js";
import { ringFiles } from "./ringExport.js";
import { zipSync } from "fflate";

const app = express();
// `true` znaczylo "wierz calemu lancuchowi X-Forwarded-For", takze temu, co
// dopisal do niego klient. Liczba mowi, ile wpisow od konca pochodzi od naszej
// infrastruktury. Wyjasnienie i sposob liczenia adresu: clientIp.js
app.set("trust proxy", TRUSTED_PROXY_HOPS);
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  "https://www.aejaca.com",
  "https://aejaca.com",
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:4173"] : []),
];
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.aejaca-site\.pages\.dev$/,
];

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || isAllowedOrigin(origin)) return cb(null, true);
    cb(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
// Body parsers are applied per-route to avoid global limit conflicts.

// To jest API, nie strona: nie ma tu czego osadzac w ramce ani czego wyswietlac.
// Naglowki mowia to wprost, zeby odpowiedz uzyta w niewlasciwym miejscu nie
// zamienila sie w narzedzie. `nosniff` liczy sie najbardziej: bez niego
// przegladarka potrafi uznac odpowiedz za HTML i wykonac jej tresc.
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

if (pool) {
  pool.query(`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS country VARCHAR(10)`).catch(() => {});
  pool.query(`CREATE TABLE IF NOT EXISTS events (id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ NOT NULL DEFAULT NOW(), session VARCHAR(50) NOT NULL, path VARCHAR(500), category VARCHAR(50), action VARCHAR(200), label VARCHAR(500), value NUMERIC, country VARCHAR(10), device VARCHAR(20))`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id VARCHAR(50)`).catch(() => {});
  // Jak klient dostarczy NAM swoj przedmiot: paczkomat, osobiscie, kurier.
  // Kierunek odwrotny do `delivery_method`, ktory opisuje droge od nas do niego.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS inbound_delivery VARCHAR(30)`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_note TEXT`).catch(() => {});
  // Zapytanie o wycene to zobowiazanie tak samo jak zamowienie, wiec musi dac
  // sie odtworzyc w calosci. Pelny opis, parametry jako struktura, plik i numer
  // do cytowania w korespondencji. Schemat w scripts/leads-schema.sql.
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS params_json JSONB`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS upload_id BIGINT`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_ref VARCHAR(32)`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(30)`).catch(() => {});
  // Projekt 3D ma limit poprawek w cenie. Kolejne sa platne, wiec licznik
  // musi zyc przy zamowieniu, a doplata wisiec przy nim jako dziecko.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS revisions_included INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS revisions_used INTEGER NOT NULL DEFAULT 0`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS parent_order_id BIGINT`).catch(() => {});
  // Oplata projektowa zaliczana na poczet wykonania. Slad trzymamy po obu
  // stronach: ile odliczono i ktore zamowienie skonsumowalo odliczenie.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_applied_grosze INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_consumed_by BIGINT`).catch(() => {});
  // Platnosc przelewem. Autopay obsluguje wylacznie polskie banki i BLIK, wiec
  // klient z zagranicy nie ma czym zaplacic od reki. Kwote naleznosci zamrazamy
  // w euro w chwili zamowienia, razem z kursem, zeby po tygodniu nie bylo sporu
  // o to, ile mial przelac. Rozliczenie i tak zostaje w groszach PLN.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'autopay'`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_eur_cents INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS eur_rate NUMERIC(10,4)`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS eur_rate_locked_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_received_cents INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_confirmed_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_confirmed_by VARCHAR(120)`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_note TEXT`).catch(() => {});
  // Kolumny recznej weryfikacji i indeks nad nimi ida LANCUCHEM, a nie obok
  // siebie. Migracje w tym bloku leca rownolegle, wiec indeks czesciowy po
  // `payment_review_at` mogl wystartowac przed powstaniem kolumny, przegrac
  // wyscig i wyladowac w pustym `.catch`. Kolejka platnosci do rozstrzygniecia
  // dzialalaby wtedy bez indeksu i nikt by sie o tym nie dowiedzial.
  const kolumnyWeryfikacji = Promise.all([
    pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_review_at TIMESTAMPTZ`),
    pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_review_reason VARCHAR(80)`),
    pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_review_previous_status VARCHAR(20)`),
  ]);
  kolumnyWeryfikacji.catch((e) => console.error("[migracja] kolumny payment_review:", e.message));
  // Status posredni: zamowienie zlozone, czekamy na wplyw na konto.
  const stanyZamowienGotowe = pool.query(`
    DO $$ BEGIN
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
      ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN
        ('draft','awaiting_payment','awaiting_transfer','payment_review','paid','details','queued','in_production','ready','shipped','completed','cancelled','expired','refunded'));
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
      ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('autopay','bank_transfer'));
    END $$;
  `);
  stanyZamowienGotowe.catch((e) => console.error("[migracja] status/payment_method:", e.message));
  pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_awaiting_transfer
              ON orders (created_at DESC) WHERE status = 'awaiting_transfer'`).catch(() => {});
  kolumnyWeryfikacji
    .then(() => pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_review
                            ON orders (payment_review_at DESC) WHERE status = 'payment_review'`))
    .catch((e) => console.error("[migracja] indeks payment_review:", e.message));

  // Kody rabatowe. Jedna tabela obsluguje kody osobiste (jednorazowe) i akcje
  // (MATKA15, BLACKFRIDAY), rozroznione wylacznie ustawieniami.
  pool.query(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id BIGSERIAL PRIMARY KEY,
      code VARCHAR(32) UNIQUE NOT NULL,
      kind VARCHAR(10) NOT NULL CHECK (kind IN ('percent','amount')),
      value INTEGER NOT NULL CHECK (value > 0),
      applies_to VARCHAR(20) NOT NULL DEFAULT 'all'
        CHECK (applies_to IN ('all','products','services','jewelry','studio')),
      min_order_grosze INTEGER NOT NULL DEFAULT 0,
      max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
      max_uses_per_email INTEGER NOT NULL DEFAULT 1 CHECK (max_uses_per_email > 0),
      used_count INTEGER NOT NULL DEFAULT 0,
      valid_from TIMESTAMPTZ,
      valid_to TIMESTAMPTZ,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      campaign VARCHAR(60),
      issued_to VARCHAR(255),
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT discount_percent_range CHECK (kind <> 'percent' OR value BETWEEN 1 AND 80)
    );
    CREATE TABLE IF NOT EXISTS discount_redemptions (
      id BIGSERIAL PRIMARY KEY,
      code_id BIGINT NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
      order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      amount_grosze INTEGER NOT NULL CHECK (amount_grosze >= 0),
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      released_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_redemptions_code ON discount_redemptions (code_id) WHERE released_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_redemptions_email ON discount_redemptions (code_id, email) WHERE released_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_redemptions_order ON discount_redemptions (order_id);
  `).catch((e) => console.error("[migracja] discounts:", e.message));
  pool.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS issued_to VARCHAR(255)`).catch(() => {});
  // Kolumna `subscribers.discount_code` miala domyslna wartosc 'AEJACA10' z czasow,
  // gdy wszyscy dostawali ten sam kod. Przeplyw zapisuje teraz kod wystawiony dla
  // konkretnej osoby, a domyslna wartosc tylko wpisywalaby w tabele nieprawde.
  pool.query(`ALTER TABLE subscribers ALTER COLUMN discount_code DROP DEFAULT`).catch(() => {});
  // Rezygnacja. Zamowienie zostaje, towar i kod wracaja do puli, a wiersz mowi
  // kto i kiedy je odwolal. Bez tych trzech kolumn "anulowane" bylo napisem
  // bez autora, czyli poczatkiem sporu o to, kto co zdjal ze stanu.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(120)`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(32)`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_grosze INTEGER NOT NULL DEFAULT 0`).catch(() => {});

  // KOLEJKA PRACOWNI. Statusy `in_production`, `shipped` i `completed` stoja
  // w ograniczeniu tabeli od poczatku, ale nic ich nigdy nie ustawialo:
  // oplacone zamowienie zostawalo w stanie `paid` na zawsze i nie bylo miejsca,
  // w ktorym widac, co jest do zrobienia dzisiaj i co czeka najdluzej.
  //
  // `fulfilled_at` NIE nadaje sie na te role. Znaczy "platnosc rozliczona",
  // ustawia je potwierdzenie przelewu i to na nim opiera sie zakaz anulowania.
  // Uzycie go do "praca skonczona" zlepiloby dwie rozne rzeczy w jedno pole.
  // Oferta wielowariantowa. Pozycje staja sie alternatywami, a `total_grosze`
  // niesie kwote wybranego wariantu zamiast sumy pozycji.
  // Waluta oferty. Dotyczy CALEJ oferty, bo przelew wychodzi z jednego konta,
  // a rachunek w dwoch walutach nie ma jak sie zsumowac. Oferty zalozone przed
  // ta kolumna dostaja walute swojego jezyka: dokladnie to widzial dotad ich
  // klient, bo strona przeliczala kwoty wylacznie po jezyku.
  (async () => {
    await pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'PLN'`);
    await pool.query(`UPDATE quotes SET currency = 'EUR' WHERE lang IN ('en','de') AND currency = 'PLN'`);
  })().catch((e) => console.error("[migracja] waluta oferty:", e.message));

  pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS pick_one BOOLEAN NOT NULL DEFAULT FALSE`).catch(() => {});
  pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS chosen_item_id BIGINT`).catch(() => {});

  // Wybor ZESZEDL NA POZIOM POZYCJI. Flaga `pick_one` opisywala cala oferte,
  // wiec albo wszystko bylo rachunkiem, albo wszystko alternatywa; "klucz
  // 56 albo 68 mm, do tego opcjonalne polerowanie" nie mialo jak powstac.
  // Teraz pozycja jest skladnikiem rachunku, wariantem w grupie albo dodatkiem.
  //
  // Te kroki ida PO SOBIE, a nie rownolegle jak reszta migracji: przepisanie
  // starych ofert czyta kolumny zakladane wiersz wyzej.
  const rodzajePozycjiGotowe = (async () => {
    await pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS kind VARCHAR(10) NOT NULL DEFAULT 'fixed'`);
    await pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS group_key VARCHAR(40)`);
    await pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS selected BOOLEAN NOT NULL DEFAULT TRUE`);
    // Stara oferta wielowariantowa to jedna grupa wariantow. Bez przepisania
    // jej pozycje wygladalyby jak rachunek, a klient zobaczylby kwote za
    // wszystkie propozycje naraz.
    await pool.query(`
      UPDATE quote_items i
         SET kind = 'variant',
             group_key = COALESCE(i.group_key, 'wybor'),
             selected = COALESCE(q.chosen_item_id = i.id, FALSE)
        FROM quotes q
       WHERE q.id = i.quote_id AND q.pick_one AND i.kind = 'fixed'`);
    // Grupa bez zaznaczenia dostaje pierwszy wyceniony wariant. Pusta karta
    // znaczylaby oferte bez kwoty, a taka nie ma czego pokazac klientowi.
    await pool.query(`
      UPDATE quote_items SET selected = TRUE
       WHERE id IN (
         SELECT DISTINCT ON (i.quote_id, COALESCE(i.group_key, 'wybor')) i.id
           FROM quote_items i
          WHERE i.kind = 'variant'
            AND NOT EXISTS (
              SELECT 1 FROM quote_items s
               WHERE s.quote_id = i.quote_id AND s.kind = 'variant' AND s.selected
                 AND COALESCE(s.group_key, 'wybor') = COALESCE(i.group_key, 'wybor'))
          ORDER BY i.quote_id, COALESCE(i.group_key, 'wybor'), (i.unit_grosze IS NULL), i.id)`);
  })();
  rodzajePozycjiGotowe.catch((e) => console.error("[migracja] warianty oferty:", e.message));

  // ZAPLATA ZAMYKA POZYCJE, A NIE CALA OFERTE (ADR-0026). Do tej pory pierwsze
  // zamowienie konczylo oferte: klient, ktory zaplacil za jeden z trzech
  // dodatkow, wracal pod ten sam link i widzial wszystko wyszarzone, razem
  // z dwoma dodatkami, ktorych nikt nie kupil. Teraz sprzedana jest POZYCJA,
  // a oferta zyje dopoki zostalo w niej cokolwiek do wziecia.
  //
  // Kolumna nie ma obok siebie flagi "oplacona" i to jest cala sztuczka:
  // stan pozycji czytamy ze stanu jej zamowienia, wiec porzucona platnosc
  // oddaje pozycje do oferty sama, gdy zamowienie wygasa. Zamiatarka
  // przestawiajaca nieoplacone zamowienia na `expired` juz tu stoi.
  //
  // Ten krok idzie PO nadaniu pozycjom rodzajow, bo przepisanie ofert juz
  // rozliczonych czyta `kind` i `selected`. Rownolegle czytaloby kolumny,
  // ktorych jeszcze nie ma.
  rodzajePozycjiGotowe.catch(() => {}).then(async () => {
    await pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS order_id BIGINT`);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE quote_items ADD CONSTRAINT quote_items_order_fk
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_quote_items_order
                        ON quote_items (order_id) WHERE order_id IS NOT NULL`);
    // Nowy stan posredni. `converted` znaczy od teraz "nie zostalo nic do
    // kupienia", `partial` znaczy "czesc zlecona, reszta czeka".
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
        ALTER TABLE quotes ADD CONSTRAINT quotes_status_check CHECK (status IN
          ('new','priced','sent','accepted','partial','converted','expired','cancelled'));
      END $$;
    `);
    // Oferta rozliczona przed ta zmiana ma zamowienie w naglowku, a nie przy
    // pozycjach. Przepisujemy je WYLACZNIE na pozycje, ktore do tamtego
    // zamowienia weszly, czyli te same, ktore wskazywala regula wyboru:
    // rachunek, wybrany wariant i zaznaczone dodatki. Oznaczenie wszystkich
    // postawiloby przy odrzuconym wariancie napis "oplacone", czyli zdanie
    // nieprawdziwe na stronie, na ktorej klient sprawdza, za co zaplacil.
    //
    // Odrzucone propozycje zostaja wiec wolne. Nie otwiera to starych ofert
    // na osciez: kupic da sie tylko w terminie waznosci, a ten w rozliczonej
    // ofercie zwykle juz minal.
    await pool.query(`
      UPDATE quote_items i
         SET order_id = q.converted_order_id
        FROM quotes q
       WHERE q.id = i.quote_id
         AND q.converted_order_id IS NOT NULL
         AND i.order_id IS NULL
         AND (i.kind = 'fixed'
              OR (i.kind = 'variant' AND (i.selected OR q.chosen_item_id = i.id))
              OR (i.kind = 'option' AND i.selected AND i.unit_grosze IS NOT NULL))`);
  }).catch((e) => console.error("[migracja] pozycje sprzedane osobno:", e.message));

  // TERMIN REALIZACJI I PRZYPOMNIENIA (ADR-0027, poprawione przez ADR-0028).
  // Zegar startuje przy wejsciu w `queued`, czyli "gotowe do pobrania": zaraz
  // po zaplacie albo, przy zleceniu wymagajacym rozmowy, po domknieciu
  // ustalen. Pobranie do pracy terminu juz nie rusza.
  pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS lead_days INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS requires_details BOOLEAN NOT NULL DEFAULT FALSE`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS lead_days INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deadline_at DATE`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_details BOOLEAN NOT NULL DEFAULT FALSE`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminders_sent JSONB NOT NULL DEFAULT '[]'::jsonb`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS details_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS details_nudged_at TIMESTAMPTZ`).catch(() => {});
  const kolumnaKolejki = pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ`);
  // USTALENIA STOJA PRZY POZYCJI, A NIE PRZY ZAMOWIENIU (2026-08-30).
  // Znacznik na zamowieniu mowil tylko "cos wymaga rozmowy" i nie umial
  // powiedziec, co jeszcze zostalo. Przy trzech pozycjach z jedna do ustalenia
  // caly zegar stal, a pracownia nie wiedziala, na co czeka.
  pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS requires_details BOOLEAN NOT NULL DEFAULT FALSE`)
    .catch((e) => console.error("[migracja] order_items.requires_details:", e.message));
  pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS details_settled_at TIMESTAMPTZ`)
    .catch((e) => console.error("[migracja] order_items.details_settled_at:", e.message));
  // CO zostalo ustalone, jednym zdaniem. Sama data mowi, ze rozmowa byla,
  // ale nie mowi, na czym stanelo, a to jest jedyna rzecz, ktora klient
  // i pracownia musza pamietac tak samo.
  pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS details_note TEXT`)
    .catch((e) => console.error("[migracja] order_items.details_note:", e.message));
  // Termin zmieniony po zaplacie jest USTALENIEM Z KLIENTEM, a nie poprawka
  // literowki, wiec musi niesc date, kiedy zapadlo. Bez niej za pol roku nikt
  // nie odtworzy, czy klient sie na to zgodzil.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS lead_days_agreed_at DATE`)
    .catch((e) => console.error("[migracja] lead_days_agreed_at:", e.message));
  kolumnaKolejki.catch((e) => console.error("[migracja] queued_at:", e.message));

  // Zamowienia stojace w `paid` to wlasnie "gotowe do pobrania": pieniadze
  // doszly, nikt tego jeszcze nie wzial. Przepisujemy je na `queued`, bo po
  // ADR-0028 `paid` jest stanem PRZELOTOWYM, ktory trwa ulamek sekundy miedzy
  // ITN a pchnieciem zlecenia dalej. Zostawione tam wisialyby w panelu jako
  // osobna grupa znaczaca dokladnie to samo, co grupa obok.
  //
  // Terminu tym wierszom NIE dorabiamy. Zaden z nich nie ma `lead_days`, bo
  // powstal przed wprowadzeniem terminow, a data policzona wstecz od dzisiaj
  // bylaby data wymyslona i to taka, ktorej klient nigdy nie widzial.
  Promise.all([kolumnaKolejki, stanyZamowienGotowe])
    .then(() => pool.query(
      `UPDATE orders SET status = 'queued', queued_at = COALESCE(queued_at, paid_at)
        WHERE status = 'paid' AND paid_at IS NOT NULL`
    ))
    .then((r) => { if (r?.rowCount) console.log(`[migracja] gotowe do pobrania: ${r.rowCount} zamowien`); })
    .catch((e) => console.error("[migracja] paid -> queued:", e.message));

  // Indeks obejmuje wszystkie etapy z biegnacym zegarem, bo tyle wlasnie czyta
  // codzienny przeglad terminow. Przebudowujemy go, a nie tworzymy warunkowo:
  // `IF NOT EXISTS` widzi sama nazwe i zostawilby stara, wezsza definicje.
  pool.query(`DROP INDEX IF EXISTS idx_orders_deadline`)
    .then(() => pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_deadline
              ON orders (deadline_at)
           WHERE status IN ('queued','in_production','ready') AND deadline_at IS NOT NULL`))
    .catch((e) => console.error("[migracja] indeks terminow:", e.message));

  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_started_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(64)`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_note TEXT`).catch(() => {});
  // Kolejke czyta sie po dacie zaplaty, bo pierwszy placi pierwszy dostaje.
  // Indeks przebudowujemy, a nie tworzymy warunkowo: `IF NOT EXISTS` widzi
  // sama nazwe, wiec po dolozeniu etapow do warunku zostawiloby stary, wezszy.
  pool.query(`DROP INDEX IF EXISTS idx_orders_kolejka`)
    .then(() => pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_kolejka
              ON orders (paid_at) WHERE status IN ('paid','details','queued','in_production','ready','shipped')`))
    .catch(() => {});

  // Wycena zapisana z kalkulatora. Kursy kruszcow z chwili zapisu pozwalaja
  // odroznic ruch ceny zlota od zmiany naszego cennika, skala trzyma to,
  // co klient realnie widzial, a adres e-mail przestaje byc obowiazkowy,
  // bo sam link do wlasnej kalkulacji nie wymaga zostawiania danych.
  pool.query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rates_snapshot JSONB`).catch(() => {});
  pool.query(`ALTER TABLE quotes ALTER COLUMN customer_email DROP NOT NULL`).catch(() => {});
  pool.query(`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS scale NUMERIC(6,3)`).catch(() => {});

  // Katalog produktow: tresc, zdjecia i stan magazynowy zyja w bazie, a nie
  // w repozytorium, zeby zmiana stanu nie wymagala wdrozenia.
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(20)`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(20)`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft'`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS offer VARCHAR(20) NOT NULL DEFAULT 'ready'`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS short JSONB`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS note JSONB`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_days INTEGER NOT NULL DEFAULT 2`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS personalization JSONB`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT`).catch(() => {});
  // Historia cen produktow. Ustawa o informowaniu o cenach wymaga, zeby przy
  // ogloszonej obnizce podac najnizsza cene z 30 dni przed obnizka. Bez zapisu
  // kazdej zmiany nie ma z czego jej wyliczyc, a odtworzyc sie tego wstecz nie da.
  pool.query(`
    CREATE TABLE IF NOT EXISTS product_price_history (
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      price_grosze INTEGER NOT NULL,
      changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_price_history_product
      ON product_price_history (product_id, changed_at DESC);
  `).catch((e) => console.error("[migracja] historia cen:", e.message));
  pool.query(`
    DO $$ BEGIN
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_offer_check;
      ALTER TABLE products ADD CONSTRAINT products_offer_check CHECK (offer IN ('ready','personalized'));
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
      ALTER TABLE products ADD CONSTRAINT products_status_check
        CHECK (status IN ('draft','live','sold_out','hidden','retired'));
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_subcategory_check;
      ALTER TABLE products ADD CONSTRAINT products_subcategory_check CHECK (subcategory IS NULL
        OR (category = 'jewelry' AND subcategory IN ('women','men','pet'))
        OR (category = 'studio'  AND subcategory IN ('fdm','msla','co2','fiber','resin','digital')));
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
      ALTER TABLE products ADD CONSTRAINT products_category_check CHECK (category IS NULL OR category IN ('jewelry','studio'));
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_check;
      ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock IS NULL OR stock >= 0);
    END $$;
  `).catch((e) => console.error("[migracja] products:", e.message));

  // Przepisanie dawnego znacznika `active` na stan pozycji. Dziala raz: pozniej
  // kazdy wiersz ma juz swoj status, a `active` wylicza sie z niego wyzwalaczem,
  // wiec zapytanie napisane recznie w bazie nie rozjedzie sie ze sklepem.
  // Tylko wiersze sprzed wyzwalacza: pozycja zapisana juz na statusach ma
  // active = false, dopoki nie jest w sprzedazy, wiec swiezy szkic zostaje
  // szkicem takze po restarcie backendu.
  pool.query(`UPDATE products SET status = 'live' WHERE status = 'draft' AND active = TRUE`).catch(() => {});
  pool.query(`
    CREATE OR REPLACE FUNCTION products_sync_active() RETURNS TRIGGER AS $$
    BEGIN
      NEW.active := NEW.status IN ('live', 'sold_out');
      RETURN NEW;
    END $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS trg_products_sync_active ON products;
    CREATE TRIGGER trg_products_sync_active BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION products_sync_active();
  `).then(() => pool.query(`UPDATE products SET status = status`))
    .catch((e) => console.error("[migracja] products.status:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS product_reservations (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL CHECK (qty > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).catch((e) => console.error("[migracja] product_reservations:", e.message));
  pool.query(`CREATE INDEX IF NOT EXISTS idx_reservations_product ON product_reservations (product_id)
              WHERE consumed_at IS NULL AND released_at IS NULL`).catch(() => {});
  pool.query(`CREATE INDEX IF NOT EXISTS idx_reservations_order ON product_reservations (order_id)`).catch(() => {});
  pool.query(`
    CREATE OR REPLACE VIEW product_availability AS
    SELECT p.id, p.slug, p.stock,
      COALESCE(SUM(r.qty) FILTER (WHERE r.consumed_at IS NULL AND r.released_at IS NULL AND r.expires_at > NOW()), 0)::INTEGER AS reserved,
      CASE WHEN p.stock IS NULL THEN NULL
           ELSE GREATEST(p.stock - COALESCE(SUM(r.qty) FILTER (WHERE r.consumed_at IS NULL AND r.released_at IS NULL AND r.expires_at > NOW()), 0), 0)::INTEGER
      END AS available
    FROM products p
    LEFT JOIN product_reservations r ON r.product_id = p.id
    GROUP BY p.id, p.slug, p.stock
  `).catch((e) => console.error("[migracja] product_availability:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS email_threads (
    id BIGSERIAL PRIMARY KEY,
    gmail_thread_id VARCHAR(200) UNIQUE NOT NULL,
    lead_id BIGINT,
    subject VARCHAR(500),
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`).catch(() => {});
  pool.query(`ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS tag VARCHAR(20) DEFAULT 'unclassified'`).catch(() => {});
  pool.query(`ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS auto_replied_at TIMESTAMPTZ`).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS email_messages (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT,
    gmail_message_id VARCHAR(200) UNIQUE NOT NULL,
    direction VARCHAR(10) NOT NULL,
    from_addr VARCHAR(300),
    to_addr TEXT,
    cc_addr TEXT,
    subject VARCHAR(500),
    body_text TEXT,
    snippet VARCHAR(500),
    gmail_labels TEXT[],
    received_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`).catch(() => {});
  pool.query(`CREATE TABLE IF NOT EXISTS market_rates (
    id SERIAL PRIMARY KEY,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(50) NOT NULL,
    pln_per_usd NUMERIC(10,6),
    pln_per_eur NUMERIC(10,6),
    au_pln_per_g NUMERIC(12,4),
    ag_pln_per_g NUMERIC(12,4),
    pt_pln_per_g NUMERIC(12,4),
    pd_pln_per_g NUMERIC(12,4),
    au_usd_per_oz NUMERIC(12,4),
    ag_usd_per_oz NUMERIC(12,4),
    pt_usd_per_oz NUMERIC(12,4),
    pd_usd_per_oz NUMERIC(12,4)
  )`).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS gemstone_prices (
    id SERIAL PRIMARY KEY,
    gem_id VARCHAR(50) NOT NULL UNIQUE,
    name_pl VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_de VARCHAR(100) NOT NULL,
    base_eur NUMERIC(10,2),
    precious BOOLEAN DEFAULT false,
    has_grades BOOLEAN DEFAULT false,
    lab BOOLEAN DEFAULT false,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100)
  )`).then(() => {
    return pool.query(`INSERT INTO gemstone_prices (gem_id,name_pl,name_en,name_de,base_eur,precious,has_grades,lab) VALUES
      ('diamond','Diament','Diamond','Diamant',3000,true,true,false),
      ('ruby','Rubin','Ruby','Rubin',1500,true,true,false),
      ('sapphire','Szafir','Sapphire','Saphir',1000,true,true,false),
      ('emerald','Szmaragd','Emerald','Smaragd',800,true,true,false),
      ('lab_diamond','Diament lab-grown','Lab-grown diamond','Labor-Diamant',350,false,true,true),
      ('moissanite','Mosanit','Moissanite','Moissanit',95,false,false,true),
      ('cz','Cyrkonia (CZ)','Cubic zirconia (CZ)','Zirkonia (CZ)',2,false,false,true),
      ('lab_ruby','Rubin lab-grown','Lab-grown ruby','Labor-Rubin',190,false,true,true),
      ('lab_sapphire','Szafir lab-grown','Lab-grown sapphire','Labor-Saphir',140,false,true,true),
      ('lab_emerald','Szmaragd lab-grown','Lab-grown emerald','Labor-Smaragd',120,false,true,true),
      ('tanzanite','Tanzanit','Tanzanite','Tansanit',400,false,true,false),
      ('aquamarine','Akwamaryn','Aquamarine','Aquamarin',100,false,false,false),
      ('tourmaline','Turmalin','Tourmaline','Turmalin',150,false,false,false),
      ('topaz','Topaz','Topaz','Topas',30,false,false,false),
      ('amethyst','Ametyst','Amethyst','Amethyst',15,false,false,false),
      ('citrine','Cytryn','Citrine','Citrin',13,false,false,false),
      ('garnet','Granat','Garnet','Granat',20,false,false,false),
      ('peridot','Perydot','Peridot','Peridot',40,false,false,false),
      ('opal','Opal','Opal','Opal',100,false,false,false),
      ('moonstone','Kamień księżycowy','Moonstone','Mondstein',20,false,false,false),
      ('lapis','Lapis lazuli','Lapis lazuli','Lapislazuli',13,false,false,false),
      ('turquoise','Turkus','Turquoise','Türkis',20,false,false,false),
      ('onyx','Onyks','Onyx','Onyx',7,false,false,false),
      ('tiger_eye','Tygrysie oko','Tiger eye','Tigerauge',5,false,false,false)
      ON CONFLICT (gem_id) DO NOTHING`);
  }).catch(() => {});

  // ── MATERIAL Z NASZEGO MAGAZYNU ───────────────────────────────────────────
  // Cena plyty zmienia sie razem z rynkiem, wiec nie moze mieszkac w kodzie:
  // poprawka stawki nie moze wymagac wdrozenia. Wycena czyta `pln_per_m2`
  // i mnozy przez pole wyrobu powiekszone o zapas na odpad.
  //
  // Zestaw startowy to REALNE ceny rynkowe z sierpnia 2026, a nie okragla
  // liczba na zachete: tabela zaklada sie raz, a ON CONFLICT DO NOTHING nie
  // nadpisze pozniejszych poprawek wlasciciela. Zla wartosc startowa zostaje
  // wiec w bazie tak dlugo, az ktos ja zauwazy.
  pool.query(`CREATE TABLE IF NOT EXISTS material_stock (
    id SERIAL PRIMARY KEY,
    material_id VARCHAR(50) NOT NULL UNIQUE,
    name_pl VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    name_de VARCHAR(120) NOT NULL,
    pln_per_m2 NUMERIC(10,2) NOT NULL DEFAULT 0,
    -- Nie wszystko kupuje sie na metry. Szklanka, plytka lupkowa czy kamien
    -- to SZTUKI, i przeliczanie ich na metr kwadratowy bylo by fikcja. Gdy
    -- ta kolumna jest wypelniona, ma pierwszenstwo przed stawka za m2.
    pln_per_piece NUMERIC(10,2),
    thickness_mm NUMERIC(6,2),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100)
  )`).then(() => {
    // Wiersze ida z `pricing/materialStockSeed.js`, a nie z tekstu wpisanego
    // tutaj: te same liczby czyta skrypt buildu, ktory wylicza etykiete
    // "od X zl" na kartach uslug. Dwie kopie rozjechalyby sie po cichu.
    const kolumny = ["material_id", "name_pl", "name_en", "name_de", "pln_per_m2", "pln_per_piece", "thickness_mm", "notes"];
    const wartosci = [];
    const miejsca = MATERIAL_SEED.map((m, i) => {
      wartosci.push(...kolumny.map((k) => m[k] ?? null));
      return `(${kolumny.map((_, j) => `$${i * kolumny.length + j + 1}`).join(",")})`;
    });
    return pool.query(
      `INSERT INTO material_stock (${kolumny.join(",")}) VALUES ${miejsca.join(",")}
       ON CONFLICT (material_id) DO NOTHING`,
      wartosci
    );
  }).then(() => {
    // Kolumna doszla po pierwszym wdrozeniu tabeli, wiec baza zalozona
    // wczesniej jej nie ma. Bez tego zapytanie o cene za sztuke wywalaloby
    // caly odczyt stawek, a wycena po cichu zjechalaby na wartosc domyslna.
    return pool.query("ALTER TABLE material_stock ADD COLUMN IF NOT EXISTS pln_per_piece NUMERIC(10,2)");
  }).then(() => zastosujKorektyStawek()).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS filament_types (
    id BIGSERIAL PRIMARY KEY,
    type_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    nozzle_min INTEGER, nozzle_max INTEGER,
    bed_min INTEGER, bed_max INTEGER,
    temp_resistance INTEGER,
    speed_min INTEGER, speed_max INTEGER,
    layer_min NUMERIC(4,2), layer_max NUMERIC(4,2),
    retraction_min NUMERIC(4,1), retraction_max NUMERIC(4,1),
    cooling INTEGER,
    enclosure VARCHAR(20) DEFAULT 'no',
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    density NUMERIC(5,3),
    price_per_kg INTEGER,
    props TEXT[],
    uses_pl TEXT, uses_en TEXT, uses_de TEXT,
    notes_pl TEXT, notes_en TEXT, notes_de TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
  )`).catch(e => console.error("[filaments] CREATE filament_types failed:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS filament_brands (
    id BIGSERIAL PRIMARY KEY,
    filament_type_id BIGINT REFERENCES filament_types(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    product_name VARCHAR(200),
    nozzle_min INTEGER, nozzle_max INTEGER,
    bed_min INTEGER, bed_max INTEGER,
    speed_min INTEGER, speed_max INTEGER,
    notes_pl TEXT, notes_en TEXT, notes_de TEXT,
    product_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    auto_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
  )`).catch(e => console.error("[filaments] CREATE filament_brands failed:", e.message));

  pool.query(`ALTER TABLE filament_brands ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE`).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS filament_contributions (
    id BIGSERIAL PRIMARY KEY,
    filament_type_id BIGINT REFERENCES filament_types(id),
    filament_brand_id BIGINT REFERENCES filament_brands(id),
    contribution_type VARCHAR(30) NOT NULL,
    brand_name VARCHAR(100), product_name VARCHAR(200),
    nozzle_min INTEGER, nozzle_max INTEGER,
    bed_min INTEGER, bed_max INTEGER,
    speed_min INTEGER, speed_max INTEGER,
    notes TEXT,
    contributor_email VARCHAR(200), contributor_name VARCHAR(100),
    gdpr_consent BOOLEAN DEFAULT FALSE,
    vote_confirm INTEGER DEFAULT 0, vote_dispute INTEGER DEFAULT 0,
    auto_approved BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ, reviewed_by VARCHAR(100)
  )`).catch(e => console.error("[filaments] CREATE filament_contributions failed:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS filament_contribution_votes (
    id BIGSERIAL PRIMARY KEY,
    contribution_id BIGINT REFERENCES filament_contributions(id) ON DELETE CASCADE,
    voter_email VARCHAR(200),
    vote VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_hash VARCHAR(64)
  )`).catch(e => console.error("[filaments] CREATE filament_contribution_votes failed:", e.message));
}

// Kazdy limit w jednym miejscu, zeby dalo sie je porownac wzrokiem zamiast
// szukac po pliku. Rozpietosc jest celowa: rozmowa z asystentem kosztuje nas
// pieniadze u dostawcy modelu, wiec jest ciasna, a zdarzenia analityczne sa
// darmowe i licza sie same, wiec sa luzne.
const chatLimit = createLimiter({ limit: 20, windowMs: 60_000, name: "chat" });
const analyticsLimit = createLimiter({ limit: 60, windowMs: 60_000, name: "analytics" });

const checkRate = (ip) => chatLimit.check(ip);
const checkAnalyticsRate = (ip) => analyticsLimit.check(ip);

function detectDevice(ua) {
  if (!ua) return 'unknown';
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

// Cache IP→country to avoid hammering ip-api.com (45 req/min free limit)
const countryCache = new Map();
setInterval(() => {
  if (countryCache.size > 2000) countryCache.clear();
}, 60 * 60_000);

async function lookupCountry(ip) {
  if (!ip || isPrivateIP(ip)) return null;
  if (countryCache.has(ip)) return countryCache.get(ip);
  try {
    // ipapi.co - HTTPS, free 1k/day, plain-text country code response
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country_code/`, {
      headers: { "User-Agent": "aejaca-analytics/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const text = (await res.text()).trim();
    const country = /^[A-Z]{2}$/.test(text) ? text : null;
    countryCache.set(ip, country);
    return country;
  } catch {
    return null;
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// ------------------------------------------------------------
// WERSJA BACKENDU SKLEPU
// ------------------------------------------------------------
// Panel i ta usluga wdrazaja sie OSOBNO. Nowy formularz rozmawiajacy ze starym
// backendem po cichu gubi pola, ktorych tamten nie zna, i wyglada to dokladnie
// tak samo jak blad w kodzie: ekran nowy, zapis nie dziala. Ta trasa pozwala
// panelowi pokazac obie wersje obok siebie, a przy okazji stan schematu: bez
// kolumn `quote_items.kind` wybor wariantow nie ma sie gdzie zapisac.
//
// Numer podnosimy RECZNIE, przy zmianie widocznej dla panelu, i robimy to na
// TRZECIEJ pozycji, zawsze dwucyfrowej: `1.1.01` -> `1.1.02`. Ta sama regula
// co w `admin/wersja.js`. Numery obu uslug nie musza byc rowne: kazda zmienia
// sie wtedy, gdy naprawde sie zmienia.
const WERSJA_API = "1.1.04";

app.get("/api/version", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  let quoteItemKinds = null;
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS ile FROM information_schema.columns
          WHERE table_name = 'quote_items' AND column_name IN ('kind','group_key','selected')`
      );
      quoteItemKinds = rows[0].ile === 3;
    } catch { quoteItemKinds = null; }
  }
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.COMMIT_SHA || "";
  res.json({
    ok: true,
    version: WERSJA_API,
    commit: sha ? sha.slice(0, 7) : null,
    schema: { quoteItemKinds },
  });
});

// Sluzy do jednej rzeczy: sprawdzenia, czy liczba warstw posrednich jest dobrana,
// czyli czy widzimy prawdziwy adres klienta, a nie adres wewnetrzny.
//
// Za zetonem, bo choc pokazuje wylacznie zadanie pytajacego, mowi tez, jak
// jestesmy poustawiani. To gotowa instrukcja dla kogos, kto dopiero sprawdza,
// czy da sie podstawic adres. Do uzycia:
//   curl -H "x-admin-token: <zeton>" https://.../api/debug-ip
app.get("/api/debug-ip", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const ip = extractIP(req);
  const country = await lookupCountry(ip);
  res.json({
    ip,
    country,
    // Adres prywatny znaczy, ze widzimy warstwe posrednia zamiast klienta,
    // czyli ze TRUSTED_PROXY_HOPS jest za male.
    private: isPrivateIP(ip),
    trustedProxyHops: TRUSTED_PROXY_HOPS,
    trustCloudflareHeaders: TRUST_CLOUDFLARE_HEADERS,
    seen: {
      "req.ip": req.ip || null,
      "x-forwarded-for": req.headers["x-forwarded-for"] || null,
      "cf-connecting-ip": req.headers["cf-connecting-ip"] || null,
      "x-real-ip": req.headers["x-real-ip"] || null,
    },
  });
});

app.post("/api/chat", express.json({ limit: "16kb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkRate(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { messages, lang = "pl", sessionId } = req.body;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== "string" || m.content.length > 2000) {
      return res.status(400).json({ error: "Invalid message format" });
    }
  }

  const systemPrompt = getSystemPrompt();
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-20).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.slice(0, 2000) })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

    if (pool && fullResponse) {
      const isHotLead = detectHotLead(messages);
      lookupCountry(ip).then(country => {
        pool.query(
          `INSERT INTO conversations (session_id, lang, messages_count, last_user_message, assistant_response, hot_lead, ip_hash, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            sessionId || null,
            lang,
            messages.length,
            messages[messages.length - 1]?.content?.slice(0, 500) || "",
            fullResponse.slice(0, 2000),
            isHotLead,
            ip ? Buffer.from(ip).toString("base64").slice(0, 20) : null,
            country,
          ]
        ).catch(() => {});
      });

      // Hot lead → also save to leads table for follow-up
      if (isHotLead) {
        const lastMsg = messages[messages.length - 1]?.content || "";
        const allText = messages.map(m => m.content).join(" ");
        const emailMatch = allText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
        const userEmail = emailMatch ? emailMatch[0].toLowerCase() : null;
        pool.query(
          `INSERT INTO leads (email, lang, calculator, params, status) VALUES ($1, $2, $3, $4, $5)`,
          [userEmail, lang, "chat", lastMsg.slice(0, 400), "new"]
        ).catch(() => {});
      }
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service unavailable" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

// --- Contact form ---
const CONTACT_N8N_URL = process.env.N8N_CONTACT_WEBHOOK_URL;
const contactLimit = createLimiter({ limit: 5, windowMs: 60 * 60_000, name: "kontakt" });
const checkContactRate = (ip) => contactLimit.check(ip);

const ALLOWED_EXT = /\.(stl|3mf|step|stp|obj|svg|ai|dxf|jpg|jpeg|png|pdf)$/i;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    ALLOWED_EXT.test(file.originalname) ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Numer zapytania cytowany w korespondencji, odpowiednik numeru zamowienia */
function generateQuoteRef() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `WY${stamp}-${generateToken().slice(0, 8).toUpperCase()}`;
}

/**
 * Zapisuje plik przyslany do wyceny tak samo, jak plik z zamowienia:
 * wiersz w uploads (suma kontrolna, nazwa) i wyslanie na Dysk przez n8n.
 *
 * Dotad plik z formularza wyceny szedl wylacznie mailem, wiec po pol roku
 * nie dalo sie ustalic, co dokladnie klient przyslal. Zwraca id wiersza
 * albo null, bo brak Dysku nie moze zablokowac przyjecia zapytania.
 *
 * @param {{name:string, mimeType:string, buffer:Buffer}} file
 */
async function storeQuoteAttachment(file, lang, ip) {
  if (!pool || !file?.buffer?.length) return null;
  try {
    const token = generateToken();
    const { rows } = await pool.query(
      `INSERT INTO uploads (token, file_name, file_size_bytes, file_sha256, mime_type, lang, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [token, String(file.name || "zalacznik").slice(0, 255), file.buffer.length,
       createHash("sha256").update(file.buffer).digest("hex"),
       file.mimeType || "application/octet-stream", lang,
       createHash("sha256").update(ip).digest("hex").slice(0, 30)]
    );

    if (UPLOAD_N8N_URL) {
      fetch(UPLOAD_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fileName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.buffer.length,
          lang,
          data: file.buffer.toString("base64"),
          source: "quote_file",
        }),
      }).then((r) => {
        if (!r.ok) console.error(`[wycena] webhook n8n ${r.status} dla ${token}`);
      }).catch((e) => console.error("[wycena] webhook blad:", e.message));
    }

    return rows[0].id;
  } catch (e) {
    console.error("[wycena] zapis zalacznika nie powiodl sie:", e.message);
    return null;
  }
}
const SUBJECT_MAP = { jewelry: "Jewelry Inquiry", studio: "Studio Inquiry", both: "Jewelry & Studio Inquiry", other: "General Inquiry" };

/** Ile zalacznikow przyjmujemy do jednego zapytania */
const MAX_QUOTE_FILES = 6;

app.post("/api/contact", (req, res, next) => {
  // DWA POLA, BO DWIE GENERACJE FORMULARZY. Kalkulator wysyla teraz liste
  // pod "files", a formularz B2B i starsze karty nadal jedno pole "file".
  // `fields` obsluguje oba naraz, wiec nie musimy przelaczac ich jednoczesnie.
  upload.fields([{ name: "file", maxCount: 1 }, { name: "files", maxCount: MAX_QUOTE_FILES }])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "File too large (max 8 MB)" : (err.message || "File upload error") });
    }
    next();
  });
}, async (req, res) => {
  const ip = extractIP(req);
  if (!checkContactRate(ip)) return res.status(429).json({ error: "Too many requests" });

  const { name, email, subject, message, lang, source, website } = req.body;
  if (website) return res.status(400).json({ error: "Invalid request" });
  if (!email?.trim() || !message?.trim()) return res.status(400).json({ error: "Missing required fields" });
  if (!CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if ((name?.length ?? 0) > 100 || message.length > 5000) return res.status(400).json({ error: "Input too long" });

  const payload = {
    name: (name || "").trim().slice(0, 100) || " - ",
    email: email.trim().toLowerCase(),
    subject: SUBJECT_MAP[subject] || (subject || "General Inquiry").slice(0, 100),
    message: message.trim().slice(0, 5000),
    lang: ["pl", "en", "de"].includes(lang) ? lang : "pl",
    source: (source || "contact").slice(0, 50),
  };
  // Jedna lista niezaleznie od tego, ktorym polem przyszly.
  const zalaczniki = [...(req.files?.file || []), ...(req.files?.files || [])].slice(0, MAX_QUOTE_FILES);
  if (zalaczniki.length) {
    // `file` zostaje pojedynczy dla zgodnosci z przeplywem n8n, ktory czyta
    // wlasnie to pole. `files` niesie komplet. Gdyby n8n czytal tylko `file`,
    // reszta i tak dojedzie do nas Dyskiem przez storeQuoteAttachment,
    // wiec zaden plik nie ginie po cichu.
    payload.file = { name: zalaczniki[0].originalname, type: zalaczniki[0].mimetype, data: zalaczniki[0].buffer.toString("base64") };
    payload.files = zalaczniki.map((f) => ({ name: f.originalname, type: f.mimetype, data: f.buffer.toString("base64") }));
  }

  // Check if this email was already contacted - pass flag to n8n so it skips follow-up
  const alreadyContacted = pool
    ? pool.query("SELECT contacted_at FROM leads WHERE email = $1 AND contacted_at IS NOT NULL LIMIT 1", [payload.email])
        .then(r => r.rows.length > 0)
        .catch(() => false)
    : Promise.resolve(false);

  alreadyContacted.then(skipFollowup => {
    if (CONTACT_N8N_URL) {
      fetch(CONTACT_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, skip_followup: skipFollowup }),
      }).then(r => {
        if (!r.ok) console.error(`Contact webhook n8n ${r.status}`);
      }).catch(err => {
        console.error("Contact webhook error:", err.message);
      });
    }
  });

  // Zapis zapytania. Pelna tresc, bez obcinania: to ona jest podstawa
  // pozniejszej realizacji i jedynym zapisem tego, co obiecalismy.
  if (pool) {
    const quoteRef = generateQuoteRef();
    // Kazdy plik zapisujemy osobno, zeby po pol roku dalo sie ustalic, co
    // dokladnie klient przyslal. Do zapytania podpinamy pierwszy, bo kolumna
    // jest jedna, a nazwy wszystkich ida do params_json.
    Promise.all(
      zalaczniki.map((f) => storeQuoteAttachment({ name: f.originalname, mimeType: f.mimetype, buffer: f.buffer }, payload.lang, ip))
    ).then((ids) => ids.filter((x) => x != null)[0] ?? null).then((uploadId) =>
      pool.query(
        `INSERT INTO leads (email, lang, calculator, source, params, description, params_json, upload_id, quote_ref, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [payload.email, payload.lang, payload.source, "contact",
         `${payload.subject}\n${payload.message.slice(0, 400)}`,
         payload.message,
         JSON.stringify({
           name: payload.name || null,
           subject: payload.subject || null,
           ...(zalaczniki.length > 1 ? { attachments: zalaczniki.map((f) => String(f.originalname).slice(0, 255)) } : {}),
         }),
         uploadId, quoteRef, "new"]
      )
    ).catch(err => console.error("Lead save error:", err.message));
  }

  res.json({ ok: true });
});

// --- Quote email capture ---
const QUOTE_N8N_URL = process.env.N8N_QUOTE_WEBHOOK_URL;
const quoteLimit = createLimiter({ limit: 10, windowMs: 60 * 60_000, name: "zapytanie o wycene" });
const checkQuoteRate = (ip) => quoteLimit.check(ip);

app.post("/api/quote", express.json({ limit: "50mb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkQuoteRate(ip)) return res.status(429).json({ error: "Too many requests" });

  const { email, lang, calculator, params, price, file, ts } = req.body || {};
  if (!email || !CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (!calculator || !params || !price) return res.status(400).json({ error: "Missing fields" });

  // Numer nadajemy przed wysylka, zeby ten sam trafil do maila i do bazy.
  const quoteRef = generateQuoteRef();

  const payload = {
    email: email.trim().toLowerCase(),
    lang: ["pl", "en", "de"].includes(lang) ? lang : "pl",
    calculator: String(calculator).slice(0, 200),
    // Limit podniesiony z 1000 na 8000 znakow. Pole niesie teraz pelne
    // podsumowanie (wybory, rozpiska ceny, uwagi do modelu, zgody), a nie
    // sama liste wyborow. Przy tysiacu znakow ucinalo sie w polowie rozpiski
    // i nikt by tego nie zauwazyl, bo mail nadal wygladalby poprawnie.
    //
    // Apostrofy zamieniamy na typograficzne, bo n8n wkleja to pole WPROST do
    // zapytania SQL zapisujacego leada (`VALUES ('{{ params }}', ...)`).
    // Dopoki szlo tam kilka naszych wlasnych etykiet, ryzyko bylo teoretyczne.
    // Teraz w podsumowaniu jest nazwa pliku, ktora podaje klient, wiec jeden
    // apostrof wywracalby zapis leada, a spreparowana nazwa robilaby wiecej.
    // Wlasciwym miejscem naprawy jest zapytanie parametryzowane w n8n, ale
    // tego nie wdrozymy z repozytorium, wiec zamykamy to tutaj.
    params: String(params).slice(0, 8000).replace(/'/g, "’"),
    quoteRef,
    price,
    ts: ts || new Date().toISOString(),
    ...(file?.data ? { file: { name: String(file.name || "attachment").slice(0, 255), type: String(file.type || "application/octet-stream"), data: file.data } } : {}),
  };

  // Check if this email was already contacted - pass flag to n8n so it skips follow-up
  const alreadyContactedQuote = pool
    ? pool.query("SELECT contacted_at FROM leads WHERE email = $1 AND contacted_at IS NOT NULL LIMIT 1", [payload.email])
        .then(r => r.rows.length > 0)
        .catch(() => false)
    : Promise.resolve(false);

  alreadyContactedQuote.then(skipFollowup => {
    if (QUOTE_N8N_URL) {
      fetch(QUOTE_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, skip_followup: skipFollowup }),
      }).then(r => {
        if (!r.ok) console.error(`Quote webhook n8n ${r.status}`);
      }).catch(err => {
        console.error("Quote webhook error:", err.message);
      });
    }
  });

  if (pool) {
    const quoteSessionId = req.body?.sessionId || null;
    // Plik przychodzi w JSON jako base64. Rozpakowujemy go tutaj, zeby
    // zapytanie mialo taki sam slad w bazie jak zamowienie.
    const attachment = file?.data
      ? { name: file.name, mimeType: file.type, buffer: Buffer.from(String(file.data).split(",").pop(), "base64") }
      : null;

    storeQuoteAttachment(attachment, payload.lang, ip)
      .then((uploadId) =>
        pool.query(
          `INSERT INTO leads (email, lang, calculator, source, params, description, params_json,
             price_min_pln, price_max_pln, price_min_eur, price_max_eur, qty, discount,
             upload_id, quote_ref, status, session_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [payload.email, payload.lang, payload.calculator, "quote",
           payload.params,
           // Pelny opis od klienta, bez limitu 1000 znakow z podsumowania.
           String(req.body?.description || req.body?.message || params || ""),
           JSON.stringify({ params: req.body?.params ?? null, price: price ?? null }),
           price?.perPcPLN?.min ?? null, price?.perPcPLN?.max ?? null,
           price?.perPcEUR?.min ?? null, price?.perPcEUR?.max ?? null,
           price?.qty ?? null, price?.discount ?? null,
           uploadId, quoteRef, "new", quoteSessionId]
        )
      )
      .catch((err) => console.error("Quote save error:", err.message));
  }

  res.json({ ok: true });
});

// --- Wiazaca wycena, liczona po stronie serwera ---
// Przegladarka przysyla parametry i ewentualnie plik. Nigdy nie przysyla ceny.
const priceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 1 },
});

const priceLimit = createLimiter({ limit: 60, windowMs: 10 * 60_000, name: "wycena" });
const checkPriceRate = (ip) => priceLimit.check(ip);

/** Kursy kruszcow z wlasnej bazy, ten sam zestaw pol, ktory dostaje frontend */
async function currentMetalRates() {
  if (!pool) return null;
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (field) field, value, fetched_at FROM (
        SELECT 'au_pln_per_g' AS field, au_pln_per_g::float AS value, fetched_at FROM market_rates WHERE au_pln_per_g IS NOT NULL
        UNION ALL SELECT 'ag_pln_per_g', ag_pln_per_g::float, fetched_at FROM market_rates WHERE ag_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pt_pln_per_g', pt_pln_per_g::float, fetched_at FROM market_rates WHERE pt_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pd_pln_per_g', pd_pln_per_g::float, fetched_at FROM market_rates WHERE pd_pln_per_g IS NOT NULL
        -- Kurs euro nalezy do tego samego zestawu, co kruszce. Bez niego
        -- kalkulator siega po wartosc zapasowa i widelki w euro rozjezdzaja
        -- sie z tymi, ktore klient widzial w przegladarce.
        UNION ALL SELECT 'pln_per_eur', pln_per_eur::float, fetched_at FROM market_rates WHERE pln_per_eur IS NOT NULL
      ) sub ORDER BY field, fetched_at DESC
    `);
    const rates = {};
    const ages = {};
    for (const r of rows) {
      rates[r.field] = r.value;
      ages[r.field] = ageHours(r.fetched_at);
    }

    // Zapytanie bierze NAJNOWSZA niepusta wartosc, nie patrzac na jej wiek.
    // Gdy pobieranie pada od tygodni, kurs sprzed miesiaca wyglada dokladnie
    // tak samo jak dzisiejszy i wycena po cichu liczy ze starej ceny kruszcu.
    // AEJaCA pracuje glownie w srebrze, wiec akurat ten kurs musi byc swiezy.
    const stale = staleRates(ages);
    if (stale.length) {
      console.error(`[rates] KURSY PRZETERMINOWANE, wycena liczy ze starych cen: ${stale.join(", ")}`);
    }
    rates._ageH = ages;
    return Object.keys(rates).length > 1 ? rates : null;
  } catch (e) {
    console.error("[price] rates query failed:", e.message);
    return null;
  }
}

// --- Ceny kamieni dla wyceny po stronie serwera ---
// Kalkulator w przegladarce naklada na statyczna liste `GEMSTONES` ceny
// z tabeli `gemstone_prices`, przeliczone biezacym kursem euro. Serwer tego
// nie robil, wiec kwota wiazaca liczyla sie z cen wpisanych w kod. Przy
// kamieniu roznica idzie w setki zlotych i nie widac jej nigdzie poza rachunkiem.
//
// Ceny bazowe zmieniaja sie rzadko, kurs euro co godzine, wiec w pamieci
// trzymamy same euro, a kurs nakladamy przy kazdym wywolaniu.
// Stawki materialow z magazynu dla WYCENY SERWEROWEJ, czyli dla kwoty
// wiazacej. Ta sama tabela zasila `/api/material-stock`, z ktorego czyta
// przegladarka; bez wspolnego zrodla klient widzialby jedna cene, a placil
// inna, i nic by tego nie zglosilo.
let _materialPriceCache = { ts: 0, rows: null };

/**
 * Skala pozycji: liczba (zapis sprzed wymiarow w trzech osiach) albo `{x,y,z}`.
 *
 * Nieczytelna wartosc daje 1, a nie wyjatek: brak skali ma zatrzymac
 * zniekształcenie, a nie sprzedaz. Zla skala i tak odbije sie o kontrole pola
 * roboczego przy wycenie.
 */
function odczytajSkale(wartosc) {
  if (wartosc == null || wartosc === "") return 1;
  if (typeof wartosc === "object") return wartosc;
  const liczba = Number(wartosc);
  if (Number.isFinite(liczba) && liczba > 0) return liczba;
  try {
    const z = JSON.parse(String(wartosc));
    if (typeof z === "number" && z > 0) return z;
    if (z && typeof z === "object") return z;
  } catch {}
  return 1;
}

async function currentMaterialStock() {
  if (!pool) return null;
  const now = Date.now();
  if (_materialPriceCache.rows && now - _materialPriceCache.ts < 60 * 60 * 1000) {
    return _materialPriceCache.rows;
  }
  try {
    const { rows } = await pool.query("SELECT material_id, pln_per_m2, pln_per_piece FROM material_stock");
    _materialPriceCache = { ts: now, rows };
    return rows;
  } catch {
    return null;
  }
}

let _gemBaseCache = { ts: 0, eur: null };

async function currentGemstones(plnPerEur) {
  if (!pool) return null;
  const rate = Number(plnPerEur) > 0 ? Number(plnPerEur) : null;
  if (!rate) return null;

  const now = Date.now();
  if (!_gemBaseCache.eur || now - _gemBaseCache.ts > 24 * 60 * 60 * 1000) {
    try {
      const { rows } = await pool.query("SELECT gem_id, base_eur FROM gemstone_prices WHERE base_eur IS NOT NULL");
      const eur = {};
      for (const r of rows) eur[r.gem_id] = parseFloat(r.base_eur);
      _gemBaseCache = { ts: now, eur };
    } catch (e) {
      console.error("[price] gemstone query failed:", e.message);
      return null;
    }
  }

  const eur = _gemBaseCache.eur;
  if (!eur || !Object.keys(eur).length) return null;

  // Ten sam warunek co w przegladarce: kamien bez ceny w bazie zostaje
  // przy swojej cenie z konfiguracji, zamiast zniknac z wyceny.
  return GEMSTONES.map((g) => {
    if (g.id === "none" || g.custom || g.basePLN === null) return g;
    const base = eur[g.id];
    return base == null ? g : { ...g, basePLN: Math.round(base * rate) };
  });
}

app.get("/api/price/calculators", (_req, res) => {
  res.json({
    // Kalkulatory oznaczone `internal` sa gotowe w kodzie, ale nie maja jeszcze
    // interfejsu. Lista jest publiczna, wiec nie moga sie na niej pojawiac,
    // zanim beda dzialac od strony klienta.
    calculators: Object.entries(CALCULATORS)
      .filter(([, c]) => !c.internal)
      .map(([id, c]) => ({ id, label: c.label })),
  });
});

app.post("/api/price", (req, res, next) => {
  priceUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.code === "LIMIT_FILE_SIZE" ? "Plik przekracza 60 MB" : (err.message || "Blad wysylki pliku"),
      });
    }
    next();
  });
}, async (req, res) => {
  const ip = extractIP(req);
  if (!checkPriceRate(ip)) return res.status(429).json({ error: "Za duzo zapytan, sprobuj za chwile" });

  try {
    const calculator = String(req.body?.calculator || "");
    const lang = String(req.body?.lang || "pl");
    // Skala przychodzi JSON-em, bo od wprowadzenia wymiarow w trzech osiach
    // bywa obiektem `{x,y,z}`. `Number(...)` na obiekcie da NaN, a NaN po
    // cichu zjezdza do skali 1: klient placilby za model w innej wielkosci
    // niz zamowil. Stary zapis (goła liczba) parsuje sie tak samo.
    const scale = odczytajSkale(req.body?.scale);
    let params = req.body?.params;
    if (typeof params === "string") {
      try { params = JSON.parse(params); }
      catch { return res.status(400).json({ error: "Nieprawidlowy format parametrow" }); }
    }

    let geometry = null;
    if (req.file?.buffer) {
      geometry = await geometryFromFile(req.file.buffer, req.file.originalname || "");
    } else if (req.body?.uploadToken && pool) {
      // Plik zostal wgrany wczesniej przez /api/uploads. Geometrie czytamy
      // z bazy, wiec przesuwanie suwaka nie wysyla modelu za kazdym razem.
      const { rows } = await pool.query("SELECT geometry FROM uploads WHERE token = $1", [String(req.body.uploadToken)]);
      if (!rows[0]) return res.status(404).json({ error: "Nieznany plik", code: "unknown_upload" });
      // Zalacznik nie ma geometrii i nigdy nie moze wplynac na cene.
      geometry = rows[0].geometry || null;
    }

    // Bryla kreatora NIE przychodzi z przegladarki. Masa decyduje o cenie,
    // wiec liczymy ja tu, tym samym kodem, ktorego uzywa podglad.
    if (RING_CALCULATORS.has(calculator) && !geometry) {
      geometry = await ringGeometryFromParams(params);
    }

    const rates = calculator.startsWith("jewelry_") ? await currentMetalRates() : null;
    const gemstones = rates ? await currentGemstones(rates.pln_per_eur) : null;
    const materialStock = calculator.startsWith("laser_") ? await currentMaterialStock() : null;
    const item = priceItem({ calculator, params, lang, geometry, scale, rates, gemstones, materialStock });

    // Informacyjnie: ile jeszcze zmiesci sie w limicie kwartalnym.
    const limit = pool ? await checkQuarterlyLimit(pool, item.lineGrosze) : null;

    // CZY TA KWOTA WOLNO NAZWAC WIAZACA. Przegladarka pokazuje z tego albo
    // kwote, albo szacunek z widelkami i powodem, ktorego brakuje. Ta sama
    // regula odmawia przyjecia zamowienia nizej, wiec ekran nie moze obiecac
    // czegos, czego kasa nie przyjmie.
    const podstawa = bindingBasis({ calculator, params, geometry });
    res.json({
      ok: true,
      item,
      binding: podstawa.binding,
      missing: podstawa.missing,
      geometry: geometry && {
        volumeCm3: Number(geometry.volumeCm3.toFixed(3)),
        bbox: geometry.bbox,
        triangleCount: geometry.triangleCount,
        sha256: geometry.sha256,
      },
      capacity: limit && { ok: limit.ok, remainingPLN: Math.round(limit.remainingGrosze / 100) },
    });
  } catch (e) {
    if (e instanceof PricingError) {
      const status = e.code === "needs_quote" ? 409 : 400;
      return res.status(status).json({ error: e.message, code: e.code });
    }
    console.error("[price] unexpected:", e);
    res.status(500).json({ error: "Wycena chwilowo niedostepna" });
  }
});


// ------------------------------------------------------------
// KREATOR PIERSCIONKOW: cztery wyjscia z jednej bryly
// ------------------------------------------------------------
// Klient wybiera miedzy plikiem, odlewem i gotowym wyrobem, wiec musi widziec
// wszystkie kwoty naraz. Cztery osobne zapytania znaczylyby cztery przebiegi
// jadra geometrycznego, po kilkaset milisekund kazdy, na te sama bryle.
// Liczymy ja raz i wyceniamy z niej kazde wyjscie.
//
// To NIE jest druga sciezka wyceny: kazde wyjscie idzie przez to samo
// `priceItem`, co pojedyncze zapytanie. Rozni je wylacznie to, ze bryla
// powstaje jeden raz.
app.post("/api/price/ring", express.json({ limit: "256kb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkPriceRate(ip)) return res.status(429).json({ error: "Za duzo zapytan, sprobuj za chwile" });

  const lang = String(req.body?.lang || "pl");
  const params = req.body?.params;
  if (!params || typeof params !== "object") {
    return res.status(400).json({ error: "Brak parametrow", code: "bad_params" });
  }

  try {
    const geometry = await ringGeometryFromParams(params);
    const rates = await currentMetalRates();
    const gemstones = await currentGemstones(rates.pln_per_eur);

    const items = {};
    // Lista wyjsc pochodzi z rdzenia wyceny, wiec wlaczenie STEP-a w jednym
    // miejscu wystarczy, zeby pojawil sie i w cenie, i w interfejsie.
    for (const output of Object.keys(OUTPUT_AVAILABLE).filter((o) => OUTPUT_AVAILABLE[o])) {
      try {
        items[output] = priceItem({
          calculator: "jewelry_ring_config",
          params: { ...params, output },
          lang, geometry, rates, gemstones,
        });
      } catch (e) {
        // Wyjscie bez ceny nie moze zabrac pozostalych. Kamien spoza cennika
        // blokuje gotowy wyrob, ale plik i odlew wyceniamy normalnie.
        items[output] = e instanceof PricingError
          ? { unavailable: e.code, message: e.message }
          : { unavailable: "error" };
      }
    }

    const wycenione = Object.values(items).filter((i) => i.lineGrosze);
    const limit = pool && wycenione.length
      ? await checkQuarterlyLimit(pool, Math.max(...wycenione.map((i) => i.lineGrosze)))
      : null;

    res.json({
      ok: true,
      items,
      geometry: {
        massG: Number(geometry.massG.toFixed(3)),
        volumeMm3: Number(geometry.volumeMm3.toFixed(1)),
        patternVolumeMm3: Number(geometry.patternVolumeMm3.toFixed(1)),
        stones: geometry.stones.map((s) => ({ role: s.role, count: s.count, size: s.size })),
      },
      capacity: limit && { ok: limit.ok, remainingPLN: Math.round(limit.remainingGrosze / 100) },
    });
  } catch (e) {
    if (e instanceof PricingError) {
      return res.status(400).json({ error: e.message, code: e.code });
    }
    console.error("[price/ring] unexpected:", e);
    res.status(500).json({ error: "Wycena chwilowo niedostepna" });
  }
});

// ============================================================
// DOPLATY ZA DODATKOWE POPRAWKI
// ============================================================
// Trzecia runda poprawek jest platna ZANIM ja zaczniemy, nigdy po. Przy
// dzialalnosci nierejestrowanej, bez umow i faktur, sciganie kogos o 90 zl
// kosztuje wiecej niz te 90 zl. Jedyny moment z realna dzwignia to moment,
// w ktorym klient czegos chce.
//
// Doplata jest zwyklym zamowieniem: przechodzi ta sama droga co zakup ze
// sklepu, razem z Autopay, ITN i mailami, wiec nic nie trzeba dublowac.

app.post("/api/orders/:ref/revision", express.json({ limit: "16kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  try {
    const { rows } = await pool.query(
      `SELECT o.*, i.calculator, i.params
         FROM orders o
         LEFT JOIN order_items i ON i.order_id = o.id AND i.calculator = 'cad_design'
        WHERE o.order_ref = $1`,
      [String(req.params.ref || "")]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "Nie ma takiego zamowienia" });
    if (order.calculator !== "cad_design") {
      return res.status(400).json({ error: "To zamowienie nie jest projektem", code: "not_a_design" });
    }

    const amount = extraRevisionGrosze(order.params?.complexityId);
    if (!amount) return res.status(400).json({ error: "Nie znam progu zlozonosci tego projektu", code: "no_rate" });

    const limit = await checkQuarterlyLimit(pool, amount);
    if (!limit.ok) {
      return res.status(409).json({
        error: "Ta kwota nie zmiesci sie w limicie kwartalnym",
        code: "quarterly_limit",
        remainingPLN: Math.round(limit.remainingGrosze / 100),
      });
    }

    const childRef = generateOrderRef();
    const childToken = generateToken();
    const round = (order.revisions_included ?? 0) + 1 + (order.revisions_used ?? 0);

    const { rows: created } = await pool.query(
      `INSERT INTO orders (order_ref, status, kind, lang, items_total_grosze, shipping_grosze, total_grosze,
         customer_email, customer_name, customer_phone, delivery_method,
         access_token, ip_hash, expires_at, parent_order_id)
       VALUES ($1,'awaiting_payment','quoted',$2,$3,0,$3,$4,$5,$6,'pickup',$7,$8,$9,$10)
       RETURNING id`,
      [childRef, order.lang, amount,
       order.customer_email, order.customer_name, order.customer_phone,
       childToken, order.ip_hash, new Date(Date.now() + 7 * 86400_000), order.id]
    );

    await pool.query(
      `INSERT INTO order_items (order_id, item_type, calculator, title, qty, unit_grosze, line_grosze, params)
       VALUES ($1,'service','cad_design',$2,1,$3,$3,$4)`,
      [created[0].id,
       `Dodatkowa runda poprawek (${round}) do ${order.order_ref}`,
       amount,
       JSON.stringify({ parentOrderRef: order.order_ref, round, complexityId: order.params?.complexityId })]
    );

    console.log(`[poprawki] ${order.order_ref}: doplata ${childRef} na ${(amount / 100).toFixed(2)} PLN`);
    res.json({
      ok: true,
      orderRef: childRef,
      amountGrosze: amount,
      round,
      payUrl: `${SITE_URL}/order/status/?ref=${childRef}&token=${childToken}`,
    });
  } catch (e) {
    console.error("[poprawki] doplata nie powiodla sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie utworzyc doplaty" });
  }
});

// ============================================================
// WYCENY INDYWIDUALNE
// ============================================================
// Sciezka dla tego, czego nie umiemy wycenic automatem: kamienie, sploty,
// projekty CAD, dlugie grawery. Klient zostawia komplet danych, czlowiek
// wpisuje kwote, a wycena zamienia sie w zwykle zamowienie do zaplaty.
//
// Tresc i pliki zapisujemy strukturalnie, a nie tylko w mailu, bo po pol
// roku mail nie wystarczy do ustalenia, co obiecalismy.

app.post("/api/quotes", express.json({ limit: "1mb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkQuoteRate(ip)) return res.status(429).json({ error: "Za duzo zapytan, sprobuj za chwile" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const { email, name, phone, lang, source, message, items } = req.body || {};
  if (!email || !CONTACT_EMAIL_RE.test(String(email))) return res.status(400).json({ error: "Nieprawidlowy adres e-mail" });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Zapytanie bez pozycji" });
  if (items.length > 20) return res.status(400).json({ error: "Za duzo pozycji w jednym zapytaniu" });

  try {
    const created = await createQuote(pool, {
      email, name, phone, lang, source: source || "configurator",
      message: String(message || "").slice(0, 8000),
      items: items.slice(0, 20),
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 30),
    });
    console.log(`[wycena] przyjeto ${created.quoteRef} od ${String(email).toLowerCase()}`);
    res.json({ ok: true, quoteRef: created.quoteRef });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] zapis nie powiodl sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie przyjac zapytania" });
  }
});

// ------------------------------------------------------------
// Wycena zapisana przez klienta z kalkulatora
// ------------------------------------------------------------
// Konfiguracja druku z plikiem to kilka minut pracy klienta i do tej pory
// ginela przy zamknieciu karty. Tutaj zostaje: klient dostaje adres, pod
// ktorym znajdzie ja takze jutro i na innym urzadzeniu.
//
// Kwoty licza sie NA SERWERZE, tym samym silnikiem co /api/price. Liczba
// przyslana przez przegladarke nie jest nawet czytana: przyjmujac ja,
// wystawialibysmy oferte na kwote wpisana przez kupujacego.

app.post("/api/quotes/save", express.json({ limit: "1mb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkQuoteRate(ip)) return res.status(429).json({ error: "Za duzo zapytan, sprobuj za chwile" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const { email, name, lang, items } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Wycena bez pozycji" });
  if (items.length > 10) return res.status(400).json({ error: "Za duzo pozycji w jednej wycenie" });
  // Adres jest dobrowolny: sam link nie wymaga zostawiania danych. Podany
  // musi byc jednak poprawny, bo inaczej mail znika bez sladu.
  if (email && !CONTACT_EMAIL_RE.test(String(email))) {
    return res.status(400).json({ error: "Nieprawidlowy adres e-mail" });
  }

  try {
    const rates = await currentMetalRates();
    const gemstones = rates ? await currentGemstones(rates.pln_per_eur) : null;
    const priced = [];

    for (const raw of items.slice(0, 10)) {
      const calculator = String(raw?.calculator || "");
      let params = raw?.params;
      if (typeof params === "string") {
        try { params = JSON.parse(params); } catch { return res.status(400).json({ error: "Nieprawidlowy format parametrow" }); }
      }

      // Plik wgrany wczesniej przez /api/uploads. Geometrie czytamy z bazy,
      // tak samo jak przy wycenie, wiec zapisana kwota jest ta sama liczba,
      // ktora klient zobaczyl w kalkulatorze.
      let geometry = null;
      let uploadId = null;
      let fileName = raw?.fileName ? String(raw.fileName).slice(0, 255) : null;
      if (raw?.uploadToken) {
        const { rows } = await pool.query(
          "SELECT id, geometry, file_name FROM uploads WHERE token = $1",
          [String(raw.uploadToken)]
        );
        if (!rows[0]) return res.status(404).json({ error: "Nieznany plik", code: "unknown_upload" });
        uploadId = rows[0].id;
        geometry = rows[0].geometry || null;
        fileName = fileName || rows[0].file_name || null;
      }

      const scale = odczytajSkale(raw?.scale);
      const materialStock = calculator.startsWith("laser_") ? await currentMaterialStock() : null;
      const item = priceItem({ calculator, params, lang, geometry, scale, rates, gemstones, materialStock });
      priced.push({
        calculator, params, scale, uploadId, fileName,
        title: item.title, qty: item.qty, unitGrosze: item.unitGrosze,
        description: raw?.description ? String(raw.description).slice(0, 2000) : null,
      });
    }

    const created = await createQuote(pool, {
      email: email || null,
      name: name || null,
      lang,
      source: SAVED_QUOTE_SOURCE,
      allowAnonymous: true,
      items: priced,
      // Kursy zapisujemy tylko wtedy, gdy jakas pozycja realnie od nich zalezy.
      ratesSnapshot: priced.some((p) => p.calculator.startsWith("jewelry_")) ? rates : null,
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 30),
    });

    // Kwoty wpisujemy po id pozycji, a te znamy dopiero po zapisie.
    const stored = await getQuoteByRef(pool, created.quoteRef);
    const result = await priceQuote(
      pool, created.quoteRef,
      stored.items.map((row, idx) => ({ id: row.id, unitGrosze: priced[idx].unitGrosze })),
      null, QUOTE_VALIDITY_DAYS
    );

    const url = `${SITE_URL}/quote/?ref=${created.quoteRef}&token=${created.accessToken}`;
    console.log(`[wycena] zapisano ${created.quoteRef} na ${(result.totalGrosze / 100).toFixed(2)} PLN${email ? ", z mailem" : ", sam link"}`);

    // Mail nie blokuje odpowiedzi: wycena jest juz zapisana, a klient ma link
    // przed soba niezaleznie od tego, czy poczta zadziala.
    if (email) sendQuoteLink(pool, created.quoteRef, url).catch(() => {});

    res.json({
      ok: true,
      quoteRef: created.quoteRef,
      token: created.accessToken,
      url,
      totalGrosze: result.totalGrosze,
      validUntil: result.validUntil,
      emailed: Boolean(email),
    });
  } catch (e) {
    if (e instanceof PricingError) {
      const status = e.code === "needs_quote" ? 409 : 400;
      return res.status(status).json({ error: e.message, code: e.code });
    }
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] zapis kalkulacji nie powiodl sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac wyceny" });
  }
});

/** Podglad wyceny dla klienta. Bez logowania, wiec adres musi znac token. */
// Stan pozycji na wire: `available` do wziecia, `reserved` ktos wlasnie za nia
// placi, `settled` zlecona. Strona oferty i panel rysuja z tego trzy rozne
// wiersze, bo wyszarzone pole zaznaczania znaczy "nie wolno ci zmienic wyboru",
// a nie "to jest juz zrobione". Jedna mapa dla obu tras, zeby panel i klient
// nie nazwali tego samego stanu inaczej.
const NA_WIRE = { wolna: "available", zajeta: "reserved", zamknieta: "settled" };

app.get("/api/quotes/:ref", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote || !secretMatches(String(req.query.token || ""), quote.access_token)) {
    return res.status(404).json({ error: "Nie ma takiej wyceny" });
  }

  // Kruszec liczy sie z dnia otwarcia, robocizna zostaje ta obiecana.
  // Po terminie waznosci nie przeliczamy juz niczego: wycena wygasla,
  // a pokazywanie swiezej kwoty pod stara data udawaloby, ze nadal obowiazuje.
  const expired = quote.valid_until && String(quote.valid_until).slice(0, 10) < new Date().toISOString().slice(0, 10);
  const ratesNow = !expired && quote.rates_snapshot ? await currentMetalRates() : null;

  // Rodzaj pozycji i to, co jest wybrane, licza sie z tej samej reguly, ktora
  // ustala kwote przy zaplacie. Druga regula w przegladarce znaczylaby strone
  // oferty pokazujaca co innego niz przelew.
  const uklad = quoteGroups(quote);
  const rodzaje = new Map(uklad.fixed.map((i) => [Number(i.id), "fixed"]));
  for (const g of uklad.groups) {
    for (const i of g.variants) rodzaje.set(Number(i.id), "variant");
    for (const i of g.options) rodzaje.set(Number(i.id), "option");
  }
  const wybraneId = new Set(selectedQuoteItems(quote).map((i) => Number(i.id)));

  let metalDelta = 0;
  const items = quote.items.map((i) => {
    const re = ratesNow
      ? repriceSavedItem(i, { ratesAtSave: quote.rates_snapshot, ratesNow, lang: quote.lang })
      : { unitGrosze: i.unit_grosze, metalDeltaGrosze: 0, repriced: false };
    const unit = re.unitGrosze ?? i.unit_grosze;
    const line = unit != null ? unit * i.qty : null;
    metalDelta += re.metalDeltaGrosze * i.qty;
    return {
      id: i.id, title: i.title, qty: i.qty,
      unitGrosze: unit, lineGrosze: line,
      savedUnitGrosze: i.unit_grosze,
      repriced: re.repriced,
      description: i.description, fileName: i.file_name,
      uploadToken: i.upload_token || null,
      calculator: i.calculator,
      params: i.params ?? null,
      scale: i.scale != null ? Number(i.scale) : null,
      // Czym pozycja jest w ofercie: skladnikiem rachunku, wariantem do wyboru
      // albo dodatkiem. Strona oferty rysuje z tego karty wyboru.
      kind: rodzaje.get(Number(i.id)) || "fixed",
      groupKey: i.group_key || null,
      selected: wybraneId.has(Number(i.id)),
      state: NA_WIRE[stanPozycji(i)] || "available",
      // Numer zamowienia, ktore te pozycje wzielo. Klient sprawdza po nim
      // stan realizacji i to jest jedyny powod, dla ktorego tu stoi.
      orderRef: stanPozycji(i) === "wolna" ? null : (i.order_ref || null),
      // Termin realizacji tej pozycji, w dniach kalendarzowych, i znacznik
      // "wymaga ustalenia szczegolow". Klient ma wiedziec, na co czeka,
      // ZANIM zaplaci, a nie dowiadywac sie tego z maila po fakcie.
      leadDays: i.lead_days != null ? Number(i.lead_days) : null,
      requiresDetails: i.requires_details === true,
    };
  });

  // Zamowienia zlozone z tej oferty, po jednym wierszu na numer. Bierzemy je
  // z pozycji, bo to one wiedza, kto co wzial; naglowek pamieta tylko pierwsze.
  const zamowienia = [];
  const wgNumeru = new Map();
  for (const i of quote.items) {
    if (stanPozycji(i) === "wolna" || !i.order_ref) continue;
    if (!wgNumeru.has(i.order_ref)) {
      // Zeton zamowienia jedzie razem z numerem, bo bez niego odnosnik "przejdz
      // do zamowienia" prowadzi na strone statusu, ktora nie wie, o ktore
      // zamowienie chodzi, i pokazuje stan domyslny: "czekamy na potwierdzenie
      // platnosci". Zdanie nieprawdziwe przy zamowieniu oplaconym miesiac temu.
      //
      // Nie jest to poszerzenie dostepu: te trase chroni zeton oferty, ktora
      // niesie juz nazwisko, telefon i adres tego samego czlowieka, a zamowienie
      // powstalo wlasnie z niej.
      const wpis = {
        orderRef: i.order_ref, token: i.order_access_token || null,
        status: i.order_status, paid: Boolean(i.order_paid_at), titles: [],
      };
      wgNumeru.set(i.order_ref, wpis);
      zamowienia.push(wpis);
    }
    wgNumeru.get(i.order_ref).titles.push(i.title);
  }

  // Suma pozycji nie jest kwota do zaplaty: wariant z jednej grupy wyklucza
  // pozostale, a niezaznaczony dodatek nie wchodzi do rachunku. Bierzemy wiec
  // wybrane pozycje z listy JUZ PRZELICZONEJ, zeby kwota zgadzala sie z ta,
  // ktora klient widzi przy zaznaczonych kartach.
  const doZaplaty = items
    .filter((i) => i.selected)
    .reduce((s, i) => s + (i.lineGrosze || 0), 0) || quote.total_grosze;

  // Waluta oferty i kwota w niej. Strona oferty NIE liczy euro sama: ten sam
  // kurs i ten sam narzut musza stac po obu stronach, inaczej klient zobaczy
  // inna kwote niz ta, ktora zamrozimy przy skladaniu zamowienia.
  const waluta = normalizeCurrency(quote.currency, quote.lang);
  const kursEur = waluta === "EUR" ? await currentEurRate() : null;

  res.json({
    ok: true,
    quoteRef: quote.quote_ref,
    status: quote.status,
    source: quote.source,
    lang: quote.lang,
    currency: waluta,
    eurRate: kursEur,
    // Kwota w walucie oferty, policzona z tej samej kwoty PLN co przelew.
    amountEurCents: waluta === "EUR" ? eurCentsFromGrosze(doZaplaty, kursEur) : null,
    paymentMethod: paymentMethodForCurrency(waluta),
    transferAvailable: transferConfigured(),
    // Oferta z wyborem: sa w niej warianty albo dodatki, a nie sam rachunek.
    pickOne: uklad.groups.length > 0,
    chosenItemId: [...wybraneId].find((id) => rodzaje.get(id) === "variant") ?? null,
    // Kwota zapisana zostaje widoczna obok biezacej, zeby roznica byla
    // widoczna, a nie do wykrycia z pamieci.
    savedTotalGrosze: quote.total_grosze,
    totalGrosze: doZaplaty,
    metalDeltaGrosze: metalDelta,
    // `price_note` to OPIS OFERTY DLA KLIENTA: zakres, co wchodzi i czego nie ma.
    // Tresc zapytania zostaje po stronie panelu, bo bywa notatka z rozmowy
    // pisana skrotami dla siebie, a nie dokumentem dla klienta.
    priceNote: quote.price_note,
    validUntil: quote.valid_until,
    expired: Boolean(expired),
    // Dane kontaktowe wraca WYLACZNIE ta trasa, chroniona tokenem, i wracaja
    // po to, zeby formularz dostawy nie kazal klientowi wpisywac drugi raz
    // tego, co juz nam podal w rozmowie.
    customer: {
      name: quote.customer_name || null,
      email: quote.customer_email || null,
      phone: quote.customer_phone || null,
    },
    // Zamowienie zlozone: strona ma pokazac numer, a nie drugi raz przycisk.
    // `orderRef` zostaje dla zgodnosci i niesie PIERWSZE zamowienie; strona
    // czyta `orders`, bo od ADR-0026 jedna oferta rodzi ich wiele.
    orderRef: zamowienia[0]?.orderRef
      || (quote.converted_order_id ? await orderRefById(quote.converted_order_id) : null),
    orders: zamowienia,
    // Nie zostalo nic do wziecia: strona ma powiedziec "oplacona i zlecona",
    // a nie pokazac formularz platnosci na pusty koszyk.
    settled: quoteSettled(quote),
    // Termin tego, co klient ma zaznaczone TERAZ: najdluzszy z wybranych,
    // bo paczka wychodzi jedna. Liczy serwer, ta sama funkcja co przy
    // zapisie zamowienia, wiec liczba na ekranie jest ta, ktora zamrozimy.
    leadDays: quoteLeadDays(quote),
    requiresDetails: quoteRequiresDetails(quote),
    items,
  });
});

// ------------------------------------------------------------
// PANEL WYCEN: lista, podglad, wysylka i wycena zalozona recznie
// ------------------------------------------------------------
// Zapytania przychodza czterema drogami: z formularza, z kalkulatora, mailem
// i telefonem. Dwie pierwsze same zapisywaly sie w bazie, dwie ostatnie
// zylly w skrzynce i w pamieci. Rozmowa telefoniczna konczyla sie kwota
// podana ustnie, bez numeru, bez zapisu i bez miejsca, w ktorym klient moze
// zaplacic. Te trasy wciagaja obie do tego samego toru.

/** Lista wycen dla panelu. Numer, stan, kwota i to, skad przyszlo. */
app.get("/api/quotes", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const stan = String(req.query.status || "").trim();
  const dozwolone = ["new", "priced", "sent", "accepted", "partial", "converted", "expired", "cancelled"];
  const warunek = dozwolone.includes(stan) ? "WHERE q.status = $1" : "";
  const parametry = dozwolone.includes(stan) ? [stan] : [];
  const { rows } = await pool.query(
    `SELECT q.id, q.quote_ref, q.status, q.lang, q.source, q.customer_email, q.customer_name,
            q.customer_phone, q.message, q.total_grosze, q.valid_until, q.sent_at, q.created_at,
            q.converted_order_id, o.order_ref AS converted_order_ref,
            (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id) AS item_count
       FROM quotes q
       LEFT JOIN orders o ON o.id = q.converted_order_id
       ${warunek}
      ORDER BY q.created_at DESC
      LIMIT 200`,
    parametry
  );
  const { rows: liczniki } = await pool.query(
    "SELECT status, COUNT(*)::int AS ile FROM quotes GROUP BY status"
  );
  res.json({ ok: true, quotes: rows, counts: Object.fromEntries(liczniki.map((r) => [r.status, r.ile])) });
});

/**
 * Podglad wyceny dla panelu.
 *
 * Osobna trasa od tej dla klienta, bo panel widzi WIECEJ: tresc zapytania,
 * dane kontaktowe, stan i token dostepu. Doklejenie tego do trasy klienckiej
 * znaczyloby, ze jedna pomylka w warunku pokazuje kupujacemu cudze dane.
 */
app.get("/api/quotes/:ref/admin", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote) return res.status(404).json({ error: "Nie ma takiej wyceny" });

  const rozklad = quoteGroups(quote);
  const rodzajePozycji = new Map(rozklad.fixed.map((i) => [Number(i.id), "fixed"]));
  for (const g of rozklad.groups) {
    for (const i of g.variants) rodzajePozycji.set(Number(i.id), "variant");
    for (const i of g.options) rodzajePozycji.set(Number(i.id), "option");
  }
  const wybrane = new Set(selectedQuoteItems(quote).map((i) => Number(i.id)));

  res.json({
    ok: true,
    quote: {
      quoteRef: quote.quote_ref, status: quote.status, lang: quote.lang, source: quote.source,
      email: quote.customer_email, name: quote.customer_name, phone: quote.customer_phone,
      message: quote.message, totalGrosze: quote.total_grosze, priceNote: quote.price_note,
      currency: normalizeCurrency(quote.currency, quote.lang),
      pickOne: Boolean(quote.pick_one),
      chosenItemId: quote.chosen_item_id != null ? Number(quote.chosen_item_id) : null,
      validUntil: quote.valid_until, sentAt: quote.sent_at, createdAt: quote.created_at,
      accessToken: quote.access_token,
      // Kod odbioru ma sens WYLACZNIE przy kliencie bez adresu e-mail: tylko
      // on nie ma czym potwierdzic tozsamosci, gdy wejdzie na strone oferty
      // z samego numeru. Przy kliencie z adresem panel go nie pokazuje, zeby
      // nie sugerowac dwoch drog tam, gdzie dziala jedna.
      pickupCode: quote.customer_email ? null : kodOdbioru(quote.access_token),
      convertedOrderId: quote.converted_order_id,
    },
    // Zamowienia zlozone z tej oferty, razem z zetonem. Panel buduje z tego
    // link, ktory mozna wkleic klientowi w odpowiedzi na pytanie "co z moim
    // zamowieniem": bez tego jedyna droga bylo szukanie starego maila.
    orders: (() => {
      const wgNumeru = new Map();
      for (const i of quote.items) {
        if (stanPozycji(i) === "wolna" || !i.order_ref) continue;
        if (wgNumeru.has(i.order_ref)) continue;
        wgNumeru.set(i.order_ref, {
          orderRef: i.order_ref,
          token: i.order_access_token || null,
          status: i.order_status,
          paid: Boolean(i.order_paid_at),
        });
      }
      return [...wgNumeru.values()];
    })(),
    items: quote.items.map((i) => ({
      id: Number(i.id), calculator: i.calculator, title: i.title, qty: i.qty,
      unitGrosze: i.unit_grosze, lineGrosze: i.line_grosze,
      description: i.description, fileName: i.file_name, params: i.params,
      // Panel rysuje karty z tych trzech pol, a nie zgaduje ich z kolejnosci.
      kind: rodzajePozycji.get(Number(i.id)) || "fixed",
      groupKey: i.group_key || null,
      selected: wybrane.has(Number(i.id)),
      // Pozycja sprzedana jest w panelu nietykalna, bo jej cena stoi juz
      // w zamowieniu. Reszta oferty zostaje do poprawiania i to jest cala
      // roznica wobec stanu sprzed ADR-0026, gdzie pierwsza zaplata
      // zamrazala wszystko, razem z literowkami.
      state: NA_WIRE[stanPozycji(i)] || "available",
      orderRef: stanPozycji(i) === "wolna" ? null : (i.order_ref || null),
      leadDays: i.lead_days != null ? Number(i.lead_days) : null,
      requiresDetails: i.requires_details === true,
    })),
    settled: quoteSettled(quote),
    openCount: quoteOpenItems(quote).length,
    leadDays: quoteLeadDays(quote),
    requiresDetails: quoteRequiresDetails(quote),
  });
});

/**
 * Wycena zalozona recznie: rozmowa mailowa albo telefoniczna.
 *
 * Numer nadajemy OD RAZU, jeszcze przed wpisaniem kwot, zeby bylo czym
 * nazwac watek w korespondencji. Adres nie jest wymagany, bo przy rozmowie
 * telefonicznej bywa, ze mamy tylko numer; wtedy link przekazuje sie ustnie
 * albo SMS-em, a mail po prostu nie wychodzi.
 */
app.post("/api/quotes/manual", express.json({ limit: "256kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const { email, name, phone, lang, currency, source, message, items } = req.body || {};
  if (email && !CONTACT_EMAIL_RE.test(String(email))) return res.status(400).json({ error: "Nieprawidlowy adres e-mail" });
  if (!email && !phone) return res.status(400).json({ error: "Podaj adres e-mail albo telefon" });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Wycena bez pozycji" });

  const zrodlo = ["email", "phone", "chat", "quote", "contact"].includes(String(source)) ? String(source) : "email";
  try {
    const created = await createQuote(pool, {
      email: email || null, name, phone, lang, currency, source: zrodlo,
      message: String(message || "").slice(0, 8000),
      items: items.slice(0, 20),
      allowAnonymous: true,
    });
    console.log(`[wycena] zalozono recznie ${created.quoteRef} (${zrodlo})`);
    res.json({ ok: true, quoteRef: created.quoteRef, accessToken: created.accessToken });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] reczne zalozenie nie powiodlo sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zalozyc wyceny" });
  }
});

/**
 * Wyslanie oferty do klienta.
 *
 * Stan `sent` znaczy: kwota wyszla na zewnatrz i od tej chwili obowiazuje.
 * Zapisujemy go NAWET wtedy, gdy mail nie wyszedl (klient bez adresu), bo
 * o tym, czy oferta zostala zlozona, decyduje przekazanie jej klientowi,
 * a nie kanal. Odpowiedz mowi wprost, czy list poszedl.
 */
app.post("/api/quotes/:ref/send", express.json({ limit: "8kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote) return res.status(404).json({ error: "Nie ma takiej wyceny" });
  if (!quoteAmountGrosze(quote)) return res.status(400).json({ error: "Najpierw wpisz kwoty", code: "not_priced" });

  const url = `${SITE_URL}/oferta/?ref=${encodeURIComponent(quote.quote_ref)}&token=${encodeURIComponent(quote.access_token)}`;
  const wyslano = quote.customer_email ? await sendQuoteLink(pool, quote.quote_ref, url) : false;
  await pool.query(
    "UPDATE quotes SET status = 'sent', sent_at = COALESCE(sent_at, NOW()), updated_at = NOW() WHERE id = $1",
    [quote.id]
  );
  console.log(`[wycena] ${quote.quote_ref} oznaczona jako wyslana, mail: ${wyslano ? "tak" : "nie"}`);
  res.json({ ok: true, url, mailed: wyslano });
});
/** Numer zamowienia po jego identyfikatorze. Wycena zna tylko id. */
async function orderRefById(id) {
  const { rows } = await pool.query("SELECT order_ref FROM orders WHERE id = $1", [id]);
  return rows[0]?.order_ref ?? null;
}

/** Wpisanie kwot: dopiero to czyni z zapytania oferte */
app.post("/api/quotes/:ref/price", express.json({ limit: "64kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  try {
    const result = await priceQuote(pool, req.params.ref, req.body?.lines, req.body?.note ?? null, req.body?.validDays);
    console.log(`[wycena] ${result.quoteRef} wyceniona na ${(result.totalGrosze / 100).toFixed(2)} PLN`);
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] wycenianie nie powiodlo sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac kwot" });
  }
});

/**
 * Poprawienie zapisanej oferty: dane klienta, tresc zapytania i pozycje.
 *
 * Osobno od `/price`, bo tamto ustala KWOTY i jest jedyna droga do ceny.
 * Tutaj poprawia sie literowke w adresie, zla ilosc albo opis pozycji, czyli
 * to, co przy przepisywaniu zapytania ze skrzynki myli sie najczesciej.
 * Bez tej trasy jedynym wyjsciem bylo zalozenie wyceny od nowa, a wiec nowy
 * numer w watku i inny tytul platnosci niz ten, ktory klient juz dostal.
 */
app.post("/api/quotes/:ref/update", express.json({ limit: "256kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  try {
    const result = await updateQuote(pool, req.params.ref, req.body || {});
    console.log(
      `[wycena] ${result.quoteRef} poprawiona: stan ${result.status}` +
      `${result.removed ? `, usunietych pozycji ${result.removed}` : ""}` +
      `${result.added ? `, dodanych pozycji ${result.added}` : ""}` +
      `${result.totalGrosze != null ? `, suma ${(result.totalGrosze / 100).toFixed(2)} PLN` : ", bez kwoty"}`
    );
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] poprawianie nie powiodlo sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac zmian" });
  }
});

/**
 * Trwale usuniecie wyceny. Decyzja wlasciciela, ADR-0014.
 *
 * Wymaga przepisania numeru, bo w panelu wiersze wygladaja identycznie,
 * a cofnac sie po tym nie da. Wycena, ktora stala sie zamowieniem, wymaga
 * dodatkowo `force`: samo zamowienie zostaje, ale ginie slad, skad przyszlo.
 */
app.delete("/api/quotes/:ref", express.json({ limit: "8kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.params.ref || "");
  if (String(req.body?.confirmRef || "").trim() !== ref) {
    return res.status(400).json({ error: "Przepisz numer wyceny, zeby potwierdzic", code: "confirm_mismatch" });
  }
  try {
    const result = await deleteQuote(pool, ref, { force: req.body?.force === true });
    console.log(
      `[wycena] USUNIETO ${ref}` +
      (result.wasConverted ? `, byla juz zamowieniem (id ${result.orderId}), zamowienie zostaje` : "")
    );
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(409).json({ error: e.message, code: e.code });
    console.error("[wycena] usuwanie nie powiodlo sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie usunac wyceny" });
  }
});

// ------------------------------------------------------------
// STRONA OFERTY: klient sam odnajduje wycene, wpisuje kod i placi
// ------------------------------------------------------------
// Do tej pory zaplacic dalo sie WYLACZNIE z linku. Kto link zgubil albo
// dostal kwote w rozmowie telefonicznej, nie mial dokad pojsc. Trasy ponizej
// otwieraja drugie wejscie: numer wyceny plus dowod, ze to nasz rozmowca.
//
// Numer sam w sobie dowodem nie jest. Wycena niesie nazwisko, telefon i adres,
// wiec wejscie na sam numer znaczyloby, ze kto go zobaczy przez ramie, zobaczy
// tez czyjes dane. Dowodem jest wiec adres e-mail, na ktory poszla oferta,
// a przy rozmowie telefonicznej, gdzie adresu nie ma, krotki kod odbioru.

/**
 * Kod odbioru dla klienta bez adresu e-mail.
 *
 * Wyprowadzony z tokenu dostepu, wiec nie potrzebuje wlasnej kolumny i nie da
 * sie go rozjechac z tokenem. Osiem znakow z alfabetu szesnastkowego, czyli
 * tyle, ile da sie podyktowac przez telefon i przepisac bez pomylki.
 */
function kodOdbioru(accessToken) {
  return String(accessToken || "").replace(/[^a-f0-9]/gi, "").slice(0, 8).toUpperCase();
}

const quoteLookupLimit = createLimiter({ limit: 20, windowMs: 60 * 60_000, name: "szukanie oferty" });

// Dwa liczniki, bo naduzycie wyglada inaczej niz zwykle uzycie. Klient
// wpisuje kod raz, moze dwa razy przy literowce. Skrypt zgadujacy kody strzela
// bez konca, i to samymi nietrafieniami. Dlatego zwykly limit jest luzny, zeby
// nikomu nie przeszkadzal, a nietrafienia maja wlasny, ciasny licznik.
const discountCheckLimit = createLimiter({ limit: 30, windowMs: 60 * 60_000, name: "sprawdzenie kodu" });
// Pietnascie nietrafien na godzine to bardzo duzo jak na przepisywanie kodu
// z maila i zadna liczba jak na zgadywanie: alfabet ma 27 znakow, kod szesc,
// czyli 387 milionow mozliwosci. Wolimy byc hojni dla omylkowych.
const discountMissLimit = createLimiter({ limit: 15, windowMs: 60 * 60_000, name: "nietrafiony kod" });

// Zamowienie sklada sie bez logowania, i tak ma zostac. Ale brak jakiegokolwiek
// limitu dawal trzy rzeczy naraz: mozna bylo trzymac ostatnia sztuke w wiecznej
// rezerwacji, zasypywac cudza skrzynke danymi do przelewu (wysylamy je od razu,
// na adres, ktorego nikt nie potwierdzil) i zapychac baze porzuconymi
// zamowieniami. Liczymy po adresie i po skrzynce, bo pierwsze dwa naduzycia
// chodza z jednego adresu, a trzecie potrafi chodzic z wielu.
const orderLimit = createLimiter({ limit: 10, windowMs: 60 * 60_000, name: "zamowienie" });
const orderEmailLimit = createLimiter({ limit: 5, windowMs: 60 * 60_000, name: "zamowienie na adres" });

app.post("/api/quotes/lookup", express.json({ limit: "8kb" }),
  limitBy(quoteLookupLimit, extractIP, { error: "Za duzo prob, sprobuj za chwile" }),
  async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.body?.ref || "").trim().toUpperCase();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim().toUpperCase();

  // Jedna odpowiedz na wszystkie trzy porazki: zly numer, zly adres i zly kod.
  // Rozne komunikaty powiedzialyby zgadujacemu, ktora polowe ma juz dobra.
  const odmowa = () => res.status(404).json({
    error: "Nie znalezlismy oferty o tym numerze albo dane sie nie zgadzaja",
    code: "not_found",
  });

  const quote = ref ? await getQuoteByRef(pool, ref) : null;
  if (!quote) return odmowa();

  if (quote.customer_email) {
    if (!email || email !== String(quote.customer_email).trim().toLowerCase()) return odmowa();
  } else if (!code || !secretMatches(code, kodOdbioru(quote.access_token))) {
    return odmowa();
  }

  console.log(`[wycena] ${quote.quote_ref} otwarta z numeru`);
  res.json({ ok: true, ref: quote.quote_ref, token: quote.access_token });
});

/**
 * Konfiguracja oferty przez klienta: wybor wariantu i zaznaczenie dodatku.
 *
 * Wybor nie jest wiazacy: az do zaplaty da sie wrocic i przestawic sie na inny
 * wariant albo dolozyc dodatek. Wiazaca jest dopiero konwersja, ktora bierze
 * uklad z tej chwili i wpisuje do zamowienia WYLACZNIE wybrane pozycje.
 *
 * Ta trasa jest dla klienta, wiec chroni ja token z linku, tak samo jak
 * podglad oferty i sprawdzenie kodu rabatowego. Przynaleznosc pozycji do tej
 * wyceny sprawdza `chooseQuoteOption`, po stronie serwera: bez tego wybor
 * bylby ustawieniem dowolnej kwoty jako naleznosci.
 */
app.post("/api/quotes/:ref/choose", express.json({ limit: "8kb" }), async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote || !secretMatches(String(req.body?.token || ""), quote.access_token)) {
    return res.status(404).json({ error: "Nie ma takiej oferty" });
  }
  try {
    // Brak pola `selected` znaczy "zaznacz": tak wygladalo zadanie przed
    // dodaniem dodatkow i tak samo wyglada klikniecie w wariant.
    const zaznacz = req.body?.selected === undefined ? true : Boolean(req.body.selected);
    const wynik = await chooseQuoteOption(pool, req.params.ref, req.body?.itemId, zaznacz);
    console.log(`[wycena] ${wynik.quoteRef}: klient ustawil pozycje ${wynik.itemId} na ${wynik.selected ? "wybrana" : "pominieta"}, razem ${(wynik.totalGrosze / 100).toFixed(2)} PLN`);
    res.json({ ok: true, ...wynik });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] wybor wariantu nie powiodl sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac wyboru" });
  }
});

/**
 * Wybor waluty zaplaty przez klienta.
 *
 * Waluta dotyczy CALEJ oferty, nigdy pojedynczej pozycji: przelew wychodzi
 * z jednego konta, a rachunek zlozony z dwoch walut nie ma jak sie zsumowac.
 * Kwota zrodlowa zostaje w zlotowkach, wiec zmiana waluty niczego nie przecenia:
 * przelicza to samo po biezacym kursie i zmienia DROGE zaplaty, bo euro idzie
 * przelewem, a zlotowki bramka.
 *
 * Wybor nie jest wiazacy az do zlozenia zamowienia: wtedy kwota w euro zamraza
 * sie razem z kursem.
 */
/**
 * Wejscie na strone zamowienia z samego numeru i adresu e-mail.
 *
 * Do tej pory zamowienie otwieral WYLACZNIE prywatny link z maila. Klient,
 * ktory tego maila skasowal, nie mial jak sprawdzic swojego zlecenia i pytanie
 * "co z moim zamowieniem" wracalo do nas jako praca dla czlowieka.
 *
 * Sam numer nie wystarcza i nie ma wystarczac, dokladnie tak jak przy ofercie
 * (ADR-0012): zamowienie niesie nazwisko, telefon i adres, wiec numer widziany
 * przez ramie nie moze otwierac czyichs danych.
 */
app.post("/api/orders/lookup", express.json({ limit: "8kb" }),
  limitBy(quoteLookupLimit, extractIP, { error: "Za duzo prob, sprobuj za chwile" }),
  async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.body?.ref || "").trim().toUpperCase();
  const email = String(req.body?.email || "").trim().toLowerCase();

  // Jedna odpowiedz na obie porazki: zly numer i zly adres. Rozne komunikaty
  // powiedzialyby zgadujacemu, ktora polowe ma juz dobra.
  const odmowa = () => res.status(404).json({
    error: "Nie znalezlismy zamowienia o tym numerze albo dane sie nie zgadzaja",
    code: "not_found",
  });

  if (!ref || !email) return odmowa();
  const { rows } = await pool.query(
    "SELECT order_ref, access_token, customer_email FROM orders WHERE order_ref = $1",
    [ref]
  );
  const order = rows[0];
  if (!order || !order.customer_email) return odmowa();
  if (email !== String(order.customer_email).trim().toLowerCase()) return odmowa();

  console.log(`[zamowienie] ${order.order_ref} otwarte z numeru`);
  res.json({ ok: true, ref: order.order_ref, token: order.access_token });
});

app.post("/api/quotes/:ref/currency", express.json({ limit: "8kb" }), async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote || !secretMatches(String(req.body?.token || ""), quote.access_token)) {
    return res.status(404).json({ error: "Nie ma takiej oferty" });
  }
  // Blokuje dopiero oferta, w ktorej nie zostalo nic do wziecia. Czesciowo
  // zlecona dalej pozwala wybrac walute dla reszty: zamowienie juz zlozone
  // ma swoja walute zamrozona u siebie i ta zmiana go nie dotyka.
  if (quoteSettled(quote)) {
    return res.status(400).json({ error: "Cala ta oferta jest juz zlecona", code: "already_converted" });
  }

  const waluta = String(req.body?.currency || "").toUpperCase();
  if (!["PLN", "EUR"].includes(waluta)) {
    return res.status(400).json({ error: "Waluta to PLN albo EUR", code: "bad_currency" });
  }
  // Euro bez skonfigurowanego rachunku walutowego byloby obietnica bez pokrycia:
  // klient wybralby walute, w ktorej nie mamy mu gdzie zaplacic.
  if (waluta === "EUR" && !transferConfigured()) {
    return res.status(503).json({ error: "Zaplata w euro nie jest teraz dostepna", code: "no_transfer" });
  }

  await pool.query(`UPDATE quotes SET currency = $2, updated_at = NOW() WHERE id = $1`, [quote.id, waluta]);
  const kurs = waluta === "EUR" ? await currentEurRate() : null;
  console.log(`[wycena] ${quote.quote_ref}: klient wybral zaplate w ${waluta}`);
  res.json({
    ok: true,
    quoteRef: quote.quote_ref,
    currency: waluta,
    eurRate: kurs,
    amountEurCents: waluta === "EUR" ? eurCentsFromGrosze(quoteAmountGrosze(quote) || 0, kurs) : null,
    paymentMethod: paymentMethodForCurrency(waluta),
  });
});

/**
 * Sprawdzenie kodu rabatowego dla oferty, jeszcze przed zaplata.
 *
 * Kwota do zaplaty ma byc juz po rabacie, a nie korygowana potem zwrotem, bo
 * zwrot to druga operacja pieniezna i drugie miejsce, w ktorym cos moze pojsc
 * nie tak. Tutaj liczymy podglad, a wiazaca jest dopiero rezerwacja przy
 * skladaniu zamowienia, w tej samej transakcji.
 */
app.post("/api/quotes/:ref/discount", express.json({ limit: "8kb" }),
  limitBy(discountCheckLimit, extractIP, { error: "Za duzo prob z kodem, sprobuj za chwile" }),
  async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote || !secretMatches(String(req.body?.token || ""), quote.access_token)) {
    return res.status(404).json({ error: "Nie ma takiej oferty" });
  }
  // Kwota z POZYCJI, tak samo jak przy zaplacie. Naglowek jest podsumowaniem
  // i po czesciowym zleceniu potrafi byc o krok z tylu; rabat policzony z
  // niego schodzilby od innej sumy niz ta, ktora klient zaraz zaplaci.
  const doRabatu = quoteAmountGrosze(quote);
  if (!doRabatu) return res.status(400).json({ error: "Ta oferta nie ma teraz nic do zaplaty", code: "not_priced" });

  const ip = extractIP(req);
  if (discountMissLimit.remaining(ip) <= 0) {
    return res.status(400).json({ error: "Nie znamy takiego kodu", code: "not_found" });
  }

  try {
    const preview = await previewDiscount(pool, {
      code: req.body?.code,
      email: quote.customer_email,
      items: quoteItemsForDiscount(quote),
    });
    res.json({
      ok: true,
      ...preview,
      totalGrosze: Math.max(0, doRabatu - preview.discountGrosze),
    });
  } catch (e) {
    if (e instanceof DiscountError) {
      if (e.code === "not_found") discountMissLimit.penalize(ip);
      return res.status(400).json({ error: e.message, code: e.code, ...(e.details || {}) });
    }
    console.error("[wycena] sprawdzenie kodu nie powiodlo sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie sprawdzic kodu" });
  }
});

/**
 * Zlozenie zamowienia z oferty przez samego klienta.
 *
 * Rozni sie od trasy panelu jednym: tozsamosc potwierdza token z linku, a nie
 * haslo administratora. Kwota pozycji pochodzi z oferty i klient nie ma jak
 * jej ruszyc; z jego strony przychodzi wylacznie to, czego wczesniej nie
 * wiedzielismy, czyli sposob dostawy, adres i ewentualny kod rabatowy.
 */
app.post("/api/quotes/:ref/checkout", express.json({ limit: "32kb" }),
  limitBy(orderLimit, extractIP, { error: "Za duzo prob, sprobuj za chwile" }),
  async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote || !secretMatches(String(req.body?.token || ""), quote.access_token)) {
    return res.status(404).json({ error: "Nie ma takiej oferty" });
  }
  // Kwota za to, co klient bierze TERAZ. Po czesciowym zleceniu naglowek mowi
  // o reszcie oferty, wiec obie liczby zwykle sa rowne, ale zrodlem zostaje
  // regula wyboru: to ona rozstrzyga przy zapisie zamowienia.
  const doZaplaty = quoteAmountGrosze(quote);
  if (!doZaplaty) return res.status(400).json({ error: "Ta oferta nie ma teraz nic do zaplaty", code: "not_priced" });
  // Zamkniete jest to, w czym nie zostalo nic do wziecia. Oferta czesciowo
  // zlecona przyjmuje kolejna zaplate za reszte i o to w tym wszystkim chodzi.
  if (quoteSettled(quote)) {
    return res.status(409).json({ error: "Cala ta oferta jest juz zlecona", code: "already_converted" });
  }
  // Po terminie waznosci kwota przestaje obowiazywac, wiec przyjecie zaplaty
  // znaczyloby zobowiazanie sie do liczby, ktorej juz nie potwierdzamy.
  if (quote.valid_until && String(quote.valid_until).slice(0, 10) < new Date().toISOString().slice(0, 10)) {
    return res.status(410).json({ error: "Ta oferta straciła waznosc, odezwij sie do nas po nowa", code: "expired" });
  }

  const dostawa = req.body?.delivery || {};
  const kraj = String(dostawa.country || "PL").toUpperCase();
  const metoda = String(dostawa.method || "");
  if (!metoda) return res.status(400).json({ error: "Wybierz sposob dostawy", code: "no_delivery" });

  // Koszt dostawy liczy serwer z wlasnego cennika. Gdyby przychodzil z
  // przegladarki, kazdy moglby zamowic kuriera za zero.
  const shipping = shippingCost(metoda, kraj, doZaplaty);
  if (shipping == null) return res.status(400).json({ error: "Nie wozimy tak do tego kraju", code: "bad_delivery" });

  // Oferta idzie WYLACZNIE przez bramke. Autopay obsluguje i BLIK-a, i przelew
  // online, wiec klient ma obie drogi, a my nie wystawiamy tu przelewu
  // tradycyjnego w euro: ten wymaga kursu i kwoty zapisanych przy zamowieniu,
  // a wycena reczna ich nie niesie. Przelew zwykly zostaje w sklepie.
  const kod = normalizeCode(req.body?.discountCode);
  const email = quote.customer_email || String(req.body?.customer?.email || "").trim().toLowerCase();
  if (!email || !CONTACT_EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Podaj adres e-mail do potwierdzenia", code: "no_email" });
  }
  if (!req.body?.consents?.terms) {
    return res.status(400).json({ error: "Akceptacja regulaminu jest wymagana", code: "no_terms" });
  }

  try {
    const limit = await checkQuarterlyLimit(pool, doZaplaty + shipping);
    if (!limit.ok) {
      return res.status(409).json({
        error: "Ta kwota nie zmiesci sie w limicie kwartalnym",
        code: "quarterly_limit",
        remainingPLN: Math.round(limit.remainingGrosze / 100),
      });
    }

    // Droga zaplaty wynika z WALUTY oferty, nie z wyboru w przegladarce: bramka
    // rozlicza wylacznie zlotowki, wiec euro moze pojsc tylko przelewem. Klient
    // zmienia droge zmieniajac walute, i to jest cala decyzja, ktora ma do podjecia.
    const walutaOferty = normalizeCurrency(quote.currency, quote.lang);
    const przelew = paymentMethodForCurrency(walutaOferty) === "bank_transfer";
    if (przelew && !transferConfigured()) {
      return res.status(503).json({ error: "Zaplata w euro nie jest teraz dostepna", code: "no_transfer" });
    }
    const kursEur = przelew ? await currentEurRate() : null;
    if (przelew && !kursEur) {
      return res.status(503).json({ error: "Brak kursu euro, sprobuj za chwile", code: "no_rate" });
    }

    const order = await convertQuoteToOrder(pool, quote.quote_ref, {
      orderRef: generateOrderRef(),
      paymentMethod: przelew ? "bank_transfer" : "autopay",
      eurRate: kursEur,
      // Przy przelewie ta sama data konczy waznosc kwoty i czas na zaplate,
      // tak samo jak w sklepie. Dwie rozne daty to dwie obietnice.
      expiresAt: przelew ? addBusinessDays(new Date(), TRANSFER_HOLD_BUSINESS_DAYS) : null,
      customer: { ...(req.body?.customer || {}), email },
      consents: req.body?.consents || null,
      delivery: {
        method: metoda,
        country: kraj,
        shippingGrosze: shipping,
        point: dostawa.point || null,
        addressLine1: dostawa.addressLine1 || null,
        addressLine2: dostawa.addressLine2 || null,
        postalCode: dostawa.postalCode || null,
        city: dostawa.city || null,
      },
      discount: kod ? { code: kod, reserve: reserveDiscount } : null,
    });

    console.log(
      `[wycena] ${quote.quote_ref} oplacana przez klienta jako ${order.orderRef} w ${walutaOferty}` +
      (order.discountCode ? `, kod ${order.discountCode} na ${(order.discountGrosze / 100).toFixed(2)} PLN` : "")
    );

    res.json({
      ok: true,
      orderRef: order.orderRef,
      token: order.accessToken,
      quoteRef: quote.quote_ref,
      totalGrosze: order.totalGrosze,
      shippingGrosze: shipping,
      discountCode: order.discountCode,
      discountGrosze: order.discountGrosze,
      creditGrosze: order.creditGrosze || 0,
      currency: walutaOferty,
      paymentMethod: order.paymentMethod,
      amountEurCents: order.amountEurCents,
      eurRate: order.eurRate,
    });
  } catch (e) {
    if (e instanceof DiscountError) return res.status(400).json({ error: e.message, code: e.code });
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] zaplata z oferty nie powiodla sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zlozyc zamowienia" });
  }
});

/**
 * Zaplata pcha zlecenie w etap pracy i uruchamia zegar.
 *
 * Do ADR-0027 zamowienie zostawalo w `paid` az ktos kliknal w panelu, wiec
 * termin realizacji nie mial od czego biec i przypomnienia nie mialy czego
 * pilnowac. Teraz robi to sama zaplata, bo to ona jest chwila, w ktorej praca
 * sie zaczyna.
 *
 * Zlecenie ze znacznikiem "wymaga ustalenia szczegolow" staje w `details`
 * i zegar CZEKA: to my czekamy wtedy na klienta, a nie on na nas, wiec
 * liczenie mu terminu byloby liczeniem cudzego czasu.
 *
 * Warunek `status = 'paid'` w obu zapisach czyni to bezpiecznym do powtorzenia:
 * druga ITN, ponowne potwierdzenie przelewu i recznie przestawiony etap nie
 * cofna niczego ani nie przestemplowluja terminu drugi raz.
 *
 * @returns {Promise<string|null>} etap, w ktory weszlo zlecenie, albo null
 */
async function ruszZlecenie(pool, orderId) {
  const { rows } = await pool.query(
    `SELECT status, requires_details, lead_days FROM orders WHERE id = $1`,
    [orderId]
  );
  const o = rows[0];
  if (!o || o.status !== "paid") return null;

  // O rozmowie decyduja POZYCJE, bo to one jej wymagaja. Zamowienie sprzed
  // wprowadzenia znacznikow przy pozycjach ma go tylko na naglowku, wiec
  // przepisujemy go w dol: inaczej takie zamowienie stanelo by w ustalaniu
  // szczegolow bez ani jednej pozycji do odhaczenia, czyli na zawsze.
  if (o.requires_details === true) {
    await pool.query(
      `UPDATE order_items SET requires_details = TRUE
        WHERE order_id = $1
          AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = $1 AND requires_details)`,
      [orderId]
    ).catch((e) => console.error("[start] przepisanie znacznika ustalen:", e.message));
  }
  const { rows: pozycje } = await pool.query(
    `SELECT requires_details, details_settled_at FROM order_items WHERE order_id = $1`,
    [orderId]
  );

  if (!ustaleniaDomkniete(pozycje)) {
    const r = await pool.query(
      `UPDATE orders SET status = 'details', details_at = NOW()
        WHERE id = $1 AND status = 'paid' RETURNING id`,
      [orderId]
    );
    return r.rowCount ? "details" : null;
  }

  // Termin zapisujemy jako DATE, a nie liczbe dni: liczba przeliczana przy
  // kazdym odczycie przesuwalaby sie razem z data odczytu i klient widzialby
  // termin, ktory nigdy nie nadchodzi.
  const termin = terminRealizacji(new Date(), o.lead_days);
  const r = await pool.query(
    `UPDATE orders SET status = $3, queued_at = NOW(), deadline_at = $2
      WHERE id = $1 AND status = 'paid' RETURNING id`,
    [orderId, termin, ETAP_STARTU_ZEGARA]
  );
  return r.rowCount ? ETAP_STARTU_ZEGARA : null;
}

/** Zamiana wyceny w zamowienie do zaplaty, z limitem kwartalnym jak w sklepie */
app.post("/api/quotes/:ref/convert", express.json({ limit: "16kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  try {
    const quote = await getQuoteByRef(pool, req.params.ref);
    if (!quote) return res.status(404).json({ error: "Nie ma takiej wyceny" });
    // Ta sama regula co po stronie klienta: kwota bierze sie z pozycji, ktore
    // sa jeszcze wolne i zaznaczone, a nie z podsumowania w naglowku.
    const doZaplaty = quoteAmountGrosze(quote);
    if (!doZaplaty) return res.status(400).json({ error: "Najpierw wpisz kwoty", code: "not_priced" });

    const shipping = Number.isInteger(req.body?.delivery?.shippingGrosze) ? req.body.delivery.shippingGrosze : 0;
    // Limit kwartalny liczy sie od kwoty, ktora realnie wplynie, a wiec
    // po odliczeniu oplaty projektowej.
    const credit = await availableDesignCredit(pool, quote.customer_email);
    const creditGrosze = credit ? Math.min(credit.grosze, doZaplaty) : 0;
    const limit = await checkQuarterlyLimit(pool, doZaplaty - creditGrosze + shipping);
    if (!limit.ok) {
      return res.status(409).json({
        error: "Ta kwota nie zmiesci sie w limicie kwartalnym",
        code: "quarterly_limit",
        remainingPLN: Math.round(limit.remainingGrosze / 100),
      });
    }

    const order = await convertQuoteToOrder(pool, req.params.ref, {
      orderRef: generateOrderRef(),
      delivery: req.body?.delivery || {},
    });
    console.log(
      `[wycena] ${req.params.ref} stala sie zamowieniem ${order.orderRef}` +
      (order.creditGrosze ? `, odliczono ${(order.creditGrosze / 100).toFixed(2)} PLN z projektu ${order.creditFrom}` : "")
    );
    res.json({
      ok: true,
      orderRef: order.orderRef,
      totalGrosze: order.totalGrosze,
      creditGrosze: order.creditGrosze || 0,
      creditFrom: order.creditFrom,
      // Adres do wyslania klientowi. Dalej idzie ta sama sciezka co w sklepie.
      payUrl: `${SITE_URL}/order/status/?ref=${order.orderRef}&token=${order.accessToken}`,
    });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] konwersja nie powiodla sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie utworzyc zamowienia" });
  }
});

// ============================================================
// PLIKI KLIENTOW
// ============================================================
// Plik wgrywany jest raz, na karcie uslugi, i od razu trafia na Dysk przez
// n8n. Przegladarka dostaje sam identyfikator, wiec pozycja w koszyku
// przezywa odswiezenie strony i powrot po kilku dniach.
//
// n8n nie zwraca linku w odpowiedzi HTTP, tylko wysyla go mailem, dlatego
// po zapisaniu pliku oddzwania do nas na /api/uploads/:token/stored.

const UPLOAD_N8N_URL = process.env.N8N_ORDER_FILE_WEBHOOK_URL;
const UPLOAD_CALLBACK_TOKEN = process.env.UPLOAD_CALLBACK_TOKEN;
const ABANDON_AFTER_DAYS = Number(process.env.UPLOAD_ABANDON_DAYS || 14);

/** Rysunki techniczne przyjmowane jako zalacznik do zlecenia */
const ATTACHMENT_EXT = /\.(svg|dxf|ai|pdf)$/i;
/**
 * ZDJECIE ALBO SZKIC z pola opisu, czyli zupelnie co innego niz projekt do
 * wykonania.
 *
 * Przez pomylke obie rzeczy jechaly tu jako `kind: "attachment"` i obie
 * wpadaly na `ATTACHMENT_EXT`, ktore przyjmuje wylacznie SVG, DXF i PDF.
 * Pole w formularzu nazywa sie "Dolacz zdjecie lub szkic" i oferuje
 * .jpg, .png, .webp, wiec klient wybieral zdjecie, widzial je przez ulamek
 * sekundy i patrzyl, jak znika: przegladarka pokazywala plik od razu,
 * a po odpowiedzi serwera kasowala go z powrotem. Przechodzil tylko PDF,
 * i to przez przypadek, bo jest na obu listach.
 *
 * Zdjecie nie jest podstawa wyceny ani plikiem produkcyjnym, jest kontekstem
 * dla pracowni: tak wyglada rzecz, ktora mamy oznaczyc. HEIC jest na liscie,
 * bo tak fotografuje domyslnie kazdy iPhone.
 */
const REFERENCE_EXT = /\.(jpg|jpeg|png|webp|heic|heif|pdf)$/i;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const uploadStore = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 1 },
});

/**
 * Wgranie pliku ma WLASNY licznik, osobny od wyceny.
 *
 * Wczesniej obie sciezki dzielily budzet `priceLimit`, czyli 60 zapytan na
 * dziesiec minut. Wycena odswieza sie po kazdym ruchu suwaka, wiec zjada ten
 * budzet setkami, a wtedy wgranie pliku odbijalo sie od 429. Objaw byl mylacy:
 * model pokazywal sie w podgladzie, bo podglad rysuje sie lokalnie, po czym
 * znikal, gdy odpowiedz serwera kasowala plik.
 *
 * Wgranie pliku to pojedyncza, swiadoma czynnosc klienta, a nie ruch suwaka,
 * wiec limit jest niski, ale nie da sie go wyczerpac konfigurowaniem.
 */
const uploadLimit = createLimiter({ limit: 30, windowMs: 10 * 60_000, name: "wgrywanie plikow" });

app.post("/api/uploads", (req, res, next) => {
  uploadStore.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.code === "LIMIT_FILE_SIZE" ? "Plik przekracza 60 MB" : (err.message || "Blad wysylki pliku"),
      });
    }
    next();
  });
}, async (req, res) => {
  const ip = extractIP(req);
  if (!uploadLimit.check(ip)) {
    return res.status(429).json({ error: "Za duzo wgranych plikow, sprobuj za kilka minut", code: "rate_limited" });
  }
  if (!req.file?.buffer) return res.status(400).json({ error: "Brak pliku" });

  try {
    // Zalacznik to projekt do wykonania, nie podstawa wyceny. Grawer i ciecie
    // licza sie z pola albo dlugosci sciezki wybranej przez klienta, a rysunek
    // mowi warsztatowi, co ma wyciac. Dlatego nie liczymy z niego geometrii
    // i nie wpuszczamy go nigdy do wyceny.
    const kind = String(req.body?.kind || "");
    const isAttachment = kind === "attachment";
    const isReference = kind === "reference";
    const bezGeometrii = isAttachment || isReference;
    const name = (req.file.originalname || "plik").slice(0, 255);

    if (isAttachment && !ATTACHMENT_EXT.test(name)) {
      return res.status(400).json({ error: "Załącznik przyjmujemy jako SVG, DXF, AI lub PDF", code: "unsupported_format" });
    }
    if (isReference && !REFERENCE_EXT.test(name)) {
      return res.status(400).json({ error: "Zdjęcie przyjmujemy jako JPG, PNG, WEBP, HEIC lub PDF", code: "unsupported_format" });
    }
    if (bezGeometrii && req.file.size > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ error: "Załącznik przekracza 15 MB", code: "file_too_large" });
    }

    const geometry = bezGeometrii ? null : await geometryFromFile(req.file.buffer, name);
    const token = generateToken();
    const lang = ["pl", "en", "de"].includes(req.body?.lang) ? req.body.lang : "pl";

    if (pool) {
      await pool.query(
        `INSERT INTO uploads (token, file_name, file_size_bytes, file_sha256, mime_type, geometry, lang, ip_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [token, name, req.file.size,
         geometry ? geometry.sha256 : createHash("sha256").update(req.file.buffer).digest("hex"),
         req.file.mimetype || "application/octet-stream",
         geometry ? JSON.stringify(geometry) : null, lang,
         createHash("sha256").update(ip).digest("hex").slice(0, 30)]
      );
    }

    // Wysylka na Dysk idzie obok glownego watku. Klient nie ma czekac
    // na zapis pliku, zeby zobaczyc cene, a brak Dysku nie moze zablokowac
    // wyceny. Link dojdzie do nas oddzwonieniem z n8n.
    if (UPLOAD_N8N_URL) {
      fetch(UPLOAD_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          // Zalacznik i zdjecie nie maja geometrii, wiec skrot liczymy z pliku.
          // Odwolanie do `geometry.sha256` bez tego rozgalezienia wywalalo caly
          // handler wyjatkiem, a klient dostawal 500 przy kazdym zdjeciu.
          sha256: geometry ? geometry.sha256 : createHash("sha256").update(req.file.buffer).digest("hex"),
          lang,
          geometry: geometry
            ? { volumeCm3: geometry.volumeCm3, bbox: geometry.bbox, triangleCount: geometry.triangleCount }
            : null,
          data: req.file.buffer.toString("base64"),
          source: bezGeometrii ? (isReference ? "reference_image" : "artwork_file") : "order_file",
        }),
      }).then((r) => {
        if (!r.ok) console.error(`[uploads] webhook n8n ${r.status} dla ${token}`);
      }).catch((e) => console.error("[uploads] webhook blad:", e.message));
    } else {
      console.warn("[uploads] N8N_ORDER_FILE_WEBHOOK_URL nie ustawiony, plik nie trafi na Dysk");
    }

    res.json({
      ok: true,
      uploadToken: token,
      geometry: geometry && {
        volumeCm3: Number(geometry.volumeCm3.toFixed(3)),
        bbox: geometry.bbox,
        triangleCount: geometry.triangleCount,
      },
    });
  } catch (e) {
    if (e instanceof PricingError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[uploads] blad:", e);
    res.status(500).json({ error: "Nie udalo sie przyjac pliku" });
  }
});

/**
 * Miniatura modelu, zrzucona z podgladu w przegladarce.
 *
 * Bez uwierzytelnienia, bo w tym momencie klient nie ma jeszcze zadnego
 * konta. Chroni nas to, ze token uploadu ma 48 znakow losowych, a zdjecie
 * da sie ustawic tylko raz i tylko dla pliku, ktory jeszcze nie zostal
 * zamowiony. Podmiana cudzego podgladu wymagalaby zgadniecia tokenu.
 */
const THUMB_PREFIX = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const MAX_THUMB_CHARS = 300_000; // okolo 220 kB obrazu

// Zapis miniatury nie wymaga uwierzytelnienia, bo klient nie ma jeszcze konta,
// a chroni go dlugosc tokenu. Limit dokladamy nie przeciw podszyciu, tylko
// przeciw zapychaniu: to jedyne miejsce, gdzie ktos z ulicy wklada do bazy
// kilkaset kilobajtow na zadanie.
const thumbLimit = createLimiter({ limit: 30, windowMs: 10 * 60_000, name: "miniatura" });

app.post("/api/uploads/:token/thumb", express.json({ limit: "400kb" }),
  limitBy(thumbLimit, extractIP),
  async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const dataUrl = String(req.body?.dataUrl || "");
  if (dataUrl.length > MAX_THUMB_CHARS || !THUMB_PREFIX.test(dataUrl)) {
    return res.status(400).json({ error: "Nieprawidlowy obraz" });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE uploads SET thumbnail = $2
        WHERE token = $1 AND thumbnail IS NULL AND status = 'pending'`,
      [String(req.params.token || ""), dataUrl]
    );
    if (!rowCount) return res.status(404).json({ error: "Nieznany plik" });
    res.json({ ok: true });
  } catch (e) {
    // Najczestszy powod to brak kolumny thumbnail w bazie. Bez tego logu
    // objaw jest niemy: koszyk po prostu pokazuje zdjecie katalogowe.
    console.error("[uploads] zapis miniatury nie powiodl sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac podgladu" });
  }
});

app.get("/api/uploads/:token/thumb", async (req, res) => {
  if (!pool) return res.status(503).end();
  const { rows } = await pool.query(`SELECT thumbnail FROM uploads WHERE token = $1`, [
    String(req.params.token || ""),
  ]);
  const dataUrl = rows[0]?.thumbnail;
  if (!dataUrl) return res.status(404).end();

  const [, mime, b64] = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl) || [];
  if (!b64) return res.status(404).end();

  res.set("Content-Type", mime);
  // Miniatura nigdy sie nie zmienia, wiec moze lezec w cache do konca zycia tokenu.
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(Buffer.from(b64, "base64"));
});

/**
 * Oddzwonienie z n8n po zapisaniu pliku na Dysku.
 * Chronione wspoldzielonym tokenem, bo inaczej ktokolwiek moglby podmienic
 * link do pliku w zamowieniu.
 */
app.post("/api/uploads/:token/stored", express.json({ limit: "8kb" }), async (req, res) => {
  const sent = req.headers["x-upload-token"];
  if (!UPLOAD_CALLBACK_TOKEN || sent !== UPLOAD_CALLBACK_TOKEN) {
    // Odcisk zamiast wartosci: tyle wystarczy, zeby porownac obie strony,
    // a sam sekret nie trafia do logow.
    const fp = (v) => (v ? `${v.length}/${createHash("sha256").update(v).digest("hex").slice(0, 8)}` : "BRAK");
    console.error(`[uploads] 401 stored: serwer=${fp(UPLOAD_CALLBACK_TOKEN)} n8n=${fp(sent)}`);
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const { driveUrl, driveFileId } = req.body || {};
  const { rowCount } = await pool.query(
    `UPDATE uploads SET drive_url = $2, drive_file_id = $3, stored_at = NOW() WHERE token = $1`,
    [String(req.params.token || ""), driveUrl || null, driveFileId || null]
  );
  if (!rowCount) return res.status(404).json({ error: "Nieznany plik" });
  console.log(`[uploads] plik ${req.params.token} zapisany na Dysku`);
  res.json({ ok: true });
});

const FILES_READY_N8N_URL = process.env.N8N_ORDER_FILES_READY_WEBHOOK_URL;

/**
 * Prosi n8n o przeniesienie plikow zamowienia do folderu Zamowienia.
 *
 * Plik trafia na Dysk juz w chwili wgrania, bo wtedy liczymy geometrie
 * i klient nie ma czekac. W tym momencie to jednak tylko proba wyceny:
 * wiekszosc takich plikow nigdy nie stanie sie zamowieniem. Dlatego
 * ladaja w folderze roboczym, a tutaj, po zaplacie, wedruja tam, gdzie
 * naprawde jest robota do wykonania.
 *
 * Nie rzuca wyjatkiem. Nieudane przeniesienie zostawia plik w folderze
 * roboczym, co jest niewygodne, ale nie moze wywrocic obslugi platnosci.
 */
async function moveOrderFilesToOrders(pool, orderId, orderRef) {
  if (!FILES_READY_N8N_URL) {
    console.warn("[dysk] N8N_ORDER_FILES_READY_WEBHOOK_URL nie ustawiony, pliki zostaja w folderze roboczym");
    return;
  }

  const { rows } = await pool.query(
    `SELECT token, file_name, drive_file_id, geometry IS NOT NULL AS is_model
       FROM uploads
      WHERE order_id = $1 AND drive_file_id IS NOT NULL
      ORDER BY id`,
    [orderId]
  );
  if (!rows.length) return;

  const resp = await fetch(FILES_READY_N8N_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderRef,
      files: rows.map((r) => ({
        driveFileId: r.drive_file_id,
        fileName: r.file_name,
        kind: r.is_model ? "model" : "attachment",
      })),
    }),
  });
  if (!resp.ok) {
    console.error(`[dysk] webhook przenoszenia zwrocil ${resp.status} dla ${orderRef}`);
    return;
  }
  console.log(`[dysk] zlecono przeniesienie ${rows.length} plikow zamowienia ${orderRef}`);
}

/** Pliki wgrane i nigdy niezamowione oznaczamy jako porzucone */
async function markAbandonedUploads() {
  if (!pool) return;
  try {
    const { rowCount } = await pool.query(
      `UPDATE uploads SET status = 'abandoned', abandoned_at = NOW()
        WHERE status = 'pending' AND created_at < NOW() - ($1 || ' days')::interval`,
      [String(ABANDON_AFTER_DAYS)]
    );
    if (rowCount) console.log(`[uploads] oznaczono jako porzucone: ${rowCount}`);
  } catch (e) {
    console.error("[uploads] oznaczanie porzuconych nie powiodlo sie:", e.message);
  }
}
if (pool) cron.schedule("30 3 * * *", markAbandonedUploads);
// Rezerwacje wygasaja co kwadrans, bo przy platnosci natychmiastowej trzymamy
// towar tylko 20 minut i nie ma sensu czekac z tym do nocy.
if (pool) cron.schedule("*/15 * * * *", () => releaseExpiredReservations(pool).catch(() => {}));
// Kod z porzuconego koszyka wraca do puli razem z towarem, w tym samym rytmie.
if (pool) cron.schedule("*/15 * * * *", () => releaseExpiredRedemptions(pool).catch(() => {}));

/** Zamowienie nieoplacone po terminie zamykamy i oddajemy jego towar do sprzedazy. */
async function expireStaleOrders() {
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = 'expired'
        WHERE status IN ('awaiting_payment','awaiting_transfer')
          AND paid_at IS NULL AND expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING id, order_ref`
    );
    for (const o of rows) {
      await releaseOrderReservations(pool, o.id);
      // Kod z przeterminowanego zamowienia wraca do puli razem z towarem.
      await releaseOrderRedemptions(pool, o.id);
    }
    if (rows.length) console.log(`[zamowienia] wygaslo ${rows.length}: ${rows.map((r) => r.order_ref).join(", ")}`);
  } catch (e) {
    console.error("[zamowienia] wygaszanie nie powiodlo sie:", e.message);
  }
}
if (pool) cron.schedule("0 * * * *", expireStaleOrders);

/**
 * Codzienny przeglad terminow realizacji (ADR-0027).
 *
 * Rano, raz na dobe: przypomnienie o terminie jest informacja, a nie alarmem,
 * wiec ma przyjsc razem z reszta poczty, a nie w nocy albo w kolku.
 *
 * Zapis "wyslane" idzie DOPIERO po udanej wysylce. Zapisany przed nia
 * zamknalby prog na zawsze przy pierwszej awarii poczty, i to po cichu:
 * nikt nie zauwaza maila, ktory nie przyszedl.
 */
async function przypomnijOTerminach() {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM orders
        WHERE status = ANY($1::text[]) AND deadline_at IS NOT NULL
        ORDER BY deadline_at`,
      [ETAPY_Z_ZEGAREM]
    );
    for (const order of rows) {
      const dni = dniDoTerminu(order.deadline_at);
      if (dni == null) continue;
      const wyslane = Array.isArray(order.reminders_sent) ? order.reminders_sent : [];
      const wybor = progDoWyslania(dni, wyslane);
      if (!wybor) continue;

      if (!await sendDeadlineReminder(pool, order, dni)) {
        console.error(`[termin] ${order.order_ref}: prog ${wybor.prog} bez wysylki, sprobujemy jutro`);
        continue;
      }
      await pool.query(
        `UPDATE orders SET reminders_sent = $2::jsonb WHERE id = $1`,
        [order.id, JSON.stringify([...new Set([...wyslane, ...wybor.domkniete])])]
      );
      console.log(`[termin] ${order.order_ref}: przypomnienie na ${dni} dni przed`);
    }
  } catch (e) {
    console.error("[termin] przeglad nie powiodl sie:", e.message);
  }

  // Ustalanie szczegolow nie ma terminu, bo czekamy w nim na klienta. Bez
  // wlasnego sprawdzenia zlecenie zaplacone i nieruszone milczaloby w
  // nieskonczonosc, a to jest najgorszy rodzaj ciszy: klient juz zaplacil.
  try {
    const { rows } = await pool.query(
      `SELECT * FROM orders WHERE status = 'details' AND details_at IS NOT NULL ORDER BY details_at`
    );
    for (const order of rows) {
      if (!szturchnacSzczegoly(order.details_at, order.details_nudged_at)) continue;
      const dni = Math.floor((Date.now() - new Date(order.details_at).getTime()) / 86400_000);
      if (!await sendDetailsNudge(pool, order, dni)) continue;
      await pool.query(`UPDATE orders SET details_nudged_at = NOW() WHERE id = $1`, [order.id]);
      console.log(`[ustalenia] ${order.order_ref}: stoi ${dni} dni, szturchnieto`);
    }
  } catch (e) {
    console.error("[ustalenia] przeglad nie powiodl sie:", e.message);
  }
}
if (pool) cron.schedule("0 7 * * *", przypomnijOTerminach, { timezone: "Europe/Warsaw" });

// Sprzatanie danych po terminach z polityki prywatnosci. Raz na dobe w nocy,
// bo to kasowanie, a nie odswiezanie: ma isc wtedy, gdy nikt nie kupuje.
if (pool) cron.schedule("15 4 * * *", () => runRetention(pool).catch((e) => console.error("[retencja]", e.message)));

// ============================================================
// ZAMOWIENIA I PLATNOSCI
// ============================================================

const SITE_URL = process.env.SITE_URL || "https://www.aejaca.com";
const ORDER_VALIDITY_DAYS = 7;

// ------------------------------------------------------------
// Przelew w euro
// ------------------------------------------------------------
// Autopay obsluguje wylacznie BLIK i polskie banki, wiec klient spoza Polski
// nie ma czym zaplacic od reki. Dane rachunku trzymamy w zmiennych srodowiskowych,
// bo zmieniaja sie niezaleznie od kodu i nie maja czego szukac w repozytorium.
const TRANSFER = {
  iban: process.env.TRANSFER_IBAN_EUR || null,
  bic: process.env.TRANSFER_BIC || null,
  holder: process.env.TRANSFER_ACCOUNT_HOLDER || null,
  bank: process.env.TRANSFER_BANK_NAME || null,
};
const transferConfigured = () => Boolean(TRANSFER.iban);

/** Kurs NBP z bazy, ten sam, ktory widzi strona */
async function currentEurRate() {
  if (!pool) return null;
  try {
    const { rows } = await pool.query(
      `SELECT pln_per_eur::float AS rate FROM market_rates
        WHERE pln_per_eur IS NOT NULL ORDER BY fetched_at DESC LIMIT 1`
    );
    return rows[0]?.rate ?? null;
  } catch {
    return null;
  }
}

/** Kanaly platnosci dostepne na serwisie, prosto z Autopay */
/**
 * Paczkomaty pasujace do wpisanego kodu pocztowego albo miasta.
 * Wolane z kasy przy kazdej zmianie w polu, wiec limit jest luzny, ale jest:
 * to pytanie do cudzej uslugi, ktora nie ma obowiazku nas obslugiwac bez konca.
 */
const lockerLimit = createLimiter({ limit: 60, windowMs: 10 * 60_000, name: "paczkomaty" });

app.get("/api/lockers", limitBy(lockerLimit, extractIP), async (req, res) => {
  try {
    const points = await findLockers(req.query.q);
    // Lista zmienia sie rzadko, wiec przegladarka moze ja potrzymac.
    res.set("Cache-Control", "public, max-age=3600");
    res.json({ points });
  } catch (e) {
    if (e instanceof LockerError) {
      const status = e.code === "too_short" ? 400 : 502;
      return res.status(status).json({ error: e.message, code: e.code });
    }
    console.error("[paczkomaty] blad:", e.message);
    res.status(500).json({ error: "Nie udalo sie pobrac listy paczkomatow" });
  }
});

app.get("/api/payment-methods", async (_req, res) => {
  const list = await fetchGatewayList();
  if (!list) return res.json({ available: false, gateways: [] });
  res.json({
    available: true,
    gateways: (list.gatewayList || [])
      .filter((g) => g.state === "OK")
      .map((g) => ({
        id: g.gatewayID, name: g.name, group: g.groupType,
        icon: g.iconURL || g.iconUrl || null, order: g.order ?? 99,
      }))
      .sort((a, b) => a.order - b.order),
  });
});

/**
 * Utworzenie zamowienia.
 * Cena liczona jest tutaj od nowa, z parametrow i geometrii pliku.
 * Kwota przyslana przez przegladarke jest ignorowana.
 */
// Liczniki skladania zamowienia stoja WYZEJ, przy trasach oferty, bo zaplata
// za oferte sklada zamowienie wczesniej w tym pliku i siega po ten sam licznik.

/** Ile rezerwacji towaru wisi jednoczesnie z jednego adresu. */
const MAX_HELD_RESERVATIONS = 2;

/**
 * Najkrotszy opis zlecenia, ktory przyjmujemy. Ta sama liczba stoi
 * w przegladarce (`MIN_DESCRIPTION` w CalcToCart i ServiceConfigurator),
 * i to jest zamierzone: formularz ma odbic zlecenie zanim klient zaplaci,
 * a serwer ma je odbic takze wtedy, gdy formularz ktos ominie.
 */
const MIN_JOB_DESCRIPTION = 20;

/**
 * Uslugi ZWOLNIONE z wymogu opisu, kazda z powodem napisanym obok.
 *
 * Lista jest krotka celowo. Zwolnienie znaczy, ze zlecenie trafi do pracowni
 * bez ani jednego zdania od klienta, wiec wolno je dac tylko wtedy, gdy tresc
 * zlecenia wynika jednoznacznie z czegos innego niz tekst.
 *
 * `jewelry_ring_config`: kreator pierscionkow. Parametry pozycji sa PELNYM
 * opisem wyrobu, co do dziesiatych milimetra, i to z nich powstaje bryla,
 * ktora klient widzial na ekranie. Opis slowny nie dodalby tu niczego, czego
 * nie ma juz w `params`, a wymuszanie go zablokowaloby sprzedaz z kreatora.
 */
const USLUGI_BEZ_OPISU = new Set(["jewelry_ring_config"]);

app.post("/api/orders", express.json({ limit: "1mb" }),
  limitBy(orderLimit, extractIP, { error: "Za duzo zamowien z tego miejsca, sprobuj za chwile" }),
  async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  try {
    const { items, customer, delivery, consents, lang, paymentMethod } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Zamowienie bez pozycji" });
    if (items.length > 20) return res.status(400).json({ error: "Za duzo pozycji" });
    // Te same reguly co w kasie (pricing/customerFields.js, kopia z src/shop).
    // Kontrola w przegladarce jest uprzejmoscia, ta tutaj obowiazuje: zamowienie
    // bez numeru telefonu albo z samym imieniem to nieodebrana paczka.
    const customerErrors = validateCustomer(customer);
    if (Object.keys(customerErrors).length) {
      return res.status(400).json({
        error: "Dane zamawiajacego sa niekompletne", code: "customer_invalid", fields: customerErrors,
      });
    }
    if (!consents?.terms) return res.status(400).json({ error: "Akceptacja regulaminu jest wymagana" });

    const customerEmail = customer.email.trim().toLowerCase();
    if (!orderEmailLimit.check(customerEmail)) {
      return res.status(429).json({
        error: "Za duzo zamowien na ten adres, sprobuj za chwile",
        code: "rate_limited",
        retryAfterSeconds: orderEmailLimit.retryAfter(customerEmail),
      });
    }

    const safeLang = ["pl", "en", "de"].includes(lang) ? lang : "pl";
    const rates = items.some((i) => String(i.calculator || "").startsWith("jewelry_")) ? await currentMetalRates() : null;
    const gemstones = rates ? await currentGemstones(rates.pln_per_eur) : null;

    // Pozycje produktowe wyceniamy z bazy, nie z przegladarki: cena i stan
    // moga sie zmienic miedzy dodaniem do koszyka a zaplata.
    const productItems = [];
    for (const raw of items.filter((i) => i.productSlug)) {
      const product = await getProduct(pool, raw.productSlug);
      if (!product) return res.status(400).json({ error: `Produkt ${raw.productSlug} nie istnieje`, code: "product_not_found" });
      const qty = Number.isInteger(raw.qty) && raw.qty > 0 ? Math.min(99, raw.qty) : 1;
      if (product.available !== null && product.available < qty) {
        return res.status(409).json({
          error: "Nie mamy tylu sztuk", code: "out_of_stock",
          slug: product.slug, available: product.available,
        });
      }
      productItems.push({
        slug: product.slug,
        title: product.title?.[safeLang] || product.title?.pl || product.slug,
        qty,
        unitGrosze: product.priceGrosze,
        lineGrosze: product.priceGrosze * qty,
        weightG: product.weightG,
        personalization: sanitizePersonalization(raw.personalization),
        kind: product.kind,
        category: product.category,
      });
    }

    // Rezerwacja trzyma towar, wiec przy nakladzie jednej sztuki wystarczyloby
    // skladac zamowienie co kwadrans, zeby pierscionek byl trwale niedostepny,
    // i nikt by tego nie zauwazyl. Jeden adres moze wiec trzymac najwyzej dwie
    // rezerwacje naraz. Kupujacy tego nie odczuje, bo placi od razu, a wtedy
    // rezerwacja zamienia sie w sprzedaz i zwalnia miejsce.
    const ipHash = createHash("sha256").update(extractIP(req)).digest("hex").slice(0, 30);
    if (productItems.length) {
      const { rows: held } = await pool.query(
        `SELECT COUNT(*)::INTEGER AS held FROM orders o
          WHERE o.ip_hash = $1
            AND o.status IN ('awaiting_payment','awaiting_transfer')
            AND o.expires_at > NOW()
            AND EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.item_type = 'product')`,
        [ipHash]
      );
      if (held[0].held >= MAX_HELD_RESERVATIONS) {
        return res.status(429).json({
          error: "Masz juz zamowienia czekajace na zaplate. Oplac je albo poczekaj, az wygasna.",
          code: "too_many_reservations",
        });
      }
    }

    const priced = [];
    for (const raw of items.filter((i) => !i.productSlug)) {
      // Geometria pochodzi z wczesniejszego wywolania /api/price, gdzie zostala
      // policzona z pliku po stronie serwera. Cene liczymy tu jeszcze raz tym
      // samym kodem, wiec zmiana czegokolwiek po drodze nic nie daje.
      // Geometrie bierzemy z bazy, nie z przegladarki, gdy pozycja ma plik.
      let itemGeometry = raw.geometry || null;
      if (raw.uploadToken) {
        const { rows } = await pool.query("SELECT geometry FROM uploads WHERE token = $1", [String(raw.uploadToken)]);
        if (rows[0]?.geometry) itemGeometry = rows[0].geometry;
      }

      // TO JEST MIEJSCE, W KTORYM POWSTAJE KWOTA WIAZACA. Kazde pominiete
      // tu zrodlo danych oznacza, ze klient placi inna cene niz ta, ktora
      // zobaczyl, i nic tego nie zglosi.
      const itemStock = String(raw.calculator || "").startsWith("laser_")
        ? await currentMaterialStock()
        : null;
      const item = priceItem({
        calculator: raw.calculator,
        params: raw.params,
        lang: safeLang,
        geometry: itemGeometry,
        scale: raw.scale || 1,
        rates,
        gemstones,
        materialStock: itemStock,
      });
      // Opakowanie i personalizacja licza sie tutaj, nie w przegladarce.
      // Bez tego klient widzialby cene z doplata, a placil bez niej.
      const packGrosze = packagingGrosze(raw.packagingId);
      const personalization = sanitizePersonalization(raw.personalization);
      // Trzy niezalezne teksty: wyrob, wieko, wnetrze wieka.
      const packagingText = sanitizePersonalization(raw.packagingText);
      const packagingTextBack = sanitizePersonalization(raw.packagingTextBack);
      // Opis zlecenia to tresc od klienta, nie parametr wyceny, wiec przycinamy
      // go do rozsadnej dlugosci i zapisujemy razem z parametrami pozycji.
      const description = String(raw.description || "").slice(0, 2000).trim() || null;

      // OPIS JEST WARUNKIEM PRZYJECIA ZLECENIA NA USLUGE.
      //
      // Sprawdzamy to TUTAJ, a nie tylko w przegladarce, bo formularz da sie
      // ominac, a skutkiem jest zamowienie oplacone i niewykonalne: pieniadze
      // na koncie, plik w chmurze i nikt nie wie, co z nim zrobic. Dokladnie
      // to sie wydarzylo 2026-08-16 przy znakowaniu laserem fiber.
      //
      // Pozycja z polki (`productSlug`) jest z tego zwolniona i nigdy tu nie
      // trafia: to gotowy przedmiot z katalogu, jego tresc jest znana.
      //
      // Pozycja z WYCENY tez jest zwolniona: przeszla przez czlowieka, ktory ja
      // policzyl, wiec pracownia ma kontekst nawet bez opisu. Bez tego wyjatku
      // stara wycena, zapisana zanim opis stal sie obowiazkowy, odbijalaby sie
      // od kasy w ostatnim kroku, juz po podaniu danych do platnosci.
      const bezOpisu = USLUGI_BEZ_OPISU.has(String(raw.calculator || ""))
        || Boolean(raw.quoteRef);
      if (!bezOpisu && (!description || description.length < MIN_JOB_DESCRIPTION)) {
        return res.status(400).json({
          error: "Zlecenie na usluge wymaga opisu tego, co mamy wykonac (min. "
            + MIN_JOB_DESCRIPTION + " znakow).",
          code: "description_required",
        });
      }

      // KWOTA WIAZACA WYMAGA PODSTAWY, KTORA DA SIE ZMIERZYC.
      //
      // Sprawdzamy to TUTAJ, bo tu powstaje zobowiazanie: pozycja przyjeta do
      // zamowienia zostanie pobrana przez Autopay i wpisana do potwierdzenia
      // jako kwota, ktorej dotrzymujemy. Przedzial wielkosci podstawa nie jest.
      // Przed ta zmiana `/api/price` oddawal 39,68 zl za samo "S", a pod spodem
      // silnik zakladal 150 cm3, ktorych nikt nie widzial ani nie zapisywal.
      //
      // Regula stoi w lustrze `src/pricing/bindingBasis.js`, wiec przegladarka
      // wygasza przycisk z tego samego powodu, dla ktorego serwer odmawia.
      const podstawa = bindingBasis({
        calculator: raw.calculator,
        params: raw.params,
        geometry: raw.geometry || null,
        fromQuote: Boolean(raw.quoteRef),
      });
      if (!podstawa.binding) {
        return res.status(400).json({
          error: "Tej pozycji nie mozemy przyjac po cenie wiazacej, bo nie wynika ona z pomiaru."
            + " Wgraj model albo podaj wymiary, albo wyslij zapytanie o wycene.",
          code: "no_binding_basis",
          missing: podstawa.missing,
          calculator: raw.calculator,
        });
      }

      // PODLOZE USLUGI LASEROWEJ.
      //
      // Grawer na przedmiocie klienta, na jego materiale i na naszym materiale
      // to trzy rozne zlecenia, kazde z innym obowiazkiem po stronie klienta:
      // przyslanie rzeczy, sztuka na proby albo nazwa materialu. Formularz
      // pilnuje tego przy dodawaniu do koszyka, ale formularz da sie ominac,
      // a pozycje sprzed zmiany leza w koszykach w `localStorage`.
      //
      // Regule liczy `brakPodloza` z lustra `src/data`, a nie wlasna kopia:
      // dwie kopie rozjechalyby sie przy pierwszej zmianie, a objawem bylby
      // blad dopiero przy platnosci.
      const brakPodl = brakPodloza({ calculator: raw.calculator, params: raw.params });
      if (brakPodl) {
        return res.status(400).json({
          error: {
            substrate_required: "Wybierz, na czym mamy pracowac: na Twoim przedmiocie, na Twoim materiale czy na naszym.",
            spare_required: "Przy materiale powierzonym potrzebujemy sztuki na proby albo deklaracji, ze przedmiot jest niepowtarzalny.",
            material_note_required: "Napisz, na jakim konkretnie materiale mamy wykonac usluge.",
          }[brakPodl] || "Zlecenie laserowe jest niekompletne.",
          code: brakPodl,
        });
      }

      // Zalaczniki zbieramy do listy i odsiewamy puste, zeby nizej isc jedna
      // petla niezaleznie od tego, czy pozycja przyszla ze starego koszyka
      // z jednym polem, czy z nowego z lista.
      const attachmentTokens = [
        ...(Array.isArray(raw.attachmentTokens) ? raw.attachmentTokens : []),
        raw.attachmentToken,
      ].map((t) => (t ? String(t) : null)).filter(Boolean);
      const uniqueAttachments = [...new Set(attachmentTokens)];
      const qty = Number.isInteger(raw.qty) && raw.qty > 0 ? Math.min(999, raw.qty) : item.qty;
      const unitGrosze = item.unitGrosze + packGrosze;

      priced.push({
        ...item,
        qty,
        unitGrosze,
        lineGrosze: unitGrosze * qty,
        packagingId: raw.packagingId || null,
        packagingGrosze: packGrosze,
        personalization,
        packagingText,
        packagingTextBack,
        description,
        params: raw.params,
        geometry: raw.geometry || null,
        fileName: raw.fileName || null,
        uploadToken: raw.uploadToken || null,
        attachmentToken: uniqueAttachments[0] || null,
        attachmentTokens: uniqueAttachments,
      });
    }

    // DEKLARACJA DOSTARCZENIA, gdy klient ma nam cos przyslac.
    //
    // Naprawa i renowacja nie maja innego wejscia niz wlasna bizuteria klienta,
    // a przy laserze material bywa powierzony. Bez tej deklaracji zamowienie
    // jest oplacone, a robota stoi: nie wiadomo, czy czekac na paczke, czy na
    // klienta pod drzwiami, ani kiedy.
    //
    // Regule krajowa liczy `inboundAllowed` z lustra `src/data`, a nie wlasna
    // kopia listy: Polska to paczkomat albo osobiscie, zagranica wylacznie
    // kurier. Sprawdzamy TU, bo formularz da sie ominac.
    //
    // Kraj liczymy TUTAJ, a nie siegamy po `country` nizej: tamta stala jest
    // deklarowana pod tym miejscem, wiec odwolanie do niej wywrocilo by kazde
    // zamowienie przy pierwszym uruchomieniu. Zlapane przed wypchnieciem.
    const krajPrzesylki = String(delivery?.country || "PL").toUpperCase();
    const przesylkaOd = priced.some((i) => wymagaPrzesylki(i));
    const inbound = String(delivery?.inbound || "").trim();
    if (przesylkaOd && !inboundAllowed(inbound, krajPrzesylki)) {
      return res.status(400).json({
        error: "Zamowienie wymaga deklaracji, w jaki sposob dostarczysz nam swoj przedmiot.",
        code: "inbound_required",
      });
    }

    const itemsTotal =
      priced.reduce((sum, i) => sum + i.lineGrosze, 0) +
      productItems.reduce((sum, i) => sum + i.lineGrosze, 0);

    // Koszt wysylki liczymy tutaj, z kraju i metody. Przyjecie kwoty od
    // przegladarki pozwalaloby zamowic paczke do Australii za cene paczkomatu.
    const country = String(delivery?.country || "PL").toUpperCase();
    const method = delivery?.method || "pickup";
    const shipping = shippingCost(method, country, itemsTotal);
    if (shipping === null) {
      return res.status(400).json({
        error: "Ta metoda dostawy nie jest dostepna dla wybranego kraju",
        code: "delivery_unavailable",
      });
    }
    // Kod rabatowy sprawdzamy tu, przed zapisem zamowienia, zeby wygasly kod
    // odbil sie od kasy, a nie od platnosci. Znizka liczy sie wylacznie od
    // pozycji, ktore obejmuje, i nigdy od wysylki.
    const discountItems = [
      ...priced.map((i) => ({
        lineGrosze: i.lineGrosze,
        source: "service",
        category: String(i.calculator || "").startsWith("jewelry") ? "jewelry" : "studio",
      })),
      ...productItems.map((i) => ({ lineGrosze: i.lineGrosze, source: "product", category: i.category })),
    ];

    const rawCode = normalizeCode(req.body?.discountCode);
    let discountGrosze = 0;
    let discountCode = null;
    if (rawCode) {
      try {
        const preview = await previewDiscount(pool, {
          code: rawCode,
          email: customer.email,
          items: discountItems,
        });
        discountGrosze = preview.discountGrosze;
        discountCode = preview.code;
      } catch (e) {
        if (e instanceof DiscountError) return res.status(400).json({ error: e.message, code: e.code });
        throw e;
      }
    }

    const total = itemsTotal - discountGrosze + shipping;

    const limit = await checkQuarterlyLimit(pool, total);
    if (!limit.ok) {
      return res.status(409).json({
        error: "Nie mozemy teraz przyjac tej platnosci",
        code: "quarterly_limit",
        remainingPLN: Math.round(limit.remainingGrosze / 100),
      });
    }

    const orderRef = generateOrderRef();
    const token = generateToken();

    // Przelew w euro: kwote zamrazamy tu i teraz razem z kursem. Gdybysmy
    // przeliczali ja dopiero przy ksiegowaniu, klient przelalby jedna kwote,
    // a my oczekiwalibysmy innej.
    // O drodze zaplaty decyduje WALUTA, a nie jezyk. Polak czytajacy po polsku
    // moze miec konto w euro, a Niemiec czytajacy po niemiecku konto w zlotowkach;
    // waluta wynika z tego, gdzie klient trzyma pieniadze, nie z tego, co czyta.
    // Bramka rozlicza wylacznie zlotowki, wiec euro moze pojsc tylko przelewem.
    //
    // Starsza strona przysyla sama metode platnosci i nie zna pola `currency`.
    // Wtedy zostajemy przy jej decyzji, zeby wdrozenie w polowie nie odrzucalo
    // zamowien.
    const walutaZadana = req.body?.currency ? normalizeCurrency(req.body.currency, safeLang) : null;
    const wantsTransfer = walutaZadana
      ? paymentMethodForCurrency(walutaZadana) === "bank_transfer"
      : paymentMethod === "bank_transfer";
    if (wantsTransfer && !transferConfigured()) {
      return res.status(503).json({ error: "Platnosc przelewem nie jest skonfigurowana" });
    }
    const eurRate = wantsTransfer ? await currentEurRate() : null;
    const amountEurCents = wantsTransfer ? eurCentsFromGrosze(total, eurRate) : null;

    // Przy przelewie ta sama data konczy rezerwacje towaru i waznosc kwoty.
    // Dwie rozne daty oznaczalyby dwie obietnice, z ktorych klient zapamieta
    // korzystniejsza.
    const expiresAt = wantsTransfer
      ? addBusinessDays(new Date(), TRANSFER_HOLD_BUSINESS_DAYS)
      : new Date(Date.now() + ORDER_VALIDITY_DAYS * 86400_000);

    const { rows } = await pool.query(
      `INSERT INTO orders (order_ref, status, kind, lang, items_total_grosze, shipping_grosze, total_grosze,
         customer_email, customer_name, customer_phone,
         delivery_method, delivery_point, address_line1, address_line2, postal_code, city, country,
         accepted_terms_at, waived_withdrawal_at, digital_immediate_at,
         access_token, ip_hash, expires_at, revisions_included,
         payment_method, amount_eur_cents, eur_rate, eur_rate_locked_at,
         discount_code, discount_grosze, inbound_delivery)
       VALUES ($1,$22,'instant',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
         NOW(), $16, $17, $18, $19, $20, $21,
         $23, $24, $25, CASE WHEN $24::INTEGER IS NULL THEN NULL ELSE NOW() END,
         $26, $27, $28)
       RETURNING id`,
      [orderRef, safeLang, itemsTotal, shipping, total,
       customerEmail, customer.name.trim().replace(/\s+/g, " "), normalizePhone(customer.phone),
       delivery?.method || null, delivery?.point || null, delivery?.addressLine1 || null,
       delivery?.addressLine2 || null, delivery?.postalCode || null, delivery?.city || null,
       country,
       consents?.waiveWithdrawal ? new Date() : null,
       consents?.digitalImmediate ? new Date() : null,
       token, ipHash, expiresAt,
       // Limit bierzemy z pozycji projektowej, jesli taka jest w koszyku.
       priced.find((i) => i.revisionsIncluded)?.revisionsIncluded ?? null,
       wantsTransfer ? "awaiting_transfer" : "awaiting_payment",
       wantsTransfer ? "bank_transfer" : "autopay",
       amountEurCents, eurRate, discountCode, discountGrosze,
       przesylkaOd ? inbound : null]
    );
    const orderId = rows[0].id;

    // Rezerwacja idzie w osobnej transakcji z blokada wiersza produktu, wiec
    // dwa rownolegle zamowienia na ostatnia sztuke ustawiaja sie w kolejce.
    // Gdy towaru zabraknie, kasujemy swieze zamowienie zamiast zostawiac
    // klienta z linkiem do zaplaty za cos, czego nie wyslemy.
    if (productItems.length || discountCode) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // Kod blokujemy tak samo jak towar: wiersz kodu pod blokada, wiec dwa
        // zamowienia zlozone w tej samej sekundzie nie uzyja jednorazowego
        // kodu obydwa. Kwota policzona tutaj musi zgadzac sie z ta, ktora
        // zapisalismy na zamowieniu, inaczej klient zaplacilby inna niz widzial.
        if (discountCode) {
          const used = await reserveDiscount(client, {
            code: discountCode, email: customer.email, items: discountItems,
            orderId, paymentMethod: wantsTransfer ? "bank_transfer" : "autopay",
          });
          if (used.discountGrosze !== discountGrosze) {
            throw new DiscountError("Warunki kodu zmienily sie w trakcie skladania zamowienia", "changed");
          }
        }
        for (const it of productItems) {
          await reserveProduct(client, {
            slug: it.slug, qty: it.qty, orderId,
            paymentMethod: wantsTransfer ? "bank_transfer" : "autopay",
          });
          await client.query(
            `INSERT INTO order_items (order_id, item_type, product_id, title, qty, unit_grosze, line_grosze, params)
             SELECT $1, 'product', id, $2, $3, $4, $5, $6 FROM products WHERE slug = $7`,
            [orderId, it.title, it.qty, it.unitGrosze, it.lineGrosze,
             JSON.stringify({ slug: it.slug, personalization: it.personalization }), it.slug]
          );
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        await pool.query("DELETE FROM orders WHERE id = $1", [orderId]).catch(() => {});
        if (e instanceof ProductError) {
          return res.status(409).json({ error: e.message, code: e.code, slug: e.slug, available: e.available });
        }
        if (e instanceof DiscountError) {
          return res.status(409).json({ error: e.message, code: e.code });
        }
        throw e;
      } finally {
        client.release();
      }
    }

    for (const i of priced) {
      let uploadRow = null;
      if (i.uploadToken) {
        const { rows } = await pool.query(
          `UPDATE uploads SET status = 'ordered', order_id = $2 WHERE token = $1
           RETURNING id, drive_url, file_name, file_sha256, geometry`,
          [i.uploadToken, orderId]
        );
        uploadRow = rows[0] || null;
      }

      // Rysunek techniczny nie jest pozycja zamowienia, tylko materialem do
      // wykonania, wiec wiazemy go z zamowieniem, a nie z linia.
      //
      // ZALACZNIKOW MOZE BYC WIECEJ NIZ JEDEN. Zlecenie na laser niesie plik
      // wektorowy DO WYKONANIA i osobno zdjecie przedmiotu, na ktorym ma sie
      // znalezc. Wczesniej oba szly w jedno pole i drugi plik po cichu
      // zastepowal pierwszy. Pojedyncze pole zostaje obslugiwane, bo tak
      // wygladaja pozycje lezace juz w koszykach klientow.
      for (const tok of i.attachmentTokens) {
        await pool.query(
          `UPDATE uploads SET status = 'ordered', order_id = $2 WHERE token = $1`,
          [tok, orderId]
        );
      }

      await pool.query(
        `INSERT INTO order_items (order_id, item_type, calculator, title, qty, unit_grosze, line_grosze,
           params, price_breakdown, file_name, file_sha256, file_url, geometry, upload_id)
         VALUES ($1,'service',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [orderId, i.calculator, i.title, i.qty, i.unitGrosze, i.lineGrosze,
         JSON.stringify({ ...(i.params ?? {}), packagingId: i.packagingId, personalization: i.personalization, packagingText: i.packagingText, packagingTextBack: i.packagingTextBack, description: i.description }),
         JSON.stringify(i.breakdown ?? []),
         i.fileName || uploadRow?.file_name || null,
         i.geometry?.sha256 ?? uploadRow?.file_sha256 ?? null,
         uploadRow?.drive_url ?? null,
         i.geometry ? JSON.stringify(i.geometry) : (uploadRow?.geometry ? JSON.stringify(uploadRow.geometry) : null),
         uploadRow?.id ?? null]
      );
    }

    // Dane do przelewu wysylamy od razu: klient zamknie strone, a przelew
    // zrobi wieczorem z telefonu.
    if (wantsTransfer) {
      sendTransferInstructions(pool, orderId, {
        ...TRANSFER,
        amountEur: (amountEurCents / 100).toFixed(2),
        reference: orderRef,
        dueAt: expiresAt,
      }).catch((e) => console.error("[przelew] wysylka danych do przelewu nie powiodla sie:", e.message));
    }

    res.json({
      ok: true,
      orderRef,
      token,
      totalGrosze: total,
      totalPLN: (total / 100).toFixed(2),
      discountCode,
      discountGrosze,
      expiresAt,
      paymentMethod: wantsTransfer ? "bank_transfer" : "autopay",
      // Numer rachunku wydajemy dopiero razem z zamowieniem, czyli wtedy, gdy
      // klient potwierdzil chec zaplaty. Wczesniej nie ma po co go pokazywac.
      transfer: wantsTransfer
        ? { ...TRANSFER, amountEurCents, amountEur: (amountEurCents / 100).toFixed(2), reference: orderRef, dueAt: expiresAt }
        : null,
      items: priced.map((i) => ({
        title: i.title, qty: i.qty,
        unitPLN: (i.unitGrosze / 100).toFixed(2),
        linePLN: (i.lineGrosze / 100).toFixed(2),
      })),
    });
  } catch (e) {
    if (e instanceof PricingError) return res.status(400).json({ error: e.message, code: e.code });
    // Pelny blad do logow, do odpowiedzi nic. Komunikaty Postgresa nie niosa
    // hasel, ale niosa nazwy kolumn i ograniczen, czyli darmowa mape bazy dla
    // kogos, kto dopiero szuka, gdzie przycisnac. Klientowi i tak nic nie mowia,
    // a diagnoza ma miejsce w logu, gdzie stoi caly slad wykonania.
    console.error("[orders] create failed:", e?.code, e?.message, e?.detail, e?.stack);
    res.status(500).json({ error: "Nie udalo sie utworzyc zamowienia" });
  }
});

// ------------------------------------------------------------
// Katalog produktow
// ------------------------------------------------------------
// Czytane przez sklep przy budowaniu stron oraz na zywo, gdy klient oglada
// karte: stan magazynowy zmienia sie bez wdrozenia, wiec statyczna strona
// nie moze byc jedynym zrodlem informacji o dostepnosci.
app.get("/api/products", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  try {
    const products = await listProducts(pool, {
      category: ["jewelry", "studio"].includes(req.query.category) ? req.query.category : null,
      offer: ["ready", "personalized"].includes(req.query.offer) ? req.query.offer : null,
    });
    res.json({ products });
  } catch (e) {
    console.error("[produkty] lista:", e.message);
    res.status(500).json({ error: "Nie udalo sie pobrac katalogu" });
  }
});

app.get("/api/products/:slug", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const product = await getProduct(pool, req.params.slug).catch(() => null);
  if (!product) return res.status(404).json({ error: "Produkt nie istnieje" });
  res.json({ product });
});

/** Dodanie albo aktualizacja produktu. Slug jest kluczem, wiec ten sam wpis
 *  mozna poprawiac wielokrotnie bez tworzenia duplikatow. */
app.put("/api/products/:slug", express.json({ limit: "256kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) return res.status(400).json({ error: "Nieprawidlowy slug" });

  const b = req.body || {};
  if (!b.title?.pl || !b.title?.en || !b.title?.de) {
    return res.status(400).json({ error: "Tytul musi byc w trzech jezykach" });
  }
  if (!Number.isInteger(b.priceGrosze) || b.priceGrosze < 0) {
    return res.status(400).json({ error: "Cena musi byc liczba calkowita w groszach" });
  }
  const status = b.status || "draft";
  if (!PRODUCT_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Stan musi byc jednym z: ${PRODUCT_STATUSES.join(", ")}` });
  }

  const kind = b.kind === "digital" ? "digital" : "physical";
  // Produkt cyfrowy nie ma stanu magazynowego, fizyczny musi go miec.
  const stock = kind === "digital" ? null : (Number.isInteger(b.stock) ? Math.max(0, b.stock) : 0);

  // Zdjecia leza w repozytorium, wiec baza trzyma tylko sciezki. Pilnujemy ich
  // tutaj, zeby zla sciezka nie doszla do odcisku katalogu i nie zatrzymala
  // budowania strony dopiero przy wdrozeniu.
  // Podkategoria musi pasowac do dzialu: to ona rysuje ikone na karcie
  // i buduje filtr nad lista, wiec zla wartosc byloby widac od razu w sklepie.
  const SUBCATEGORIES = { jewelry: ["women", "men", "pet"], studio: ["fdm", "msla", "co2", "fiber", "resin", "digital"] };
  const subcategory = b.subcategory || null;
  if (subcategory && !(SUBCATEGORIES[b.category] || []).includes(subcategory)) {
    return res.status(400).json({ error: `Podkategoria ${subcategory} nie pasuje do dzialu ${b.category || "(brak)"}` });
  }

  const images = Array.isArray(b.images) ? b.images.filter((s) => typeof s === "string") : [];
  if (images.length < 1 || images.length > 5) {
    return res.status(400).json({ error: "Produkt potrzebuje od 1 do 5 zdjec" });
  }
  // Bez `..` w sciezce. Dzis zdjecie trafia tylko do znacznika `img`, wiec
  // wyjscie z katalogu nic nie daje, ale ta sama sciezka pojedzie kiedys do
  // odczytu pliku albo do generatora miniatur i wtedy juz bedzie dawac.
  if (images.some((s) => !/^\/img\/[\w./-]+\.(webp|jpg|jpeg|png)$/i.test(s) || s.includes(".."))) {
    return res.status(400).json({ error: "Zdjecie musi byc sciezka /img/... do pliku w repozytorium" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (slug, kind, category, subcategory, offer, title, short, description, specs, note, images,
         price_grosze, weight_g, stock, lead_time_days, personalization, sort_order, status, license, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (slug) DO UPDATE SET
         kind = EXCLUDED.kind, category = EXCLUDED.category, subcategory = EXCLUDED.subcategory,
         offer = EXCLUDED.offer,
         title = EXCLUDED.title, short = EXCLUDED.short, description = EXCLUDED.description,
         specs = EXCLUDED.specs, note = EXCLUDED.note, images = EXCLUDED.images, price_grosze = EXCLUDED.price_grosze,
         weight_g = EXCLUDED.weight_g, stock = EXCLUDED.stock, lead_time_days = EXCLUDED.lead_time_days,
         personalization = EXCLUDED.personalization, sort_order = EXCLUDED.sort_order,
         status = EXCLUDED.status, license = EXCLUDED.license, notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING id, slug`,
      [slug, kind, b.category || null, subcategory,
       b.offer === "personalized" ? "personalized" : "ready",
       JSON.stringify(b.title), b.short ? JSON.stringify(b.short) : null,
       b.description ? JSON.stringify(b.description) : null, b.specs ? JSON.stringify(b.specs) : null,
       b.note ? JSON.stringify(b.note) : null,
       JSON.stringify(images),
       b.priceGrosze, Number.isInteger(b.weightG) ? b.weightG : null, stock,
       Number.isInteger(b.leadTimeDays) ? b.leadTimeDays : 2,
       b.personalization ? JSON.stringify(b.personalization) : null,
       Number.isInteger(b.sortOrder) ? b.sortOrder : 100,
       status, b.license || null, b.notes || null]
    );
    // Historie dopisujemy tylko przy realnej zmianie ceny, zeby zapisanie
    // opisu produktu nie tworzylo wpisu udajacego zmiane cennika.
    await pool.query(
      `INSERT INTO product_price_history (product_id, price_grosze)
       SELECT $1, $2
        WHERE NOT EXISTS (
          SELECT 1 FROM product_price_history h
           WHERE h.product_id = $1
           ORDER BY h.changed_at DESC LIMIT 1
        ) OR (
          SELECT h.price_grosze FROM product_price_history h
           WHERE h.product_id = $1
           ORDER BY h.changed_at DESC LIMIT 1
        ) <> $2`,
      [rows[0].id, b.priceGrosze]
    ).catch((e) => console.error("[produkty] historia ceny:", e.message));

    res.json({ ok: true, product: rows[0] });
  } catch (e) {
    console.error("[produkty] zapis:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac produktu" });
  }
});

/** Korekta samego stanu magazynowego, bez przepisywania calego produktu. */
app.patch("/api/products/:slug/stock", express.json({ limit: "4kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const { stock } = req.body || {};
  if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ error: "Stan musi byc liczba nieujemna" });
  const { rows } = await pool.query(
    `UPDATE products SET stock = $2, updated_at = NOW()
      WHERE slug = $1 AND stock IS NOT NULL RETURNING slug, stock`,
    [String(req.params.slug || ""), stock]
  );
  if (!rows[0]) return res.status(404).json({ error: "Produkt nie istnieje albo jest cyfrowy" });
  res.json({ ok: true, ...rows[0] });
});

/**
 * Zmiana stanu pozycji. Osobno od pelnego zapisu, bo to najczestsza zmiana
 * w panelu i musi byc jednym kliknieciem: rzecz sprzedana na Etsy albo na
 * miejscu ma przestac byc do kupienia natychmiast, bez czekania na wdrozenie.
 * Sklep pyta o dostepnosc na zywo, wiec skutek widac od razu.
 */
app.patch("/api/products/:slug/status", express.json({ limit: "4kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const status = req.body?.status;
  if (!PRODUCT_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Stan musi byc jednym z: ${PRODUCT_STATUSES.join(", ")}` });
  }
  const { rows } = await pool.query(
    `UPDATE products SET status = $2, updated_at = NOW() WHERE slug = $1 RETURNING slug, status, active`,
    [String(req.params.slug || ""), status]
  );
  if (!rows[0]) return res.status(404).json({ error: "Produkt nie istnieje" });
  res.json({ ok: true, ...rows[0] });
});

/** Lista dla panelu: takze pozycje wylaczone, razem z rezerwacjami. */
app.get("/api/admin/products", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const { rows } = await pool.query(
    // `lowest_30d` to najnizsza cena z ostatnich 30 dni. Przy ogloszonej obnizce
    // trzeba ja podac obok ceny promocyjnej, wiec panel pokazuje ja od reki,
    // zamiast zmuszac do liczenia z pamieci.
    `SELECT p.slug, p.kind, p.category, p.subcategory, p.offer, p.title, p.short, p.images,
            p.price_grosze, p.weight_g, p.stock, p.status, p.lead_time_days,
            p.sold_count, p.sort_order, p.notes, p.updated_at, a.reserved, a.available,
            LEAST(
              p.price_grosze,
              COALESCE((SELECT MIN(h.price_grosze) FROM product_price_history h
                         WHERE h.product_id = p.id AND h.changed_at > NOW() - INTERVAL '30 days'),
                       p.price_grosze)
            ) AS lowest_30d
       FROM products p LEFT JOIN product_availability a ON a.id = p.id
      ORDER BY p.status = 'live' DESC, p.sort_order, p.slug`
  );
  res.json({ products: rows });
});

// ------------------------------------------------------------
// Kody rabatowe
// ------------------------------------------------------------

/**
 * Podglad w kasie. Klient ma zobaczyc kwote znizki, zanim zamowi, i ten sam
 * powod odmowy co przy zamowieniu, zamiast dowiadywac sie o wygasnieciu kodu
 * dopiero przy platnosci. Kwota nigdy nie pochodzi z przegladarki.
 */
// Liczniki kodow rabatowych stoja WYZEJ, przy szukaniu oferty, bo strona
// oferty uzywa ich wczesniej w tym pliku. Deklaracja w tym miejscu byla
// martwa strefa czasowa `const`: rejestracja trasy oferty siegala po nazwe,
// ktora powstawala dopiero tysiac linii nizej, wiec caly modul wywalal sie
// przy starcie.

app.post("/api/discounts/check", express.json({ limit: "16kb" }),
  limitBy(discountCheckLimit, extractIP, { error: "Za duzo prob z kodem, sprobuj za chwile" }),
  async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const ip = extractIP(req);
  // Wyczerpanie puli nietrafien konczy zabawe na godzine. Odpowiadamy tak samo
  // jak na kod nieznany, bo inaczej sam komunikat mowilby zgadujacemu, ze jest
  // na tropie czegos, co istnieje.
  if (discountMissLimit.remaining(ip) <= 0) {
    return res.status(400).json({ error: "Nie znamy takiego kodu", code: "not_found" });
  }
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  // Same kwoty pozycji sa tu tylko podgladem. Przy skladaniu zamowienia
  // liczymy je od nowa z katalogu i z kalkulatora, wiec podstawiona kwota
  // niczego nie daje poza ladniejsza liczba na ekranie przez chwile.
  const clean = items
    .map((i) => ({
      lineGrosze: Number.isInteger(i.lineGrosze) ? Math.max(0, i.lineGrosze) : 0,
      source: i.source === "product" ? "product" : "service",
      category: i.category === "jewelry" ? "jewelry" : "studio",
    }))
    .filter((i) => i.lineGrosze > 0);
  if (!clean.length) return res.status(400).json({ error: "Koszyk jest pusty", code: "empty_cart" });

  try {
    const preview = await previewDiscount(pool, {
      code: req.body?.code,
      email: req.body?.email,
      items: clean,
    });
    res.json({ ok: true, ...preview });
  } catch (e) {
    if (e instanceof DiscountError) {
      // Karzemy wylacznie za kod, ktorego nie ma. Kod wygasly, wyczerpany albo
      // za maly na ten koszyk to zwykle zycie klienta, nie zgadywanie.
      if (e.code === "not_found") discountMissLimit.penalize(ip);
      return res.status(400).json({ error: e.message, code: e.code, minGrosze: e.minGrosze });
    }
    console.error("[rabaty] sprawdzenie kodu:", e.message);
    res.status(500).json({ error: "Nie udalo sie sprawdzic kodu" });
  }
});

/**
 * Kod powitalny dla zapisujacych sie do newslettera. Wola go przeplyw w n8n,
 * ktory wysyla maila, i wstawia otrzymany kod do tresci. Obietnica ze strony
 * ("wyslemy kod 10% na pierwsze zamowienie") zaczyna dzialac sama, bez reki
 * czlowieka przy kazdym zapisie.
 *
 * Powtarzalne: drugi zapis tym samym adresem oddaje ten sam kod, zamiast
 * rozdawac kolejne. Inaczej wystarczyloby zapisac sie piec razy.
 */
app.post("/api/discounts/welcome", express.json({ limit: "4kb" }), async (req, res) => {
  if (!requireSecret(req, res, "x-newsletter-token", "NEWSLETTER_CODE_TOKEN")) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Nieprawidlowy adres e-mail" });

  const percent = Number.isInteger(req.body?.percent) ? Math.min(req.body.percent, MAX_PERCENT) : 10;
  const days = Number.isInteger(req.body?.days) ? Math.min(Math.max(req.body.days, 7), 365) : 90;

  try {
    const { rows: existing } = await pool.query(
      `SELECT code, valid_to FROM discount_codes
        WHERE campaign = 'newsletter' AND issued_to = $1 AND active = TRUE AND used_count = 0
          AND (valid_to IS NULL OR valid_to > NOW())
        ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (existing[0]) return res.json({ ok: true, reused: true, code: existing[0].code, percent, validTo: existing[0].valid_to });

    // Kolizja losowania jest skrajnie rzadka, ale kosztuje jedno powtorzenie,
    // a nie odmowe wyslania maila, wiec probujemy kilka razy.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode("AEJ10");
      const { rows } = await pool.query(
        `INSERT INTO discount_codes
           (code, kind, value, applies_to, max_uses, max_uses_per_email, valid_to, campaign, issued_to, note)
         VALUES ($1, 'percent', $2, 'all', 1, 1, NOW() + ($3 || ' days')::INTERVAL, 'newsletter', $4, $5)
         ON CONFLICT (code) DO NOTHING
         RETURNING code, valid_to`,
        [code, percent, String(days), email, `Kod powitalny, zapis ${new Date().toISOString().slice(0, 10)}`]
      );
      if (rows[0]) return res.json({ ok: true, reused: false, code: rows[0].code, percent, validTo: rows[0].valid_to });
    }
    res.status(500).json({ error: "Nie udalo sie wylosowac kodu" });
  } catch (e) {
    console.error("[rabaty] kod powitalny:", e.message);
    res.status(500).json({ error: "Nie udalo sie wystawic kodu" });
  }
});

/** Lista dla panelu, razem z liczba uzyc i rezerwacji w toku. */
app.get("/api/admin/discounts", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const { rows } = await pool.query(
    `SELECT c.*,
            (SELECT COUNT(*)::INTEGER FROM discount_redemptions r
              WHERE r.code_id = c.id AND r.released_at IS NULL AND r.consumed_at IS NULL
                AND r.expires_at > NOW()) AS pending,
            (SELECT COALESCE(SUM(r.amount_grosze), 0)::INTEGER FROM discount_redemptions r
              WHERE r.code_id = c.id AND r.consumed_at IS NOT NULL) AS granted_grosze
       FROM discount_codes c
      ORDER BY c.active DESC, c.created_at DESC
      LIMIT 500`
  );
  res.json({ codes: rows });
});

/**
 * Tworzenie kodow. Jedno wywolanie robi albo jeden kod o zadanej nazwie
 * (akcja), albo paczke kodow osobistych z losowa koncowka: wreczenie
 * dwudziestu roznych kodow ma byc jedna czynnoscia, a nie dwudziestoma.
 */
app.post("/api/admin/discounts", express.json({ limit: "16kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const b = req.body || {};
  const kind = b.kind === "amount" ? "amount" : "percent";
  const value = Number(b.value);
  if (!Number.isInteger(value) || value <= 0) return res.status(400).json({ error: "Wartosc musi byc liczba calkowita wieksza od zera" });
  if (kind === "percent" && value > MAX_PERCENT) return res.status(400).json({ error: `Procent nie moze przekroczyc ${MAX_PERCENT}` });
  const appliesTo = APPLIES_TO.includes(b.appliesTo) ? b.appliesTo : "all";

  const count = Number.isInteger(b.count) ? Math.min(Math.max(b.count, 1), 200) : 1;
  const single = String(b.code || "").trim();
  if (count > 1 && single) return res.status(400).json({ error: "Paczka kodow losuje nazwy, wiec nie podawaj wlasnej" });
  if (count === 1 && !single) return res.status(400).json({ error: "Podaj nazwe kodu albo liczbe kodow do wygenerowania" });

  const codes = count > 1
    ? Array.from({ length: count }, () => randomCode(b.prefix || "AEJ"))
    : [normalizeCode(single)];

  const created = [];
  try {
    for (const code of codes) {
      const { rows } = await pool.query(
        `INSERT INTO discount_codes
           (code, kind, value, applies_to, min_order_grosze, max_uses, max_uses_per_email,
            valid_from, valid_to, campaign, issued_to, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (code) DO NOTHING
         RETURNING code`,
        [code, kind, value, appliesTo,
         Number.isInteger(b.minOrderGrosze) ? b.minOrderGrosze : 0,
         Number.isInteger(b.maxUses) ? b.maxUses : (count > 1 ? 1 : null),
         Number.isInteger(b.maxUsesPerEmail) ? b.maxUsesPerEmail : 1,
         b.validFrom || null, b.validTo || null,
         b.campaign || null, b.issuedTo || null, b.note || null]
      );
      if (rows[0]) created.push(rows[0].code);
    }
  } catch (e) {
    console.error("[rabaty] tworzenie kodu:", e.message);
    return res.status(400).json({ error: "Nie udalo sie zapisac kodu" });
  }

  if (!created.length) return res.status(409).json({ error: "Taki kod juz istnieje", code: "duplicate" });
  res.json({ ok: true, codes: created });
});

/**
 * Skasowanie kodu. Wolno tylko wtedy, gdy nikt go jeszcze nie uzyl: kod
 * z historia stoi za kwota na czyims zamowieniu i skasowany zostawilby
 * rabat, ktorego juz nie da sie wytlumaczyc. Uzyte kody sie wylacza, nie kasuje.
 */
app.delete("/api/admin/discounts/:code", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const code = normalizeCode(req.params.code);
  const { rows } = await pool.query(
    `SELECT c.id, c.used_count,
            (SELECT COUNT(*)::INTEGER FROM discount_redemptions r
              WHERE r.code_id = c.id AND r.consumed_at IS NOT NULL) AS consumed
       FROM discount_codes c WHERE c.code = $1`,
    [code]
  );
  if (!rows[0]) return res.status(404).json({ error: "Nie znamy takiego kodu" });
  if (rows[0].used_count > 0 || rows[0].consumed > 0) {
    return res.status(409).json({
      error: "Ten kod byl juz uzyty, wiec zostaje w bazie razem z historia. Wylacz go zamiast kasowac.",
      code: "already_used",
    });
  }
  // Rezerwacje w toku znikaja razem z kodem: dotycza nieoplaconych zamowien,
  // ktore i tak straca znizke, a zamowienie zostaje ze swoja kwota.
  await pool.query(`DELETE FROM discount_codes WHERE id = $1`, [rows[0].id]);
  res.json({ ok: true, deleted: code });
});

/** Wylaczenie albo wlaczenie kodu. Kod zostaje w bazie razem z historia uzyc. */
/**
 * Poprawienie kodu. Przyjmuje POJEDYNCZE pola, wiec przelacznik "aktywny"
 * z listy dalej wysyla samo `{active}` i dziala tak jak dotad.
 *
 * TRZECH RZECZY NIE WOLNO RUSZYC, i to nie jest ostroznosc na wyrost:
 *
 *   - `code` jest juz w rekach klientow i stoi przy zamowieniach. Zmiana
 *     nazwy zostawilaby rabat, ktorego nie da sie powiazac z niczym.
 *   - `used_count` jest ZAPISEM TEGO, CO SIE STALO. Licznik poprawiany reka
 *     przestaje byc dowodem, a zaczyna byc opinia.
 *   - `created_at` z tego samego powodu.
 *
 * Zejscie z limitem PONIZEJ liczby juz wykorzystanych uzyc jest odrzucane.
 * Kod robilby sie wtedy martwy, wygladajac na aktywny, a od zatrzymania kodu
 * jest przelacznik "aktywny", ktory mowi to wprost.
 */
app.patch("/api/admin/discounts/:code", express.json({ limit: "4kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const b = req.body || {};
  const code = normalizeCode(req.params.code);

  const { rows: obecne } = await pool.query(
    "SELECT id, kind, value, used_count FROM discount_codes WHERE code = $1", [code]
  );
  if (!obecne[0]) return res.status(404).json({ error: "Nie znamy takiego kodu" });

  const pola = [];
  const wartosci = [code];
  const dopisz = (kolumna, wartosc) => {
    wartosci.push(wartosc);
    pola.push(`${kolumna} = $${wartosci.length}`);
  };

  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") return res.status(400).json({ error: "Pole active musi byc true albo false" });
    dopisz("active", b.active);
  }

  // Rodzaj i wartosc chodza para: procent ma inny zakres niz kwota, wiec
  // sprawdzamy je razem, a nie kazde z osobna.
  const kind = b.kind === undefined ? obecne[0].kind : (b.kind === "amount" ? "amount" : "percent");
  if (b.kind !== undefined) dopisz("kind", kind);
  if (b.value !== undefined) {
    const value = Number(b.value);
    if (!Number.isInteger(value) || value <= 0) return res.status(400).json({ error: "Wartosc musi byc liczba calkowita wieksza od zera" });
    if (kind === "percent" && value > MAX_PERCENT) return res.status(400).json({ error: `Procent nie moze przekroczyc ${MAX_PERCENT}` });
    dopisz("value", value);
  }
  if (b.appliesTo !== undefined) {
    if (!APPLIES_TO.includes(b.appliesTo)) return res.status(400).json({ error: "Nieznany zakres kodu" });
    dopisz("applies_to", b.appliesTo);
  }
  if (b.minOrderGrosze !== undefined) {
    const v = Number(b.minOrderGrosze);
    if (!Number.isInteger(v) || v < 0) return res.status(400).json({ error: "Prog zamowienia nie moze byc ujemny" });
    dopisz("min_order_grosze", v);
  }
  if (b.maxUses !== undefined) {
    if (b.maxUses === null) dopisz("max_uses", null);
    else {
      const v = Number(b.maxUses);
      if (!Number.isInteger(v) || v <= 0) return res.status(400).json({ error: "Limit uzyc musi byc liczba wieksza od zera" });
      if (v < obecne[0].used_count) {
        return res.status(400).json({ error: `Kod wykorzystano juz ${obecne[0].used_count} razy. Zeby go zatrzymac, wylacz go zamiast schodzic z limitem.` });
      }
      dopisz("max_uses", v);
    }
  }
  if (b.maxUsesPerEmail !== undefined) {
    const v = Number(b.maxUsesPerEmail);
    if (!Number.isInteger(v) || v <= 0) return res.status(400).json({ error: "Limit na adres musi byc liczba wieksza od zera" });
    dopisz("max_uses_per_email", v);
  }
  if (b.validFrom !== undefined) dopisz("valid_from", b.validFrom || null);
  if (b.validTo !== undefined) dopisz("valid_to", b.validTo || null);
  if (b.campaign !== undefined) dopisz("campaign", b.campaign || null);
  if (b.issuedTo !== undefined) dopisz("issued_to", b.issuedTo || null);
  if (b.note !== undefined) dopisz("note", b.note || null);

  if (!pola.length) return res.status(400).json({ error: "Nie podano zadnego pola do zmiany" });

  try {
    const { rows } = await pool.query(
      `UPDATE discount_codes SET ${pola.join(", ")}, updated_at = NOW()
        WHERE code = $1 RETURNING code, active, kind, value`,
      wartosci
    );
    res.json({ ok: true, ...rows[0] });
  } catch (e) {
    // Ograniczenia CHECK w tabeli sa druga linia obrony i maja pierwszenstwo
    // przed naszym sprawdzeniem, bo pilnuja takze zapisow spoza panelu.
    console.error("[rabaty] poprawka kodu:", e.message);
    res.status(400).json({ error: "Nie udalo sie zapisac zmiany" });
  }
});

// ------------------------------------------------------------
// Reczne potwierdzenie wplaty
// ------------------------------------------------------------
// Przelew nie ma ITN, wiec jedynym dowodem wplywu jest wyciag bankowy, ktory
// oglada czlowiek. Ten endpoint jest odpowiednikiem SUCCESS z bramki: ustawia
// oplacenie, wysyla te same maile i przenosi pliki do Zamowien. Wolno go
// wykonac raz, bo pilnuje tego fulfilled_at.
const TRANSFER_TOLERANCE = 0.98;

// ------------------------------------------------------------
// KOLEJKA PRACOWNI
// ------------------------------------------------------------
// Zamowienie oplacone nie mialo dalszego ciagu. Status `paid` zostawal na nim
// na zawsze, wiec pytanie "co jest dzisiaj do zrobienia i co czeka najdluzej"
// odpowiadala skrzynka mailowa i pamiec. Zamowienia z oferty tylko to zaostrzyly,
// bo przychodza spoza sklepu i nie maja nawet watku w koszyku.
//
// Kolejnosc jest jedna i nie podlega negocjacji: KTO PIERWSZY ZAPLACIL.
// Sortujemy po dacie zaplaty, a nie po dacie zlozenia, bo zlozenie bez zaplaty
// nie rezerwuje czasu pracowni.

app.get("/api/orders/queue", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  // Domyslnie kolejka pokazuje to, co jeszcze czeka na prace. `?status=`
  // pozwala siegnac po zakonczone i anulowane, bo inaczej omylkowe kliknieciecie
  // "zrobione" znika z ekranu i nie ma czego poprawic.
  const DOZWOLONE_STANY = ["paid", "details", "queued", "in_production", "ready", "shipped", "completed", "cancelled"];
  const zadane = String(req.query.status || "").split(",").map((x) => x.trim()).filter(Boolean);
  const stany = zadane.length
    ? zadane.filter((x) => DOZWOLONE_STANY.includes(x))
    // Ustalanie szczegolow i "zrealizowane" stoja w domyslnym widoku, bo to
    // wlasnie one czekaja na RUCH Z NASZEJ STRONY. Zlecenie w ustalaniu nie ma
    // nawet zegara, wiec pominiete tutaj nie odezwaloby sie znikad.
    : ["paid", "details", "queued", "in_production", "ready"];
  if (!stany.length) return res.status(400).json({ error: "Nie znamy takiego stanu" });

  // Sortowanie z BIALEJ LISTY, a nie z parametru wstawionego do zapytania:
  // `ORDER BY` nie przyjmuje parametru wiazanego, wiec przepisany wprost
  // bylby wstrzyknieciem, i to takim, ktore przechodzi przez panel.
  //
  // Domyslnie od najnowszej wplaty (decyzja wlasciciela, 2026-08-29).
  // "Po terminie" stoi obok jednym kliknieciem, bo to ono odpowiada na
  // pytanie, po ktore sie tu wchodzi: co przypali sie najpredzej.
  const SORTOWANIA = {
    newest: "o.paid_at DESC NULLS LAST",
    oldest: "o.paid_at ASC NULLS LAST",
    deadline: "o.deadline_at ASC NULLS LAST, o.paid_at ASC",
    amount: "o.total_grosze DESC",
    name: "o.customer_name ASC NULLS LAST",
  };
  const sort = Object.hasOwn(SORTOWANIA, String(req.query.sort || "")) ? String(req.query.sort) : "newest";

  const { rows } = await pool.query(
    `SELECT o.id, o.order_ref, o.status, o.kind, o.lang, o.total_grosze,
            o.customer_email, o.customer_name, o.customer_phone,
            o.delivery_method, o.delivery_point, o.address_line1, o.address_line2,
            o.postal_code, o.city, o.country,
            o.paid_at, o.queued_at, o.production_started_at, o.shipped_at, o.details_at, o.ready_at,
            o.tracking_number, o.production_note,
            o.lead_days, o.deadline_at, o.requires_details, o.lead_days_agreed_at, o.access_token,
            (SELECT q.quote_ref FROM quotes q WHERE q.converted_order_id = o.id) AS quote_ref
       FROM orders o
      WHERE o.status = ANY($1::text[])
      ORDER BY ${SORTOWANIA[sort]}
      LIMIT 200`,
    [stany]
  );
  if (!rows.length) return res.json({ ok: true, orders: [], counts: {} });

  const { rows: pozycje } = await pool.query(
    `SELECT id, order_id, title, qty, calculator, file_name, file_url, params,
            requires_details, details_settled_at, details_note
       FROM order_items WHERE order_id = ANY($1::bigint[]) ORDER BY id`,
    [rows.map((o) => o.id)]
  );
  const wgOrder = new Map();
  for (const p of pozycje) {
    const klucz = String(p.order_id);
    if (!wgOrder.has(klucz)) wgOrder.set(klucz, []);
    wgOrder.get(klucz).push({
      id: Number(p.id),
      title: p.title, qty: p.qty, calculator: p.calculator,
      fileName: p.file_name, fileUrl: p.file_url,
      // Ustalenia stoja przy pozycji: zegar zamowienia rusza dopiero wtedy,
      // gdy domkniete sa wszystkie, ktore ich wymagaly.
      requiresDetails: p.requires_details === true,
      detailsSettledAt: p.details_settled_at,
      detailsNote: p.details_note || null,
      // Opis od klienta bywa jedynym zdaniem mowiacym, co ma powstac, gdy
      // pozycja nie ma pliku. Siedzi w parametrach, wiec go stamtad wyjmujemy.
      description: p.params?.description ?? null,
    });
  }

  const dni = (od) => (od ? Math.floor((Date.now() - new Date(od).getTime()) / 86400_000) : null);
  const orders = rows.map((o) => ({
    orderRef: o.order_ref,
    quoteRef: o.quote_ref,
    status: o.status,
    kind: o.kind,
    lang: o.lang,
    name: o.customer_name,
    email: o.customer_email,
    phone: o.customer_phone,
    totalPLN: (o.total_grosze / 100).toFixed(2),
    // Termin i ile do niego zostalo. Liczy SERWER, tak samo jak dla klienta:
    // dwa miejsca liczace to samo znaczylyby panel pokazujacy inna liczbe dni
    // niz strona zamowienia, przy tym samym zleceniu.
    leadDays: o.lead_days != null ? Number(o.lead_days) : null,
    deadlineAt: o.deadline_at ? String(o.deadline_at).slice(0, 10) : null,
    daysLeft: dniDoTerminu(o.deadline_at),
    requiresDetails: o.requires_details === true,
    leadDaysAgreedAt: o.lead_days_agreed_at ? String(o.lead_days_agreed_at).slice(0, 10) : null,
    // Zeton dostepu do strony zamowienia. Panel sklada z niego ten sam adres,
    // ktory klient dostal mailem po zaplacie, zeby dalo sie go wyslac ponownie
    // bez szukania w skrzynce.
    accessToken: o.access_token,
    detailsAt: o.details_at,
    queuedAt: o.queued_at,
    readyAt: o.ready_at,
    paidAt: o.paid_at,
    waitingDays: dni(o.paid_at),
    productionStartedAt: o.production_started_at,
    shippedAt: o.shipped_at,
    trackingNumber: o.tracking_number,
    productionNote: o.production_note,
    delivery: {
      method: o.delivery_method, point: o.delivery_point,
      addressLine1: o.address_line1, addressLine2: o.address_line2,
      postalCode: o.postal_code, city: o.city, country: o.country,
    },
    items: wgOrder.get(String(o.id)) || [],
  }));

  const counts = orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {});
  res.json({ ok: true, orders, counts, sort });
});

/**
 * Pchniecie zamowienia o jeden etap pracy.
 *
 * Przejscia sa wypisane, a nie dowolne. Bez tego jedno klikniecie w zlym
 * wierszu robilo z zamowienia nieoplaconego zamowienie wyslane, i nikt by tego
 * nie zauwazyl, bo zadna kwota by sie nie zmienila.
 */
app.post("/api/orders/:ref/production", express.json({ limit: "8kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const etap = String(req.body?.stage || "");
  if (!znanyEtap(etap)) return res.status(400).json({ error: "Nie znamy takiego etapu", code: "bad_stage" });

  const ref = String(req.params.ref || "");
  const { rows } = await pool.query("SELECT id, status FROM orders WHERE order_ref = $1", [ref]);
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Zamowienie nie istnieje" });

  const regula = przejscie(order.status, etap);
  if (!regula.ok) {
    return res.status(409).json({
      error: `Zamowienie ma status ${order.status}, a do "${etap}" wchodzi sie z: ${ETAPY_PRACY[etap].z.join(", ")}`,
      code: regula.powod,
    });
  }

  const numer = req.body?.trackingNumber ? String(req.body.trackingNumber).trim().slice(0, 64) : null;
  const notatka = req.body?.note ? String(req.body.note).slice(0, 2000) : null;
  // Data wysylki podana z reki, bo paczka bywa nadana wczoraj, a zaznaczona
  // dzisiaj. Bez tego termin realizacji wygladalby na przekroczony o dzien.
  const dzien = String(req.body?.shippedOn || "").trim();
  if (dzien && !/^\d{4}-\d{2}-\d{2}$/.test(dzien)) {
    return res.status(400).json({ error: "Date wysylki podaj jako RRRR-MM-DD", code: "bad_date" });
  }

  // Wejscie w etap z zegarem stempluje termin. Liczymy go OD TERAZ, a nie od
  // zaplaty: zlecenie stojace tydzien w ustalaniu szczegolow ma pelny termin
  // od chwili, w ktorej naprawde ruszylo.
  const rusza = etap === ETAP_STARTU_ZEGARA;

  // Warunek na statusie powtorzony w samym UPDATE, bo miedzy odczytem a zapisem
  // ktos moze anulowac zamowienie w drugiej zakladce.
  const zmiana = await pool.query(
    `UPDATE orders
        SET status = $2,
            ${regula.pole} = COALESCE(${regula.pole}, $6::timestamptz, NOW()),
            tracking_number = COALESCE($3, tracking_number),
            production_note = COALESCE($4, production_note)
            ${rusza ? ", deadline_at = COALESCE(deadline_at, (COALESCE($6::timestamptz, NOW()) + (lead_days || ' days')::interval)::date)" : ""}
      WHERE id = $1 AND status = ANY($5::text[])
      RETURNING status, ${regula.pole} AS stempel, deadline_at`,
    [order.id, etap, numer, notatka, regula.z, dzien || null]
  );
  if (!zmiana.rowCount) {
    return res.status(409).json({ error: "Stan zamowienia zmienil sie w miedzyczasie", code: "state_changed" });
  }

  console.log(`[kolejka] ${ref}: ${order.status} -> ${etap}${numer ? `, list przewozowy ${numer}` : ""}`);
  // Powiadomienie idzie WYLACZNIE na zyczenie pracowni. Automat przy kazdej
  // zmianie zamienilby skrzynke klienta w dziennik naszej pracy, a przy
  // cofnieciu omylkowego klikniecia wysylalby sprostowanie czegos, o czym
  // klient nie zdazyl sie dowiedziec. Nie czekamy na wysylke: etap jest juz
  // zapisany i nieudany mail nie ma prawa cofnac pracy.
  const powiadom = req.body?.notify === true || req.body?.notify === "1";
  if (powiadom) {
    sendStatusUpdate(pool, order.id)
      .then((poszlo) => console.log(`[etap] ${ref}: powiadomienie klienta ${poszlo ? "wyslane" : "NIE poszlo"}`))
      .catch((e) => console.error("[etap] powiadomienie:", e.message));
  }
  res.json({
    ok: true, orderRef: ref, status: zmiana.rows[0].status, at: zmiana.rows[0].stempel,
    deadlineAt: zmiana.rows[0].deadline_at || null,
  });
});

/**
 * Poprawienie wiersza kolejki: numer przesylki, notatka i korekta etapu.
 *
 * Osobno od `/production`, bo tamto PCHA zamowienie naprzod wedlug wypisanych
 * przejsc, a to poprawia pomylke. Korekta nie jest furtka: `korekta()` wpuszcza
 * wylacznie zamowienie, ktore juz jest oplacone, i przy cofnieciu czysci
 * stemple etapow, ktore przestaly byc prawda. Zamowienie cofniete z "wyslane"
 * nie moze dalej niesc daty wysylki, bo nic nie wyjechalo.
 */
app.post("/api/orders/:ref/queue", express.json({ limit: "8kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.params.ref || "");
  const { rows } = await pool.query(
    "SELECT id, status, lead_days, deadline_at, lead_days_agreed_at FROM orders WHERE order_ref = $1", [ref]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Zamowienie nie istnieje" });

  const etap = req.body?.stage ? String(req.body.stage) : null;
  // Puste pole znaczy "wyczysc", brak pola znaczy "nie ruszaj". Bez tego
  // rozroznienia nie da sie skasowac blednego numeru przesylki.
  const numer = req.body?.trackingNumber === undefined
    ? undefined
    : String(req.body.trackingNumber || "").trim().slice(0, 64) || null;
  const notatka = req.body?.note === undefined
    ? undefined
    : String(req.body.note || "").slice(0, 2000) || null;

  // Liczba dni i data terminu. Obie do poprawienia, bo obie bywaja bledne
  // z innego powodu: liczba wpisana w ofercie na oko, data przesunieta
  // ustaleniem z klientem po fakcie.
  let dni;
  if (req.body?.leadDays !== undefined) {
    const surowe = String(req.body.leadDays ?? "").trim();
    if (surowe === "") {
      dni = null;
    } else {
      const n = Number(surowe);
      if (!Number.isInteger(n) || n < 1 || n > 365) {
        return res.status(400).json({ error: "Termin podaj w dniach, od 1 do 365", code: "bad_lead" });
      }
      dni = n;
    }
  }
  // Data ustalenia nowego terminu z klientem. Zmiana liczby dni po zaplacie
  // jest ZMIANA UMOWY, a nie poprawka literowki, wiec musi niesc date, kiedy
  // klient sie na to zgodzil. Bez niej za pol roku nikt tego nie odtworzy.
  let ustalonoDnia;
  if (req.body?.leadDaysAgreedAt !== undefined) {
    const surowa = String(req.body.leadDaysAgreedAt || "").trim();
    if (surowa && !/^\d{4}-\d{2}-\d{2}$/.test(surowa)) {
      return res.status(400).json({ error: "Date ustalenia podaj jako RRRR-MM-DD", code: "bad_date" });
    }
    ustalonoDnia = surowa || null;
  }

  let termin;
  if (req.body?.deadlineAt !== undefined) {
    const surowa = String(req.body.deadlineAt || "").trim();
    if (surowa && !/^\d{4}-\d{2}-\d{2}$/.test(surowa)) {
      return res.status(400).json({ error: "Termin podaj jako RRRR-MM-DD", code: "bad_date" });
    }
    termin = surowa || null;
  }

  // Znacznik ustalen zamraza sie przy zaplacie, ale zamowienia sprzed jego
  // wprowadzenia go nie maja, a zdarza sie tez, ze rzecz wymagajaca rozmowy
  // przeszla przez oferte bez znacznika. Bez mozliwosci poprawienia go tutaj
  // takie zlecenie na zawsze mowiloby "ustalenia nie byly wymagane".
  const ustalenia = req.body?.requiresDetails === undefined
    ? undefined
    : req.body.requiresDetails === true || req.body.requiresDetails === "true" || req.body.requiresDetails === "on";

  // Ktore z dwoch pol terminu operator naprawde ruszyl. Panel przysyla oba
  // przy kazdym zapisie, wiec sama ich obecnosc niczego nie znaczy.
  const terminWBazie = order.deadline_at ? String(order.deadline_at).slice(0, 10) : null;
  const dataZmieniona = termin !== undefined && termin !== terminWBazie;
  const dniZmienione = dni !== undefined && dni !== (order.lead_days == null ? null : Number(order.lead_days));

  // Przypisania trzymamy POD NAZWA KOLUMNY, a nie w plaskiej liscie. Postgres
  // odrzuca `SET a = 1, a = 2` bledem i to dopiero w bazie, wiec lista
  // pozwalala zlozyc zapytanie, ktore nie ma prawa sie wykonac: korekta etapu
  // z "wyslane" kasuje list przewozowy, a formularz panelu przysyla go przy
  // kazdym zapisie, wiec kazde takie cofniecie konczylo sie bledem 500.
  // Przy dwoch zapisach do tej samej kolumny wygrywa PoZNIEJSZY.
  const pola = new Map();
  const wartosci = [order.id];
  const ustaw = (kolumna, wyrazenie) => pola.set(kolumna, `${kolumna} = ${wyrazenie}`);
  const parametr = (v) => { wartosci.push(v); return `$${wartosci.length}`; };
  let czyszczone = [];

  if (etap) {
    const regula = korekta(order.status, etap);
    if (!regula.ok) {
      return res.status(409).json({
        error: regula.powod === "no_change"
          ? `Zamowienie juz ma etap ${etap}`
          : `Nie da sie poprawic zamowienia ze stanu ${order.status} na ${etap}`,
        code: regula.powod,
      });
    }
    ustaw("status", parametr(etap));
    const pole = ETAPY_PRACY[etap]?.pole;
    if (pole) ustaw(pole, `COALESCE(${pole}, NOW())`);
    czyszczone = regula.doWyczyszczenia;
    for (const kolumna of czyszczone) {
      // `reminders_sent` jest NOT NULL i trzyma liste, wiec czysci sie do
      // listy pustej, a nie do NULL. Wpisanie NULL wywalilo by cala korekte
      // na ograniczeniu kolumny, i to dopiero w bazie.
      ustaw(kolumna, kolumna === "reminders_sent" ? "'[]'::jsonb" : "NULL");
    }
    // Cofniecie sprzed wysylki zabiera tez list przewozowy, bo nie ma czego
    // sledzic. Jawny numer w tym samym zadaniu i tak wygra, bo idzie nizej.
    if (czyszczone.includes("shipped_at")) ustaw("tracking_number", "NULL");
  }

  if (numer !== undefined) ustaw("tracking_number", parametr(numer));
  if (notatka !== undefined) ustaw("production_note", parametr(notatka));
  if (ustalenia !== undefined) ustaw("requires_details", parametr(ustalenia));
  if (ustalonoDnia !== undefined) ustaw("lead_days_agreed_at", `${parametr(ustalonoDnia)}::date`);
  // Cofniecie zlecenia przed etap z zegarem wygrywa z obiema droga do terminu.
  // Termin zostawiony przy zleceniu, ktore wrocilo do ustalen, bylby data
  // policzona z pracy, ktora sie jeszcze nie zaczela. Sprawdzamy to PRZED
  // wpisaniem czegokolwiek, bo parametr dolozony do zapytania i nieuzyty
  // w nim wywala cale zapytanie na "could not determine data type".
  const zegarWyzerowany = czyszczone.includes("deadline_at");

  if (dniZmienione) {
    // Daty ustalenia zadamy tylko wtedy, gdy termin robi sie DLUZSZY. To jest
    // jedyny kierunek, w ktorym klient cos traci, wiec jedyny, ktory trzeba
    // umiec uzasadnic za pol roku. Skrocenie terminu i wpisanie go tam, gdzie
    // go nie bylo, przechodza bez pytania: pierwsza wersja tej reguly zadala
    // daty przy KAZDEJ zmianie i przez to nie dalo sie poprawic wlasnej
    // literowki w liczbie dni, choc nikt niczego klientowi nie zabieral.
    const wydluzenie = dni !== null && order.lead_days != null && dni > Number(order.lead_days);
    if (wydluzenie && !ustalonoDnia && !order.lead_days_agreed_at) {
      return res.status(400).json({
        error: "Wydluzenie terminu wymaga daty ustalenia z klientem",
        code: "agreement_date_required",
      });
    }
    const n = parametr(dni);
    ustaw("lead_days", n);
    // Zmiana liczby dni przelicza termin OD CHWILI STARTU ZEGARA, a nie od
    // dzisiaj: inaczej poprawienie literowki w liczbie dni przesuwaloby date,
    // ktora klient juz dostal, o tyle, ile zlecenie zdazylo przelezec.
    // Zlecenie bez startu zegara terminu jeszcze nie ma i nie dostaje go tedy.
    if (dni !== null && !dataZmieniona && !zegarWyzerowany) {
      ustaw("deadline_at", `CASE
                     WHEN COALESCE(queued_at, production_started_at, paid_at) IS NULL THEN deadline_at
                     ELSE (COALESCE(queued_at, production_started_at, paid_at) + (${n} || ' days')::interval)::date
                   END`);
    }
  }
  // Data wpisana wprost wygrywa z przeliczona, bo jest decyzja, a nie wynikiem.
  if (dataZmieniona && !zegarWyzerowany) ustaw("deadline_at", `${parametr(termin)}::date`);

  const zmiany = [...pola.values()];
  if (!zmiany.length) return res.status(400).json({ error: "Nie ma czego zmienic", code: "no_change" });

  const zapis = await pool.query(
    `UPDATE orders SET ${zmiany.join(", ")}, updated_at = NOW()
      WHERE id = $1 AND status = $${wartosci.length + 1}
      RETURNING status, tracking_number, production_note, lead_days, deadline_at, requires_details, lead_days_agreed_at`,
    [...wartosci, order.status]
  );
  if (!zapis.rowCount) {
    return res.status(409).json({ error: "Stan zamowienia zmienil sie w miedzyczasie", code: "state_changed" });
  }

  console.log(`[kolejka] ${ref}: poprawka${etap ? ` ${order.status} -> ${etap}` : ""}${czyszczone.length ? `, wyczyszczone ${czyszczone.join(", ")}` : ""}`);
  if (etap && (req.body?.notify === true || req.body?.notify === "1")) {
    sendStatusUpdate(pool, order.id)
      .then((poszlo) => console.log(`[etap] ${ref}: powiadomienie klienta ${poszlo ? "wyslane" : "NIE poszlo"}`))
      .catch((e) => console.error("[etap] powiadomienie:", e.message));
  }
  res.json({
    ok: true,
    orderRef: ref,
    status: zapis.rows[0].status,
    trackingNumber: zapis.rows[0].tracking_number,
    productionNote: zapis.rows[0].production_note,
    leadDays: zapis.rows[0].lead_days,
    requiresDetails: zapis.rows[0].requires_details === true,
    deadlineAt: zapis.rows[0].deadline_at ? String(zapis.rows[0].deadline_at).slice(0, 10) : null,
    cleared: czyszczone,
  });
});

/**
 * Domkniecie albo cofniecie ustalen JEDNEJ pozycji zamowienia.
 *
 * Zegar zamowienia rusza dopiero wtedy, gdy domkniete sa ustalenia WSZYSTKICH
 * pozycji, ktore ich wymagaly (decyzja wlasciciela, 2026-08-30). Dlatego to
 * ta trasa, a nie osobny przycisk "ustalenia domkniete", przestawia zamowienie
 * z rozmowy do kolejki: dwa miejsca robiace to samo rozjechalyby sie przy
 * pierwszej pozycji, o ktorej ktos zapomni.
 *
 * Cofniecie dziala tak samo w druga strone i jest calym powodem, dla ktorego
 * zegar da sie zatrzymac: klient odzywa sie z uwaga po tym, jak uznalismy
 * temat za zamkniety, i termin liczony dalej bylby terminem na prace, ktorej
 * nie mozemy zaczac.
 */
app.post("/api/orders/:ref/items/:id/details", express.json({ limit: "4kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.params.ref || "");
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ error: "Zla pozycja", code: "bad_item" });
  }
  const domykamy = req.body?.settled !== false;
  // Tresc ustalenia. `undefined` znaczy "nie ruszaj", pusty napis kasuje.
  const notatka = req.body?.note === undefined
    ? undefined
    : String(req.body.note || "").slice(0, 500) || null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: zam } = await client.query(
      `SELECT id, status, lead_days FROM orders WHERE order_ref = $1 FOR UPDATE`, [ref]
    );
    const order = zam[0];
    if (!order) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Zamowienie nie istnieje" }); }

    // Poza tymi trzema stanami praca juz ruszyla albo zamowienie nie jest
    // oplacone. W obie strony poprawia sie to korekta etapu, nie tedy.
    if (!["paid", "details", "queued"].includes(order.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: `Zamowienie ma status ${order.status}, ustalenia domyka sie przed wzieciem do pracy`,
        code: "too_late",
      });
    }

    const { rows: poz } = await client.query(
      `SELECT id, requires_details, details_settled_at FROM order_items
        WHERE order_id = $1 ORDER BY id FOR UPDATE`, [order.id]
    );
    const pozycja = poz.find((i) => Number(i.id) === itemId);
    if (!pozycja) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Nie ma takiej pozycji" }); }
    if (pozycja.requires_details !== true) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ta pozycja nie wymaga ustalen", code: "not_required" });
    }

    await client.query(
      `UPDATE order_items
          SET details_settled_at = $2
              ${notatka === undefined ? "" : ", details_note = $3"}
        WHERE id = $1`,
      notatka === undefined ? [itemId, domykamy ? new Date() : null] : [itemId, domykamy ? new Date() : null, notatka]
    );

    // Stan liczymy z pozycji PO zapisie, a nie z tego, co przyszlo w zadaniu:
    // dwie zakladki otwarte naraz zamykaja dwie rozne pozycje i tylko baza wie,
    // ktora byla ostatnia.
    const poZapisie = poz.map((i) =>
      Number(i.id) === itemId ? { ...i, details_settled_at: domykamy ? new Date() : null } : i
    );
    const komplet = ustaleniaDomkniete(poZapisie);
    const zostalo = ileDoUstalenia(poZapisie);

    let status = order.status;
    let termin = null;
    if (komplet && (order.status === "details" || order.status === "paid")) {
      const t = terminRealizacji(new Date(), order.lead_days);
      const r = await client.query(
        `UPDATE orders SET status = $2, queued_at = COALESCE(queued_at, NOW()),
                deadline_at = COALESCE(deadline_at, $3::date)
          WHERE id = $1 RETURNING status, deadline_at`,
        [order.id, ETAP_STARTU_ZEGARA, t]
      );
      status = r.rows[0].status;
      termin = r.rows[0].deadline_at ? String(r.rows[0].deadline_at).slice(0, 10) : null;
    } else if (!komplet && order.status === "queued") {
      // Zegar cofa sie razem ze sladem po przypomnieniach. Zostawione progi
      // zamknelyby drugie podejscie: raz wyslane nie odezwaloby sie ponownie.
      const r = await client.query(
        `UPDATE orders SET status = 'details', details_at = COALESCE(details_at, NOW()),
                queued_at = NULL, deadline_at = NULL, reminders_sent = '[]'::jsonb
          WHERE id = $1 RETURNING status`,
        [order.id]
      );
      status = r.rows[0].status;
    }

    await client.query("COMMIT");
    console.log(`[ustalenia] ${ref}: pozycja ${itemId} ${domykamy ? "domknieta" : "otwarta"}, zostalo ${zostalo}, status ${status}`);
    // O ustaleniach piszemy klientowi tylko wtedy, gdy zmienily ETAP: samo
    // odhaczenie jednej z trzech pozycji jest nasza notatka, a nie nowina.
    if (status !== order.status && (req.body?.notify === true || req.body?.notify === "1")) {
      sendStatusUpdate(pool, order.id)
        .then((poszlo) => console.log(`[etap] ${ref}: powiadomienie klienta ${poszlo ? "wyslane" : "NIE poszlo"}`))
        .catch((e) => console.error("[etap] powiadomienie:", e.message));
    }
    res.json({ ok: true, orderRef: ref, itemId, settled: domykamy, remaining: zostalo, status, deadlineAt: termin });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[ustalenia] nie powiodlo sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac ustalen" });
  } finally {
    client.release();
  }
});

app.get("/api/orders/awaiting-transfer", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const shape = (o) => ({
    orderRef: o.order_ref,
    email: o.customer_email,
    name: o.customer_name,
    lang: o.lang,
    status: o.status,
    totalPLN: (o.total_grosze / 100).toFixed(2),
    amountEur: o.amount_eur_cents != null ? (o.amount_eur_cents / 100).toFixed(2) : null,
    eurRate: o.eur_rate,
    createdAt: o.created_at,
    expiresAt: o.expires_at,
    paidAt: o.paid_at,
    cancelledAt: o.cancelled_at,
    cancelledBy: o.cancelled_by,
    cancelReason: o.cancel_reason,
    paymentStatus: o.payment_status,
    paymentRemoteId: o.payment_remote_id,
    paymentReviewAt: o.payment_review_at,
    paymentReviewReason: o.payment_review_reason,
    paymentReviewPreviousStatus: o.payment_review_previous_status,
  });

  const COLS = `order_ref, customer_email, customer_name, lang, status, total_grosze,
                amount_eur_cents, eur_rate, created_at, expires_at,
                paid_at, cancelled_at, cancelled_by, cancel_reason,
                payment_status, payment_remote_id, payment_review_at,
                payment_review_reason, payment_review_previous_status`;

  // Druga lista, zamowienia zamkniete bez zaplaty, jest tu celowo. Rezygnacja
  // ma zdejmowac wiersz z listy roboczej, a nie z oczu: to przy niej sprawdza
  // sie, czy towar faktycznie wrocil do sprzedazy, i stad kasuje sie pomylki.
  const [pending, reviews, closed] = await Promise.all([
    pool.query(`SELECT ${COLS} FROM orders WHERE status = 'awaiting_transfer' ORDER BY created_at DESC LIMIT 100`),
    pool.query(`SELECT ${COLS} FROM orders WHERE status = 'payment_review'
                 ORDER BY payment_review_at ASC LIMIT 100`),
    pool.query(`SELECT ${COLS} FROM orders WHERE status IN ('cancelled','expired')
                 ORDER BY COALESCE(cancelled_at, created_at) DESC LIMIT 50`),
  ]);

  res.json({
    orders: pending.rows.map(shape),
    reviews: reviews.rows.map(shape),
    closed: closed.rows.map(shape),
  });
});

app.post("/api/orders/:ref/confirm-transfer", express.json({ limit: "8kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.params.ref || "");
  const { receivedEur, note, by, force } = req.body || {};

  const { rows } = await pool.query(
    `SELECT id, status, amount_eur_cents, fulfilled_at FROM orders WHERE order_ref = $1`,
    [ref]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Zamowienie nie istnieje" });
  if (order.fulfilled_at) return res.status(409).json({ error: "Zamowienie juz zostalo rozliczone" });
  if (order.status !== "awaiting_transfer") {
    return res.status(409).json({ error: `Zamowienie ma status ${order.status}, nie czeka na przelew` });
  }

  // Kwota otrzymana bywa mniejsza od naleznej o oplaty banku posredniczacego.
  // Drobna roznice przyjmujemy, wieksza wymaga swiadomej decyzji.
  const expected = order.amount_eur_cents ?? 0;
  const received = Number.isFinite(Number(receivedEur)) ? Math.round(Number(receivedEur) * 100) : expected;
  if (!force && expected > 0 && received < Math.round(expected * TRANSFER_TOLERANCE)) {
    return res.status(409).json({
      error: "Kwota nizsza od naleznej",
      code: "underpaid",
      expectedEur: (expected / 100).toFixed(2),
      receivedEur: (received / 100).toFixed(2),
      shortfallEur: ((expected - received) / 100).toFixed(2),
    });
  }

  await pool.query(
    `UPDATE orders SET status = 'paid', paid_at = NOW(), fulfilled_at = NOW(),
       payment_status = 'SUCCESS', payment_status_details = 'manual_transfer',
       transfer_received_cents = $2, transfer_confirmed_at = NOW(),
       transfer_confirmed_by = $3, transfer_note = $4
     WHERE id = $1`,
    [order.id, received, String(by || "admin").slice(0, 120), note ? String(note).slice(0, 2000) : null]
  );
  console.log(`[przelew] ${ref} potwierdzony recznie, ${(received / 100).toFixed(2)} EUR`);

  // Dalej dokladnie to samo, co po SUCCESS z bramki, razem ze startem zegara:
  // przelew jest ta sama zaplata co BLIK, tylko wolniejsza.
  const etapPrzelewu = await ruszZlecenie(pool, order.id).catch(() => null);
  if (etapPrzelewu) console.log(`[kolejka] ${ref} wchodzi w etap ${etapPrzelewu}`);

  await issueDownloads(pool, order.id).catch((e) =>
    console.error("[pobranie] zalozenie linkow nie powiodlo sie:", e.message)
  );
  sendOrderPaidEmails(pool, order.id).catch((e) =>
    console.error("[przelew] wysylka maili nie powiodla sie:", e.message)
  );
  consumeReservations(pool, order.id).catch((e) =>
    console.error("[produkty] zdjecie ze stanu nie powiodlo sie:", e.message)
  );
  consumeDiscount(pool, order.id).catch((e) =>
    console.error("[rabaty] zapisanie uzycia kodu nie powiodlo sie:", e.message)
  );
  moveOrderFilesToOrders(pool, order.id, ref).catch((e) =>
    console.error("[dysk] przeniesienie plikow nie powiodlo sie:", e.message)
  );

  res.json({ ok: true, orderRef: ref, receivedEur: (received / 100).toFixed(2) });
});

/**
 * Rezygnacja z zamowienia.
 *
 * Towar i kod rabatowy wracaja do puli natychmiast, bez czekania na wygasniecie
 * rezerwacji. To jest wlasnie sedno: sztuka odlozona na bok przez zamowienie,
 * ktore nie dojdzie do skutku, ma wrocic na polke tego samego dnia, a nie po
 * trzech dniach roboczych.
 *
 * Wiersz zostaje. Zamowienie jest dokumentem, wiec pytanie "dlaczego ta sztuka
 * wrocila do sprzedazy" musi miec odpowiedz takze za pol roku.
 */
app.post("/api/orders/:ref/cancel", express.json({ limit: "4kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.params.ref || "");
  const { rows } = await pool.query(
    `SELECT id, status, fulfilled_at FROM orders WHERE order_ref = $1`, [ref]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Zamowienie nie istnieje" });
  if (order.fulfilled_at) return res.status(409).json({ error: "Zamowienie zostalo rozliczone", code: "fulfilled" });
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return res.status(409).json({
      error: `Zamowienie ma status ${order.status}, nie ma z czego rezygnowac`,
      code: "not_cancellable",
    });
  }

  const cancelled = await pool.query(
    `UPDATE orders SET status = 'cancelled', cancelled_at = NOW(),
       cancelled_by = $2, cancel_reason = $3
     WHERE id = $1 AND fulfilled_at IS NULL AND status = ANY($4::text[])
     RETURNING id`,
    [order.id, String(req.body?.by || "panel").slice(0, 120),
     req.body?.reason ? String(req.body.reason).slice(0, 2000) : null,
     CANCELLABLE_STATUSES]
  );
  if (!cancelled.rowCount) {
    return res.status(409).json({
      error: "Stan zamowienia zmienil sie przed rezygnacja",
      code: "state_changed",
    });
  }

  const stock = await releaseOrderReservations(pool, order.id);
  const codes = await releaseOrderRedemptions(pool, order.id);
  console.log(`[zamowienia] ${ref} anulowane, zwolniono rezerwacji: ${stock}, kodow: ${codes}`);

  res.json({ ok: true, orderRef: ref, releasedReservations: stock, releasedCodes: codes });
});

/**
 * Skasowanie zamowienia.
 *
 * Domyslnie wolno skasowac wylacznie zamowienie, ktore nigdy nie zylo: do
 * pomylek i testow, nie do sprzatania historii. Wiersz ciagnie za soba
 * kaskadowo pozycje, rezerwacje i uzycia kodu, wiec skasowanie czegos, co
 * zdazylo sie wydarzyc, wymazuje po cichu dowody. Warunki w orderCleanup.js.
 *
 * `force: true` LAMIE te warunki. Jest to decyzja wlasciciela z 2026-08-26,
 * zapisana w ADR-0014, podjeta po tym, jak zglosilem sprzecznosc z polityka
 * retencji (`chat-api/retention.js` zamowienie ANONIMIZUJE, a nie kasuje,
 * i trzyma je szesc lat). Wymaga przepisania numeru zamowienia i zostawia
 * w logu liste przelamanych warunkow, zeby dalo sie pozniej odtworzyc, co
 * dokladnie zniknelo i mimo czego.
 *
 * Co przezywa kasowanie z `force`: `payment_notifications`, bo wiaza sie
 * z zamowieniem po numerze, a nie kluczem obcym. Slad wplaty zostaje, tyle ze
 * bez wiersza zamowienia obok. Towar NIE wraca na stan, bo zszedl przy
 * zaplacie, a kasowanie nie jest zwrotem i nie udajemy, ze jest.
 */
app.delete("/api/orders/:ref", express.json({ limit: "8kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.params.ref || "");
  const force = req.body?.force === true;
  // Potwierdzenie dotyczy WYLACZNIE lamania warunkow. Zwykle kasowanie zostaje
  // takie, jakie bylo, bo panel przelewow wola te trasa od dawna i nie ma
  // powodu psuc mu dzialania.
  if (force && String(req.body?.confirmRef || "").trim() !== ref) {
    return res.status(400).json({ error: "Przepisz numer zamowienia, zeby potwierdzic", code: "confirm_mismatch" });
  }
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.paid_at, o.fulfilled_at, o.transfer_confirmed_at,
            (SELECT COUNT(*)::INTEGER FROM payment_notifications n WHERE n.order_ref = o.order_ref) AS payment_notifications,
            (SELECT COUNT(*)::INTEGER FROM product_reservations r WHERE r.order_id = o.id AND r.consumed_at IS NOT NULL) AS consumed_reservations,
            (SELECT COUNT(*)::INTEGER FROM discount_redemptions d WHERE d.order_id = o.id AND d.consumed_at IS NOT NULL) AS consumed_redemptions,
            (SELECT COUNT(*)::INTEGER FROM downloads w WHERE w.order_id = o.id) AS downloads,
            (SELECT COUNT(*)::INTEGER FROM orders c WHERE c.parent_order_id = o.id) AS child_orders,
            (SELECT COUNT(*)::INTEGER FROM quotes q WHERE q.converted_order_id = o.id) AS linked_quotes
       FROM orders o WHERE o.order_ref = $1`,
    [ref]
  );
  const o = rows[0];
  if (!o) return res.status(404).json({ error: "Zamowienie nie istnieje" });

  const blockers = deletionBlockers({
    paidAt: o.paid_at,
    fulfilledAt: o.fulfilled_at,
    transferConfirmedAt: o.transfer_confirmed_at,
    paymentNotifications: o.payment_notifications,
    consumedReservations: o.consumed_reservations,
    consumedRedemptions: o.consumed_redemptions,
    downloads: o.downloads,
    childOrders: o.child_orders,
    linkedQuotes: o.linked_quotes,
  });
  if (blockers.length && !force) {
    return res.status(409).json({
      error: `Tego zamowienia nie da sie skasowac, bo ${blockers.join(", ")}. Zamiast tego zrezygnuj z niego.`,
      code: "linked",
      blockers,
    });
  }

  // Rezerwacje i tak znikna razem z wierszem, ale zwalniamy je wprost, zeby
  // dostepnosc policzona w tej samej sekundzie nie zalezala od kolejnosci kaskady.
  await releaseOrderReservations(pool, o.id);
  await releaseOrderRedemptions(pool, o.id);

  // `releaseOrderRedemptions` zwalnia wylacznie rezerwacje NIEZUZYTE, bo tylko
  // takie widzi zwykla sciezka kasowania: zuzyty kod jest jej blokada. Przy
  // `force` zuzyte wlasnie kasujemy, a licznik `used_count` stoi na kodzie
  // i nie liczy sie z wierszy, wiec kaskada zostawilaby kod spalony na zawsze.
  let oddaneKody = [];
  if (force) {
    const { rows: oddane } = await pool.query(
      `UPDATE discount_codes c
          SET used_count = GREATEST(0, c.used_count - z.ile), updated_at = NOW()
         FROM (SELECT code_id, COUNT(*)::INTEGER AS ile
                 FROM discount_redemptions
                WHERE order_id = $1 AND consumed_at IS NOT NULL
                GROUP BY code_id) z
        WHERE c.id = z.code_id
      RETURNING c.code`,
      [o.id]
    );
    oddaneKody = oddane.map((r) => r.code);
  }

  await pool.query(`DELETE FROM orders WHERE id = $1`, [o.id]);
  if (force && blockers.length) {
    console.log(
      `[zamowienia] ${ref} SKASOWANE MIMO WARUNKOW (status ${o.status}): przelamane ${blockers.join(", ")}` +
      (oddaneKody.length ? `, oddane kody: ${oddaneKody.join(", ")}` : "")
    );
  } else {
    console.log(`[zamowienia] ${ref} skasowane recznie (status ${o.status})`);
  }

  res.json({ ok: true, orderRef: ref, deleted: true, overridden: force ? blockers : [], releasedCodes: oddaneKody });
});

/** Parametry startu transakcji, podpisane po stronie serwera */
app.post("/api/orders/:ref/pay", express.json({ limit: "8kb" }), async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  if (!autopayConfigured()) return res.status(503).json({ error: "Platnosci nie sa skonfigurowane" });

  const ref = String(req.params.ref || "");
  const token = String(req.body?.token || "");
  const gatewayId = req.body?.gatewayId ?? 0;

  const { rows } = await pool.query(
    `SELECT o.id, o.order_ref, o.access_token, o.status, o.total_grosze, o.customer_email,
            o.expires_at, o.fulfilled_at, o.payment_method,
            (SELECT q.quote_ref FROM quotes q WHERE q.converted_order_id = o.id) AS quote_ref
       FROM orders o WHERE o.order_ref = $1`,
    [ref]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Zamowienie nie istnieje" });
  if (!secretMatches(token, order.access_token)) return res.status(403).json({ error: "Brak dostepu" });
  const startProblem = paymentStartProblem(order);
  if (startProblem) {
    const errors = {
      already_paid: [409, "Zamowienie jest juz oplacone"],
      expired: [410, "Wycena wygasla"],
      wrong_method: [409, "To zamowienie nie korzysta z Autopay"],
      unavailable: [409, "Dla tego zamowienia nie mozna rozpoczac platnosci"],
    };
    const [status, error] = errors[startProblem] || [409, "Nie mozna rozpoczac platnosci"];
    return res.status(status).json({ error, code: startProblem });
  }

  const limit = await checkQuarterlyLimit(pool, order.total_grosze);
  if (!limit.ok) return res.status(409).json({ error: "Nie mozemy teraz przyjac tej platnosci", code: "quarterly_limit" });

  const validity = new Date(Math.min(
    order.expires_at ? new Date(order.expires_at).getTime() : Number.POSITIVE_INFINITY,
    Date.now() + 30 * 86400_000
  ));
  const start = buildStartTransaction({
    orderId: order.order_ref,
    amountGrosze: order.total_grosze,
    // Zamowienie z oferty niesie w tytule TAKZE numer oferty. Klient ma przed
    // oczami numer z korespondencji, a nie numer nadany przy zaplacie, wiec bez
    // niego wyciag bankowy i watek mailowy nie maja wspolnego punktu.
    description: order.quote_ref ? `AEJaCA ${order.order_ref} / ${order.quote_ref}` : `AEJaCA ${order.order_ref}`,
    gatewayId,
    customerEmail: order.customer_email,
    validityTime: formatValidityTime(validity),
  });

  const started = await pool.query(
    `UPDATE orders SET payment_gateway_id = $2, payment_status = 'PENDING',
       payment_status_details = NULL
     WHERE id = $1 AND status = 'awaiting_payment' AND fulfilled_at IS NULL
       AND COALESCE(payment_method, 'autopay') = 'autopay'
     RETURNING id`,
    [order.id, Number(gatewayId) || null]
  );
  if (!started.rowCount) {
    return res.status(409).json({
      error: "Stan zamowienia zmienil sie przed rozpoczeciem platnosci",
      code: "state_changed",
    });
  }

  // Zwracamy gotowe parametry, formularz wysyla przegladarka.
  // Klucz wspoldzielony nigdy nie opuszcza serwera.
  res.json({ ok: true, ...start });
});

/**
 * Powrot klienta z bramki.
 * Weryfikacja podpisu jest obowiazkowa, a status zamowienia zmienia
 * WYLACZNIE komunikat ITN. Ta strona pokazuje tylko to, co juz wiadomo.
 */
app.get("/api/autopay/return", async (req, res) => {
  const { ServiceID, OrderID, Hash } = req.query || {};
  const target = new URL("/order/status/", SITE_URL);

  if (!verifyReturn({ ServiceID, OrderID, Hash })) {
    console.warn("[autopay] powrot z niepoprawnym podpisem", { OrderID });
    target.searchParams.set("error", "invalid_signature");
    return res.redirect(302, target.toString());
  }

  target.searchParams.set("ref", String(OrderID));
  // Podpis Autopay wiaze OrderID z tym powrotem niezaleznie od tego, czy ITN
  // zdazyl juz ustawic paid albo payment_review. Token daje tej sesji prywatny
  // dostep do statusu, lecz sam powrot nadal nie zmienia zamowienia.
  if (pool) {
    const { rows } = await pool.query(
      "SELECT access_token FROM orders WHERE order_ref = $1",
      [String(OrderID)]
    ).catch(() => ({ rows: [] }));
    if (rows[0]?.access_token) target.searchParams.set("token", rows[0].access_token);
  }
  res.redirect(302, target.toString());
});

async function placePaymentInReview(order, parsed, amountOk) {
  const reviewed = await pool.query(
    `UPDATE orders SET status = 'payment_review', paid_at = COALESCE(paid_at, NOW()),
       payment_status = 'SUCCESS', payment_status_details = $2, payment_remote_id = $3,
       payment_review_at = NOW(),
       payment_review_reason = CASE WHEN $4 THEN 'unexpected_status:' || status ELSE 'amount_mismatch' END,
       payment_review_previous_status = status
     WHERE id = $1 AND fulfilled_at IS NULL
       AND status <> 'payment_review' AND status <> ALL($5::text[])
     RETURNING id, payment_review_previous_status, payment_review_reason`,
    // Kazdy etap PO zaplacie, a nie sam `paid`. Od ADR-0027 `paid` trwa ulamek
    // sekundy, wiec warunek na nim samym przestal cokolwiek chronic: druga,
    // dziwna ITN wciagalaby do weryfikacji zlecenie, ktore juz stoi w robocie.
    [order.id, parsed.paymentStatusDetails, parsed.remoteID, amountOk, ETAPY_PO_ZAPLACIE]
  );
  if (!reviewed.rowCount) return false;

  const { payment_review_previous_status: previous, payment_review_reason: reason } = reviewed.rows[0];
  console.error(`[payment-review] ${parsed.orderID}, poprzedni stan ${previous}, powod ${reason}`);
  sendPaymentReviewAlert(pool, order.id).catch((e) =>
    console.error("[payment-review] wysylka alertu nie powiodla sie:", e.message)
  );
  return true;
}

/**
 * Powiadomienie natychmiastowe o statusie platnosci (ITN).
 *
 * Reguly z dokumentacji, str. 26 do 27:
 *  - kazdy komunikat o poprawnym podpisie potwierdzamy struktura CONFIRMED,
 *  - logike biznesowa wykonujemy tylko przy PIERWSZYM SUCCESS,
 *  - FAILURE po SUCCESS potwierdzamy, ale nie cofamy statusu zamowienia.
 */
app.post("/api/autopay/itn", express.urlencoded({ extended: false, limit: "256kb" }), async (req, res) => {
  const parsed = parseITN(req.body?.transactions);

  if (pool) {
    await pool.query(
      `INSERT INTO payment_notifications (order_ref, remote_id, payment_status, status_details,
         amount_grosze, currency, gateway_id, payment_date, hash_valid, raw_xml)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [parsed.orderID ?? null, parsed.remoteID ?? null, parsed.paymentStatus ?? null,
       parsed.paymentStatusDetails ?? null,
       parsed.amount ? Math.round(Number(parsed.amount) * 100) : null,
       parsed.currency ?? null, parsed.gatewayID ? Number(parsed.gatewayID) : null,
       parsed.paymentDate ?? null, Boolean(parsed.hashValid), parsed.xml ?? null]
    ).catch((e) => console.error("[itn] log failed:", e.message));
  }

  if (!parsed.ok || !parsed.hashValid) {
    console.warn("[autopay] ITN odrzucony:", parsed.error || "bledny podpis", parsed.orderID);
    return res.status(400).type("text/plain").send("hash mismatch");
  }

  try {
    if (pool) {
      const { rows } = await pool.query(
        "SELECT id, status, total_grosze, fulfilled_at FROM orders WHERE order_ref = $1",
        [parsed.orderID]
      );
      const order = rows[0];

      if (!order) {
        console.warn("[autopay] ITN dla nieznanego zamowienia", parsed.orderID);
      } else {
        const amountGrosze = Math.round(Number(parsed.amount) * 100);
        const amountOk = amountGrosze === order.total_grosze;
        if (!amountOk) {
          console.error("[autopay] kwota z ITN nie zgadza sie z zamowieniem", {
            ref: parsed.orderID, itn: amountGrosze, zamowienie: order.total_grosze,
          });
        }

        const action = itnAction({
          orderStatus: order.status,
          fulfilledAt: order.fulfilled_at,
          paymentStatus: parsed.paymentStatus,
          amountOk,
        });

        if (action === "fulfill") {
          const fulfilled = await pool.query(
            `UPDATE orders SET status = 'paid', paid_at = NOW(), fulfilled_at = NOW(),
               payment_status = $2, payment_status_details = $3, payment_remote_id = $4
             WHERE id = $1 AND status = 'awaiting_payment' AND fulfilled_at IS NULL
             RETURNING id`,
            [order.id, parsed.paymentStatus, parsed.paymentStatusDetails, parsed.remoteID]
          );
          // Stan mogl zmienic sie po SELECT, na przyklad przez anulowanie w
          // panelu. Brak atomowej bramki wskrzeszalby wtedy zamkniete zamowienie.
          if (!fulfilled.rowCount) {
            await placePaymentInReview(order, parsed, amountOk);
          } else {
            console.log(`[autopay] zamowienie ${parsed.orderID} oplacone, ${(amountGrosze / 100).toFixed(2)} PLN`);

            // Zegar realizacji rusza tutaj, a nie przy klikaniu w panelu.
            const etap = await ruszZlecenie(pool, order.id).catch((e) => {
              console.error("[kolejka] nie udalo sie ruszyc zlecenia:", e.message);
              return null;
            });
            if (etap) console.log(`[kolejka] ${parsed.orderID} wchodzi w etap ${etap}`);

            // LINKI PRZED MAILEM, i to jest jedyna kolejnosc, ktora ma sens:
            // to wlasnie mail niesie link do klienta. Odwrotna kolejnosc dawalaby
            // potwierdzenie zaplaty bez tego, za co klient zaplacil.
            //
            // Czekamy tu na wynik, w odroznieniu od reszty: gdyby zalozenie
            // linkow sie nie udalo, mail i tak ma pojsc, ale bez sekcji plikow,
            // a nie z linkiem prowadzacym donikad.
            await issueDownloads(pool, order.id).catch((e) => {
              console.error("[pobranie] zalozenie linkow nie powiodlo sie:", e.message);
            });
            // Maile wysylamy po ustawieniu fulfilled_at, wiec kolejny SUCCESS
            // tego zamowienia juz tu nie wejdzie. Nie czekamy na wynik: ITN
            // trzeba potwierdzic niezaleznie od tego, czy poczta zadziala.
            sendOrderPaidEmails(pool, order.id).catch((e) =>
              console.error("[autopay] wysylka maili nie powiodla sie:", e.message)
            );
            // Stan magazynowy schodzi dopiero teraz. Do tej pory towar byl
            // wylacznie zarezerwowany, wiec porzucone zamowienie niczego nie kasowalo.
            consumeReservations(pool, order.id).catch((e) =>
              console.error("[produkty] zdjecie ze stanu nie powiodlo sie:", e.message)
            );
            // Kod rabatowy liczy sie jako uzyty dopiero teraz, z tego samego
            // powodu: porzucony koszyk nie ma prawa spalic kodu jednorazowego.
            consumeDiscount(pool, order.id).catch((e) =>
              console.error("[rabaty] zapisanie uzycia kodu nie powiodlo sie:", e.message)
            );
            // Pliki lezaly dotad w folderze roboczym, bo w chwili wgrania nikt
            // jeszcze niczego nie zamowil. Dopiero zaplata robi z nich zlecenie.
            moveOrderFilesToOrders(pool, order.id, parsed.orderID).catch((e) =>
              console.error("[dysk] przeniesienie plikow nie powiodlo sie:", e.message)
            );
          }
        } else if (action === "review") {
          await placePaymentInReview(order, parsed, amountOk);
        } else if (action === "record") {
          await pool.query(
            `UPDATE orders SET payment_status = COALESCE($2, payment_status),
               payment_status_details = COALESCE($3, payment_status_details)
             WHERE id = $1 AND fulfilled_at IS NULL AND status <> ALL($4::text[])`,
            // To samo co wyzej: `FAILURE` przyslane po udanej platnosci nie ma
            // prawa dopisac sie do zlecenia, ktore jest juz w robocie. Strona
            // zamowienia czyta ten sam `payment_status` i pokazalaby klientowi
            // nieudana platnosc za rzecz, ktora wlasnie robimy.
            [order.id, parsed.paymentStatus, parsed.paymentStatusDetails, ETAPY_PO_ZAPLACIE]
          );
        }
      }
    }
  } catch (e) {
    console.error("[autopay] przetwarzanie ITN nie powiodlo sie:", e.message);
  }

  // Potwierdzamy zawsze, takze komunikat, ktory niczego nie zmienil.
  res.type("application/xml").send(buildITNConfirmation(parsed.orderID));
});

// ------------------------------------------------------------
// POBRANIE ZAKUPIONEGO PLIKU
// ------------------------------------------------------------
// Link nie ma hasla, bo hasla nie ma tez klient: token W ADRESIE jest tu
// jedynym uwierzytelnieniem i dlatego ma dwadziescia cztery bajty losowe,
// termin waznosci i licznik. Ograniczenie liczby prob dokladamy mimo to,
// bo nic nie kosztuje, a zamienia zgadywanie z beznadziejnego na niemozliwe.
//
// Plik POWSTAJE TERAZ, z parametrow zapisanych w zamowieniu, tym samym kodem,
// ktory policzyl cene. Gdyby lezal na dysku, rozjechalby sie z wycena przy
// pierwszej poprawce generatora i nikt by tego nie zauwazyl.
const downloadLimit = createLimiter({ limit: 30, windowMs: 10 * 60_000, name: "pobranie pliku" });

const POWOD = {
  unknown: { status: 404, pl: "Taki link nie istnieje." },
  expired: { status: 410, pl: "Link wygasł. Napisz do nas, wystawimy nowy." },
  exhausted: { status: 410, pl: "Limit pobrań wyczerpany. Napisz do nas, wystawimy nowy link." },
};

app.get("/api/download/:token", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  if (!downloadLimit.check(extractIP(req))) {
    return res.status(429).json({ error: "Za duzo prob, sprobuj za chwile" });
  }

  let wynik;
  try {
    wynik = await takeDownload(pool, req.params.token);
  } catch (e) {
    console.error("[pobranie] baza:", e.message);
    return res.status(500).json({ error: "Pobranie chwilowo niedostepne" });
  }

  if (!wynik.ok) {
    const p = POWOD[wynik.reason] || POWOD.unknown;
    return res.status(p.status).json({ error: p.pl, code: wynik.reason });
  }

  // Plik budujemy WYLACZNIE dla pozycji z kreatora. Wpis w katalogu oznaczony
  // jako cyfrowy dostanie kiedys wlasny plik i wlasna sciezke; do tego czasu
  // nie wolno oddac mu pierscionka z domyslnych parametrow, bo bylby to inny
  // przedmiot niz kupiony, wydany bez jednego ostrzezenia.
  if (wynik.item.calculator !== "jewelry_ring_config" || !wynik.item.params) {
    console.error(`[pobranie] ${wynik.item.order_ref}: pozycja bez parametrow kreatora`);
    return res.status(500).json({ error: "Tego pliku nie umiemy jeszcze wydac. Napisz do nas." });
  }

  try {
    const komplet = await ringFiles(wynik.item.params);
    const wpisy = {};
    for (const f of komplet.files) wpisy[f.name] = new Uint8Array(f.buffer);
    const paczka = Buffer.from(zipSync(wpisy, { level: 6 }));

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition",
      `attachment; filename="${downloadName(wynik.item.order_ref)}"`);
    // Kopia w cache posrednika przezylaby licznik pobran, wiec jej nie chcemy.
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Downloads-Left", String(wynik.pozostalo));
    res.send(paczka);
    console.log(`[pobranie] ${wynik.item.order_ref}: wydano paczke, zostalo ${wynik.pozostalo}`);
  } catch (e) {
    // Pobranie zostalo juz odliczone, a pliku nie ma. Oddajemy je z powrotem,
    // bo inaczej klient traci proba za nasza usterke.
    console.error("[pobranie] budowa pliku nie powiodla sie:", e.message);
    await pool.query(
      "UPDATE downloads SET download_count = GREATEST(0, download_count - 1) WHERE token = $1",
      [String(req.params.token || "")]
    ).catch(() => {});
    res.status(500).json({ error: "Nie udalo sie zbudowac pliku. Napisz do nas." });
  }
});

/** Status zamowienia dla strony powrotu */
app.get("/api/orders/:ref", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  res.set("Cache-Control", "no-store, private");
  const { rows } = await pool.query(
    `SELECT id, order_ref, access_token, status, total_grosze, items_total_grosze, shipping_grosze,
            discount_code, discount_grosze, credit_applied_grosze,
            lead_days, deadline_at, requires_details, details_at, queued_at, ready_at,
            production_started_at,
            lang, paid_at, expires_at, delivery_method, delivery_point,
            revisions_included, revisions_used,
            payment_method, payment_status, fulfilled_at,
            amount_eur_cents, transfer_confirmed_at,
            shipped_at, tracking_number
       FROM orders WHERE order_ref = $1`,
    [String(req.params.ref || "")]
  );
  const o = rows[0];
  if (!o || !orderAccessAllowed(req.headers.authorization, o.access_token)) {
    return res.status(404).json({ error: "Zamowienie nie istnieje lub brak dostepu" });
  }

  // Pozycje zamowienia. Do tej pory strona statusu dostawala sam numer i sume,
  // wiec klient, ktory wracal do niej po tygodniu, nie mial jak sprawdzic, CO
  // wlasciwie zamowil; podsumowanie mial wylacznie w mailu, ktory bywa
  // zarchiwizowany albo skasowany. Tu jada te same wiersze, co w mailu.
  const { rows: pozycje } = await pool.query(
    `SELECT title, qty, unit_grosze, line_grosze, requires_details, details_settled_at, details_note
       FROM order_items WHERE order_id = $1 ORDER BY id`,
    [o.id]
  );

  res.json({
    orderRef: o.order_ref,
    status: o.status,
    totalPLN: (o.total_grosze / 100).toFixed(2),
    // Grosze obok gotowego napisu, bo strona formatuje kwoty sama i musi
    // umiec pokazac je takze w euro, po kursie zamrozonym przy zamowieniu.
    totalGrosze: o.total_grosze,
    itemsTotalGrosze: o.items_total_grosze,
    shippingGrosze: o.shipping_grosze,
    discountGrosze: o.discount_grosze || 0,
    discountCode: o.discount_code || null,
    creditGrosze: o.credit_applied_grosze || 0,
    items: pozycje.map((i) => ({
      title: i.title, qty: i.qty,
      unitGrosze: i.unit_grosze, lineGrosze: i.line_grosze,
      // Klient ma prawo wiedziec, NA CO czekamy. "Ustalamy szczegoly" bez
      // wskazania pozycji brzmi jak zwloka, a nie jak konkretne pytanie,
      // ktore do niego wyslalismy.
      requiresDetails: i.requires_details === true,
      detailsSettled: Boolean(i.details_settled_at),
      detailsSettledAt: i.details_settled_at,
      // Co ustalilismy, slowami. Klient czyta to samo zdanie co pracownia,
      // wiec nie ma dwoch wersji tej samej rozmowy.
      detailsNote: i.details_note || null,
    })),
    paidAt: o.paid_at,
    expiresAt: o.expires_at,
    deliveryMethod: o.delivery_method,
    // Numer paczkomatu albo punktu odbioru. Klient wybieral go tydzien
    // wczesniej i zwykle nie pamieta, a paczka jedzie wlasnie tam.
    deliveryPoint: o.delivery_point || null,

    // TERMIN REALIZACJI (ADR-0027).
    //
    // `daysLeft` liczy SERWER i to nie jest wygoda, tylko koniecznosc: data
    // policzona w JSX wychodzi inna przy buildzie i inna u klienta, React
    // uznaje to za rozjazd i wyrzuca cale poddrzewo (ADR-0022). Strona
    // dostaje wiec gotowa liczbe, a nie material do liczenia.
    leadDays: o.lead_days != null ? Number(o.lead_days) : null,
    deadlineAt: o.deadline_at ? String(o.deadline_at).slice(0, 10) : null,
    daysLeft: dniDoTerminu(o.deadline_at),
    requiresDetails: o.requires_details === true,
    detailsAt: o.details_at,
    // Chwila wejscia do kolejki. Klient widzi z niej moment, od ktorego liczy
    // sie termin, wiec bez niej os czasu na stronie zamowienia mialaby dziure
    // dokladnie tam, gdzie zaczyna sie odliczanie.
    queuedAt: o.queued_at,
    productionStartedAt: o.production_started_at,
    readyAt: o.ready_at,
    // Etap pracy widzi takze klient. Bez tego strona zamowienia po przestawieniu
    // go w kolejce wracala do galezi domyslnej i mowila oplaconemu klientowi,
    // ze czekamy na jego platnosc.
    shippedAt: o.shipped_at,
    trackingNumber: o.tracking_number,
    ...publicPaymentState(o),
    // Licznik poprawek pokazujemy od poczatku. Klient, ktory dowiaduje sie
    // o wyczerpaniu limitu dopiero przy rachunku, czuje sie naciagniety.
    revisions: o.revisions_included
      ? { included: o.revisions_included, used: o.revisions_used ?? 0 }
      : null,
    paymentMethod: o.payment_method || "autopay",
    transfer:
      o.payment_method === "bank_transfer" && o.amount_eur_cents != null
        ? {
            ...TRANSFER,
            amountEur: (o.amount_eur_cents / 100).toFixed(2),
            reference: o.order_ref,
            dueAt: o.expires_at,
            confirmedAt: o.transfer_confirmed_at,
          }
        : null,
  });
});

// --- Lead contact status (for n8n BCC automation) ---
// Token-authenticated: requires X-Admin-Token header matching ADMIN_API_TOKEN env var
app.get("/api/leads/contact-status", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const email = (req.query.email || "").trim().toLowerCase();
  if (!email || !CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (!pool) return res.json({ contacted: false });
  const { rows } = await pool.query(
    "SELECT contacted_at, contact_note FROM leads WHERE email = $1 AND contacted_at IS NOT NULL ORDER BY contacted_at DESC LIMIT 1",
    [email]
  ).catch(() => ({ rows: [] }));
  res.json({ contacted: rows.length > 0, contacted_at: rows[0]?.contacted_at || null, note: rows[0]?.contact_note || null });
});

// Mark lead as contacted via API (for n8n BCC automation)
app.post("/api/leads/mark-contacted", express.json(), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { email, note } = req.body || {};
  if (!email || !CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (!pool) return res.json({ ok: true, updated: 0 });
  const { rowCount } = await pool.query(
    `UPDATE leads SET contacted_at = NOW(), status = 'contacted', contact_note = COALESCE($2, contact_note)
     WHERE email = $1 AND contacted_at IS NULL`,
    [email.trim().toLowerCase(), note || null]
  ).catch(() => ({ rowCount: 0 }));
  res.json({ ok: true, updated: rowCount });
});

// --- Analytics event ingestion ---
app.post("/api/events", express.text({ type: "*/*", limit: "64kb" }), async (req, res) => {
  if (!pool) return res.status(200).json({ ok: true });

  const ip = extractIP(req);
  if (!checkAnalyticsRate(ip)) return res.status(429).json({ error: "Too many requests" });

  let body;
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const events = Array.isArray(body.events) ? body.events.slice(0, 50) : [];
  if (events.length === 0) return res.json({ ok: true });

  const country = req.headers["cf-ipcountry"] || await lookupCountry(ip).catch(() => null);
  const device = detectDevice(req.headers["user-agent"]);

  const values = [];
  const params = [];
  let idx = 1;
  for (const e of events) {
    if (!e.s || !e.c) continue;
    const ts = e.t ? new Date(e.t).toISOString() : new Date().toISOString();
    values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(ts, String(e.s).slice(0, 50), String(e.p || "/").slice(0, 500), String(e.c).slice(0, 50), String(e.a || "").slice(0, 200), String(e.l || "").slice(0, 500), e.v ?? null, country, device);
  }

  if (values.length === 0) return res.json({ ok: true });

  pool.query(
    `INSERT INTO events (ts, session, path, category, action, label, value, country, device) VALUES ${values.join(",")}`,
    params
  ).catch(() => {});

  res.json({ ok: true });
});

// --- Laser Matrix public API ---
let _matrixCache = { ts: 0, rows: null };

async function ensureMatrixCache() {
  if (!pool) return;
  const now = Date.now();
  if (!_matrixCache.rows || now - _matrixCache.ts > 5 * 60_000) {
    const { rows } = await pool.query(
      "SELECT * FROM laser_matrix ORDER BY laser_type, action_type, material, watts"
    );
    _matrixCache = { ts: now, rows };
  }
}

// GET /api/laser-matrix - all rows, optional ?laser=CO2&action=Grawerowanie&material=Akryl
app.get("/api/laser-matrix", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DB unavailable" });
  try {
    await ensureMatrixCache();
    let rows = _matrixCache.rows;
    const { laser, action, material } = req.query;
    if (laser)    rows = rows.filter(r => r.laser_type === laser);
    if (action)   rows = rows.filter(r => r.action_type === action);
    if (material) rows = rows.filter(r => r.material.toLowerCase().includes(material.toLowerCase()));
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ rows, count: rows.length, cachedAt: new Date(_matrixCache.ts).toISOString() });
  } catch (err) {
    // Komunikat wyjatku zostaje w logu. Do odpowiedzi trafia zdanie, ktore nie
    // opowiada obcemu o strukturze bazy ani o tym, gdzie sie potknelismy.
    console.error("[api] blad trasy:", err.message);
    res.status(500).json({ error: "Nie udalo sie pobrac danych" });
  }
});

// GET /api/laser-matrix/options - unique filter values for wizard dropdowns
app.get("/api/laser-matrix/options", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DB unavailable" });
  try {
    await ensureMatrixCache();
    const rows = _matrixCache.rows || [];
    const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
    const lasers    = uniq(rows.map(r => r.laser_type));
    const actions   = uniq(rows.map(r => r.action_type));
    const materials = uniq(rows.map(r => r.material));
    const watts     = uniq(rows.map(r => r.watts));
    const lenses    = uniq(rows.map(r => r.optics_lens));
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ lasers, actions, materials, watts, lenses });
  } catch (err) {
    // Komunikat wyjatku zostaje w logu. Do odpowiedzi trafia zdanie, ktore nie
    // opowiada obcemu o strukturze bazy ani o tym, gdzie sie potknelismy.
    console.error("[api] blad trasy:", err.message);
    res.status(500).json({ error: "Nie udalo sie pobrac danych" });
  }
});

// POST /api/laser-matrix/invalidate - clears cache (called by admin after edit)
app.post("/api/laser-matrix/invalidate", express.json({ limit: "1kb" }), (req, res) => {
  if (!requireInvalidateToken(req, res)) return;
  _matrixCache = { ts: 0, rows: null };
  res.json({ ok: true, message: "Cache invalidated" });
});

// ─── Market Rates: fetch functions ────────────────────────────────────────

const TROY_OZ_TO_GRAM = 31.1035;

async function fetchNBP() {
  if (!pool) return;
  try {
    const [goldRes, usdRes, eurRes] = await Promise.all([
      fetch("https://api.nbp.pl/api/cenyzlota/last/1/?format=json"),
      fetch("https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json"),
      fetch("https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json"),
    ]);
    const [goldData, usdData, eurData] = await Promise.all([
      goldRes.json(), usdRes.json(), eurRes.json(),
    ]);
    const au_pln_per_g = goldData[0]?.cena ?? null;
    const pln_per_usd = usdData?.rates?.[0]?.mid ?? null;
    const pln_per_eur = eurData?.rates?.[0]?.mid ?? null;
    const au_usd_per_oz = (au_pln_per_g && pln_per_usd)
      ? (au_pln_per_g / pln_per_usd) * TROY_OZ_TO_GRAM : null;
    await pool.query(
      `INSERT INTO market_rates (source, pln_per_usd, pln_per_eur, au_pln_per_g, au_usd_per_oz)
       VALUES ($1,$2,$3,$4,$5)`,
      ["nbp", pln_per_usd, pln_per_eur, au_pln_per_g, au_usd_per_oz]
    );
    console.log(`[rates] NBP: Au=${au_pln_per_g} PLN/g, USD=${pln_per_usd}, EUR=${pln_per_eur}`);
  } catch (e) {
    console.error("[rates] NBP fetch failed:", e.message);
  }
}


async function fetchPlatinumPalladiumSilver() {
  if (!pool) return;
  const apiKey = process.env.METAL_PRICE_API_KEY;
  if (!apiKey) {
    console.warn("[rates] METAL_PRICE_API_KEY not set - skipping Pt/Pd/Ag fetch");
    return;
  }
  try {
    const resp = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XPT,XPD,XAG`
    );
    const json = await resp.json();
    if (!json.success) {
      // Samo "API error" nie pozwala odroznic wyczerpanego limitu od zlego
      // klucza, a to sa dwa zupelnie rozne problemy. Logujemy, co przyszlo.
      const detail = json.error?.info || json.error?.message || json.message
        || `HTTP ${resp.status}, tresc: ${JSON.stringify(json).slice(0, 200)}`;
      throw new Error(detail);
    }
    const pt_usd_per_oz = json.rates?.XPT ? 1 / json.rates.XPT : null;
    const pd_usd_per_oz = json.rates?.XPD ? 1 / json.rates.XPD : null;
    const ag_usd_per_oz = json.rates?.XAG ? 1 / json.rates.XAG : null;
    const rateRow = await pool.query(
      "SELECT pln_per_usd FROM market_rates WHERE pln_per_usd IS NOT NULL ORDER BY fetched_at DESC LIMIT 1"
    );
    const pln_per_usd = rateRow.rows[0]?.pln_per_usd ?? null;
    const pt_pln_per_g = (pt_usd_per_oz && pln_per_usd) ? (pt_usd_per_oz * pln_per_usd) / TROY_OZ_TO_GRAM : null;
    const pd_pln_per_g = (pd_usd_per_oz && pln_per_usd) ? (pd_usd_per_oz * pln_per_usd) / TROY_OZ_TO_GRAM : null;
    const ag_pln_per_g = (ag_usd_per_oz && pln_per_usd) ? (ag_usd_per_oz * pln_per_usd) / TROY_OZ_TO_GRAM : null;
    await pool.query(
      `INSERT INTO market_rates (source, pt_pln_per_g, pd_pln_per_g, pt_usd_per_oz, pd_usd_per_oz, ag_pln_per_g, ag_usd_per_oz)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      ["metalpriceapi", pt_pln_per_g, pd_pln_per_g, pt_usd_per_oz, pd_usd_per_oz, ag_pln_per_g, ag_usd_per_oz]
    );
    console.log(`[rates] metalpriceapi: Pt=${pt_pln_per_g?.toFixed(2)}, Pd=${pd_pln_per_g?.toFixed(2)}, Ag=${ag_pln_per_g?.toFixed(2)} PLN/g`);
  } catch (e) {
    console.error("[rates] metalpriceapi fetch failed:", e.message);
  }
}

// NBP: hourly (gold PLN/g + currencies). metalpriceapi: twice daily (Pt/Pd/Ag, 60 req/month)
if (pool) {
  fetchNBP();
  // Pobranie przy starcie tylko wtedy, gdy nie mamy swiezego odczytu.
  // Metalpriceapi ma sto zapytan na miesiac, a harmonogram zjada juz okolo
  // osiemdziesieciu. Kazdy deploy dokladal kolejne, wiec w dniu z kilkoma
  // wdrozeniami limit konczyl sie sam z siebie.
  (async () => {
    try {
      const { rows } = await pool.query(
        `SELECT fetched_at FROM market_rates WHERE ag_pln_per_g IS NOT NULL
          ORDER BY fetched_at DESC LIMIT 1`,
      );
      const ageH = ageHours(rows[0]?.fetched_at);
      if (ageH > STARTUP_REFETCH_AFTER_H) fetchPlatinumPalladiumSilver();
      else console.log(`[rates] pomijam pobranie przy starcie, ostatnie sprzed ${ageH.toFixed(1)} h`);
    } catch {
      fetchPlatinumPalladiumSilver();
    }
  })();

  cron.schedule("5 * * * *", fetchNBP);

  // Harmonogram kruszcow pochodzi z `rates.js`, gdzie jest policzony jego
  // miesieczny koszt i pilnowany testem. Recznie dopisany `cron.schedule`
  // ominalby te kontrole i po cichu wyczerpal limit.
  for (const expr of fetchCronExpressions()) cron.schedule(expr, fetchPlatinumPalladiumSilver);
  console.log(`[rates] harmonogram kruszcow: ${monthlyRequests().toFixed(0)} zapytan miesiecznie`);

  // Gmail polling every 5 minutes (fallback when Pub/Sub unavailable)
  cron.schedule("*/5 * * * *", async () => {
    const gmail = createGmailClient();
    if (!gmail) return;
    const count = await pollRecentMessages(gmail, pool);
    if (count > 0) console.log(`[gmail] poll: ${count} new messages processed`);
  });
}

app.get("/api/market-rates", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "Database not available" });
  }
  try {
    // Get latest non-null value for each field, with its source and timestamp
    const q = await pool.query(`
      SELECT DISTINCT ON (field) field, value, source, fetched_at FROM (
        SELECT 'pln_per_usd' AS field, pln_per_usd::float AS value, source, fetched_at FROM market_rates WHERE pln_per_usd IS NOT NULL
        UNION ALL SELECT 'pln_per_eur', pln_per_eur::float, source, fetched_at FROM market_rates WHERE pln_per_eur IS NOT NULL
        UNION ALL SELECT 'au_pln_per_g', au_pln_per_g::float, source, fetched_at FROM market_rates WHERE au_pln_per_g IS NOT NULL
        UNION ALL SELECT 'ag_pln_per_g', ag_pln_per_g::float, source, fetched_at FROM market_rates WHERE ag_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pt_pln_per_g', pt_pln_per_g::float, source, fetched_at FROM market_rates WHERE pt_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pd_pln_per_g', pd_pln_per_g::float, source, fetched_at FROM market_rates WHERE pd_pln_per_g IS NOT NULL
      ) sub
      ORDER BY field, fetched_at DESC
    `);

    const rates = {};
    const sources = {};
    for (const row of q.rows) {
      rates[row.field] = row.value;
      sources[row.field] = { source: row.source, fetched_at: row.fetched_at };
    }

    // Derive EUR/USD from PLN rates
    if (rates.pln_per_usd && rates.pln_per_eur) {
      rates.eur_per_usd = rates.pln_per_usd / rates.pln_per_eur;
    }

    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ ...rates, sources });
  } catch (e) {
    console.error("[market-rates] query error:", e.message);
    res.status(500).json({ error: "Failed to fetch market rates" });
  }
});

app.get("/api/metal-prices", (req, res) => res.redirect("/api/market-rates"));

// --- Gemstone Prices ---
let _gemCache = { ts: 0, data: null };

app.get("/api/gemstone-prices", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DB unavailable" });
  const now = Date.now();
  if (_gemCache.data && now - _gemCache.ts < 24 * 60 * 60 * 1000) {
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.json(_gemCache.data);
  }
  try {
    const { rows } = await pool.query("SELECT * FROM gemstone_prices ORDER BY precious DESC, lab, name_pl");
    const data = { gems: rows, updatedAt: new Date().toISOString() };
    _gemCache = { ts: now, data };
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch gemstone prices" });
  }
});

// --- Material z naszego magazynu ---
// Przegladarka liczy z tych samych stawek co serwer, wiec kwota na ekranie
// i kwota wiazaca biora sie z jednego zrodla. Bez tego klient widzialby
// jedna cene, a placil inna, i nic by tego nie zglosilo.
let _materialCache = { ts: 0, data: null };

// ── KOREKTY STAWEK JUZ ZAPISANYCH W BAZIE ────────────────────────────────────
// Zestaw startowy wchodzi z `ON CONFLICT DO NOTHING`, wiec poprawiona liczba
// z repozytorium nie dochodzi do tabeli zalozonej wczesniej. Poprawka wygladala
// wtedy na zrobiona: build zielony, kod poprawny, klient widzi stara cene.
//
// Lista korekt stoi w `pricing/materialCorrections.js` i tam jest opisana.
// Tutaj zostaje samo wykonanie, z dwoma zabezpieczeniami:
//
//   - `AND pln_per_m2 = $stara` sprawia, ze korekta rusza wylacznie wartosc,
//     ktora znamy jako bledna. Gdy wlasciciel zdazyl poprawic cene w panelu,
//     wdrozenie mu jej NIE COFNIE.
//   - Wykonana korekta jest zapisana po `id`, wiec nie powtorzy sie przy
//     kazdym restarcie. Zapisujemy ja takze wtedy, gdy nie trafila w zaden
//     wiersz: znaczy to, ze temat jest zamkniety, a nie ze mamy probowac dalej.
async function zastosujKorektyStawek() {
  if (!pool || !MATERIAL_CORRECTIONS.length) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS material_corrections (
    id VARCHAR(80) PRIMARY KEY,
    material_id VARCHAR(50) NOT NULL,
    rows_changed INTEGER NOT NULL DEFAULT 0,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  for (const k of MATERIAL_CORRECTIONS) {
    try {
      const { rows: juz } = await pool.query("SELECT id FROM material_corrections WHERE id=$1", [k.id]);
      if (juz.length) continue;
      const wynik = await pool.query(
        `UPDATE material_stock SET pln_per_m2=$1, updated_at=NOW(), updated_by=$2
         WHERE material_id=$3 AND pln_per_m2=$4`,
        [k.to_pln_per_m2, `korekta:${k.id}`, k.material_id, k.from_pln_per_m2]
      );
      await pool.query(
        "INSERT INTO material_corrections (id, material_id, rows_changed) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
        [k.id, k.material_id, wynik.rowCount || 0]
      );
      // Stawka wisi w dwoch pamieciach podrecznych naraz. Bez wyczyszczenia obu
      // przegladarka dostalaby nowa cene, a kwota wiazaca liczylaby sie ze
      // starej, i przez godzine obie strony mowilyby co innego.
      if (wynik.rowCount) {
        _materialCache = { ts: 0, data: null };
        _materialPriceCache = { ts: 0, rows: null };
        console.log(`[material] korekta ${k.id}: ${k.material_id} ${k.from_pln_per_m2} -> ${k.to_pln_per_m2} zl/m2`);
      } else {
        console.log(`[material] korekta ${k.id}: pominieta, stawka juz inna niz ${k.from_pln_per_m2}`);
      }
    } catch (e) {
      console.error(`[material] korekta ${k.id} nieudana:`, e.message);
    }
  }
}

app.get("/api/material-stock", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DB unavailable" });
  const now = Date.now();
  if (_materialCache.data && now - _materialCache.ts < 60 * 60 * 1000) {
    res.setHeader("Cache-Control", "public, max-age=900");
    return res.json(_materialCache.data);
  }
  try {
    const { rows } = await pool.query(
      "SELECT material_id, name_pl, name_en, name_de, pln_per_m2, pln_per_piece, thickness_mm, in_stock FROM material_stock ORDER BY material_id"
    );
    const data = { materials: rows, updatedAt: new Date().toISOString() };
    _materialCache = { ts: now, data };
    res.setHeader("Cache-Control", "public, max-age=900");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch material stock" });
  }
});

app.post("/api/material-stock/invalidate", express.json(), (req, res) => {
  if (!requireInvalidateToken(req, res)) return;
  _materialCache = { ts: 0, data: null };
  // Wycena serwerowa ma wlasna pamiec podreczna. Bez wyczyszczenia obu naraz
  // nowa stawka doszlaby do przegladarki od razu, a do kwoty wiazacej dopiero
  // po godzinie, i przez ta godzine obie strony liczylyby inaczej.
  _materialPriceCache = { ts: 0, rows: null };
  res.json({ ok: true });
});

app.post("/api/gemstone-prices/invalidate", express.json(), (req, res) => {
  if (!requireInvalidateToken(req, res)) return;
  _gemCache = { ts: 0, data: null };
  // Wycena po stronie serwera ma wlasna pamiec podreczna cen bazowych.
  // Bez wyczyszczenia jej razem z tamta zmiana ceny kamienia dotarlaby
  // do przegladarki od razu, a do kwoty wiazacej dopiero po dobie.
  _gemBaseCache = { ts: 0, eur: null };
  res.json({ ok: true });
});

// ── FILAMENT TYPES API ────────────────────────────────────────────────────────

let _filamentCache = { ts: 0, data: null };
const FILAMENT_TTL = 5 * 60_000;

async function getFilamentData() {
  const now = Date.now();
  if (_filamentCache.data && now - _filamentCache.ts < FILAMENT_TTL) return _filamentCache.data;
  if (!pool) return null;

  const { rows: types } = await pool.query(
    `SELECT * FROM filament_types WHERE is_active=TRUE ORDER BY sort_order, category, name`
  );
  const { rows: brands } = await pool.query(
    `SELECT * FROM filament_brands WHERE is_active=TRUE AND (is_verified=TRUE OR auto_approved=TRUE) ORDER BY is_verified DESC, brand`
  );

  // Nest brands into types
  const brandsByType = {};
  for (const b of brands) {
    if (!brandsByType[b.filament_type_id]) brandsByType[b.filament_type_id] = [];
    brandsByType[b.filament_type_id].push(b);
  }
  for (const t of types) t.brands = brandsByType[t.id] || [];

  _filamentCache = { ts: now, data: { types, count: types.length } };
  return _filamentCache.data;
}

// GET /api/filaments - public
app.get("/api/filaments", async (req, res) => {
  try {
    const data = await getFilamentData();
    if (!data) return res.status(503).json({ error: "DB unavailable" });

    let types = data.types;
    const { category } = req.query;
    if (category) types = types.filter(t => t.category === category);

    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ types, count: types.length, cachedAt: new Date(_filamentCache.ts).toISOString() });
  } catch (e) {
    console.error("[filaments] GET /api/filaments error:", e.message);
    res.status(500).json({ error: "Failed to fetch filaments" });
  }
});

// GET /api/filaments/options - unique values for wizard
app.get("/api/filaments/options", async (req, res) => {
  try {
    const data = await getFilamentData();
    if (!data) return res.status(503).json({ error: "DB unavailable" });

    const categories = [...new Set(data.types.map(t => t.category))].sort();
    const difficulties = [...new Set(data.types.map(t => t.difficulty))].sort((a, b) => a - b);

    res.json({ categories, difficulties, count: data.count });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch options" });
  }
});

// GET /api/filaments/contributions?type_id=X - pending contributions (public)
app.get("/api/filaments/contributions", async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: "DB unavailable" });
    const { type_id } = req.query;
    const conditions = ["status='pending'", "vote_confirm >= 1"];
    const params = [];
    if (type_id) { params.push(type_id); conditions.push(`filament_type_id=$${params.length}`); }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const { rows } = await pool.query(
      `SELECT id, filament_type_id, brand_name, product_name, nozzle_min, nozzle_max,
              bed_min, bed_max, speed_min, speed_max, notes, vote_confirm, vote_dispute,
              auto_approved, created_at
       FROM filament_contributions ${where}
       ORDER BY vote_confirm DESC, created_at DESC LIMIT 50`,
      params
    );
    res.json({ contributions: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// POST /api/filaments/contribute - user submission
const contributeLimit = limitBy(createLimiter({ limit: 3, windowMs: 60 * 60_000, name: "zgloszenie filamentu" }), extractIP);
app.post("/api/filaments/contribute", express.json({ limit: "16kb" }), contributeLimit, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: "DB unavailable" });
    const { filament_type_id, brand_name, product_name, nozzle_min, nozzle_max,
            bed_min, bed_max, speed_min, speed_max, notes,
            contributor_email, contributor_name, gdpr_consent } = req.body;

    if (!filament_type_id || !brand_name || !contributor_email || !gdpr_consent)
      return res.status(400).json({ error: "Missing required fields" });

    const { rows } = await pool.query(
      `INSERT INTO filament_contributions
        (filament_type_id, brand_name, product_name, nozzle_min, nozzle_max,
         bed_min, bed_max, speed_min, speed_max, notes,
         contributor_email, contributor_name, gdpr_consent, contribution_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new_brand')
       RETURNING id`,
      [filament_type_id, brand_name, product_name || null,
       nozzle_min || null, nozzle_max || null, bed_min || null, bed_max || null,
       speed_min || null, speed_max || null, notes || null,
       contributor_email, contributor_name || null, !!gdpr_consent]
    );
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) {
    res.status(500).json({ error: "Failed to save contribution" });
  }
});

// POST /api/filaments/vote - community voting on contributions
const voteLimit = limitBy(createLimiter({ limit: 20, windowMs: 60 * 60_000, name: "glos na filament" }), extractIP);
app.post("/api/filaments/vote", express.json({ limit: "4kb" }), voteLimit, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: "DB unavailable" });
    const { contribution_id, vote, voter_email } = req.body;
    if (!contribution_id || !["confirm", "dispute"].includes(vote))
      return res.status(400).json({ error: "Invalid request" });

    const ip = extractIP(req);
    const ipHash = createHash("sha256").update(ip + contribution_id).digest("hex");

    // Deduplication check
    const { rows: existing } = await pool.query(
      "SELECT id FROM filament_contribution_votes WHERE contribution_id=$1 AND ip_hash=$2",
      [contribution_id, ipHash]
    );
    if (existing.length > 0) return res.status(409).json({ error: "Already voted" });

    await pool.query(
      "INSERT INTO filament_contribution_votes (contribution_id, voter_email, vote, ip_hash) VALUES ($1,$2,$3,$4)",
      [contribution_id, voter_email || null, vote, ipHash]
    );

    // Update vote counts
    const field = vote === "confirm" ? "vote_confirm" : "vote_dispute";
    const { rows: updated } = await pool.query(
      `UPDATE filament_contributions SET ${field}=${field}+1
       WHERE id=$1 RETURNING vote_confirm, vote_dispute`,
      [contribution_id]
    );

    // Auto-approve if 5+ confirms
    if (updated[0]?.vote_confirm >= 5) {
      await pool.query(
        `UPDATE filament_contributions SET auto_approved=TRUE WHERE id=$1 AND auto_approved=FALSE`,
        [contribution_id]
      );
      // Insert as brand if not already
      const { rows: contrib } = await pool.query(
        "SELECT * FROM filament_contributions WHERE id=$1", [contribution_id]
      );
      if (contrib[0] && !contrib[0].filament_brand_id) {
        await pool.query(
          `INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, speed_min, speed_max, notes_en, is_verified, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,TRUE)`,
          [contrib[0].filament_type_id, contrib[0].brand_name, contrib[0].product_name,
           contrib[0].nozzle_min, contrib[0].nozzle_max, contrib[0].bed_min, contrib[0].bed_max,
           contrib[0].speed_min, contrib[0].speed_max, contrib[0].notes]
        );
        _filamentCache = { ts: 0, data: null }; // invalidate
      }
    }

    res.json({ ok: true, votes: updated[0] });
  } catch (e) {
    res.status(500).json({ error: "Failed to record vote" });
  }
});

// POST /api/filaments/invalidate - admin cache invalidation
app.post("/api/filaments/invalidate", express.json(), (req, res) => {
  if (!requireInvalidateToken(req, res)) return;
  _filamentCache = { ts: 0, data: null };
  res.json({ ok: true });
});

// --- Gmail Push Notifications (Google Cloud Pub/Sub) ---
let _lastHistoryId = null;

app.post("/api/gmail/push", express.json(), async (req, res) => {
  // Verify Pub/Sub push token
  const token = req.query.token;
  if (!token || token !== process.env.GMAIL_PUBSUB_SECRET) {
    return res.status(401).end();
  }

  // Acknowledge immediately (Pub/Sub requires fast 200)
  res.status(200).end();

  if (!pool) return;

  try {
    const msgData = req.body?.message?.data;
    if (!msgData) return;
    const decoded = JSON.parse(Buffer.from(msgData, "base64").toString("utf-8"));
    const historyId = decoded.historyId;
    if (!historyId) return;

    const gmail = createGmailClient();
    if (!gmail) return;

    const startId = _lastHistoryId || String(BigInt(historyId) - 10n);
    const count = await processHistory(gmail, pool, startId);
    _lastHistoryId = historyId;
    if (count > 0) console.log(`[gmail] processed ${count} new messages from historyId ${startId}`);
  } catch (err) {
    console.error("[gmail] push error:", err.message);
  }
});

// Setup/renew Gmail watch (token-auth, call once to start and then auto-renewed by cron)
app.post("/api/gmail/setup-watch", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const gmail = createGmailClient();
    if (!gmail) return res.status(503).json({ error: "Gmail not configured" });
    const result = await setupGmailWatch(gmail);
    _lastHistoryId = result.historyId;
    res.json({ ok: true, historyId: result.historyId, expiration: result.expiration });
  } catch (err) {
    // Komunikat wyjatku zostaje w logu. Do odpowiedzi trafia zdanie, ktore nie
    // opowiada obcemu o strukturze bazy ani o tym, gdzie sie potknelismy.
    console.error("[api] blad trasy:", err.message);
    res.status(500).json({ error: "Nie udalo sie pobrac danych" });
  }
});

if (pool) {
  // Renew Gmail watch every 6 days (expires after 7)
  cron.schedule("0 6 */6 * *", async () => {
    const gmail = createGmailClient();
    if (!gmail) return;
    try {
      const result = await setupGmailWatch(gmail);
      _lastHistoryId = result.historyId;
      console.log("[gmail] watch renewed, historyId:", result.historyId);
    } catch (err) {
      console.error("[gmail] watch renewal error:", err.message);
    }
  });
}

app.listen(PORT, () => console.log(`AEJaCA Chat API running on :${PORT}`));
