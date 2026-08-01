-- ============================================================
-- AEJaCA: zapytania o wycene i kontakty (tabela leads)
-- Run: psql $DATABASE_URL -f scripts/leads-schema.sql
-- ============================================================
-- Tabela istniala na produkcji, ale nie miala pliku schematu w repozytorium,
-- wiec nikt nie mogl sprawdzic z kodu, jakie ma kolumny. Ten plik jest teraz
-- jej zapisem, a wszystkie polecenia sa idempotentne, wiec mozna go puscic
-- na dzialajacej bazie.
--
-- Zasada: zapytanie o wycene to zobowiazanie tak samo jak zamowienie. Musi
-- dac sie odtworzyc po roku, razem z pelnym opisem klienta i plikiem, ktory
-- przyslal. Wczesniej opis byl obcinany do 400 znakow, a plik nie mial tu
-- zadnego sladu.

CREATE TABLE IF NOT EXISTS leads (
  id            BIGSERIAL PRIMARY KEY,
  email         VARCHAR(255),
  lang          VARCHAR(5) DEFAULT 'pl',
  calculator    VARCHAR(200),

  -- Krotkie podsumowanie tekstowe, zostaje dla zgodnosci ze starymi wpisami
  params        TEXT,
  status        VARCHAR(20) DEFAULT 'new',

  -- Widelki z kalkulatora w chwili zapytania
  price_min_pln NUMERIC(10,2),
  price_max_pln NUMERIC(10,2),
  price_min_eur NUMERIC(10,2),
  price_max_eur NUMERIC(10,2),
  qty           INTEGER,
  discount      NUMERIC(5,3),

  session_id    VARCHAR(50),
  contacted_at  TIMESTAMPTZ,
  contact_note  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --- Rozszerzenie: pelna tresc i powiazanie z plikiem ---

-- Pelny opis od klienta, bez obcinania. To on trafia do korespondencji
-- i to na nim opiera sie pozniejsza realizacja.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT;

-- Parametry jako struktura, a nie sklejony tekst. Bez tego nie da sie
-- odpowiedziec na pytanie "ile zapytan dotyczylo zlota 585".
ALTER TABLE leads ADD COLUMN IF NOT EXISTS params_json JSONB;

-- Plik przyslany do wyceny. Wiersz w uploads niesie sume kontrolna
-- i link do Dysku, wiec zapytanie przestaje byc samym mailem.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS upload_id BIGINT REFERENCES uploads(id) ON DELETE SET NULL;

-- Numer zapytania cytowany w korespondencji, odpowiednik order_ref.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_ref VARCHAR(32);

-- Zrodlo: contact, quote, chat. Dotad siedzialo w kolumnie calculator.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_quote_ref ON leads (quote_ref) WHERE quote_ref IS NOT NULL;

-- Zapytania czekajace na odpowiedz, najstarsze na gorze
CREATE OR REPLACE VIEW open_quotes AS
SELECT id, quote_ref, created_at, email, lang, calculator,
       LEFT(COALESCE(description, params, ''), 200) AS brief,
       price_min_pln, price_max_pln, upload_id
  FROM leads
 WHERE status = 'new' AND contacted_at IS NULL
 ORDER BY created_at;
