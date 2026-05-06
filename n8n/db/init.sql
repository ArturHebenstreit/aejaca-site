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

-- Newsletter subscribers — 10% discount opt-in
CREATE TABLE IF NOT EXISTS subscribers (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  lang          VARCHAR(5)   NOT NULL DEFAULT 'pl',
  source        VARCHAR(100) DEFAULT 'footer',
  discount_code VARCHAR(50)  DEFAULT 'AEJACA10',
  subscribed_at TIMESTAMPTZ  DEFAULT NOW(),
  unsubscribed  BOOLEAN      DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_subs_email ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subs_date ON subscribers (subscribed_at DESC);

-- AI Chat conversations log
CREATE TABLE IF NOT EXISTS conversations (
  id                SERIAL PRIMARY KEY,
  session_id        VARCHAR(100),
  lang              VARCHAR(5)    DEFAULT 'pl',
  messages_count    INTEGER       DEFAULT 1,
  last_user_message TEXT,
  assistant_response TEXT,
  hot_lead          BOOLEAN       DEFAULT FALSE,
  ip_hash           VARCHAR(30),
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_conv_hot ON conversations (hot_lead) WHERE hot_lead = TRUE;
CREATE INDEX IF NOT EXISTS idx_conv_date ON conversations (created_at DESC);

-- Analytics events (migrated from Cloudflare D1)
CREATE TABLE IF NOT EXISTS events (
  id         BIGSERIAL    PRIMARY KEY,
  ts         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  session    VARCHAR(50)  NOT NULL,
  path       VARCHAR(500),
  category   VARCHAR(50),
  action     VARCHAR(200),
  label      VARCHAR(500),
  value      NUMERIC,
  country    VARCHAR(10),
  device     VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_events_ts      ON events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session);
CREATE INDEX IF NOT EXISTS idx_events_cat     ON events (category);
CREATE INDEX IF NOT EXISTS idx_events_path    ON events (path) WHERE category = 'page';

-- Materialized daily aggregates (populated by n8n cron)
CREATE TABLE IF NOT EXISTS daily_stats (
  day       DATE         NOT NULL,
  metric    VARCHAR(50)  NOT NULL,
  dimension VARCHAR(200),
  count     INTEGER      NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric, dimension)
);

-- Link events sessions to leads (enables conversion attribution)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_leads_session ON leads (session_id) WHERE session_id IS NOT NULL;
