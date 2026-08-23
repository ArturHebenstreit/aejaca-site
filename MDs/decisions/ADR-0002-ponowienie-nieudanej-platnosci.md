---
status: draft
owner: Artur
date: 2026-08-23
deciders: Artur
supersedes: null
related:
  - MDs/AEJaCA_Autopay_Integration.md
  - chat-api/server.js
  - src/pages/OrderStatus.jsx
  - MDs/decisions/ADR-0004-token-statusu-zamowienia.md
---

# ADR-0002: Ponowienie nieudanej płatności Autopay

## Kontekst

Backend zapisuje status `FAILURE` z poprawnie podpisanego ITN, ale publiczny endpoint
statusu zamówienia go nie zwraca. Strona klienta sprawdza nieistniejące pole
`payment_status`, dlatego zawsze pokazuje oczekiwanie zamiast nieudanej płatności.
Komunikat obiecuje możliwość ponowienia, lecz interfejs nie udostępnia tej czynności.

## Decyzja

- Uwierzytelniony endpoint statusu zwraca jawne pola `paymentStatus` i `canRetryPayment`.
- Ponowienie korzysta z istniejącego endpointu startu płatności i wymaga tajnego tokenu zamówienia.
- Po poprawnie podpisanym powrocie z Autopay backend dołącza token właściwego zamówienia do wewnętrznego przekierowania na stronę statusu.
- Ponowienie jest dostępne tylko dla ważnego zamówienia `awaiting_payment`, rozliczanego przez Autopay i nieopłaconego.
- Dostępność akcji nie zależy od `payment_status`: obejmuje brak pierwszej próby, porzucone `PENDING` i odrzucone `FAILURE`. Sposób prezentacji nadal rozróżnia oczekiwanie od błędu.
- Strona zapisuje token pod kluczem danego zamowienia w `sessionStorage`, a potem
  jednorazowo usuwa go z adresu. F5 w tej samej sesji karty zachowuje dostep i
  mozliwosc ponowienia. Sam oczyszczony adres otwarty niezaleznie nie wystarcza.
- Rozpoczęcie kolejnej próby ustawia stan płatności na `PENDING` i usuwa szczegóły poprzedniego `FAILURE`.
- `FAILURE` odebrane po `SUCCESS` jest potwierdzane operatorowi, ale nie zmienia zamówienia.

## Alternatywy

- Utworzenie nowego zamówienia przy każdej próbie: odrzucone, bo duplikuje rezerwacje, pliki, rabaty i historię klienta.
- Ponowienie tylko przez kontakt z obsługą: odrzucone, bo niepotrzebnie przerywa samoobsługowy checkout.
- Ponowienie bez tokenu na podstawie samego numeru zamówienia: odrzucone, bo pozwala osobie znającej numer uruchamiać transakcje dla cudzego zamówienia.

## Konsekwencje

- Klient widzi rzeczywisty status i może ponowić płatność bez składania drugiego zamówienia.
- Token pozostaje wymagany przy każdej próbie i nie jest zwracany przez publiczny endpoint statusu.
- Starsze linki powrotne bez tokenu nie pokażą pełnego statusu i zaoferują kontakt.
- Token nie pozostaje w historii bieżącego adresu po załadowaniu strony statusu.

## Niezmienniki i testy

- Nie można ponowić płatności zamówienia opłaconego, anulowanego, wygasłego ani rozliczanego przelewem ręcznym.
- `SUCCESS` z właściwą kwotą realizuje zamówienie tylko raz.
- `FAILURE` po `SUCCESS` nie cofa statusu ani realizacji.
- Testy `paymentState.test.mjs` sprawdzają pozytywne ponowienie i wszystkie kontrole negatywne.
- Testy obejmują `FAILURE`, `PENDING` i pusty status płatności.

## Synchronizacja

- `MDs/AEJaCA_Autopay_Integration.md`
- `chat-api/server.js`
- `src/pages/OrderStatus.jsx`
- `src/i18n/pl.js`, `src/i18n/en.js`, `src/i18n/de.js`
- `chat-api/context.js`
- `public/llms.txt`
- `MDs/AEJaCA_Brand_Reference.md`
