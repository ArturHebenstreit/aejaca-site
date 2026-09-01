---
status: draft
owner: Artur
date: 2026-08-31
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0026-zaplata-zamyka-pozycje.md
  - src/shop/numerySpraw.js
  - chat-api/quotes.js
  - chat-api/server.js
  - chat-api/gmail.js
  - admin/views/leads.ejs
---

# ADR-0032: Jeden numer sprawy, od pierwszej wiadomosci do zaplaty

## Kontekst

Klient pisal z formularza, dostawal potwierdzenie, po tygodniu ofertę, a po
zaplacie potwierdzenie zamowienia. Za kazdym razem z innym oznaczeniem albo bez
zadnego. Wlasciciel, odpisujac na zapytanie ofertowe z formularza, nie mial
czego zacytowac, bo w panelu numeru nie bylo widac.

Stan faktyczny sprzed zmiany byl inny, niz wygladal, i to w obie strony:

- **Numery byly**, tylko niewidoczne. `/api/contact` zapisywal zgloszenie razem
  z numerem w kolumnie `leads.quote_ref` od dawna. Panel nie pokazywal go
  nigdzie, potwierdzenie do klienta tez nie, wiec z punktu widzenia obu stron
  numeru nie bylo.
- **Dwie z czterech drog nie nadawaly numeru w ogole**: mail przyslany wprost
  na skrzynke (zaklada zgloszenie w `gmail.js`) i rozmowa z asystentem uznana
  za zapytanie. Ta druga zapisywala nawet sam ostatni komunikat, bez tresci.
- **Numery generowaly DWA miejsca**: `quotes.js` i wlasna kopia tej samej
  funkcji w `server.js`. Dwa generatory jednego formatu rozjezdzaja sie przy
  pierwszej zmianie ksztaltu numeru, i to po cichu, bo oba dzialaja.
- **Wycena zakladana ze zgloszenia dostawala NOWY numer**, wiec klient miał
  dwa: jeden z potwierdzenia i drugi z oferty, przy czym pierwszy niczego nie
  otwieral.

## Decyzja

### 1. Jedna sprawa, jeden numer

Kazda droga, ktora zaklada zgloszenie (formularz kontaktowy, formularz B2B,
kalkulator, czat, mail uznany za zapytanie), nadaje mu numer `WY` + data
+ osiem znakow. Numer generuje **wylacznie** `quotes.js`; kopia z `server.js`
znika.

**Poczta jest wyjatkiem, i to swiadomym (uzupelnienie z 2026-09-01).** Mail
przychodzacy NIE jest jeszcze zapytaniem: bywa newsletterem, faktura od
dostawcy i oferta pozycjonowania. Do 1 wrzesnia kazdy z nich zakladal sprawe
z numerem, bo `gmail.js` robil to bez zadnego sprawdzenia. Rownolegle panel
mial przyciski "Lead / Nie lead / Spam", ktore zmienialy **sam kolor
plakietki**: dwie decyzje o jednej rzeczy, jedna automatyczna i slepa, druga
reczna i bezczynna.

Teraz jest jedna droga. Watek czeka w skrzynce jako `unclassified`, a numer
nadaje **decyzja**: oznaczenie watku jako zapytanie zaklada sprawe razem
z trescia pierwszej wiadomosci PRZYCHODZACEJ (nasza wlasna odpowiedz w tym
samym watku nie jest niczyim pytaniem). Watek od adresu, ktory sprawe juz ma,
podpina sie do niej zamiast zakladac druga.

Decyzje podejmuja DWIE rzeczy i obie ida ta sama droga (`watkiPoczty.js`):
klasyfikacja automatyczna przy pierwszej wiadomosci i czlowiek w panelu, ktory
ja poprawia. Dwie kopie tej decyzji rozjechalyby sie po cichu, bo automat
zakladalby sprawe inaczej niz klikniecie, a wygladalo by to identycznie.

**Cofniecie decyzji nie kasuje zalozonej sprawy.** Numer moze byc juz
w korespondencji, a numer raz podany jest obietnica. Oznaczenie watku jako
"nie lead" albo spam blokuje natomiast zrobienie z tej sprawy oferty, i panel
mowi to wprost. Ponowne uznanie watku za zapytanie przywraca przycisk: warunek
czyta znacznik watku, wiec nie ma czego odkrecac osobno.

**Poczta czekajaca na nas jest policzona w dwoch liczbach**, bo "nieobsluzone"
znaczy dwie rozne rzeczy: `do decyzji` to watki, o ktorych nikt nie
rozstrzygnal (nie maja numeru i nie da sie z nich zrobic oferty), a
`bez odpowiedzi` to te, w ktorych OSTATNIA wiadomosc jest przychodzaca, czyli
ktos napisal i czeka. Spam i "nie lead" nie licza sie do drugiej liczby:
nieodpisanie na reklame nie jest zaniedbaniem. Obie stoja na pulpicie panelu,
bo skrzynka jest osobna strona i bez tego nieodpisany mail nie odzywa sie
znikad.

Wycena zrobiona ze zgloszenia **przejmuje jego numer**, zamiast losowac nowy.
Zgloszenie sprzed tej zmiany, ktore numeru nie ma, przejmuje numer swojej
wyceny, zeby nie zostac z dwoma oznaczeniami.

### 2. Zamowienie nosi numer sprawy z koncowka

Sam numer sprawy nie wystarcza, bo **jedna oferta rodzi wiele zamowien**
(ADR-0026: zaplata zamyka pozycje, nie cala oferte), a bramka platnicza,
rachunek i list przewozowy potrzebuja oznaczenia jednoznacznego. Stad koncowka:

```
WY20260831-A1B2C3D4        zgloszenie, potem oferta
WY20260831-A1B2C3D4-1      pierwsza zaplata z tej oferty
WY20260831-A1B2C3D4-2      druga zaplata z tej samej oferty
WY20260831-A1B2C3D4-1-R2   druga runda poprawek tego samego projektu
```

Koncowke liczymy **w transakcji, ktora trzyma juz pozycje oferty**. Dwie
rownolegle zaplaty z jednej oferty nie policza wiec tej samej liczby: druga
czeka na pierwsza.

### 3. Zamowienie z koszyka zostaje przy swoim numerze

Zakup prosto ze sklepu nie ma sprawy przed soba, wiec dostaje `AE` + data
+ osiem znakow, jak dotad. To nie jest niekonsekwencja: nie bylo zgloszenia,
ktore mialoby numer przekazac, a wymyslanie sprawy dla zakupu z polki
zaciemnialoby obraz w panelu.

### 4. Panel pokazuje numer i robi z niego oferte jednym klikiem

Widok zgloszen ma kolumne z numerem i przycisk "Zrób wycenę". Przycisk
przepisuje adres, jezyk, tresc, parametry i przyslany plik i zaklada wycene pod
numerem sprawy. Drugie klikniecie oddaje istniejaca wycene zamiast zakladac
blizniacza.

**Przycisk znika, gdy oferta pod tym numerem ISTNIEJE, a nie gdy pole `status`
mowi "quoted" (poprawione 2026-09-01).** Pole zostawalo na `quoted` takze po
SKASOWANIU oferty, bo `deleteQuote` nie dotykalo zgloszenia. Zgloszenie
ladowalo wiec w slepym zaulku: oferty juz nie ma, a przycisku do zrobienia
nowej tez nie ma. Stan wyliczalny trzymany jako osobne pole rozjezdza sie
z rzeczywistoscia przy pierwszej zmianie, i to po cichu. Skasowanie oferty
cofa dodatkowo `status` na `new`, zeby oba widoki mowily to samo. Numer sprawy
zostaje: raz podany klientowi jest obietnica, a nie danymi do poprawienia.

### 5. Wzorce numerow stoja w jednym pliku

`src/shop/numerySpraw.js` trzyma wzorce i przyklady. Do 2026-08-31 lezaly
w dwoch plikach interfejsu i **oba przyjmowaly wylacznie `AE...`**, wiec
zamowienie z oferty zostaloby odrzucone jako "zly numer" jeszcze przed
zapytaniem serwera, i wygladaloby to na blad klienta.

## Alternatywy i powody odrzucenia

- **Zostawienie dwoch numerow (sprawa `WY`, zamowienie `AE`).** Najtansze
  i najmniej ryzykowne, bo nie dotyka sciezki platnosci. Odrzucone przez
  wlasciciela: klient w polowie drogi zaczyna poslugiwac sie drugim numerem,
  a przy kilkunastu sprawach w miesiacu zmiana kosztuje tyle, co jej opisanie.
  Za rok znaczylaby migracje historii.
- **Doslownie jeden numer, bez koncowki.** Lamie sie dokladnie tam, gdzie
  wlasciciel sam wskazal: przy czesciowej zaplacie. Dwie wplaty, dwie paczki
  i dwa rachunki nosilyby ten sam numer.
- **Osobny prefiks dla zgloszen (`ZG`).** Rozwazany i odrzucony: numer i tak
  staje sie numerem oferty, a drugi prefiks znaczylby dwie konwencje na jedna
  droge i drugie miejsce do pilnowania.
- **Numer kolejny w roku (`2026/014`).** Czytelniejszy dla czlowieka, ale
  wymaga licznika w bazie i blokady przy kazdym nadaniu, a przy dwoch usługach
  wdrazanych osobno to jest zrodlo kolizji. Data plus losowe znaki daja
  unikalnosc bez uzgadniania.

## Konsekwencje

- **Numery zamowien z ofert wygladaja inaczej niz dotad.** Stare zamowienia
  zostaja przy `AE` i nic ich nie zmienia: numer raz podany klientowi jest
  obietnica, a nie danymi do poprawienia.
- **Strona zamowienia przyjmuje trzy postacie numeru.** Wzorzec obejmuje `AE`,
  numer sprawy z koncowka i runde poprawek.
- **Tekst w FAQ przestal klamac.** Zdanie "numer zaczyna sie od AE" bylo
  prawda do 31 sierpnia 2026.
- **Zgloszenie z czatu niesie teraz tresc rozmowy**, a nie sam ostatni
  komunikat. Bez tego po tygodniu nie bylo wiadomo, o co klient pytal.
- **Mail przychodzacy czeka na decyzje.** Wczesniej zakladal zgloszenie sam,
  najpierw z samym tematem, potem z trescia. Numer dostaje w chwili, gdy
  uznajemy go za zapytanie, a nie w chwili dostarczenia poczty.

## Niezmienniki i testy

- Kazde miejsce zapisujace zgloszenie nadaje numer. Test przeglada WSZYSTKIE
  wstawki do `leads` w `server.js` i wymaga kolumny `quote_ref`: nowa droga
  dopisana bez numeru zapali sie od razu, a nie przy odpisywaniu na zapytanie.
  `gmail.js` nie zapisuje zgloszen wcale i test tego pilnuje osobno.
  Test: `chat-api/numerSprawy.test.mjs`.
- Skasowanie oferty otwiera droge do nastepnej, a przycisk zalezy od istnienia
  oferty, nie od zapamietanego pola. Test: `scripts/test-lead-z-maila.mjs`.
- Wycena ze zgloszenia idzie pod numerem zgloszenia, a drugie klikniecie oddaje
  istniejaca. Test: `chat-api/numerSprawy.test.mjs`.
- Numer zamowienia wyprowadza sie z numeru sprawy, a liczy sie w transakcji po
  zablokowaniu pozycji oferty. Test: `chat-api/numerSprawy.test.mjs`.
- Wzorzec numeru zamowienia przyjmuje `AE`, koncowke zaplaty i runde poprawek.
  Plik: `src/shop/numerySpraw.js`.

## Synchronizacja

- `chat-api/context.js`: asystent zna trzy postacie numeru i wie, ze strona
  zamowienia przyjmuje kazda z nich.
- `src/data/faq/sklep.js`: odpowiedz o wejsciu na strone zamowienia.
