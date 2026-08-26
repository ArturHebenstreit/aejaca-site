-- ============================================================
-- AEJaCA: wyceny indywidualne (quotes, quote_items)
-- Run: psql $DATABASE_URL -f scripts/quotes-schema.sql
-- ============================================================
-- Wycena indywidualna to zamowienie, ktoremu brakuje jednej rzeczy: kwoty,
-- ktora musi podac czlowiek. Wszystko inne jest takie samo, wiec struktura
-- jest lustrem `orders` i `order_items`. Dzieki temu wyslanie klientowi
-- wyceny z linkiem do platnosci to przepisanie wierszy, a nie osobny swiat.
--
-- `leads` zostaje przy swojej roli: slad kontaktu i material do przypomnien.
-- Tresc merytoryczna zapytania mieszka tutaj.

CREATE TABLE IF NOT EXISTS quotes (
  id                BIGSERIAL PRIMARY KEY,
  quote_ref         VARCHAR(32) UNIQUE NOT NULL,

  -- SLAD PO STARYM UKLADZIE. `pick_one` znaczylo "cala oferta jest do wyboru",
  -- a `chosen_item_id` niosl wskazanie klienta. Oba pola zostaja dla ofert
  -- wyslanych przed podzialem na rodzaje pozycji; rozstrzyga dzis
  -- `quote_items.kind`, `group_key` i `selected`, bo tylko one pozwalaja miec
  -- na jednej ofercie wybor wariantu i dodatek obok niego.
  pick_one          BOOLEAN NOT NULL DEFAULT FALSE,
  chosen_item_id    BIGINT,

  status            VARCHAR(20) NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','priced','sent','accepted','converted','expired','cancelled')),

  lang              VARCHAR(5) NOT NULL DEFAULT 'pl',

  -- Waluta CALEJ oferty. Zrodlem ceny zostaja grosze PLN; euro liczy sie z nich
  -- po kursie i narzucie z `src/pricing/currency.js`. Waluta rozstrzyga o drodze
  -- platnosci: PLN idzie bramka (BLIK, pay-by-link), EUR przelewem na rachunek
  -- walutowy, bo nasza umowa z operatorem bramki nie obejmuje euro.
  currency          VARCHAR(3) NOT NULL DEFAULT 'PLN'
                    CHECK (currency IN ('PLN','EUR')),

  source            VARCHAR(30),               -- contact, quote, configurator, chat, saved

  -- Adres jest obowiazkowy przy zapytaniu o wycene reczna, bo bez niego nie ma
  -- jak odpisac. Przy wycenie zapisanej z kalkulatora (source = 'saved') klient
  -- moze chciec sam link, wiec kolumna dopuszcza NULL.
  customer_email    VARCHAR(255),
  customer_name     VARCHAR(150),
  customer_phone    VARCHAR(40),

  -- Tresc od klienta, w calosci. To ona rozstrzyga spor o zakres.
  message           TEXT,

  -- Kwota wpisana przez czlowieka. Do czasu wyceny NULL, i to jest istotne:
  -- pusta kwota znaczy "jeszcze nie obiecalismy niczego".
  total_grosze      INTEGER CHECK (total_grosze IS NULL OR total_grosze > 0),
  price_note        TEXT,                      -- co wchodzi w kwote, co nie

  valid_until       DATE,
  sent_at           TIMESTAMPTZ,

  -- Kursy kruszcow z chwili zapisu. Bez nich nie da sie odroznic ruchu ceny
  -- zlota od zmiany naszego wlasnego cennika, a to jest cala roznica miedzy
  -- "kruszec podrozal" a "podniesliscie mi robocizne po fakcie".
  rates_snapshot    JSONB,

  -- Zamowienie powstale z tej wyceny. Jedna wycena rodzi najwyzej jedno.
  converted_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  converted_at      TIMESTAMPTZ,

  -- Klient oglada wycene bez logowania, wiec adres musi byc nieodgadywalny.
  access_token      VARCHAR(64) UNIQUE,

  ip_hash           VARCHAR(30),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id            BIGSERIAL PRIMARY KEY,
  quote_id      BIGINT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

  calculator    VARCHAR(50),                   -- klucz z rejestru CALCULATORS
  title         VARCHAR(255) NOT NULL,
  qty           INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),

  -- Wypelniane dopiero przy wycenie, tak samo jak w naglowku.
  unit_grosze   INTEGER CHECK (unit_grosze IS NULL OR unit_grosze > 0),
  line_grosze   INTEGER CHECK (line_grosze IS NULL OR line_grosze > 0),

  -- Czym pozycja jest w ofercie:
  --   fixed   - skladnik rachunku, zawsze w kwocie
  --   variant - propozycja: z jednej grupy klient bierze DOKLADNIE JEDNA
  --   option  - dodatek: klient bierze go albo nie, niezaleznie od reszty
  -- `group_key` nazywa karte, na ktorej pozycja stoi: warianty jednej grupy
  -- wykluczaja sie wzajemnie, a dodatki z tej samej grupy da sie do nich
  -- dolozyc. `selected` niesie uklad wybrany przez klienta, a przed wyslaniem
  -- oferty ten zaproponowany przez nas.
  kind          VARCHAR(10) NOT NULL DEFAULT 'fixed'
                CHECK (kind IN ('fixed','variant','option')),
  group_key     VARCHAR(40),
  selected      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Parametry wyboru klienta, w tej samej postaci co w order_items.
  params        JSONB,
  -- Opis slowny: to, czego nie widac w parametrach.
  description   TEXT,

  upload_id     BIGINT REFERENCES uploads(id) ON DELETE SET NULL,
  file_name     VARCHAR(255),
  -- Skala wydruku. Bez niej ta sama geometria wyceniona ponownie dalaby inna
  -- kwote niz ta, ktora klient widzial.
  scale         NUMERIC(6,3),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes (customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items (quote_id);

-- updated_at bez pamietania o nim w kodzie
CREATE OR REPLACE FUNCTION touch_quotes_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quotes_updated_at ON quotes;
CREATE TRIGGER trg_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION touch_quotes_updated_at();

-- Co czeka na moja odpowiedz, od najstarszego
CREATE OR REPLACE VIEW quotes_pending AS
SELECT q.id, q.quote_ref, q.created_at, q.customer_email, q.lang, q.source,
       LEFT(COALESCE(q.message, ''), 200) AS brief,
       COUNT(i.id) AS items,
       COUNT(i.upload_id) FILTER (WHERE i.upload_id IS NOT NULL) AS files
  FROM quotes q
  LEFT JOIN quote_items i ON i.quote_id = q.id
 WHERE q.status IN ('new','priced')
 GROUP BY q.id
 ORDER BY q.created_at;
