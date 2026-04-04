-- AEJaCA Analytics — D1 Schema
-- Run: wrangler d1 execute aejaca-analytics --file=workers/analytics/schema.sql

CREATE TABLE IF NOT EXISTS events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL,          -- Unix timestamp ms
  session   TEXT    NOT NULL,          -- anonymous session ID
  path      TEXT    NOT NULL DEFAULT '',-- page path
  category  TEXT    NOT NULL,          -- page, calc, inquiry, nav
  action    TEXT    NOT NULL,          -- view, select, send, lang_change
  label     TEXT    NOT NULL DEFAULT '',-- detail (e.g. "gold_18k")
  value     REAL,                      -- optional numeric value
  country   TEXT    NOT NULL DEFAULT '',-- from CF headers
  device    TEXT    NOT NULL DEFAULT '',-- mobile/desktop/tablet
  created   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session);

-- Daily aggregates (materialized by Worker cron)
CREATE TABLE IF NOT EXISTS daily_stats (
  day       TEXT    NOT NULL,          -- YYYY-MM-DD
  metric    TEXT    NOT NULL,          -- pageviews, visitors, inquiries, etc.
  dimension TEXT    NOT NULL DEFAULT '',-- path, calculator, language, etc.
  count     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric, dimension)
);
