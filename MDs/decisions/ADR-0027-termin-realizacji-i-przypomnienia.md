---
status: draft
owner: Artur
date: 2026-08-29
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0013-kolejka-pracowni.md
  - MDs/decisions/ADR-0017-uklad-wyboru-w-ofercie.md
  - MDs/decisions/ADR-0022-nic-zaleznego-od-chwili-w-renderze.md
  - MDs/decisions/ADR-0026-zaplata-zamyka-pozycje.md
  - chat-api/productionQueue.js
  - chat-api/deadlineReminders.js
  - chat-api/quotes.js
  - chat-api/server.js
  - src/pages/Offer.jsx
  - src/pages/OrderStatus.jsx
  - admin/views/queue.ejs
  - scripts/test-production-queue.mjs
---

# ADR-0027: Termin realizacji jako dana, a nie jako obietnica z pamieci

## Kontekst

Zlecenie oplacone nie mialo zegara. Termin istnial w rozmowie i w mailu, a
system nie umial powiedziec ani "to wychodzi za trzy dni", ani "to mialo wyjsc
wczoraj". Kolejka (ADR-0013) mowila, co jest do zrobienia, ale nie kiedy.

Zamowienie zostawalo przy tym w stanie `paid` az ktos kliknal w panelu, wiec
nawet gdyby termin istnial, nie mialby od czego biec.

Po stronie klienta bylo jeszcze gorzej: oferta nie mowila, ile sie czeka.
Klient decydowal miedzy wariantami wylacznie cena, choc przy wyrobie
wykonywanym na zamowienie czas bywa wazniejszy.

## Decyzja

### 1. Etap pracy zostaje statusem zamowienia

`orders.status` dostaje dwa nowe etapy zamiast osobnej kolumny obok.
ADR-0013 rozstrzygnal to raz: etap pracy JEST statusem zamowienia plus
stemplem czasu, a nie osobnym bytem. Dwie osie, ktore widzi klient, czyli
stan platnosci i stan realizacji, sa sposobem POKAZANIA jednej wartosci,
a nie dwoma zapisami do trzymania w zgodzie.

| etap | co znaczy | zegar |
|---|---|---|
| `details` | Ustalanie szczegolow zlecenia | **stoi** |
| `in_production` | Zlecenie w realizacji | **biegnie** |
| `ready` | Zrealizowane, czeka na wydanie | biegl, termin juz stoi |
| `shipped` | Wyslane albo przekazane | koniec |

`ready` istnieje, bo miedzy skonczeniem pracy a wydaniem paczki potrafi minac
kilka dni i to wlasnie tam zlecenia gubily sie najlatwiej. `completed`
zostaje jako zamkniecie wiersza, po wydaniu.

### 2. Zaplata pcha zlecenie dalej, znacznik zatrzymuje zegar

Do tej pory zaplata konczyla sie na `paid`. Teraz od razu pcha zlecenie
w `in_production`, bo to ona jest chwila, w ktorej praca sie zaczyna.

Pozycja oferty moze nosic znacznik **"wymaga ustalenia szczegolow
realizacji"**. Wystarczy jedna taka pozycja w koszyku, zeby zamowienie
stanelo najpierw w `details`: zamowienia nie da sie zaczac w polowie.

W `details` **zegar nie biegnie**, i to jest cala tresc tego etapu. Czekamy
w nim na klienta, a nie on na nas, wiec liczenie mu terminu byloby liczeniem
cudzego czasu. Termin rusza dopiero przy przestawieniu na `in_production`
i liczy sie OD TEJ CHWILI, a nie od zaplaty.

### 3. Termin to najdluzszy z wybranych

Pozycja oferty niesie `lead_days`, w dniach KALENDARZOWYCH. Dni robocze
odpadly swiadomie (decyzja wlasciciela z 2026-08-29): kalendarz swiat to
osobny problem i nie ma powodu wciagac go do pierwszej wersji.

Sklada sie to w dwoch krokach, obydwa ta sama regula:

- **grupa wyboru** bierze termin najdluzszy sposrod swoich pozycji,
- **zamowienie** bierze najdluzszy sposrod pozycji, ktore do niego weszly.

Wlasciciel rozwazal branie terminu z pierwszej pozycji grupy i odrzucil to
w trakcie: skoro zaplacone zlecenie i tak bierze najdluzszy, grupa nie ma
powodu robic inaczej, a dwie reguly znaczylyby dwie rozne liczby na jednej
karcie. **Paczka wychodzi jedna**, wiec calosc czeka na to, co robi sie
najdluzej, i to jest jedyny powod tej reguly.

Termin liczy sie z tego samego zaznaczenia, co kwota (`selectedQuoteItems`),
wiec przestawienie wariantu zmienia obie liczby naraz i klient nigdy nie widzi
ceny jednego ukladu obok terminu drugiego. Przy ofercie kupowanej po kawalku
(ADR-0026) drugie wejscie liczy termin od nowa, z tego, co wlasnie zaznaczone.

Termin ZAMRAZA sie na zamowieniu w chwili zaplaty, razem z kwota i kursem.
Pozycja oferty zyje dalej i moze go jeszcze zmienic, a to zamowienie ma zostac
takie, jakie klient kupil.

### 4. Termin jest data, nie liczba dni

`orders.lead_days` trzyma umowe ("czternascie dni"), `orders.deadline_at`
trzyma jej skutek ("15 wrzesnia"). Liczba dni przeliczana przy kazdym odczycie
przesuwalaby termin razem z data odczytu i klient widzialby termin, ktory
nigdy nie nadchodzi.

Ile dni zostalo, **liczy serwer**. To nie jest wygoda: data policzona w JSX
wychodzi inna przy buildzie i inna u klienta, React uznaje to za rozjazd
i wyrzuca cale poddrzewo (ADR-0022). Strona zamowienia dostaje wiec gotowa
liczbe, a nie material do liczenia.

### 5. Przypomnienia sa dla nas, nie dla klienta

Progi: **14, 7, 3 i 0 dni** przed terminem. Codzienny przeglad o 7 rano.
Maile ida WYLACZNIE na nasz adres: klient dostal termin w ofercie i widzi go
na stronie zamowienia, a codzienne dopowiadanie mu, ile dni zostalo,
zamieniloby nasza dyscypline w jego niepokoj.

Na przebieg wychodzi **co najwyzej jeden mail**. Zlecenie z terminem
dwudniowym przekracza progi 14, 7 i 3 w tej samej chwili; wyslanie wszystkich
trzech dalo by trzy maile jednego ranka o jednej rzeczy, a szum sie ignoruje
razem z trescia. Bierzemy wiec prog NAJBLIZSZY prawdzie, a dalsze zamykamy
tym samym mailem.

Do listy wlasciciela doszlo jedno przypomnienie: **zlecenie stojace
w `details` dluzej niz trzy dni**, potem co trzy dni. Ten etap nie ma
terminu, wiec bez wlasnego sprawdzenia bylby slepa plama, a jest to najgorszy
rodzaj ciszy: klient juz zaplacil.

Zamowienie wyslane nie dostaje niczego, bo zapytanie o nie jest juz tylko
pytaniem o kuriera.

### 6. Klient sprawdza zlecenie numerem i adresem

Strona `/order/status/` przyjmuje teraz numer zamowienia albo numer oferty
razem z adresem e-mail. To samo pole w sklepie i w koszyku przyjmuje oba
numery i rozsyla je pod wlasciwe strony po prefiksie.

**Sam numer nie wystarcza**, dokladnie tak jak przy ofercie (ADR-0012):
zamowienie niesie nazwisko, telefon i adres.

## Alternatywy i powody odrzucenia

- **Osobna kolumna `production_stage` obok `status`.** Odrzucone: dwa zapisy
  o tym samym, ktore trzeba trzymac w zgodzie, i dwa miejsca mowiace
  "wyslane". Dokladnie to, przed czym ostrzegal ADR-0013.
- **Dni robocze zamiast kalendarzowych.** Odrzucone przez wlasciciela na
  teraz: wymaga kalendarza swiat, a bez niego "dni robocze" znaczy co innego
  w Polsce i co innego w Niemczech, do ktorych tez sprzedajemy.
- **Termin grupy z pierwszej dodanej pozycji.** Rozwazone i odrzucone
  w trakcie, powody w punkcie 3.
- **Przypomnienia takze do klienta.** Odrzucone: patrz punkt 5.
- **Przypomnienie po terminie.** Zaproponowane i odrzucone przez wlasciciela.
  Konsekwencja jest realna i warto ja znac: **po dniu wysylki zlecenie milknie**,
  wiec spoznione przestaje sie odzywac dokladnie wtedy, gdy jest najgorzej.
  Widac je nadal w kolejce, na czerwono, ale nie samo z siebie.
- **Zegar biegnacy takze w ustalaniu szczegolow.** Odrzucone: liczylby czas,
  ktory zuzywa klient, i termin byloby przekroczony, zanim cokolwiek zrobimy.

## Konsekwencje

- **Stan `paid` przestaje w praktyce wystepowac.** Zaplata pcha zlecenie od
  razu dalej. Zostaje w regulach i w kolejce dla wierszy sprzed tej zmiany
  i dla zamowien, ktorych zaplata nie zdazyla przestawic.
- **Odliczenie za projekt musialo poszerzyc warunek.** Czytalo sam stan
  `paid`; po tej zmianie nie znajdowaloby juz niczego i po cichu zniknelo by
  z kasy. Teraz czyta kazdy stan po zaplacie.
- Zamowienie ze sklepu tez wchodzi od razu w `in_production`. Nie ma pozycji
  z terminem, wiec nie ma terminu i nie dostaje przypomnien; kolejka dziala
  jak dotad, tylko wiersz stoi w innej grupie.
- Cofniecie zlecenia przed etap z zegarem kasuje termin ORAZ slad po wyslanych
  przypomnieniach. Zostawiony termin byloby data policzona z pracy, ktora sie
  jeszcze nie zaczela, a zostawione progi zamknelyby drugie podejscie.
- Data wysylki podaje sie z reki. Paczka bywa nadana wczoraj, a zaznaczona
  dzisiaj, i wtedy termin wygladalby na przekroczony o dzien.
- Odbior osobisty konczy sie **przekazaniem**, a nie wysylka: nie pytamy wtedy
  o list przewozowy i nie mowimy klientowi, ze paczka jest w drodze.
- Panel i strona zamowienia licza dni tym samym kodem po stronie serwera. Dwa
  miejsca liczace to samo znaczylyby panel pokazujacy inna liczbe niz klient.

## Niezmienniki i testy

- Termin grupy i termin zamowienia to ta sama funkcja (`terminGrupy`).
- Pozycja odznaczona ani juz sprzedana nie podnosi terminu reszty oferty.
- Pozycja bez terminu nie zaniza terminu grupy.
- Znacznik ustalen liczy sie wylacznie z pozycji zaznaczonych.
- Termin jest data; bez liczby dni albo bez chwili startu nie powstaje.
- Dni do terminu licza sie po dniach, nie po godzinach: o 23:00 i o 6:00 rano
  tego samego dnia wychodzi ta sama liczba.
- Na przebieg wychodzi najwyzej jeden prog, a prog raz wyslany nie wraca.
  Prog zapisuje sie DOPIERO po udanej wysylce: zapis przed nia zamknalby go na
  zawsze przy pierwszej awarii poczty, i to po cichu.
- Szturchniecie liczy sie od ostatniego odezwania sie, nie od wejscia w etap.
- Start zlecenia da sie powtorzyc bez szkody (`AND status = 'paid'` w zapisie).
- Pilnuje tego `scripts/test-production-queue.mjs`, sekcje 7, 8 i 9, w buildzie.
  Kontrola negatywna: termin z pierwszej pozycji zamiast najdluzszego i prog
  najdalszy zamiast najblizszego wychodza na czerwono. **Obie te pomylki
  naprawde popelnilem, a test je zlapal**, i to jest jedyny powod, dla ktorego
  ten akapit tu stoi.

## Synchronizacja

- `chat-api/context.js` i `public/llms.txt`: asystent ma umiec powiedziec,
  skad bierze sie termin i od kiedy biegnie.
- `MDs/AEJaCA_Brand_Reference.md`, rozdzial o ofertach i o kolejce.
- `public/sitemap.xml` bez zmian: obie strony sa bez numeru samym formularzem.
