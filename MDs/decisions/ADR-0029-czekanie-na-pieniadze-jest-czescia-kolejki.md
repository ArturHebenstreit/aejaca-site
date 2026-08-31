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

### 5. Trzy sytuacje po przelewie, i klient slyszy o kazdej

Decyzja wlasciciela z 2026-08-30. Kwota z przelewu bywa inna niz kwota
zamowienia i to nie jest bledem, tylko zyciem: bank posredniczacy sciaga
oplate po drodze, klient przelewa z pamieci albo zaokragla.

**Kwota zgodna** dziala jak dotad: potwierdzenie wplaty rusza zlecenie.

**Kwota inna od zamowienia** rozstrzyga sie progiem: **5 EUR albo 2% kwoty, co
mniejsze**. Sam procent nie wystarcza w obie strony, bo 2% z duzego zamowienia
to juz kwota do rozmowy, a przy malym nie przechodzi nawet prowizja banku.

- **Ponizej progu na minus** wplata liczy sie jak zgodna, a potwierdzenie mowi
  wprost, ze roznice bierzemy na siebie. Zatrzymanie zamowienia na trzy dni
  z powodu dwoch euro kosztuje klienta wiecej niz nas ta roznica.
- **Powyzej progu na minus** idzie prosba o doplate z terminem trzech dni.
  Zamowienie zostaje na przystanku "Zapłata", a termin zapisuje sie w tym samym
  `expires_at`, ktory wygasza zamowienia nieoplacone: drugi zegar do utrzymania
  rozjechalby sie z pierwszym. Brakujacej kwoty NIE zapisujemy osobno, bo to
  roznica dwoch kolumn, ktore juz sa.
- **Na plus** zamowienie rusza od razu, a nadwyzka wraca na rachunek nadawcy.
  Nadplata nie ma prawa blokowac pracy, ktora jest juz oplacona, a pytanie
  klienta o zdanie zostawiloby otwarta sprawe z jego pieniedzmi.

**Brak wplaty** konczy sie tak jak dotad, czyli wygasnieciem po terminie, ale
juz nie po cichu. Klient dostaje wiadomosc, w dwoch wersjach: gdy nie wplynelo
nic, mail mowi, ze przelew wyslany po terminie wroci na rachunek nadawcy; gdy
wplynela czesc, mowi, ze odsylamy te kwote. Mail nie blokuje wygaszania: towar
ma wrocic do sprzedazy niezaleznie od tego, czy poczta zadziala.

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
- **Sam procent jako prog niedoplaty.** Dziala dla jednej wielkosci zamowienia
  i zawodzi dla kazdej innej. Kwota i procent razem, z mniejszej strony, sa
  odporne w obie strony.
- **Pytanie klienta, co zrobic z nadplata.** Uczciwe, ale zostawia otwarta
  sprawe z cudzymi pieniedzmi, a czesc klientow nie odpisze nigdy.
- **Zamkniecie po terminie doplaty przez czlowieka.** Wiecej kontroli, ale
  zamowienie stoi tygodniami, jesli nikt nie zajrzy, a towar lezy zarezerwowany
  dla kogos, kto nie zaplacil.
- **Zostawienie `/transfers` jako widoku pomocniczego.** Odrzucone przez
  wlasciciela: dwa miejsca o tych samych zamowieniach rozjezdzaja sie przy
  pierwszej zmianie, a rozjazd w panelu konczy sie zleceniem obsluzonym dwa
  razy albo wcale.

## Konsekwencje

- **Trasa `/api/orders/awaiting-transfer` znika razem z widokiem.** Te same
  zamowienia oddaje `/api/orders/queue`. Druga trasa o tych samych danych
  rozjechalaby sie z pierwsza przy pierwszej zmianie ksztaltu odpowiedzi.
- **Zamowienie zamkniete bez zaplaty ma wlasne zdanie na stronie zamowienia.**
  Dotad spadalo do galezi domyslnej i mowilo "bank jeszcze nie potwierdzil
  przelewu, to zwykle kwestia kilku minut" komus, kogo zamowienie wygaslo
  tydzien temu. Mail o wygasnieciu wprost zaprasza na te strone, wiec to
  klamstwo bylo od 2026-08-30 widoczne dla kazdego.
- **Domyslna lista kolejki jest dluzsza** o zamowienia, ktore czekaja na wplate.
  To jest cel: dotad nie bylo ich widac nigdzie poza wlasna strona.
- **Zegar i termin przy tych stanach nie istnieja.** Kolumna terminu jest pusta,
  a przypomnienia ich nie dotycza, bo zegar rusza dopiero w `queued`
  (ADR-0028). Wiersz nie udaje, ze cokolwiek jest spoznione.
- **Klient w euro widzi cala droge od pierwszej chwili**, razem z odpowiedzia na
  pytanie "czy potwierdziliscie wplate".
- **Dochodza trzy wiadomosci do klienta**: prosba o doplate, wygasniecie bez
  wplaty i wygasniecie po wplacie czesciowej. Potwierdzenie przyjecia
  naleznosci dostaje jedno zdanie o roznicy, gdy roznica byla.
- **Zamowienie po prosbie o doplate dostaje NOWE trzy dni.** Klient dostal juz
  raz trzy dni na przelew i drugi raz dostaje tyle samo. Termin siedzi
  w `expires_at`, wiec wygasza go ten sam cron co zawsze.

## Niezmienniki i testy

- Kazdy stan z bialej listy kolejki ma nazwe w mapie `STAN` w panelu. Bez tego
  widok wywala sie na `STAN[o.status].label`. Test: `scripts/test-production-queue.mjs`.
- Formularz wplaty stoi pod przystankiem "Zapłata", a nie w osobnym widoku.
  Test: `scripts/test-production-queue.mjs`.
- Platnosc do recznej decyzji jest widoczna dla pracowni razem z powodem.
  Test: `chat-api/paymentSafety.test.mjs`.
- Atrapa kolejki w `admin/check-views.mjs` zawiera zamowienie czekajace na
  przelew, wiec kontrola szablonow naprawde renderuje te sciezke.
- Kazda z trzech sytuacji po przelewie ma wlasne zdanie do klienta, a kwota
  zgodna nie ma zadnego. Test: `scripts/test-mail-klienta.mjs`, sekcja 4i.

## Synchronizacja

- `chat-api/context.js`: asystent wie, ze zamowienie w euro widac na stronie
  zamowienia razem z osia czasu.
- `PROJECT_RULES.md`: sekcja o kolejce.
