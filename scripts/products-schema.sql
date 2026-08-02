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
-- Podkategoria: to, po czym klient zawezi liste jednym kliknieciem, i to, co
-- widzi na karcie jako ikone. Lista musi zgadzac sie z `src/data/shopFacets.js`.
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer       VARCHAR(20) NOT NULL DEFAULT 'ready';
ALTER TABLE products ADD COLUMN IF NOT EXISTS short       JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs       JSONB;
-- Uwaga dla klienta na karcie produktu, np. o bezplatnej zmianie rozmiaru.
-- Osobno od `notes`, ktore jest notatka wewnetrzna i nigdzie sie nie pokazuje.
ALTER TABLE products ADD COLUMN IF NOT EXISTS note        JSONB;
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
  -- Podkategoria musi pasowac do dzialu, inaczej w bizuterii pojawilby sie
  -- filtr "Laser CO2", a w studiu "Damska".
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_subcategory_check;
  ALTER TABLE products ADD CONSTRAINT products_subcategory_check
    CHECK (subcategory IS NULL
      OR (category = 'jewelry' AND subcategory IN ('women','men','pet'))
      OR (category = 'studio'  AND subcategory IN ('fdm','msla','co2','fiber','resin','digital')));
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
-- Stan pozycji w ofercie
-- ------------------------------------------------------------
-- Jedno pole zamiast kilku znacznikow. Trzy osobne flagi (aktywny, widoczny,
-- wyprzedany) daja osiem kombinacji, z czego polowa nie znaczy nic, a pytanie
-- "czy klient to kupi" wymagaloby sprawdzenia trzech pol w kazdym miejscu.
--
--   draft     przygotowywany, nigdy nie byl wystawiony
--   live      w sprzedazy, kupowalny, jesli sa wolne sztuki
--   sold_out  widoczny z plakietka, bez przycisku zakupu, wroci na polke
--   hidden    znika ze sklepu, wroci
--   retired   wycofany na stale
--
-- `sold_out` istnieje dla rzeczy sprzedanych poza sklepem (Etsy, na miejscu):
-- stan magazynowy zostaje nietkniety, a pozycja natychmiast przestaje byc do
-- kupienia. Wlasna sprzedaz i tak zdejmuje sztuki, wiec tam wystarcza `stock`.
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft';

DO $$ BEGIN
  ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
  ALTER TABLE products ADD CONSTRAINT products_status_check
    CHECK (status IN ('draft','live','sold_out','hidden','retired'));
END $$;

-- Przepisanie dawnego znacznika na stan. Wykonuje sie raz, przy pierwszym
-- uruchomieniu po zmianie: pozniej kazdy wiersz ma juz swoj status.
-- Tylko wiersze sprzed wyzwalacza ponizej: pozycja zapisana juz na statusach
-- ma active = false, dopoki nie jest w sprzedazy, wiec swiezy szkic zostaje
-- szkicem takze przy ponownym uruchomieniu tego pliku.
UPDATE products SET status = 'live' WHERE status = 'draft' AND active = TRUE;

-- `active` zostaje, ale przestaje byc czymkolwiek sterowac: wylicza sie ze
-- stanu, zeby zapytanie napisane recznie w bazie nie moglo rozjechac sie
-- z tym, co widzi sklep.
CREATE OR REPLACE FUNCTION products_sync_active() RETURNS TRIGGER AS $$
BEGIN
  NEW.active := NEW.status IN ('live', 'sold_out');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_sync_active ON products;
CREATE TRIGGER trg_products_sync_active
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_sync_active();

UPDATE products SET status = status;  -- wymusza przeliczenie `active`

CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);

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
