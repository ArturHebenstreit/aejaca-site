-- ============================================================
-- AEJaCA Filament Database Schema
-- Run: psql $DATABASE_URL -f scripts/filament-schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS filament_types (
  id              BIGSERIAL PRIMARY KEY,
  type_id         VARCHAR(50)  UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  category        VARCHAR(30)  NOT NULL CHECK (category IN ('standard','engineering','flexible','specialty')),
  -- Temperature ranges
  nozzle_min      INTEGER,
  nozzle_max      INTEGER,
  bed_min         INTEGER,
  bed_max         INTEGER,
  temp_resistance INTEGER,
  -- Print settings
  speed_min       INTEGER,
  speed_max       INTEGER,
  layer_min       NUMERIC(4,2),
  layer_max       NUMERIC(4,2),
  retraction_min  NUMERIC(4,1),
  retraction_max  NUMERIC(4,1),
  cooling         INTEGER,
  enclosure       VARCHAR(20)  DEFAULT 'no' CHECK (enclosure IN ('no','recommended','required')),
  -- Properties
  difficulty      INTEGER      CHECK (difficulty BETWEEN 1 AND 5),
  density         NUMERIC(5,3),
  price_per_kg    INTEGER,
  props           TEXT[],
  -- i18n text
  uses_pl         TEXT,
  uses_en         TEXT,
  uses_de         TEXT,
  notes_pl        TEXT,
  notes_en        TEXT,
  notes_de        TEXT,
  -- Metadata
  is_active       BOOLEAN      DEFAULT TRUE,
  sort_order      INTEGER      DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_by      VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS filament_brands (
  id                BIGSERIAL PRIMARY KEY,
  filament_type_id  BIGINT REFERENCES filament_types(id) ON DELETE CASCADE,
  brand             VARCHAR(100) NOT NULL,
  product_name      VARCHAR(200),
  -- Parameter overrides (NULL = use filament_types defaults)
  nozzle_min        INTEGER,
  nozzle_max        INTEGER,
  bed_min           INTEGER,
  bed_max           INTEGER,
  speed_min         INTEGER,
  speed_max         INTEGER,
  -- Notes
  notes_pl          TEXT,
  notes_en          TEXT,
  notes_de          TEXT,
  product_url       VARCHAR(500),
  is_verified       BOOLEAN      DEFAULT FALSE,
  is_active         BOOLEAN      DEFAULT TRUE,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_by        VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS filament_contributions (
  id                  BIGSERIAL PRIMARY KEY,
  filament_type_id    BIGINT REFERENCES filament_types(id),
  filament_brand_id   BIGINT REFERENCES filament_brands(id),
  contribution_type   VARCHAR(30) NOT NULL CHECK (contribution_type IN ('brand_tweak','new_brand','type_correction')),
  brand_name          VARCHAR(100),
  product_name        VARCHAR(200),
  nozzle_min          INTEGER,
  nozzle_max          INTEGER,
  bed_min             INTEGER,
  bed_max             INTEGER,
  speed_min           INTEGER,
  speed_max           INTEGER,
  notes               TEXT,
  contributor_email   VARCHAR(200),
  contributor_name    VARCHAR(100),
  gdpr_consent        BOOLEAN      DEFAULT FALSE,
  -- Community voting
  vote_confirm        INTEGER      DEFAULT 0,
  vote_dispute        INTEGER      DEFAULT 0,
  auto_approved       BOOLEAN      DEFAULT FALSE,
  -- Admin review
  status              VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note          TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS filament_contribution_votes (
  id               BIGSERIAL PRIMARY KEY,
  contribution_id  BIGINT REFERENCES filament_contributions(id) ON DELETE CASCADE,
  voter_email      VARCHAR(200),
  vote             VARCHAR(10) NOT NULL CHECK (vote IN ('confirm','dispute')),
  ip_hash          VARCHAR(64),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_filament_types_category    ON filament_types(category);
CREATE INDEX IF NOT EXISTS idx_filament_types_active      ON filament_types(is_active);
CREATE INDEX IF NOT EXISTS idx_filament_brands_type       ON filament_brands(filament_type_id);
CREATE INDEX IF NOT EXISTS idx_filament_brands_verified   ON filament_brands(is_verified, is_active);
CREATE INDEX IF NOT EXISTS idx_filament_contributions_status ON filament_contributions(status);
CREATE INDEX IF NOT EXISTS idx_filament_contributions_type   ON filament_contributions(filament_type_id);
CREATE INDEX IF NOT EXISTS idx_contribution_votes_contrib    ON filament_contribution_votes(contribution_id);
