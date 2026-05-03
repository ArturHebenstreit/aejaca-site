-- AEJaCA Quote Leads — PostgreSQL schema
-- Run once on your Railway Postgres instance

CREATE TABLE IF NOT EXISTS leads (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  lang          VARCHAR(5)   NOT NULL DEFAULT 'pl',
  calculator    VARCHAR(255) NOT NULL,
  params        TEXT,
  price_min_pln INTEGER,
  price_max_pln INTEGER,
  price_min_eur INTEGER,
  price_max_eur INTEGER,
  qty           INTEGER      DEFAULT 1,
  discount      NUMERIC(4,2) DEFAULT 0,
  status        VARCHAR(50)  DEFAULT 'new',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  followup_48h  BOOLEAN      DEFAULT FALSE,
  discount_7d   BOOLEAN      DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
