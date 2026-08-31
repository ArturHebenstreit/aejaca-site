---
status: accepted
owner: Artur
date: 2026-08-23
deciders: Artur
supersedes: null
related:
  - MDs/AEJaCA_Autopay_Integration.md
  - chat-api/server.js
  - chat-api/paymentState.js
  - scripts/orders-schema.sql
---

# ADR-0003: Reczna weryfikacja platnosci w nieoczekiwanym stanie

## Kontekst

Poprawnie podpisany `SUCCESS` mogl dotad zmienic anulowane albo wygasle
zamowienie na `paid`. Rezerwacje produktu i kodu mogly byc juz zwolnione, wiec
automatyczna realizacja grozila sprzedaza niedostepnego towaru. Ten sam problem
dotyczy `SUCCESS` z niezgodna kwota albo w innym stanie niz `awaiting_payment`.

## Decyzja

- Automatyczna realizacja jest dozwolona tylko dla pierwszego `SUCCESS` z
  poprawna kwota, gdy zamowienie nadal ma stan `awaiting_payment`.
- Kazdy inny poprawnie podpisany `SUCCESS` dla nierozliczonego zamowienia trafia
  do stanu `payment_review`.
- `payment_review` zapisuje otrzymanie platnosci, poprzedni stan i powod wyjatku,
  ale nie wydaje plikow, nie zuzywa rezerwacji ani rabatu, nie uruchamia produkcji
  i nie wysyla klientowi potwierdzenia rozpoczecia realizacji.
- Wlasciciel otrzymuje pilny alert i widzi wyjatek w panelu administracyjnym.
  Decyzja o realizacji, odtworzeniu rezerwacji albo zwrocie pozostaje reczna.
- Powtorzony ITN dla zamowienia juz w `payment_review` pozostaje w dzienniku, ale
  nie wysyla kolejnych alertow.

## Alternatywy

- Automatyczne przywrocenie anulowanego zamowienia: odrzucone, bo rezerwowany
  towar albo kod mogl zostac przyznany innej osobie.
- Automatyczny zwrot: odrzucony, bo projekt nie ma jeszcze bezpiecznego i
  idempotentnego przeplywu zwrotow Autopay.
- Pozostawienie stanu `cancelled` z samym logiem: odrzucone, bo pieniadze moglyby
  pozostac niewidoczne na zwyklej liscie operacyjnej.

## Konsekwencje

- Pieniadze otrzymane po zamknieciu zamowienia nie uruchomia cichej realizacji.
- Obsluga musi rozstrzygnac wyjatek recznie i sprawdzic dostepnosc towaru.
- Stan `payment_review` wchodzi do schematu bazy, API statusu i panelu.

## Niezmienniki i testy

- Tylko `awaiting_payment` plus poprawna kwota moze przejsc automatycznie do `paid`.
- `cancelled`, `expired`, zla kwota i inne nieoczekiwane stany daja `payment_review`.
- `payment_review` nie uruchamia skutkow ubocznych realizacji.
- Powtorzony `SUCCESS` nie wysyla drugiego alertu.

## Synchronizacja

- `MDs/AEJaCA_Autopay_Integration.md`
- `chat-api/paymentState.js`, `chat-api/server.js`, `chat-api/orderMail.js`
- `scripts/orders-schema.sql`
- `admin/views/transfers.ejs` (widok USUNIETY 2026-08-30, ADR-0029: platnosci
  do recznej decyzji stoja od tej pory w kolejce, razem z reszta zamowien)
- `src/pages/OrderStatus.jsx`
