-- ============================================================
-- AEJaCA: karty podarunkowe
-- Run: psql $DATABASE_URL -f scripts/giftcards-schema.sql
-- ============================================================
-- Karta podarunkowa NIE jest kodem rabatowym i nie da sie jej wcisnac do
-- tabeli `discount_codes`, choc kusi. Roznice sa trzy i kazda z nich zmienia
-- zachowanie kasy:
--
--   1. To przedplata, czyli nasze zobowiazanie. Klient juz zaplacil, wiec
--      karta pokrywa TAKZE wysylke. Rabat nie pokrywa jej nigdy.
--   2. Ma saldo. Karta 500 zl uzyta na zamowienie 320 zl zostawia 180 zl.
--      Kod rabatowy zna tylko dwa stany: zuzyty albo nie.
--   3. Kolejnosc liczenia jest ustalona: najpierw rabat od pozycji, potem
--      wysylka, a karta schodzi na koncu od sumy do zaplaty. Odwrotnie
--      karta doplacalaby rabat, ktorego nikt nie kupil.
--
-- Ksiegowo to bon roznego przeznaczenia: sprzedajemy zarowno towary, jak i
-- uslugi, wiec stawki VAT sa rozne i podatek rozlicza sie przy realizacji
-- bonu, a nie przy jego sprzedazy. Kwoty trzymamy w groszach PLN, tak jak
-- cala reszta cennika; prezentacja w euro jest wylacznie przeliczeniem.

CREATE TABLE IF NOT EXISTS gift_cards (
  id                BIGSERIAL PRIMARY KEY,

  -- Zawsze wielkimi literami i z myslnikami dla czytelnosci przy przepisywaniu
  -- z wydrukowanej karty. Format: AEJ-XXXX-XXXX.
  code              VARCHAR(32)  UNIQUE NOT NULL,

  -- Nominal zostaje na zawsze, saldo maleje. Bez nominalu nie da sie odtworzyc
  -- historii karty ani odpowiedziec na pytanie "ile ona byla warta".
  initial_grosze    INTEGER      NOT NULL CHECK (initial_grosze > 0),
  balance_grosze    INTEGER      NOT NULL CHECK (balance_grosze >= 0),

  -- 12 miesiecy od wydania. Data jest twarda, bo klient musi ja zobaczyc na
  -- karcie, a nie wyliczac z regulaminu.
  valid_to          TIMESTAMPTZ  NOT NULL,

  -- Wylaczenie recznie, np. gdy karta zostala zglosza jako zgubiona i wydalismy
  -- w zamian nowa. Nie kasujemy wiersza, bo historia obciazen ma zostac.
  active            BOOLEAN      NOT NULL DEFAULT TRUE,

  -- Kto kupil i dla kogo. Adres obdarowanego jest opcjonalny: karta bywa
  -- wreczana osobiscie i wtedy nie ma czego wysylac.
  purchaser_email   VARCHAR(255),
  purchaser_name    VARCHAR(160),
  recipient_email   VARCHAR(255),
  recipient_name    VARCHAR(160),
  message           TEXT,          -- dedykacja od kupujacego, trafia na karte

  note              TEXT,          -- wylacznie wewnetrznie: jak zaplacono, nr faktury
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Saldo nigdy nie moze przekroczyc nominalu. Gdyby doszlo do podwojnego
  -- zwrotu przy anulowaniu zamowienia, ten warunek zatrzyma to na bazie,
  -- a nie na reklamacji.
  CONSTRAINT gift_balance_within_initial CHECK (balance_grosze <= initial_grosze)
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON gift_cards (active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser ON gift_cards (purchaser_email);

-- ------------------------------------------------------------
-- Obciazenia
-- ------------------------------------------------------------
-- Ten sam uklad, co przy kodach rabatowych i przy rezerwacji towaru:
-- rezerwacja powstaje przy skladaniu zamowienia i wygasa sama, a saldo
-- schodzi dopiero przy zaplacie. Porzucony koszyk nie zjada karty.
--
-- `balance_grosze` na karcie odzwierciedla WYLACZNIE obciazenia rozliczone.
-- Kwota dostepna to saldo minus otwarte rezerwacje, dlatego liczy ja widok
-- ponizej, a nie kolumna. Kolumna rozjechalaby sie przy pierwszym wygasnieciu.
CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id             BIGSERIAL PRIMARY KEY,
  card_id        BIGINT       NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id       BIGINT       REFERENCES orders(id) ON DELETE CASCADE,
  email          VARCHAR(255) NOT NULL,
  amount_grosze  INTEGER      NOT NULL CHECK (amount_grosze > 0),
  expires_at     TIMESTAMPTZ  NOT NULL,
  consumed_at    TIMESTAMPTZ,
  released_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_redemptions_card ON gift_card_redemptions (card_id)
  WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gift_redemptions_order ON gift_card_redemptions (order_id);
CREATE INDEX IF NOT EXISTS idx_gift_redemptions_expiry ON gift_card_redemptions (expires_at)
  WHERE consumed_at IS NULL AND released_at IS NULL;

-- Kwota realnie dostepna do wykorzystania w tej chwili.
CREATE OR REPLACE VIEW gift_cards_available AS
SELECT
  c.*,
  GREATEST(
    c.balance_grosze - COALESCE(SUM(r.amount_grosze) FILTER (
      WHERE r.consumed_at IS NULL AND r.released_at IS NULL AND r.expires_at > NOW()
    ), 0),
    0
  )::INTEGER AS available_grosze
FROM gift_cards c
LEFT JOIN gift_card_redemptions r ON r.card_id = c.id
GROUP BY c.id;

-- ------------------------------------------------------------
-- Slad na zamowieniu
-- ------------------------------------------------------------
-- Tak jak przy rabacie: kwota do zaplaty musi dac sie odtworzyc po latach bez
-- zagladania w tabele kart.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_code   VARCHAR(32);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_grosze INTEGER NOT NULL DEFAULT 0;
