-- ============================================================
-- AEJaCA: pliki klientow wgrywane do wyceny i zamowien
-- Run: psql $DATABASE_URL -f scripts/uploads-schema.sql
-- ============================================================
-- Plik klienta zyje dluzej niz jedna wizyta w przegladarce: wgrywany jest
-- na karcie uslugi, a platnosc moze nastapic nastepnego dnia. Dlatego
-- przechowujemy go na Dysku (przez n8n), a tutaj trzymamy metryke:
-- geometrie potrzebna do wyceny, sume kontrolna i link do pliku.
--
-- Koszyk trzyma sam identyfikator wpisu, kilkadziesiat znakow zamiast
-- megabajtow, wiec przezywa odswiezenie strony i powrot po kilku dniach.

CREATE TABLE IF NOT EXISTS uploads (
  id              BIGSERIAL PRIMARY KEY,
  token           VARCHAR(64)  UNIQUE NOT NULL,   -- identyfikator uzywany przez przegladarke
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','ordered','abandoned')),

  file_name       VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  file_sha256     VARCHAR(64),
  mime_type       VARCHAR(100),

  -- Wynik parsowania modelu, zeby wycena nie wymagala ponownego wgrania pliku
  geometry        JSONB,

  -- Zrzut modelu z podgladu 3D, pokazywany w koszyku i w mailu warsztatowym
  thumbnail       TEXT,

  -- Link nadawany przez n8n po zapisaniu pliku na Dysku
  drive_url       TEXT,
  drive_file_id   VARCHAR(128),
  stored_at       TIMESTAMPTZ,

  order_id        BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  lang            VARCHAR(5) DEFAULT 'pl',
  ip_hash         VARCHAR(30),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  abandoned_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_uploads_token ON uploads (token);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads (status);
CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads (created_at DESC);

-- Powiazanie pozycji zamowienia z wgranym plikiem
DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN upload_id BIGINT REFERENCES uploads(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Widok porzuconych plikow: wgrane, ale nigdy nieprzypisane do zamowienia.
-- Przydatny do przegladu katalogu na Dysku i do odzywania sie do klientow,
-- ktorzy wycenili i nie dokonczyli.
CREATE OR REPLACE VIEW abandoned_uploads AS
SELECT id, token, file_name, drive_url, lang, created_at, abandoned_at
FROM uploads
WHERE status = 'abandoned'
ORDER BY created_at DESC;

-- Dopisanie miniatury do istniejacej instalacji
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS thumbnail TEXT;
