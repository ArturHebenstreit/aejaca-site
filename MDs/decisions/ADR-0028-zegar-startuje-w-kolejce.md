---
status: draft
owner: Artur
date: 2026-08-29
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0013-kolejka-pracowni.md
  - MDs/decisions/ADR-0026-zaplata-zamyka-pozycje.md
  - MDs/decisions/ADR-0027-termin-realizacji-i-przypomnienia.md
  - chat-api/productionQueue.js
  - chat-api/server.js
  - chat-api/quotes.js
  - src/pages/OrderStatus.jsx
  - admin/views/queue.ejs
  - admin/server.js
  - scripts/test-production-queue.mjs
---

# ADR-0028: Zegar startuje w kolejce, a nie przy wzieciu zlecenia do reki

## Kontekst

Zlecenie na kolejke opisane 2026-08-29 wprowadzalo miedzy zaplate a prace stan
oczekiwania: zamowienie czeka, az ktos w pracowni kliknie "biore do realizacji".
W opisie stan ten mial dwie nazwy, "Oczekuje na pobranie do realizacji" oraz
"Gotowy do pobrania", i opisywal jedna sytuacje: ustalenia domkniete, praca
jeszcze nie ruszyla.

Wazniejsza byla druga sprzecznosc. Do ADR-0027 termin realizacji stemplowal sie
przy wejsciu w `in_production`, czyli w chwili wziecia zlecenia do reki. Dolozenie
przed nim stanu oczekiwania znaczyloby, ze kazdy dzien lezenia w kolejce
przesuwa termin razem z soba, a klient ma w mailu i na stronie zamowienia date
sprzed tego przesuniecia. Bylaby to zmiana umowy z klientem przebrana za zmiane
panelu, i to zmiana niewidoczna: zadna kwota by sie przy tym nie ruszyla.

## Decyzja

### 1. Jeden stan, jedna nazwa: `queued`, "Gotowe do pobrania"

Dwie nazwy w kodzie daly by dwa stany, a roznicy miedzy nimi nikt nie umialby
wskazac. Stan nazywa sie `queued` i znaczy: pieniadze u nas, ustalenia
domkniete, praca jeszcze nie ruszyla.

### 2. Termin stempluje sie tam, gdzie zostal obiecany

`deadline_at` powstaje przy wejsciu w `queued`, czyli w chwili, od ktorej klient
liczy dni:

- zlecenie bez znacznika ustalen dostaje termin w chwili zaplaty;
- zlecenie ze znacznikiem dostaje go przy domknieciu ustalen, bo do tej pory
  czekamy na klienta, a nie on na nas.

Wziecie zlecenia do reki (`in_production`) jest znacznikiem PRACY, a nie
zdarzeniem terminowym. Stempluje wlasna kolumne i nie rusza terminu. Zwloka
w kolejce zjada nasz zapas, a nie termin klienta, i tak ma byc: to my
obiecalismy date.

### 3. Przypomnienia patrza na trzy etapy, nie na jeden

Zegar biegnie w `queued`, `in_production` i `ready`. Zlecenie zrobione, ale
niewyslane, ma przed soba dokladnie ten termin, o ktory chodzi najbardziej:
dzien nadania. Pytane wylacznie o `in_production` milczaloby wtedy, kiedy paczka
lezy spakowana i nie jedzie.

### 4. Znaki w panelu znacza wszedzie to samo

Olowek otwiera wiersz do edycji, zielony znak zatwierdza, zawinieta strzalka
wycofuje sie bez zmian, krzyzyk usuwa. Krzyzyk NIE zamyka formularza: gdyby raz
zamykal, a raz kasowal, roznica miedzy pomylka a utrata danych bylaby kwestia
tego, gdzie akurat stoi kursor. Zestaw stoi raz, w `app.locals.IKONY`, i jest
do wziecia w kazdym widoku panelu.

Pole zaznaczane, ktore jest zaznaczone i nieaktywne, zastapil napis o stanie
rzeczy. Martwy przelacznik uczy wylacznie tego, ze klikniecia czasem nie
dzialaja.

### 5. Postep jest osia czasu, a przycisk stoi pod przystankiem

Etapy leza na jednej linii, ze stemplami pod nazwami, a przycisk stoi pod tym
przystankiem, DO KTOREGO prowadzi. Widac wtedy nie tylko, co mozna zrobic, ale
i dokad to przesunie zlecenie. Termin domyka os, bo jest tym, do czego ona
zmierza: pojawia sie sam w chwili, gdy zegar rusza.

Przystanek wysylkowy potrzebuje dwoch pol, wiec jest rozwijany. Reszta to
pojedyncze przyciski, bo rozwijanie czegos, co ma jedna mozliwosc, jest samym
klikaniem.

Zapis i wycofanie stoja PRZY WIERSZU, a nie na dole rozwinietego panelu: przy
dlugim zleceniu trzeba bylo do nich przewijac, a wracalo sie do wiersza, ktory
wyszedl juz poza ekran. Wiaze je z formularzem atrybut `form`, wiec dzialaja bez
skryptu. Kazda ikona ma dymek, bo znak jest krotki, ale cichy, a jeden z nich
kasuje zlecenie.

### 6. Kasowanie oplaconego zlecenia mowi, co robi

Krzyzyk otwiera ostrzezenie i pole na przepisanie numeru, a nie kasuje od razu.
Przy zleceniu oplaconym ostrzezenie nazywa rzecz po imieniu: platnosc zostaje
bez zamowienia, wiec ksiegowosc i panel przestaja sie zgadzac, a zwykla droga
jest anulowanie.

### 7. Ustalenia stoja przy POZYCJI, a zegar czeka na ostatnia z nich

Uzupelnienie z 2026-08-30. Znacznik na zamowieniu mowil tylko "cos wymaga
rozmowy" i nie umial powiedziec, co jeszcze zostalo: przy trzech pozycjach
z jedna do ustalenia caly zegar stal, a pracownia nie wiedziala, na co czeka.

Znacznik jedzie wiec z pozycji oferty do pozycji zamowienia i zamraza sie
razem z cena. Kazda pozycja, ktora go ma, dostaje w panelu wlasne pole
zaznaczane; pozycja bez wymogu nie dostaje go wcale, bo pytanie "czy ustalone"
nie mialoby przy niej tresci. Zegar calego zamowienia rusza w chwili, gdy
stempel ma juz kazda pozycja, ktora go wymagala.

Odznaczenie dziala w druga strone i jest calym powodem, dla ktorego zegar da
sie zatrzymac: klient odzywa sie z uwaga po tym, jak uznalismy temat za
zamkniety, a termin liczony dalej bylby terminem na prace, ktorej nie mozemy
zaczac. Zamowienie wraca wtedy do ustalen razem z terminem i sladem po
przypomnieniach.

Osobny przycisk "ustalenia domkniete" znika. Dwa miejsca robiace to samo
rozjechalyby sie przy pierwszej pozycji, o ktorej ktos zapomni.

### 8. Przycisk stoi pod przystankiem, NA KTORYM zlecenie stoi

Poprawka do punktu 5, decyzja wlasciciela z 2026-08-30. Przycisk pod
przystankiem docelowym czytal sie jako "co juz sie stalo". Teraz mowi, co
mozna zrobic z miejsca, w ktorym zlecenie jest: pod "gotowe do pobrania"
stoi "biore do realizacji", pod "w realizacji" stoi "zakonczone", a pola
wysylki pojawiaja sie dopiero przy "gotowe do wysylki", bo dopiero wtedy
jest co nadawac.

Zaznaczenie "przekazane osobiscie" chowa numer przesylki: kurier wtedy nie
jechal i nie ma czego sledzic. Sposob dostawy z zamowienia ustawia tylko stan
poczatkowy tego pola, bo paczka bywa odbierana osobiscie mimo wybranego kuriera.

### 9. Termin zmieniony po zaplacie niesie date ustalenia

`lead_days` przychodzi z oplaconej oferty. Zmiana po zaplacie jest zmiana
umowy, a nie poprawka literowki, wiec API zada `lead_days_agreed_at`, czyli
daty maila, w ktorym klient sie zgodzil. Bez niej w bazie zostawalaby liczba,
ktorej za pol roku nikt nie umie uzasadnic.

### 10. Klient widzi os czasu, a nie sama date

Strona zamowienia pokazywala termin i nic wiecej, a klient pyta przede
wszystkim "co sie dzieje". Os stoi w pionie, bo strona zamowienia jest waska
kolumna, a piec przystankow w poziomie lamalo podpisy na dwie linie.

Etapy "gotowe do pobrania" i "w realizacji" sa dla klienta JEDNYM stanem:
w obu zaplacil, przyjelismy i termin biegnie. Roznica jest wewnetrzna. Daty
formatujemy z napisu, a nie przez `Intl`, bo dane ICU w Node i w przegladarce
bywaja z roznych wersji, a rozjazd wyrzuca cale poddrzewo (ADR-0022).

### 11. Link do zamowienia stoi w kolejce

Ten sam adres, ktory poszedl mailem po zaplacie, z przyciskiem kopiowania,
tak samo jak przy ofercie. Klient gubi maile, a bez zetonu strona zamowienia
pyta go o numer i adres. Dotad jedyna droga bylo szukanie starej wiadomosci.

### 12. Znacznik ustalen da sie poprawic w kolejce

Zamraza sie przy zaplacie, ale zlecenia sprzed jego wprowadzenia go nie maja,
a zdarza sie tez, ze rzecz wymagajaca rozmowy przeszla przez oferte bez niego.
Bez pola w kolejce takie zlecenie na zawsze mowiloby "ustalenia nie byly
wymagane" i nigdy nie stanelo by na wlasciwym przystanku osi.

## Alternatywy i powody odrzucenia

- **Zegar startuje przy pobraniu do pracy.** Wtedy oferta nie moze obiecywac
  daty, tylko "14 dni od przyjecia do realizacji", i trzeba to zmienic w ofercie,
  mailu i na stronie zamowienia. Uczciwe, ale slabsze dla klienta: data jest
  konkretem, a "od przyjecia" jest terminem bez poczatku. Odrzucone przez
  wlasciciela 2026-08-29.
- **Zostawienie `paid` jako "gotowe do pobrania".** Bez nowego statusu, ale
  `paid` znaczylby wtedy dwie rzeczy naraz: stan przelotowy po ITN i stan
  oczekiwania w kolejce. Cofniecie ustalen nie mialoby dokad wracac.
- **Osobna kolumna "ustalenia domkniete".** Rozjechalaby sie ze statusem
  w pierwszym tygodniu. Etap JEST statusem (ADR-0013).

## Konsekwencje

- **Zamowienia stojace w `paid` migruja na `queued`.** Terminu im nie dorabiamy:
  zaden nie ma `lead_days`, a data policzona wstecz od dzisiaj bylaby data
  wymyslona, ktorej klient nigdy nie widzial.
- **Zlecenie moze byc spoznione, zanim ktokolwiek je otworzyl.** To nie jest
  usterka, tylko sens tej zmiany: przypomnienie przychodzi wtedy, kiedy jeszcze
  da sie zdazyc.
- **Klient nie widzi roznicy miedzy "gotowe do pobrania" a "w realizacji".**
  Dla niego oba znacza jedno: zaplacil, przyjelismy, termin biegnie. Roznica
  jest wewnetrzna i dotyczy tego, czy ktos wzial zlecenie do reki.
- **Poprawienie liczby dni przelicza termin od startu zegara, a nie od dzisiaj.**
  Inaczej poprawienie literowki w liczbie przesuwaloby date o tyle, ile zlecenie
  zdazylo przelezec. Data wpisana wprost wygrywa z przeliczona, bo jest decyzja,
  a nie wynikiem.
- **Warunki na `status = 'paid'` przy ITN przestaly cokolwiek chronic** i zostaly
  poszerzone na wszystkie etapy po zaplacie. Od ADR-0027 `paid` trwa ulamek
  sekundy, wiec druga, dziwna ITN wciagalaby do weryfikacji zlecenie, ktore juz
  stoi w robocie, a `FAILURE` po udanej platnosci pokazywalby klientowi nieudana
  platnosc za rzecz, ktora wlasnie robimy.
- **Kolejka jest lista jednowierszowa z sortowaniem.** Domyslnie od najnowszej
  wplaty (decyzja wlasciciela), z "po terminie" jednym kliknieciem obok.
  Sortowanie idzie do `ORDER BY` przez interpolacje, wiec bierze sie z bialej
  listy: `ORDER BY` nie przyjmuje parametru wiazanego.

- **Korekta skladala zapytanie, ktore nie mialo prawa sie wykonac.** Przypisania
  szly plaska lista, a Postgres odrzuca `SET a = 1, a = 2`, i to dopiero w bazie.
  Cofniecie etapu z "wyslane" kasuje list przewozowy, a formularz panelu przysyla
  go przy kazdym zapisie, wiec kazde takie cofniecie konczylo sie bledem 500.
  Teraz przypisania stoja pod nazwa kolumny i wygrywa pozniejsze.

## Niezmienniki i testy

- `ETAP_STARTU_ZEGARA` to `queued`, a `in_production` stempluje wlasna kolumne.
  Test: `scripts/test-production-queue.mjs`, sekcja 7.
- Kazdy etap z `ETAPY_KOLEJNO` ma nazwe w panelu i zamyka pozycje oferty.
  Etap pominiety w `ZAMOWIENIE_DOSZLO` spada na "zajeta", czyli na zdanie
  "ktos wlasnie za to placi", i oferta obiecywalaby zwolnienie pozycji juz
  zaplaconej. Test: sekcja 9, po jednym sprawdzeniu na etap.
- Kolejnosc listy bierze sie z bialej listy, a nie z parametru zadania.
- Nazwa ikony uzytej w widoku musi istniec w `app.locals.IKONY`. Sprawdza
  `admin/check-views.mjs`: `IKONY` jest obiektem, wiec literowka nie wywala
  renderu, tylko zostawia pusty przycisk.

## Synchronizacja

- `scripts/orders-schema.sql`: kolumna `queued_at`, status `queued`, indeksy.
- `PROJECT_RULES.md`: sekcja o terminie realizacji.
- `CLAUDE.md`, `AGENTS.md`: regula zglaszania nielogicznosci przed kodem.
