---
status: accepted
owner: Artur
date: 2026-08-29
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0012-zaplata-za-oferte.md
  - MDs/decisions/ADR-0015-oferta-wielowariantowa.md
  - MDs/decisions/ADR-0017-uklad-wyboru-w-ofercie.md
  - MDs/decisions/ADR-0020-jeden-termin-waznosci-oferty.md
  - chat-api/quotes.js
  - chat-api/server.js
  - src/pages/Offer.jsx
  - admin/views/quote-edit.ejs
  - scripts/quotes-schema.sql
  - scripts/test-quote-edit.mjs
---

# ADR-0026: Zaplata zamyka pozycje oferty, a nie cala oferte

## Kontekst

Wlasciciel zapytal 2026-08-29 o scenariusz, ktorego system nie umial obsluzyc:
klient dostaje oferte z trzema dodatkami, kupuje jeden i **wraca pod ten sam
link**, bo link zyje tak dlugo, jak oferta.

To, co widzial, bylo zle na trzy sposoby naraz. Strona pokazywala zielona ramke
"ta oferta ma juz zamowienie" i wyszarzala WSZYSTKO: kupiony dodatek zostawal
zaznaczony, wiec wygladal na wybor do zrobienia, a dwa pozostale, ktorych nikt
nie kupil, umieraly razem z nim. Formularz platnosci znikal w calosci, wiec
dokupienie czegokolwiek wymagalo nowej oferty, nowego numeru i nowego watku
w korespondencji.

Zrodlo bylo jedno i stalo w schemacie od poczatku: `quotes.converted_order_id`
z komentarzem "jedna wycena rodzi najwyzej jedno [zamowienie]". Stan "sprzedane"
mieszkal w NAGLOWKU oferty, wiec nie mial jak opisac oferty, w ktorej czesc
rzeczy jest zrobiona, a czesc dopiero do wziecia. Blokowaly na tym cztery
miejsca: konwersja, wybor klienta, wycenianie i edycja.

Ostatnie z nich bylo osobna szkoda. Pierwsze zamowienie zamrazalo cala oferte
takze dla NAS, wiec poprawienie ceny dodatku, ktorego nikt nie kupil, albo
literowki w jego nazwie wymagalo zalozenia oferty od nowa.

## Decyzja

**Zaplata zamyka POZYCJE, a nie oferte.** Stan "sprzedane" schodzi z naglowka
na pozycje, dokladnie tym samym ruchem, ktorym ADR-0017 zniosl na pozycje
wybor, i z tego samego powodu: naglowek jest za gruby, zeby opisac oferte
kupowana po kawalku.

### 1. Jedna kolumna, zero flag

`quote_items` dostaje `order_id`: zamowienie, ktore te pozycje wzielo. I tyle.

Obok niej **celowo nie ma flagi "oplacona"**. Stan pozycji wyprowadzamy ze
stanu jej zamowienia:

| zamowienie | pozycja |
|---|---|
| brak, albo `expired` / `cancelled` | **wolna**, jest w ofercie |
| `awaiting_payment`, `awaiting_transfer`, `payment_review`, `draft` | **zajeta**, ktos wlasnie za nia placi |
| `paid`, `in_production`, `shipped`, `completed`, `refunded` | **zamknieta** |

Dzieki temu porzucona platnosc oddaje pozycje do oferty SAMA, w chwili gdy
zamiatarka przestawi zamowienie na `expired`. Flaga wymagalaby drugiego zapisu
przy kazdym przejsciu zamowienia i rozjechalaby sie z nim przy pierwszym,
o ktorym ktos zapomni. Stan nieznany liczymy jako zajety: pomylka w te strone
kaze klientowi zapytac, a w druga sprzedaje mu drugi raz to, co juz dostal.

### 2. Regula kwoty zostaje jedna

`selectedQuoteItems()` odrzuca pozycje niewolne na wejsciu. To jedno zdanie
zalatwia wszystkie cztery bramki z ADR-0017 naraz: strone oferty, rabat,
konwersje i panel. Druga regula gdziekolwiek indziej znaczylaby zamowienie na
inna rzecz niz ta, za ktora klient zaplacil.

Konwersja przestaje przy okazji czytac kwote z `quotes.total_grosze` i liczy ja
z pozycji. Naglowek po czesciowym zleceniu mowi o RESZCIE oferty, wiec przelew
opiewalby na inna sume niz pozycje, ktore do zamowienia weszly.

### 3. Wariant zamyka grupe, dodatek nie

Trzy dodatki to trzy niezalezne rzeczy: klient bierze jeden, wraca za tydzien
po drugi. Trzy warianty to "klucz 56 ALBO 68 mm": kiedy klient kupi jeden,
**druga alternatywa nie jest nadal dostepna, tylko przestala istniec**, bo
powiedzielismy mu, ze wybiera jedno. Bez tego "albo, albo" zamienia sie po
cichu w sklep, w ktorym da sie kupic oba, i zobaczylibysmy to pierwszy raz na
zleceniu do pracowni.

Dodatki z tej samej grupy zostaja otwarte: polerowanie doklada sie do klucza,
ktory klient wlasnie kupil, i po to tam stoi.

Praktyczny wniosek przy wystawianiu oferty: **jesli klient ma moc dokupic
reszte pozniej, to sa dodatki, a nie warianty.** Edytor umie jedno i drugie.

### 4. Blokada przy zapisie zamowienia

Konwersja zaklada `FOR UPDATE` na wierszach pozycji, ZANIM cokolwiek zapisze,
i liczy koszyk od nowa z zablokowanego stanu. Dwie karty otwarte na tej samej
ofercie to nie teoria, tylko zwykly poniedzialek: klient klika "zaplac"
w jednej, wraca do drugiej i klika znowu.

Nie sprawdzamy przy tym samych wybranych pozycji, tylko przeliczamy caly
koszyk: sprzedanie wariantu zamyka jego grupe, wiec czyjas zaplata za "klucz
56" odbiera prawo do "klucza 68", choc sam wiersz klucza 68 dalej wyglada na
wolny. Gdy koszyk sie zmienil, zaplata jest wstrzymana, a nie po cichu
podmieniana na to, co zostalo: klient ma zaplacic za rzeczy, ktore mial przed
oczami.

### 5. Zamrozone jest to, co sprzedane, a nie cala oferta

Edycja i wycenianie odmawiaja dopiero ofercie, w ktorej nie zostalo nic do
wziecia. Pozycja zlecona jest nietykalna, bo jej cena stoi juz w zamowieniu
i to ono jest dokumentem; cala reszta zostaje do poprawiania. Usuniecie oferty
wymaga osobnego potwierdzenia, gdy stoi za nia CHOCBY JEDNO zamowienie.

### 6. Stan oferty wynika z pozycji

`quotes.status` dostaje `partial`. `converted` znaczy od teraz "nie zostalo nic
do kupienia", a nie "ktos zaplacil". `converted_order_id` i `converted_at`
zostaja jako slad po PIERWSZYM zamowieniu, tak samo jak zostala flaga
`pick_one`; kto wzial ktora pozycje, mowi `quote_items.order_id`.

### 7. Termin waznosci sie NIE przedluza

Kusi, zeby po zaplacie za srebro dac klientowi kolejne trzydziesci dni na
zloto. Wtedy jednak sprzedajemy zloto po kursie sprzed miesiaca: `rates_snapshot`
jest z chwili wyceny, a nie z chwili kliknięcia. Po terminie reszta oferty
umiera i wystawiamy nowa. Date i tak przesuwa sie w panelu jednym polem,
swiadomie. ADR-0020 zostaje w mocy.

## Alternatywy i powody odrzucenia

- **Flaga `paid` przy pozycji.** Odrzucone: dwa zrodla prawdy o tym samym.
  Porzucona platnosc blokowalaby pozycje na zawsze, bo nikt nie pamieta
  o gaszeniu flagi przy wygasnieciu zamowienia.
- **Tabela laczaca `quote_orders`.** Odrzucone: rozstrzygac trzeba na poziomie
  POZYCJI, a nie oferty, wiec kolumna przy pozycji i tak jest potrzebna,
  a tabela nie wnosi nic ponad nia.
- **Rozbicie oferty na osobne wyceny przy wysylce, po jednej na dodatek.**
  Odrzucone z tego samego powodu, dla ktorego odrzucil je ADR-0015: trzy numery
  w jednym watku mylą obie strony.
- **Zostawienie jednej zaplaty i wystawianie nowej oferty recznie.** Uczciwa
  i najtansza droga, ale wlasciciel chce sciezki samoobslugowej i to jest
  cala tresc zgloszenia.
- **Przepisanie starych ofert tak, by wszystkie ich pozycje uznac za sprzedane.**
  Odrzucone: przy odrzuconym wariancie stanalby napis "oplacone", czyli zdanie
  nieprawdziwe na stronie, na ktorej klient sprawdza, za co zaplacil. Migracja
  oznacza wiec tylko te pozycje, ktore do zamowienia weszly.

## Konsekwencje

- Jedna oferta rodzi tyle zamowien, ile razy klient cos z niej wezmie. Kazde ma
  wlasny numer i wlasny tytul platnosci; numer oferty zostaje jeden i dalej
  nazywa watek.
- Odrzucone propozycje starych ofert rozliczonych przed ta zmiana zostaja wolne.
  Nie otwiera to ich na osciez: kupic da sie wylacznie w terminie waznosci,
  a ten w ofercie rozliczonej zwykle juz minal.
- **Kod rabatowy dziala teraz raz na zamowienie, a nie raz na oferte.** Kod
  jednorazowy zuzywa sie przy pierwszej czesci i drugiej juz nie obejmie, ale
  kod procentowy zejdzie z kazdej czesci osobno. Rozstrzygaja o tym wlasne
  ustawienia kodu i tak ma zostac; gdyby mial obowiazywac raz na oferte, jest
  to osobna decyzja i osobna kolumna.
- Oferta czesciowo zlecona moze nie miec nic zaznaczonego i to jest stan
  normalny: klient kupil jeden dodatek, pozostale zostawil odznaczone i wroci
  po nie pozniej. Przycisk zaplaty wtedy gasnie zamiast wysylac zero.
- Panel dostaje stan `partial` z wlasna barwa. Skrot "Usun" znika z wiersza
  takze przy nim, bo stoja za nim prawdziwe zamowienia.
- Pozycja zlecona nie ma na stronie oferty pola wyboru. Wyszarzone pole
  zaznaczania znaczy "nie wolno ci zmienic wyboru", a nie "to jest juz
  zrobione", wiec zamiast niego stoi wiersz stanu z numerem zamowienia.

## Niezmienniki i testy

- Stan pozycji wynika WYLACZNIE ze stanu jej zamowienia i liczy sie w jednym
  miejscu (`stanPozycji`). Funkcja jest czysta, wiec sprawdza sie bez bazy.
- Kwota do zaplaty pomija pozycje niewolne; ta sama oferta bez sprzedanej
  pozycji daje kwote wyzsza, i to jest kontrola negatywna tej reguly.
- Zamowienie wygasle oddaje pozycje do oferty, odwolane tak samo.
- Zaplata za wariant zamyka jego grupe; dodatek z tej samej grupy zostaje.
- Blokada pozycji stoi PRZED zapisem zamowienia, nie po nim.
- Konwersja nie czyta kwoty z naglowka oferty.
- Konwersja nie zmienia w miejscu pozycji wczytanych z bazy: sklada nowy obiekt.
  Podmiana w miejscu zostawiala slad w kazdym, kto trzyma do nich odnosnik,
  i wychodzila na jaw dopiero przy drugim wywolaniu na tej samej wycenie.
- Pilnuje tego `scripts/test-quote-edit.mjs`, sekcja 2, wpieta w `npm run build`.
  Kontrola negatywna: zdjecie filtru dostepnosci, zdjecie zamykania grupy
  i wyjecie blokady z zapytania wychodza na czerwono.

## Synchronizacja

- `chat-api/context.js` i `public/llms.txt`: asystent ma umiec powiedziec, ze
  z jednej oferty da sie zaplacic za czesc, a reszta czeka.
- `MDs/AEJaCA_Brand_Reference.md`, rozdzial o ofertach.
- `public/sitemap.xml` CELOWO bez zmian: strona oferty jest bez numeru samym
  formularzem i nic tu tego nie rusza.
