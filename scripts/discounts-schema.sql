-- ============================================================
-- AEJaCA: kody rabatowe
-- Run: psql $DATABASE_URL -f scripts/discounts-schema.sql
-- ============================================================
-- Jedna tabela obsluguje dwie rodziny kodow, rozroznione ustawieniami:
--
--   osobisty  losowy ciag, max_uses = 1, wreczany konkretnej osobie
--   akcja     ladne haslo (MATKA15), okno czasowe, limit na adres e-mail
--
-- Uzycia trzymamy osobno, a nie jako sam licznik, bo licznik nie odpowiada
-- na pytania, ktore i tak padna: kto uzyl, w ktorym zamowieniu i za ile.

CREATE TABLE IF NOT EXISTS discount_codes (
  id                 BIGSERIAL PRIMARY KEY,
  -- Zawsze wielkimi literami: klient przepisze kod tak, jak mu wygodnie.
  code               VARCHAR(32)  UNIQUE NOT NULL,

  kind               VARCHAR(10)  NOT NULL CHECK (kind IN ('percent','amount')),
  -- Procent (1..80) albo kwota w groszach.
  value              INTEGER      NOT NULL CHECK (value > 0),

  -- Czego dotyczy znizka. Wysylki nie obejmuje nigdy, w zadnym wariancie.
  applies_to         VARCHAR(20)  NOT NULL DEFAULT 'all'
                     CHECK (applies_to IN ('all','products','services','jewelry','studio')),
  min_order_grosze   INTEGER      NOT NULL DEFAULT 0,

  -- NULL = bez limitu (akcja). 1 = kod osobisty, jednorazowy naprawde.
  max_uses           INTEGER      CHECK (max_uses IS NULL OR max_uses > 0),
  -- Bez rejestracji uzytkownikow to jedyna bariera przed dziesiecioma
  -- zamowieniami z jednej skrzynki na kod akcji.
  max_uses_per_email INTEGER      NOT NULL DEFAULT 1 CHECK (max_uses_per_email > 0),
  used_count         INTEGER      NOT NULL DEFAULT 0,

  valid_from         TIMESTAMPTZ,
  valid_to           TIMESTAMPTZ,
  active             BOOLEAN      NOT NULL DEFAULT TRUE,

  campaign           VARCHAR(60),  -- nazwa akcji, np. "Dzien Matki 2026"
  -- Komu wreczony. Przy kodzie powitalnym z newslettera to adres zapisujacego
  -- sie, dzieki czemu drugi zapis tym samym adresem nie tworzy drugiego kodu.
  issued_to          VARCHAR(255),
  note               TEXT,         -- komu wreczony i za co, wylacznie wewnetrznie

  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT discount_percent_range CHECK (kind <> 'percent' OR value BETWEEN 1 AND 80)
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes (active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_discount_codes_campaign ON discount_codes (campaign);

-- ------------------------------------------------------------
-- Uzycia
-- ------------------------------------------------------------
-- Rezerwacja powstaje przy skladaniu zamowienia i wygasa sama: 20 minut przy
-- platnosci natychmiastowej, 3 dni robocze przy przelewie. Dokladnie tyle samo,
-- co rezerwacja towaru i waznosc kwoty, wiec klient dostaje jedna date.
CREATE TABLE IF NOT EXISTS discount_redemptions (
  id            BIGSERIAL PRIMARY KEY,
  code_id       BIGINT      NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id      BIGINT      REFERENCES orders(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  amount_grosze INTEGER     NOT NULL CHECK (amount_grosze >= 0),
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  released_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_code ON discount_redemptions (code_id)
  WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_redemptions_email ON discount_redemptions (code_id, email)
  WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_redemptions_order ON discount_redemptions (order_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_expiry ON discount_redemptions (expires_at)
  WHERE consumed_at IS NULL AND released_at IS NULL;

-- ------------------------------------------------------------
-- Slad na zamowieniu
-- ------------------------------------------------------------
-- Kwota do zaplaty musi dac sie odtworzyc po latach bez zagladania w tabele
-- kodow, ktora moze sie zmienic albo zniknac.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code   VARCHAR(32);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_grosze INTEGER NOT NULL DEFAULT 0;
