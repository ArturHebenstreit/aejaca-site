---
status: accepted
owner: Artur
date: 2026-08-23
deciders: Artur
supersedes: null
related:
  - PROJECT_RULES.md
  - chat-api/server.js
  - src/pages/OrderStatus.jsx
---

# ADR-0004: Token wymagany do pelnego statusu zamowienia

## Kontekst

Publiczny `GET /api/orders/:ref` zwracal kwote, sposob dostawy, status zamowienia
i status platnosci na podstawie samego numeru. Numer jest trudny do odgadniecia,
ale pojawia sie w mailach i wiadomosciach, dlatego nie jest sekretem.

## Decyzja

- Pelny status zamowienia wymaga zgodnego `access_token`.
- Przegladarka przekazuje token w naglowku `Authorization: Bearer`, a nie w
  adresie zapytania o status.
- Brak zamowienia i bledny token daja taka sama odpowiedz `404`, zeby endpoint
  nie potwierdzal istnienia cudzego numeru.
- Odpowiedz ma `Cache-Control: no-store, private`.
- Token otrzymany w podpisanym powrocie Autopay jest zapisywany pod kluczem
  zamowienia w `sessionStorage`, a nastepnie usuwany z paska adresu. F5 w tej
  samej sesji karty odzyskuje token. Sam oczyszczony adres otwarty w niezaleznej
  sesji pokazuje instrukcje kontaktu i nie odpytuje pelnego statusu.
- Poprawnie podpisany powrot dostaje token niezaleznie od tego, czy ITN zdazyl
  juz ustawic `paid` albo `payment_review`.

## Alternatywy

- Dalsze traktowanie numeru zamowienia jako sekretu: odrzucone, bo numer jest
  identyfikatorem biznesowym udostepnianym klientowi.
- Token w parametrze zapytania statusowego: odrzucony, bo adresy trafiaja do
  historii, logow i narzedzi obserwowalnosci.
- Publiczna odpowiedz ograniczona do jednego pola: odrzucona na tym etapie, bo
  nadal potwierdzalaby istnienie zamowienia bez potrzeby biznesowej.

## Konsekwencje

- Osoba znajaca tylko numer zamowienia nie odczyta jego danych operacyjnych.
- Stare linki bez tokenu wymagaja kontaktu z AEJaCA.
- Naglowek `Authorization` musi byc dozwolony przez CORS.
- Odświezenie w tej samej sesji karty zachowuje dostep bez ponownego ujawniania
  tokenu w adresie.
- `sessionStorage` moze zostac skopiowany do pomocniczej karty utworzonej z
  `opener`, dlatego izolacja dotyczy niezaleznej sesji, a nie kazdego sposobu
  utworzenia nowej karty.

## Niezmienniki i testy

- Brak, zly format i zly token nie zwracaja danych zamowienia.
- Poprawny token daje pelny status i naglowek `no-store`.
- Token nie jest wysylany w query string statusu ani zwracany w odpowiedzi.
- Token z URL nadpisuje zapamietany token tego zamowienia, a klucze roznych
  zamowien nie moga sie wzajemnie zastepowac.

## Synchronizacja

- `MDs/AEJaCA_Autopay_Integration.md`
- `chat-api/server.js`
- `src/pages/OrderStatus.jsx`
- `src/i18n/pl.js`, `src/i18n/en.js`, `src/i18n/de.js`
