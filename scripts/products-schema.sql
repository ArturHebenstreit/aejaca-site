-- ============================================================
-- AEJaCA: katalog produktow i rezerwacje stanu
-- Run: psql $DATABASE_URL -f scripts/products-schema.sql
-- ============================================================
-- Tabela `products` powstala razem z zamowieniami, ale nikt jej nie uzywal:
-- katalog sklepu zyl w pliku w repozytorium, a stan magazynowy byl liczba
-- wpisana recznie, ktorej nic nie zmniejszalo po sprzedazy. Ten plik dopelnia
-- tabele o pola potrzebne sklepowi i dodaje rezerwacje, bez ktorych dwoch
-- klientow kupilo by te sama ostatnia sztuke.
--
-- Zasada: dostepnosc = stock - suma aktywnych rezerwacji. Stan zmniejszamy
-- dopiero przy potwierdzonej platnosci, wiec porzucone zamowienie nie kasuje
-- towaru, tylko zwalnia rezerwacje po terminie.

-- ------------------------------------------------------------
-- Uzupelnienie katalogu
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS category    VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer       VARCHAR(20) NOT NULL DEFAULT 'ready';
ALTER TABLE products ADD COLUMN IF NOT EXISTS short       JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs       JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_days INTEGER NOT NULL DEFAULT 2;
-- Konfiguracja personalizacji: co klient podaje i jaki jest limit znakow.
ALTER TABLE products ADD COLUMN IF NOT EXISTS personalization JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order  INTEGER NOT NULL DEFAULT 100;
-- Slad po sprzedazy, zeby dalo sie odroznic "nigdy nie bylo" od "wyprzedane".
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes       TEXT;

DO $$ BEGIN
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
  ALTER TABLE products ADD CONSTRAINT products_category_check
    CHECK (category IS NULL OR category IN ('jewelry','studio'));
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_offer_check;
  ALTER TABLE products ADD CONSTRAINT products_offer_check
    CHECK (offer IN ('ready','personalized'));
  -- Stan nie moze zejsc ponizej zera takze przy recznej korekcie w bazie.
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_check;
  ALTER TABLE products ADD CONSTRAINT products_stock_check
    CHECK (stock IS NULL OR stock >= 0);
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_offer ON products (offer) WHERE active = TRUE;

-- ------------------------------------------------------------
-- Rezerwacje stanu
-- ------------------------------------------------------------
-- Rezerwacja powstaje przy skladaniu zamowienia i wygasa sama: 20 minut przy
-- platnosci natychmiastowej, 3 dni robocze przy przelewie. Termin przy przelewie
-- jest wprost podany klientowi w kasie, w mailu i w regulaminie.
CREATE TABLE IF NOT EXISTS product_reservations (
  id            BIGSERIAL PRIMARY KEY,
  product_id    BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id      BIGINT      REFERENCES orders(id) ON DELETE CASCADE,
  qty           INTEGER     NOT NULL CHECK (qty > 0),
  expires_at    TIMESTAMPTZ NOT NULL,
  -- Wypelnione, gdy rezerwacja przestala blokowac towar: albo zamienila sie
  -- w sprzedaz (consumed_at), albo wygasla (released_at).
  consumed_at   TIMESTAMPTZ,
  released_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_product ON product_reservations (product_id)
  WHERE consumed_at IS NULL AND released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_order ON product_reservations (order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON product_reservations (expires_at)
  WHERE consumed_at IS NULL AND released_at IS NULL;

-- ------------------------------------------------------------
-- Dostepnosc
-- ------------------------------------------------------------
-- Jedno miejsce, w ktorym liczy sie "ile mozna jeszcze kupic". Produkt cyfrowy
-- ma stock NULL, czyli bez limitu, i taki zostaje.
CREATE OR REPLACE VIEW product_availability AS
SELECT
  p.id,
  p.slug,
  p.stock,
  COALESCE(SUM(r.qty) FILTER (
    WHERE r.consumed_at IS NULL AND r.released_at IS NULL AND r.expires_at > NOW()
  ), 0)::INTEGER AS reserved,
  CASE WHEN p.stock IS NULL THEN NULL
       ELSE GREATEST(p.stock - COALESCE(SUM(r.qty) FILTER (
         WHERE r.consumed_at IS NULL AND r.released_at IS NULL AND r.expires_at > NOW()
       ), 0), 0)::INTEGER
  END AS available
FROM products p
LEFT JOIN product_reservations r ON r.product_id = p.id
GROUP BY p.id, p.slug, p.stock;
