---
status: accepted
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

Etapy "gotowe do pobrania" i "w realizacji" byly dla klienta JEDNYM stanem.
Punkt 13 to odwoluje. Daty formatujemy z napisu, a nie przez `Intl`, bo dane
ICU w Node i w przegladarce bywaja z roznych wersji, a rozjazd wyrzuca cale
poddrzewo (ADR-0022).

### 11. Link do zamowienia stoi w kolejce

Ten sam adres, ktory poszedl mailem po zaplacie, z przyciskiem kopiowania,
tak samo jak przy ofercie. Klient gubi maile, a bez zetonu strona zamowienia
pyta go o numer i adres. Dotad jedyna droga bylo szukanie starej wiadomosci.

### 12. Znacznik ustalen da sie poprawic w kolejce

Zamraza sie przy zaplacie, ale zlecenia sprzed jego wprowadzenia go nie maja,
a zdarza sie tez, ze rzecz wymagajaca rozmowy przeszla przez oferte bez niego.
Bez pola w kolejce takie zlecenie na zawsze mowiloby "ustalenia nie byly
wymagane" i nigdy nie stanelo by na wlasciwym przystanku osi.

### 13. Klient widzi kolejke osobno, a data nazywa sie planowana finalizacja

Decyzja wlasciciela z 2026-08-30, poprawka do punktow 10 i 3.

**Kolejka jest osobnym przystankiem.** Punkt 10 chowal przed klientem roznice
miedzy "czeka" a "robimy", wiec dwa powiadomienia pod rzad rysowaly ten sam
obrazek, a zlecenie lezace w kolejce przedstawialo sie jako juz robione. Os czasu
ma teraz "Czeka w kolejce" i "W realizacji" osobno, w mailu i na stronie
zamowienia, ze zdaniem mowiacym wprost, ze nikt jeszcze nie wzial zlecenia do
reki, ale termin juz biegnie.

**Data nazywa sie "Planowana finalizacja", nie "Planowana wysylka".** Ta sama
data stala pod nazwa mowiaca o wysylce przy zamowieniu odbieranym osobiscie
i przy zamowieniu, ktore w calosci jest plikiem. Nazwa neutralna jest prawdziwa
we wszystkich trzech drogach i nie kaze rozgalezac etykiety. Mowi tez, czego
data NIE obejmuje: to dzien konca pracy i przekazania paczki, a nie dzien
doreczenia. Angielski: "Planned completion", niemiecki: "Geplante
Fertigstellung".

**Zdanie o wydaniu bierze sie z `delivery_method`.** Wczesniej mail i strona
wyliczaly klientowi obie mozliwosci naraz ("do wysylki albo do odbioru"), choc
sposob dostawy znamy od zamowienia, a przy etapie "wyslane" kod podmienial
fragmenty gotowego zdania, osobno dla kazdego jezyka. Zdania stoja teraz jako
`{ ship, pickup, digital }` i wybiera je jedna funkcja. Podmiana slow wymagala
trzech regulek na jezyk i milczaco przestawala dzialac przy kazdej poprawce
stylistycznej.

**Karta z terminem znika na etapie "gotowe".** Praca jest skonczona, wiec
"planowana finalizacja" z data w przyszlosci przeczylaby zdaniu stojacemu wyzej
w tym samym mailu. Zegar przypomnien to osobna sprawa i dalej obejmuje `ready`
(punkt 3): pracownia ma wiedziec, ze spakowana paczka nie jedzie.

### 14. Doreczenie jest przystankiem, a przewoznika wybiera pracownia

Decyzja wlasciciela z 2026-08-30, poprawka do punktu 5.

**Ostatnia kropka zapala sie dopiero po potwierdzeniu.** "Wyslane" i
"zamkniete" dzielily jeden przystanek, wiec paczka wlozona do paczkomatu
wygladala tak samo jak paczka odebrana, a droga klienta nigdy nie konczyla sie
na zielono. Doreczenie ma wlasny przystanek ("Dostarczone", przy odbiorze
osobistym "Odebrane") ze stemplem `completed_at`, na osi klienta, w mailu
i w panelu. Potwierdzenie zapala CALA os: ostatni przystanek jako "biezacy"
swiecilby na bursztynowo, czyli mowilby "trwa" o czyms, co juz sie stalo.
Przycisk w panelu nazywa sie "Dostarczone", a nie "Zakonczone": pracownia ma
wiedziec, co potwierdza, bo to jest widoczne dla klienta.

**Przewoznika wybiera sie przy nadaniu.** Sam numer przesylki jest dla klienta
ciagiem dwudziestu czterech cyfr. Strefa wysylkowa mowi, kto zwykle wozi w tamta
strone, ale strefy swiatowe nosza dwie nazwy naraz ("DHL / FedEx"), a paczka
jedzie jedna. Kolumna `carrier` trzyma nazwe wybrana w panelu, biala lista stoi
przy strefach (`pricing/shipping.js`), a adres sledzenia buduje jeden pomocnik
uzywany i przez mail, i przez strone zamowienia. Bez wyboru wraca podpowiedz ze
strefy, a przy dwoch nazwach odsylamy do obu: numer w reku i zadnego miejsca do
jego wklejenia jest gorsze niz dwa adresy.

Cofniecie sprzed wysylki kasuje przewoznika razem z numerem: obie rzeczy opisuja
przesylke, ktorej juz nie ma.

## Alternatywy i powody odrzucenia

- **Przewoznik z samej strefy wysylkowej, bez pola w panelu.** Dziala dla
  Polski i Europy, ale strefy swiatowe nosza dwie nazwy naraz i klient
  z Australii dostawalby dwa adresy sledzenia zamiast jednego wlasciwego.
  Zostaje jako droga zapasowa, gdy pracownia nie wybrala nic.
- **Przewoznik jako pole tekstowe.** Napis wpisany z reki przechodzi zapis
  i po cichu nie daje zadnego odnosnika, bo z nazwy budujemy adres. Biala lista
  odrzuca literowke od razu.
- **Rozgalezienie samej etykiety terminu** ("Planowana wysylka" przy kurierze,
  "Gotowe do odbioru" przy odbiorze). Dwie nazwy jednej daty w mailu, na stronie
  zamowienia i w panelu, a przy zamowieniu cyfrowym zadna z nich nie pasuje.
  Jedna nazwa neutralna zalatwia wszystkie trzy drogi.
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

- `scripts/orders-schema.sql`: kolumny `queued_at` i `carrier`, status `queued`, indeksy.
- `PROJECT_RULES.md`: sekcja o terminie realizacji.
- `CLAUDE.md`, `AGENTS.md`: regula zglaszania nielogicznosci przed kodem.
