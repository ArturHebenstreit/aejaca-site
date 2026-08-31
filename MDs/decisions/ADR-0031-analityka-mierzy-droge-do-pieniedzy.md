---
status: draft
owner: Artur
date: 2026-08-31
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0023-adresy-z-prefiksem-jezyka.md
  - src/utils/analytics.js
  - chat-api/zrodlaRuchu.js
  - chat-api/server.js
  - admin/analityka.js
  - admin/views/analytics.ejs
---

# ADR-0031: Analityka mierzy droge do pieniedzy, a nie sam ruch

## Kontekst

Licznik odwiedzin dziala w serwisie od maja 2026 i jest wlasny: bez ciasteczek,
bez zapisu czegokolwiek w urzadzeniu odwiedzajacego, z identyfikatorem wizyty
losowanym w pamieci karty. Ta konstrukcja zostaje i jest swiadoma (art. 398
Prawa komunikacji elektronicznej: zapis w urzadzeniu wymagalby zgody, czyli
banera).

Do 31 sierpnia 2026 zbieral jednak za malo, zeby na jego podstawie cokolwiek
postanowic, a ekran w panelu opisywal serwis, ktorego juz nie ma:

- **Nie bylo wiadomo, skad przychodza.** `trackPageView(path, referrer)`
  przyjmowal referrer i go wyrzucal, parametrow `utm_*` nie czytal nikt.
  Google, Instagram, odnosnik w mailu i wejscie wprost byly nierozroznialne.
- **Sklep nie wysylal ani jednego zdarzenia.** Karta produktu, karta uslugi,
  koszyk i kasa powstaly po tym liczniku i nikt go nie dopial. Statystyka
  konczyla sie na kalkulatorze.
- **Zamowienia i wyceny nie wskazywaly wizyty.** `leads.session_id` istnialo
  i backend je czytal, ale serwis nigdy tego pola nie wysylal, wiec kolumna
  stala pusta. Pytanie "ktore zrodlo ruchu przynosi przychod" nie mialo
  w danych zadnej odpowiedzi.
- **Ekran panelu pokazywal same liczby, bez porownania**, wiec nie dalo sie
  z niego wyczytac trendu, a jego "lejek kalkulatora" szukal sciezek
  `/jewelry/` i `/studio/`, ktore po ADR-0023 i po wejsciu sklepu nie sa
  miejscem, gdzie cokolwiek sie dzieje.
- **Tabela `events` nie miala ani jednego indeksu** przy dwuletniej retencji,
  a kraj byl pobierany z zewnetrznej uslugi W TRAKCIE zadania, z oczekiwaniem
  do trzech sekund na kazdym nowym odwiedzajacym.

## Decyzja

### 1. Mierzymy droge, a nie odwiedziny

Zbieramy to, co pozwala odtworzyc cala droge: **skad przyszli** (referrer,
`utm_*`), **na co weszli** (pierwsza strona wizyty), **co ich zatrzymalo**
(czas widocznej karty, przewijanie), **co zrobili** (kalkulator, koszyk, kasa)
i **czym sie to skonczylo** (zapytanie, zamowienie, zaplata).

Zdarzenia sklepu doszly w jednym miejscu na krok: dodanie i usuniecie
z koszyka liczy `CartContext`, a nie kazdy przycisk w serwisie, bo do koszyka
wklada sie z czterech roznych miejsc i cztery kopie licznika rozjechalyby sie
przy piatym.

### 2. Kanal ruchu ustala serwer, nie przegladarka

Przegladarka wysyla surowy referrer i `utm_*`. Nazwe kanalu (wyszukiwarki,
spolecznosciowe, poczta, platne, polecenia, asystenci AI, wprost) nadaje
`chat-api/zrodlaRuchu.js`. Powod jest praktyczny: listy domen trzeba poprawiac,
a poprawka na serwerze wchodzi z jednym wdrozeniem, podczas gdy poprawka
w przegladarce dziala dopiero u tych, ktorzy pobiora nowy serwis.

Zapisujemy JEDNO I DRUGIE: kanal do liczenia i surowe zrodlo do zajrzenia,
gdy liczba wyglada dziwnie. Kampania oznaczona przez nas (`utm_*`) wygrywa
z referrerem, bo jest jedyna informacja wpisana swiadomie.

### 3. Zamowienie i wycena wskazuja wizyte

`orders.session_id` i `quotes.session_id` (oraz dzialajace juz
`leads.session_id`) zamykaja lejek: dopiero one pozwalaja powiedziec, ze
strona narzedziowa przyniosla przychod, a nie tylko ruch. Identyfikator jest
losowy, zyje w pamieci karty i nie laczy dwoch wizyt, wiec nie zmienia niczego
w prywatnosci.

### 4. Kokpit zamiast tabel, ale z wejsciem w wiersze

Ekran analityki pokazuje w tej kolejnosci: sygnaly (co wymaga reakcji), kafle
z porownaniem do poprzedniego okresu, wykres dzienny, pozyskanie, strony
wejscia, tresc, dwa lejki (sklep i wycena), geografia, wybory w kalkulatorach.

**Kazda liczba prowadzi do wierszy, z ktorych powstala**: klikniecie w wiersz
zestawienia otwiera liste pojedynczych wizyt, a wizyta otwiera swoja sciezke
zdarzenie po zdarzeniu razem z tym, czym sie skonczyla. Wykres, pod ktory nie
da sie zajrzec, sluzy do wierzenia, a nie do decydowania.

### 5. Liczba bez porownania nie trafia na ekran

Kazdy kafel niesie te sama liczbe z poprzedniego okresu tej samej dlugosci
i kierunek zmiany. "82 wizyty" nie znaczy nic; "82, czyli o 40 procent mniej
niz poprzednio" znaczy wszystko.

### 6. Sygnaly mowia, co zrobic

Kokpit wylicza kilka progow i pisze zdanie z zaleceniem: spadek ruchu ponad
25 procent, ruch bez zadnego zapytania, odrzucenia powyzej 70 procent, strona
wejscia z realnym ruchem i zerem zapytan, kanal bez interakcji, ucieczka miedzy
koszykiem a kasa, zamowienia zlozone i nieoplacone. Progi maja minimalne
progi wielkosci probki, zeby przy dziesieciu wizytach nie robic alarmu z zera.

### 7. Czego celowo nie mierzymy

**Powracajacych i atrybucji dluzszej niz jedna wizyta.** Wymagalyby zapisu
w urzadzeniu, czyli banera zgody. Decyzja wlasciciela z 2026-08-31: zostajemy
bez ciasteczek i mierzymy cala populacje odwiedzajacych, zamiast mierzyc
dokladniej te czesc, ktora klika "zgadzam sie".

**Wlasnego ruchu, ale przez OZNACZENIE, a nie przez wyrzucanie.** Adres IP
sie tu nie nadaje: wlasciciel oglada serwis z trzech urzadzen, z domu, z pracy
i z telefonu, a adres ma zmienny. Przegladarka nie zdradza zadnego
identyfikatora urzadzenia (podaje system i przegladarke, wspolne dla milionow
ludzi) i tak ma byc.

Zostaje znacznik, ktory wlasciciel ustawia sobie sam: wejscie na
`www.aejaca.com/?nolicz=1` zapisuje jeden klucz w tej przegladarce,
`?nolicz=0` go kasuje. **To jedyna rzecz, ktora licznik zapisuje w urzadzeniu**,
i jest wyjatkiem uzasadnionym: zapisuje ja swiadomie sam zainteresowany, sluzy
wylacznie wylaczeniu zliczania i nie niesie zadnej informacji o czlowieku.
Trzeba go ustawic raz na kazdej przegladarce i powtorzyc po wyczyszczeniu
danych.

Zdarzenia z oznaczonego urzadzenia **nadal trafiaja do bazy**, z flaga
`internal`. Kokpit ich domyslnie nie liczy, ale pokazuje je przelacznikiem
"z moim ruchem". Wyrzucanie ich przy zapisie byloby prostsze i gorsze: brak
wpisow wyglada dokladnie tak samo, gdy znacznik dziala, i gdy licznik jest
zepsuty. Odsiewanie musi stac w KAZDYM zapytaniu kokpitu, inaczej jeden ekran
podaje dwie rozne prawdy (test: `admin/analityka.test.mjs`).

**Stan znacznika widac na stronie, a nie w panelu, i nie jest to niedorobka.**
Znacznik nalezy do pamieci przegladarki pod adresem `www.aejaca.com`. Panel
administracyjny stoi pod innym adresem, wiec tej pamieci nie odczyta, a ramka
z naszym adresem osadzona w panelu tez nie pomoze: przegladarki dziela pamiec
osobno dla kazdej strony nadrzednej, wiec taka ramka widzialaby PUSTA polke
i pokazywalaby "liczony" nawet dla oznaczonego urzadzenia. Falszywa lampka jest
gorsza od braku lampki.

Stad podzial:

- **Serwis** pokazuje plakietke (`src/components/ZnacznikRuchu.jsx`) w rogu, gdy
  znacznik stoi albo gdy wlasnie uzyto parametru. Ta sama plakietka przelacza
  stan jednym klikniecem, wiec parametru nie trzeba pamietac. Zwykly
  odwiedzajacy nie zobaczy jej nigdy, bo bez znacznika i bez parametru
  komponent nie rysuje niczego. Trzeci stan, "przegladarka nie daje pamieci",
  nazywamy wprost, zamiast udawac "liczony": inaczej klikanie nie dawaloby
  zadnego skutku i wygladalo na zepsute.
- **Parametr znika z adresu**, gdy zadziala. Zostawiony odwracalby kazde
  pozniejsze przelaczenie z plakietki, bo znacznik ustala sie przy kazdej
  odslonie, a przy okazji adres z parametrem trafialby do zakladek.
- **Panel** pokazuje na pulpicie to, co naprawde wie: ile oznaczonych zdarzen
  przyszlo w siedem dni, z ilu wizyt i kiedy ostatnie. To jest dowod ze skutku,
  a nie deklaracja, i odpowiada na jedyne pytanie, ktore panel moze rozstrzygnac:
  czy oznaczanie w ogole dziala. Obok stoja odnosniki otwierajace serwis
  z parametrem, bo przelaczyc da sie tylko tam.

Skrot analityki na pulpicie panelu liczy **to samo, co pelna analityka**, czyli
bez wlasnego ruchu. Dwie liczby pod jedna nazwa, rozne o wejscia wlasciciela,
bylyby gorsze niz brak skrotu.

Uzupelniajaco zostaje `ANALYTICS_IGNORE_IPS` (zmienna srodowiskowa chat-api,
adresy po przecinku, nigdzie niezapisywane) dla stalego adresu, gdyby taki
kiedys byl.

**Ruchu maszynowego.** Roboty wyszukiwarek nie wykonuja JavaScriptu i tu nie
docieraja, ale narzedzia do sprawdzania stron i przegladarki sterowane
skryptem juz tak. Odsiewa je lista wzorcow w `zrodlaRuchu.js`.

## Alternatywy i powody odrzucenia

- **Google Analytics 4.** Gotowe raporty i zero pracy, ale wymaga banera zgody
  i zgody na przekazanie danych poza UE, a przy naszym ruchu odsialoby czesc
  odwiedzajacych. Do tego przenosi wiedze o wlasnych klientach do cudzej
  usludze, ktorej nie da sie odpytac SQL-em razem z tabela zamowien.
- **Plausible albo Umami we wlasnej instancji.** Sensowne i tanie, ale to
  kolejna usluga do utrzymania, a zadne z nich nie zna naszych zamowien, wiec
  i tak trzeba by laczyc dane recznie. Mamy juz tabele zdarzen w tej samej
  bazie co zamowienia i to jest przewaga, ktorej te narzedzia nie daja.
- **Klasyfikacja kanalow w przegladarce.** Prostsze, ale kazda poprawka listy
  domen dzialalaby dopiero u tych, ktorzy pobiora nowy serwis.
- **Wyliczanie strony wejscia dopiero w zapytaniu, bez zapisu zrodla.** Strone
  wejscia da sie policzyc z pierwszego zdarzenia sesji i tak robimy. Zrodla
  policzyc sie nie da: referrer istnieje tylko w chwili wejscia.
- **Zapis pochodzenia raz na sesje, w osobnym wierszu.** Mniej danych, ale
  kazde zestawienie musialoby dolaczac ten wiersz. Kilkadziesiat bajtow na
  zdarzenie jest tansze niz zlaczenie w kazdym zapytaniu i w kazdej glowie,
  ktora te zapytania czyta.

## Konsekwencje

- **Zdarzenie urosло** o referrer, trzy pola `utm_*`, kanal, zrodlo i jezyk.
  Przy naszym ruchu to kilka megabajtow rocznie, przy dwuletniej retencji.
- **Tabela `events` dostala cztery indeksy.** Bez nich kazdy wykres skanowal
  dwa lata historii.
- **Kraj przestal blokowac odpowiedz.** Licznik odpowiada od razu, a kraj
  dopisuje sie do wierszy TEJ sesji, gdy zewnetrzna usluga odpowie. Wazne:
  dopisanie musi byc ograniczone do sesji z tej paczki, bo stemplowanie
  wszystkich wierszy bez kraju byloby falszem, ktory wyglada poprawnie.
- **Kolumna `session_id` w zamowieniach i wycenach** sluzy WYLACZNIE
  statystyce. Nie wolno jej uzywac do rozpoznawania klienta ani do dostepu.
- **Stary licznik na Cloudflare Workers (`workers/analytics`) jest martwy.**
  Punkt zbiorczy wskazuje chat-api. Katalog zostaje do usuniecia osobna zmiana.
- **Zdarzenia sprzed 31 sierpnia 2026 nie maja kanalu ani jezyka.** Zestawienia
  pokazuja je jako "wprost" i "(brak)", i to jest uczciwe: nie zgadujemy
  wstecz. Pierwszy pelny miesiac porownawczy to wrzesien 2026.

## Niezmienniki i testy

- Wymiar zestawienia przychodzi z paska adresu i trafia do zapytania jako nazwa
  kolumny, wiec MUSI przechodzic przez biala liste. Test:
  `admin/analityka.test.mjs` (proba z `DROP TABLE` w wymiarze).
- Wartosc filtru idzie parametrem zapytania, nigdy przez sklejanie.
  Test: `admin/analityka.test.mjs`.
- Przychod liczy sie wylacznie z zamowien z data zaplaty.
  Test: `admin/analityka.test.mjs`.
- Odbicie to jedna strona BEZ interakcji, a nie sama jedna strona.
  Test: `admin/analityka.test.mjs`.
- Lejek liczy sesje, a nie klikniecia. Test: `admin/analityka.test.mjs`.
- Kanal ruchu: wlasna domena nie jest zrodlem, `utm_*` wygrywa z referrerem,
  domeny przekierowan (`t.co`, `l.instagram.com`) licza sie jak serwis, z
  ktorego pochodza. Test: `chat-api/zrodlaRuchu.test.mjs`.
- Trzy widoki kokpitu renderuja sie na danych. Test: `admin/check-views.mjs`.
- Plakietka stanu stoi w serwisie, panel jej nie udaje, a skrot na pulpicie
  pomija wlasny ruch tak samo jak pelna analityka.
  Test: `scripts/test-wlasny-ruch.mjs`.

## Synchronizacja

- `PROJECT_RULES.md`: zasada, ze nowa sciezka klienta dostaje zdarzenie razem
  z kodem, a nie "kiedys pozniej".
- Zmienna `ANALYTICS_IGNORE_IPS` w usludze chat-api na Railway (opcjonalna).
- Znacznik wlasnego ruchu: wejscie na `www.aejaca.com/?nolicz=1` raz na kazdej
  przegladarce wlasciciela, albo klikniecie w plakietce. Przyciski otwierajace
  oba adresy stoja na pulpicie panelu.
