-- ============================================================
-- SLAD PO WIADOMOSCIACH SPRZED ZAMOWIENIA
-- ============================================================
-- Potrzebny do JEDNEJ reguly: nigdy dwie nasze wiadomosci tego samego dnia do
-- tego samego adresu (decyzja wlasciciela, 2026-08-31). Klient, ktory zapisal
-- sie do newslettera i tego samego dnia wycenil cos w kalkulatorze, dostawalby
-- inaczej powitanie, potwierdzenie wyceny i przypomnienie w jednej dobie.
--
-- Regula dotyczy WYLACZNIE wiadomosci, ktore moga poczekac: przypomnienia
-- o kodzie. Potwierdzenie zamowienia, dane do przelewu i zmiana etapu ida
-- zawsze i natychmiast, bo klient na nie czeka.

CREATE TABLE IF NOT EXISTS mail_log (
  id       BIGSERIAL PRIMARY KEY,
  email    VARCHAR(255) NOT NULL,
  rodzaj   VARCHAR(40)  NOT NULL,
  sent_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mail_log_email_idx ON mail_log (LOWER(email), sent_at DESC);
