---
status: accepted
owner: Artur
date: 2026-08-26
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0012-zaplata-za-oferte.md
  - MDs/decisions/ADR-0017-uklad-wyboru-w-ofercie.md
  - src/pricing/currency.js
  - src/shop/CurrencyContext.jsx
  - chat-api/quotes.js
  - src/pages/Offer.jsx
  - src/pages/Payments.jsx
---

# ADR-0018: Waluta zaplaty wybierana przez klienta, oferta w euro

## Kontekst

Do tej pory walute rozstrzygal JEZYK STRONY: `showEur = lang === "en" || "de"`.
Rownolegle backend odmawial przelewu kazdemu, kto czytal po polsku
("Przelew jest dostepny wylacznie przy cenach w euro"). Z tego wychodzily
trzy dziury.

1. **Oferty nie dalo sie wystawic w euro.** Trasa zaplaty za oferte miala
   `paymentMethod: "autopay"` wpisane na sztywno, a bramka rozlicza wylacznie
   zlotowki. Klient z Niemiec placil wiec w zlotowkach albo wcale.
2. **Polak z kontem w euro i Niemiec z polska karta nie mieli jak zaplacic
   po swojemu.** Waluta wynika z tego, GDZIE KTOS TRZYMA PIENIADZE, a nie
   z tego, w jakim jezyku czyta. Wersja jezykowa jest kiepskim proxy dla konta
   bankowego.
3. **Klient nie wiedzial, co sie stanie po kliknieciu.** Sciezka przelewu ma
   reczne ksiegowanie i termin liczony w dniach roboczych, a strona mowila
   o tym proza, w jednym miejscu, po fakcie.

## Decyzja

### 1. Jezyk PODPOWIADA walute, nigdy jej nie narzuca

`CURRENCY_BY_LANG = { pl: "PLN", en: "EUR", de: "EUR" }` w `src/pricing/currency.js`,
czyli w rdzeniu kopiowanym do backendu. Jedna tabelka dla strony, panelu
i serwera. Klient przestawia walute w trzech miejscach: w menu jezyka, w kasie
i na stronie oferty. Wybor pamieta sie w przegladarce (`aejaca-currency`)
i zmiana jezyka juz go nie kasuje.

### 2. Waluta wybiera DROGE ZAPLATY

`paymentMethodForCurrency()`: PLN idzie bramka (BLIK, pay-by-link), EUR
przelewem na rachunek walutowy. To nie jest wybor wygody, tylko jedyna droga,
ktora mamy: umowa z operatorem bramki nie obejmuje euro, wiec `Currency = "PLN"`
w `autopay.js` zostaje na sztywno i tak ma byc.

Wynika z tego, ze **osobny przelacznik "sposob platnosci" znika**. Klient
wybiera walute, a sposob zaplaty idzie za nia. Jedna decyzja zamiast dwoch,
ktore i tak musialy sie zgadzac.

### 3. Waluta dotyczy CALEJ oferty

`quotes.currency` (PLN albo EUR), nigdy pojedynczej pozycji. Rachunek zlozony
z dwoch walut nie ma jak sie zsumowac, a przelew wychodzi z jednego konta.
Panel ustawia walute przy zakladaniu wyceny (domyslnie z jezyka) i zmienia ja
w edytorze; klient zmienia ja u siebie, bo to on wie, gdzie ma konto.

### 4. Zrodlem ceny zostaja grosze PLN

Euro liczy sie z nich po kursie NBP i narzucie `EUR_FX_MARGIN`, tym samym
po obu stronach. Kwota w euro **zamraza sie razem z kursem w chwili zlozenia
zamowienia** (`amount_eur_cents`, `eur_rate`, `eur_rate_locked_at`), a nie
przy ksiegowaniu: inaczej klient przelalby jedna kwote, a my oczekiwalibysmy
innej. Rabat schodzi z obu kwot naraz.

Ryzyko kursowe miedzy wystawieniem oferty a zaplata zostaje po stronie klienta
w tym sensie, ze kwote w euro przeliczamy w dniu zaplaty. Zamrazamy ja dopiero
przy zamowieniu, na `TRANSFER_HOLD_BUSINESS_DAYS` dni roboczych. Alternatywa,
czyli zamrozenie euro na caly okres waznosci oferty, przerzucalaby na nas
pozycje walutowa na dwa tygodnie i nie ma za nia zaplaty.

### 5. Procedura pokazana, a nie opowiedziana

Strona `/payments/` dostaje **diagram dwoch drog** z osia czasu: co dzieje sie
teraz, co w kilka sekund, a co nastepnego dnia roboczego. Ten sam schemat,
w skrocie, stoi na stronie oferty przy wyborze waluty i w kasie sklepu.
Liczba dni roboczych bierze sie z `TRANSFER_HOLD_BUSINESS_DAYS`, nie z pamieci.

## Konsekwencje

- Kazdy klient widzi obie drogi zaplaty, takze polski. Wczesniej przelew byl
  ukryty przed czytajacym po polsku.
- Zamowienie z oferty potrafi teraz powstac w stanie `awaiting_transfer`.
  Kolejka pracowni i potwierdzanie wplat obsluguja ten stan od dawna, bo tak
  dziala sklep, wiec nowej sciezki recznej nie ma.
- Teksty na `/payments/` przestaly wiazac walute z wersja jezykowa. To byla
  informacja nieprawdziwa od chwili wdrozenia tej zmiany.
- Oferty wystawione wczesniej po angielsku i niemiecku dostaja `currency = 'EUR'`
  w migracji. To jest dokladnie to, co ich klient juz widzial, bo strona
  przeliczala kwoty po jezyku.

## Czego ta decyzja nie rozstrzyga

1. **Euro w bramce.** Gdyby umowa z operatorem objela euro, znikalby powod,
   dla ktorego euro idzie przelewem. Wtedy `paymentMethodForCurrency` zmienia
   sie w jednym miejscu.
2. **Trzecia waluta.** Lista `CURRENCIES` jest dwuelementowa i wszystko czyta
   z niej, ale funt czy korona wymagalyby rachunku i kursu, a nie tylko wpisu.
3. **Kurs sprzedazy.** Bierzemy kurs NBP z narzutem. Kurs wlasny, ustawiany
   recznie w panelu, byloby osobna decyzja handlowa.
