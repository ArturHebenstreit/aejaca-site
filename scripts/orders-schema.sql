-- ============================================================
-- AEJaCA Orders & Shop Schema
-- Run: psql $DATABASE_URL -f scripts/orders-schema.sql
-- ============================================================
-- CZEGO TEN PLIK NIE ROBI: nie migruje istniejacej bazy. Kazda tabela stoi
-- pod `CREATE TABLE IF NOT EXISTS`, wiec na bazie, ktora juz istnieje, nowa
-- kolumna dopisana ponizej NIE powstanie. Robi to blok `ALTER TABLE ... ADD
-- COLUMN IF NOT EXISTS` na starcie `chat-api/server.js`. Dodajac kolumne,
-- dopisz ja w OBU miejscach: tutaj, zeby swieza baza ja miala i zeby bylo
-- wiadomo, po co jest, i tam, zeby dostala ja baza produkcyjna.
--
-- Zasady, ktore ten schemat wymusza:
--  1. Kwoty trzymamy w groszach (INTEGER). Zlotowki zmiennoprzecinkowe
--     gubia grosze przy mnozeniu przez naklad, a Autopay porownuje kwote
--     co do grosza.
--  2. Cene ustala backend i zapisuje razem z parametrami wejsciowymi, zeby
--     dalo sie odtworzyc, skad wzieta jest kwota na zamowieniu sprzed roku.
--  3. order_ref jest tym, co leci do Autopay jako OrderID. Nigdy sie nie
--     powtarza, bo dokumentacja Autopay tego zabrania przez caly okres uslugi.
--     Od 2026-08-31 (ADR-0032) ma dwie postacie. Zakup prosto z koszyka:
--     `AE` + data + osiem znakow. Zamowienie z oferty: numer sprawy z koncowka
--     mowiaca, ktora to zaplata z tej oferty, bo jedna oferta rodzi wiele
--     zamowien (ADR-0026), na przyklad `WY20260831-A1B2C3D4-2`. Kolejna runda
--     poprawek projektu dokłada `-R2`. Najdluzsza postac ma 24 znaki i sklada
--     sie wylacznie z liter, cyfr i lacznika, wiec miesci sie w limicie Autopay.

-- ------------------------------------------------------------
-- Zamowienia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                BIGSERIAL PRIMARY KEY,
  order_ref         VARCHAR(32)  UNIQUE NOT NULL,   -- OrderID dla Autopay, A-Za-z0-9-_
  -- Etap pracy JEST statusem zamowienia, a nie osobna kolumna obok (ADR-0013).
  -- Klient widzi z tego dwie osie: stan platnosci i stan realizacji, ale to
  -- jedna wartosc, wiec nie ma czego trzymac w zgodzie.
  --   details       Ustalanie szczegolow zlecenia; ZEGAR NIE BIEGNIE
  --   queued        Gotowe do pobrania; TU STARTUJE ZEGAR i przypomnienia
  --   in_production Zlecenie w realizacji; ktos wzial je do reki
  --   ready         Zrealizowane, czeka na wysylke albo odbior
  --   shipped       Wyslane albo przekazane
  -- `paid` zostaje etapem wejsciowym dla zamowien sprzed ADR-0027 i dla tych,
  -- ktorych zaplata nie zdazyla jeszcze pchnac dalej.
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','awaiting_payment','awaiting_transfer','payment_review','paid','details','queued','in_production','ready','shipped','completed','cancelled','expired','refunded')),
  -- 'instant' to zamowienie wycenione automatycznie, 'quoted' to wycena wystawiona recznie
  kind              VARCHAR(20)  NOT NULL DEFAULT 'instant' CHECK (kind IN ('instant','quoted')),
  lang              VARCHAR(5)   NOT NULL DEFAULT 'pl',

  -- Kwoty w groszach, waluta zawsze PLN (jeden ServiceID Autopay = jedna waluta)
  items_total_grosze    INTEGER  NOT NULL DEFAULT 0,
  shipping_grosze       INTEGER  NOT NULL DEFAULT 0,
  total_grosze          INTEGER  NOT NULL DEFAULT 0 CHECK (total_grosze >= 0),
  currency              VARCHAR(3) NOT NULL DEFAULT 'PLN',

  -- Klient
  customer_email    VARCHAR(255) NOT NULL,
  customer_name     VARCHAR(200),
  customer_phone    VARCHAR(40),

  -- Dostawa
  delivery_method   VARCHAR(30),   -- inpost_locker | courier | pickup | digital
  delivery_point    VARCHAR(100),  -- kod paczkomatu
  address_line1     VARCHAR(200),
  address_line2     VARCHAR(200),
  postal_code       VARCHAR(20),
  city              VARCHAR(120),
  country           VARCHAR(2)   DEFAULT 'PL',

  -- Zamkniecie sprawy bez realizacji. `cancel_kind` mowi KTORA z czterech drog
  -- (chat-api/drogiZamkniecia.js): odstapienie w 14 dni, nasza wina, nasza
  -- decyzja, rezygnacja z rzeczy na zamowienie. Przy trzech pierwszych zwrot
  -- jest obowiazkiem z regulaminu, przy czwartej decyzja handlowa, wiec bez
  -- tej kolumny nie da sie po czasie powiedziec, czemu wrocilo tyle, a nie
  -- tyle. Kwota stoi osobno od stanu: stan konczy sie na 'cancelled', a to,
  -- czy pieniadze wrocily, mowia `refund_grosze` i `refunded_at`.
  cancel_kind       VARCHAR(30),
  refund_grosze     INTEGER      NOT NULL DEFAULT 0,
  refunded_at       TIMESTAMPTZ,

  -- Zgody, kazda z osobna, bo art. 38 UPK wymaga odrebnego oswiadczenia
  accepted_terms_at       TIMESTAMPTZ,
  waived_withdrawal_at    TIMESTAMPTZ,  -- rzecz wykonywana na zamowienie
  digital_immediate_at    TIMESTAMPTZ,  -- tresc cyfrowa dostarczana natychmiast

  -- Platnosc (Autopay)
  payment_provider     VARCHAR(30)  DEFAULT 'autopay',
  payment_gateway_id   INTEGER,                 -- wybrany kanal, np. BLIK
  payment_remote_id    VARCHAR(32),             -- remoteID z ITN
  payment_status       VARCHAR(20),             -- PENDING | SUCCESS | FAILURE
  payment_status_details VARCHAR(50),
  paid_at              TIMESTAMPTZ,
  -- Znacznik, ze logika biznesowa (maile, wydanie plikow) juz sie wykonala.
  -- Autopay potrafi przyslac SUCCESS wiele razy i kazdy trzeba potwierdzic,
  -- ale zrealizowac zamowienie wolno tylko raz.
  fulfilled_at         TIMESTAMPTZ,
  -- SUCCESS, ktorego nie wolno automatycznie zrealizowac, na przyklad po
  -- anulowaniu albo z inna kwota. Pieniadze sa zapisane, skutki realizacji nie.
  payment_review_at              TIMESTAMPTZ,
  payment_review_reason          VARCHAR(80),
  payment_review_previous_status VARCHAR(20),

  -- Platnosc przelewem (klient spoza Polski)
  -- Autopay daje wylacznie BLIK i linki do polskich bankow, wiec zagraniczny
  -- klient nie ma czym zaplacic natychmiast. Naleznosc zamrazamy w euro razem
  -- z kursem z dnia zamowienia; rozliczenie i limit obrotu licza sie dalej
  -- w groszach PLN, a paid_at ustawia dopiero potwierdzenie wplywu.
  payment_method         VARCHAR(20)  NOT NULL DEFAULT 'autopay'
                         CHECK (payment_method IN ('autopay','bank_transfer')),
  amount_eur_cents       INTEGER,
  eur_rate               NUMERIC(10,4),
  eur_rate_locked_at     TIMESTAMPTZ,
  transfer_received_cents INTEGER,
  -- Chwila, w ktorej poprosilismy klienta o doplate. Od niej biegna trzy dni
  -- (`expires_at`), po ktorych zamowienie wygasa samo i oddajemy pieniadze.
  -- Nie trzymamy tu brakujacej kwoty: to roznica `amount_eur_cents` i
  -- `transfer_received_cents`, a stan wyliczalny zapisany osobno rozjezdza sie
  -- z reszta przy pierwszej korekcie kwoty.
  transfer_asked_at      TIMESTAMPTZ,
  transfer_confirmed_at  TIMESTAMPTZ,
  transfer_confirmed_by  VARCHAR(120),
  transfer_note          TEXT,

  -- Kolejka pracowni: etap pracy po zaplacie
  -- Statusy `in_production`, `shipped` i `completed` stoja w ograniczeniu wyzej
  -- od poczatku, ale dlugo nic ich nie ustawialo. Te kolumny zapisuja chwile
  -- wejscia w etap, a `chat-api/productionQueue.js` decyduje, z jakiego stanu
  -- w ktory etap wolno wejsc.
  details_at            TIMESTAMPTZ,
  queued_at             TIMESTAMPTZ,
  production_started_at TIMESTAMPTZ,
  ready_at              TIMESTAMPTZ,
  shipped_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  tracking_number       VARCHAR(64),
  -- Przewoznik wybrany przy nadaniu. Strefa wysylkowa mowi tylko, kto zwykle
  -- wozi w tamta strone, a strefy swiatowe nosza dwie nazwy naraz ("DHL /
  -- FedEx"), wiec bez tego pola mail do klienta spoza Europy musialby odsylac
  -- do dwoch stron sledzenia naraz. Biala lista: pricing/shipping.js.
  carrier               VARCHAR(40),

  -- TERMIN REALIZACJI (ADR-0027).
  --
  -- `lead_days` zamraza sie przy skladaniu zamowienia i jest NAJDLUZSZYM
  -- terminem sposrod pozycji, ktore do niego weszly: paczka wychodzi jedna,
  -- wiec calosc czeka na to, co robi sie najdluzej.
  --
  -- `deadline_at` stempluje sie przy wejsciu w `queued`, czyli w chwili, od
  -- ktorej klient liczy dni: zaraz po zaplacie albo po domknieciu ustalen
  -- (ADR-0028). Pobranie zlecenia do pracy terminu juz nie rusza, bo zwloka
  -- w kolejce jest nasza, a nie klienta. Trzymamy DATE, a nie liczbe dni, zeby
  -- termin nie przesuwal sie sam przy kazdym odczycie.
  lead_days             INTEGER CHECK (lead_days IS NULL OR lead_days > 0),
  deadline_at           DATE,
  -- Czy po zaplacie zlecenie idzie najpierw do ustalania szczegolow. Zamraza
  -- sie razem z `lead_days`: znacznik przy pozycji moze sie pozniej zmienic,
  -- a to zamowienie ma zostac takie, jakie klient kupil.
  --
  -- To jest PODSUMOWANIE znacznikow z `order_items`, trzymane dla maila
  -- i dla starych zamowien. O tym, czy zegar rusza, decyduja pozycje.
  requires_details      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Data ustalenia NOWEGO terminu z klientem. Zmiana `lead_days` po zaplacie
  -- jest zmiana umowy, a nie poprawka literowki, wiec musi niesc date, kiedy
  -- klient sie zgodzil. Zwykle jest to data maila potwierdzajacego.
  lead_days_agreed_at   DATE,
  -- Ktore przypomnienia juz poszly, po nazwach progow: ["d14","d7","d3","d0"].
  -- Bez tego zapisu codzienny przebieg wysylalby ten sam mail kazdego ranka.
  reminders_sent        JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Kiedy ostatnio szturchnelismy zlecenie stojace w ustalaniu szczegolow.
  -- Ten etap nie ma terminu, wiec bez wlasnego stempla bylby slepa plama.
  details_nudged_at     TIMESTAMPTZ,
  production_note       TEXT,

  -- Token do ogladania statusu zamowienia bez logowania
  access_token      VARCHAR(64)  NOT NULL,

  notes             TEXT,
  ip_hash           VARCHAR(30),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ                  -- waznosc wyceny / linku platniczego
);

CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders (order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_paid ON orders (paid_at DESC) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_awaiting_transfer
  ON orders (created_at DESC) WHERE status = 'awaiting_transfer';
CREATE INDEX IF NOT EXISTS idx_orders_payment_review
  ON orders (payment_review_at DESC) WHERE status = 'payment_review';
-- Kolejka pracowni pyta zawsze o to samo: co jest w robocie i co czeka najdluzej.
CREATE INDEX IF NOT EXISTS idx_orders_queue
  ON orders (paid_at ASC) WHERE status IN ('paid','details','queued','in_production','ready','shipped');

-- Przypomnienia czytaja to codziennie: zlecenia z biegnacym zegarem.
CREATE INDEX IF NOT EXISTS idx_orders_deadline
  ON orders (deadline_at) WHERE status IN ('queued','in_production','ready') AND deadline_at IS NOT NULL;

-- ------------------------------------------------------------
-- Pozycje zamowienia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id                BIGSERIAL PRIMARY KEY,
  order_id          BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- 'service' to usluga wyceniona z parametrow, 'product' to pozycja z katalogu
  item_type         VARCHAR(20)  NOT NULL CHECK (item_type IN ('service','product')),
  calculator        VARCHAR(50),        -- print3d_fdm | print3d_msla | jewelry_new | laser_co2_engrave | ...
  product_id        BIGINT,             -- FK ustawiany ponizej, po utworzeniu products

  title             VARCHAR(200) NOT NULL,
  qty               INTEGER      NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_grosze       INTEGER      NOT NULL CHECK (unit_grosze >= 0),
  line_grosze       INTEGER      NOT NULL CHECK (line_grosze >= 0),

  -- Wejscie do wyceny i pelny wynik, zeby cene dalo sie odtworzyc po latach
  params            JSONB,
  price_breakdown   JSONB,

  -- Plik klienta (druk 3D, grawer)
  file_name         VARCHAR(255),
  file_sha256       VARCHAR(64),
  file_url          TEXT,
  geometry          JSONB,              -- objetosc, bbox, pole powierzchni, liczba trojkatow

  -- USTALENIA STOJA PRZY POZYCJI (2026-08-30). Znacznik jedzie z pozycji
  -- oferty i zamraza sie razem z cena. `details_settled_at` stempluje chwile,
  -- w ktorej uznalismy te jedna pozycje za dogadana; zegar CALEGO zamowienia
  -- rusza dopiero, gdy stempel ma kazda pozycja, ktora go wymaga.
  --
  -- Znacznik na samym zamowieniu mowil tylko "cos wymaga rozmowy" i nie umial
  -- powiedziec, co jeszcze zostalo: przy trzech pozycjach z jedna do ustalenia
  -- caly zegar stal, a pracownia nie wiedziala, na co czeka.
  requires_details   BOOLEAN NOT NULL DEFAULT FALSE,
  details_settled_at TIMESTAMPTZ,

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- ------------------------------------------------------------
-- Katalog produktow gotowych, fizycznych i cyfrowych
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                BIGSERIAL PRIMARY KEY,
  slug              VARCHAR(120) UNIQUE NOT NULL,
  kind              VARCHAR(20)  NOT NULL CHECK (kind IN ('physical','digital')),
  active            BOOLEAN      NOT NULL DEFAULT TRUE,

  -- Tresci trojjezyczne trzymamy w JSONB zamiast trzech kolumn na pole,
  -- bo inaczej kazdy nowy jezyk to migracja schematu.
  title             JSONB        NOT NULL,   -- { pl, en, de }
  description       JSONB,
  images            JSONB,                   -- ["/img/shop/...webp"]

  price_grosze      INTEGER      NOT NULL CHECK (price_grosze >= 0),
  weight_g          INTEGER,                 -- do kosztu wysylki
  stock             INTEGER,                 -- NULL = bez limitu (produkt cyfrowy)

  -- Produkt cyfrowy
  file_path         TEXT,
  file_size_bytes   BIGINT,
  license           VARCHAR(50),             -- personal | commercial

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active) WHERE active = TRUE;

DO $$ BEGIN
  ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- Wydania plikow cyfrowych
-- ------------------------------------------------------------
-- Link generujemy dopiero po pierwszym SUCCESS z ITN. Ma termin waznosci
-- i licznik pobran, zeby zakupiony model nie krazyl po internecie jako
-- wieczysty link.
CREATE TABLE IF NOT EXISTS downloads (
  id                BIGSERIAL PRIMARY KEY,
  order_id          BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id     BIGINT       REFERENCES order_items(id) ON DELETE CASCADE,
  product_id        BIGINT       REFERENCES products(id) ON DELETE SET NULL,

  token             VARCHAR(64)  UNIQUE NOT NULL,
  max_downloads     INTEGER      NOT NULL DEFAULT 5,
  download_count    INTEGER      NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ  NOT NULL,
  last_downloaded_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_token ON downloads (token);
CREATE INDEX IF NOT EXISTS idx_downloads_order ON downloads (order_id);

-- ------------------------------------------------------------
-- Dziennik komunikatow ITN od Autopay
-- ------------------------------------------------------------
-- Kazde powiadomienie zapisujemy w surowej postaci. Bez tego reklamacja
-- platnosci sprowadza sie do slowa przeciwko slowu.
CREATE TABLE IF NOT EXISTS payment_notifications (
  id                BIGSERIAL PRIMARY KEY,
  order_ref         VARCHAR(32),
  remote_id         VARCHAR(32),
  payment_status    VARCHAR(20),
  status_details    VARCHAR(50),
  amount_grosze     INTEGER,
  currency          VARCHAR(3),
  gateway_id        INTEGER,
  payment_date      VARCHAR(20),
  hash_valid        BOOLEAN      NOT NULL DEFAULT FALSE,
  raw_xml           TEXT,
  received_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_notif_ref ON payment_notifications (order_ref);
CREATE INDEX IF NOT EXISTS idx_payment_notif_received ON payment_notifications (received_at DESC);

-- ------------------------------------------------------------
-- Obrot kwartalny, limit dzialalnosci nierejestrowanej
-- ------------------------------------------------------------
-- Od 2026-01-01 limit rozlicza sie kwartalnie i wynosi 10 813,50 PLN
-- (225% kwartalnego minimalnego wynagrodzenia). Przekroczenie oznacza
-- obowiazek rejestracji dzialalnosci, wiec pilnujemy go po swojej stronie,
-- nie tylko po stronie Autopay.
CREATE OR REPLACE VIEW quarterly_revenue AS
SELECT
  date_trunc('quarter', paid_at) AS quarter,
  COUNT(*)                        AS orders_paid,
  SUM(total_grosze)               AS revenue_grosze,
  ROUND(SUM(total_grosze) / 100.0, 2) AS revenue_pln
FROM orders
WHERE paid_at IS NOT NULL AND status NOT IN ('cancelled','refunded')
GROUP BY 1
ORDER BY 1 DESC;

-- ------------------------------------------------------------
-- updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
