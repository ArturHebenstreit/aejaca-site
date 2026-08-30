---
status: draft
owner: Artur
date: 2026-08-30
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0013-kolejka-pracowni.md
  - MDs/decisions/ADR-0018-waluta-zaplaty.md
  - MDs/decisions/ADR-0027-termin-realizacji-i-przypomnienia.md
  - MDs/decisions/ADR-0028-zegar-startuje-w-kolejce.md
  - chat-api/server.js
  - admin/server.js
  - admin/views/queue.ejs
  - src/pages/OrderStatus.jsx
  - scripts/test-production-queue.mjs
  - chat-api/paymentSafety.test.mjs
---

# ADR-0029: Czekanie na pieniadze jest czescia kolejki, a nie osobna sprawa

## Kontekst

Zamowienie platne przelewem w euro (ADR-0018) dostaje status `awaiting_transfer`
i czeka, az wplata pojawi sie na rachunku walutowym. Do 2026-08-30 takie
zamowienie stalo WYLACZNIE na osobnej stronie panelu, `/transfers`, z wlasnymi
formularzami. W kolejce nie bylo go w ogole, bo kolejka pokazywala stany od
`paid` w gore.

Drugi taki stan to `payment_review`: bramka potwierdzila pobranie pieniedzy,
ale zlecenia nie uruchomiono automatycznie i decyzja nalezy do czlowieka. On
tez stal na stronie przelewow.

Rozjazd byl widoczny z obu stron:

- **Pracownia** miala jedna droge zlecenia rozbita na dwa ekrany. Pierwszy krok,
  potwierdzenie wplaty, dzial sie w innym miejscu niz cala reszta, a lista
  "co dzisiaj robimy" nie zawierala zamowien, ktore czekaja wlasnie na nas.
- **Klient** w euro widzial ekran oczekiwania bez osi czasu, bo os rysowala sie
  dopiero od zaplaty. Na pytanie "czy potwierdziliscie wplate" strona zamowienia
  nie odpowiadala, choc jest do tego zbudowana.

Mechanika byla przy tym od poczatku wspolna: potwierdzenie przelewu robi
doslownie to samo, co udana platnosc bramka. Ustawia `paid`, wpuszcza zlecenie
do kolejki razem ze startem zegara, zaklada linki do plikow, zdejmuje towar ze
stanu, zapisuje uzycie kodu i wysyla klientowi potwierdzenie. Rozjechany byl
wylacznie ekran.

## Decyzja

### 1. Jedna tabela: kolejka pokazuje takze to, co czeka na pieniadze

`awaiting_transfer` i `payment_review` wchodza do widoku kolejki, do domyslnej
listy i do bialej listy filtrow. Domyslny widok kolejki to od teraz "wszystko,
co czeka na RUCH Z NASZEJ STRONY", a czekajaca wplata jest dokladnie tym.

Oba stany wchodza razem, bo z punktu widzenia pracowni znacza jedno: pieniadze
nie sa jeszcze rozstrzygniete, a zlecenie stoi. Przyczyna jest inna i to widac
w wierszu, ale miejsce jest jedno.

### 2. Potwierdzenie wplaty to PIERWSZY KROK kolejki, a nie osobny formularz

Formularz stoi pod przystankiem "Zapłata", tak samo jak kazda inna akcja stoi
pod przystankiem, na ktorym zlecenie sie znajduje (ADR-0028, punkt 8). Zostaje
przy tym rozroznienie na potwierdzenie zwykle i "mimo roznicy": niedoplata nie
jest bledem, tylko decyzja, wiec API odmawia i podaje roznice, a swiadome
przyjecie ma wlasny przycisk.

`payment_review` nie dostaje zadnego przycisku i to jest celowe. Pieniadze
pobrano, zlecenia nie uruchomiono, wiec najpierw sprawdza sie platnosc i stan
magazynu, a dopiero potem decyduje. Wiersz podaje powod i mowi wprost, na czym
stoi sprawa.

### 3. Strona `/transfers` znika, adres przekierowuje

Dwa miejsca robiace to samo rozjezdzaja sie przy pierwszej zmianie. Adres
zostaje jako przekierowanie na kolejke z filtrem, bo jest w zakladkach.
Rezygnacje i zamowienia wygasle maja w kolejce wlasny filtr, "Zamknięte bez
zapłaty", wiec nic z tamtej strony nie ginie.

### 4. Os czasu klienta zaczyna sie PRZY zaplacie, a nie po niej

Strona zamowienia rysuje os takze dla `awaiting_transfer` i `payment_review`.
Pierwszy przystanek nazywa sie wtedy "Zapłata", nie ma stempla i swieci jako
biezacy. Po zaksiegowaniu wplaty dostaje date i zielen, a zapala sie kolejka.

Nazwa zalezy od stempla, a nie od statusu: "Zapłacone" bez daty przy zamowieniu,
ktore wlasnie prosimy o przelew, byloby zdaniem nieprawdziwym, i to postawionym
obok ekranu z danymi do przelewu.

## Alternatywy i powody odrzucenia

- **Dolozenie `awaiting_transfer` do `ETAPY_KOLEJNO`.** Wygladalo na najprostsze,
  ale `ETAPY_KOLEJNO` to LISTA KOLEJNYCH etapow pracy: napedza przejscia,
  stemple i kasowanie stempli przy cofnieciu. `awaiting_transfer`
  i `payment_review` to dwie ALTERNATYWNE drogi do tego samego `paid`, a nie
  dwa kolejne kroki, wiec w tej liscie klamalyby o kolejnosci. Zostaja poza
  nia: widok kolejki jest szerszy niz lista etapow pracy i tak ma byc.
- **Osobny, nowy przystanek "Zapłata" przed "Zapłacone".** Dwie kropki o tej
  samej rzeczy. Przystanek zaplaty juz istnieje, brakowalo mu tylko stanu
  "jeszcze nie".
- **Zostawienie `/transfers` jako widoku pomocniczego.** Odrzucone przez
  wlasciciela: dwa miejsca o tych samych zamowieniach rozjezdzaja sie przy
  pierwszej zmianie, a rozjazd w panelu konczy sie zleceniem obsluzonym dwa
  razy albo wcale.

## Konsekwencje

- **Domyslna lista kolejki jest dluzsza** o zamowienia, ktore czekaja na wplate.
  To jest cel: dotad nie bylo ich widac nigdzie poza wlasna strona.
- **Zegar i termin przy tych stanach nie istnieja.** Kolumna terminu jest pusta,
  a przypomnienia ich nie dotycza, bo zegar rusza dopiero w `queued`
  (ADR-0028). Wiersz nie udaje, ze cokolwiek jest spoznione.
- **Klient w euro widzi cala droge od pierwszej chwili**, razem z odpowiedzia na
  pytanie "czy potwierdziliscie wplate".
- **Maile sie nie zmieniaja.** Dane do przelewu i potwierdzenie przyjecia
  naleznosci wychodzily juz wczesniej i wychodza tak samo.

## Niezmienniki i testy

- Kazdy stan z bialej listy kolejki ma nazwe w mapie `STAN` w panelu. Bez tego
  widok wywala sie na `STAN[o.status].label`. Test: `scripts/test-production-queue.mjs`.
- Formularz wplaty stoi pod przystankiem "Zapłata", a nie w osobnym widoku.
  Test: `scripts/test-production-queue.mjs`.
- Platnosc do recznej decyzji jest widoczna dla pracowni razem z powodem.
  Test: `chat-api/paymentSafety.test.mjs`.
- Atrapa kolejki w `admin/check-views.mjs` zawiera zamowienie czekajace na
  przelew, wiec kontrola szablonow naprawde renderuje te sciezke.

## Synchronizacja

- `chat-api/context.js`: asystent wie, ze zamowienie w euro widac na stronie
  zamowienia razem z osia czasu.
- `PROJECT_RULES.md`: sekcja o kolejce.
