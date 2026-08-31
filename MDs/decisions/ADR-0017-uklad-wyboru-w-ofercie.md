---
status: accepted
owner: Artur
date: 2026-08-26
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0012-zaplata-za-oferte.md
  - MDs/decisions/ADR-0015-oferta-wielowariantowa.md
  - chat-api/quotes.js
  - chat-api/server.js
  - admin/views/quote-edit.ejs
  - admin/server.js
  - src/pages/Offer.jsx
  - scripts/quotes-schema.sql
  - scripts/test-quote-edit.mjs
---

# ADR-0017: Uklad wyboru w ofercie i jeden formularz w edytorze wycen

## Kontekst

Wlasciciel zglosil 2026-08-26, po pierwszej ofercie wystawionej na zywym
kliencie ("wydruk klucz 56 mm", "wydruk klucz 68 mm"), piec rzeczy naraz.
Cztery dotycza edytora, piata dotyczy tego, co widzi klient.

1. **Kwoty mieszkaly w drugim formularzu.** Pozycje edytowalo sie na gorze
   strony, a ich ceny wpisywalo nizej, w osobnej sekcji z wlasnym przyciskiem.
   Zapis jednej polowy nie zapisywal drugiej, wiec kwota stala daleko od
   pozycji, ktorej dotyczy, i latwo bylo zapisac tylko polowe pracy.
2. **"Co zrobic" bylo nienaturalne.** Usuwanie pozycji szlo przez liste
   wyboru z opcjami "zostaw" i "usun te pozycje". Powstala tak, bo pole
   zaznaczane wysyla sie WYLACZNIE zaznaczone i przy dwoch usuwanych z pieciu
   tablice formularza rozjezdzaja sie o dwa miejsca. Rozwiazanie chronilo
   przed prawdziwa awaria, ale wygladalo jak formularz urzedowy.
3. **Waznosci nie dalo sie zmienic bez wpisywania kwot od nowa**, bo liczba
   dni stala przy przycisku wyceniania.
4. **Oferta miala jeden tryb wyboru na cala siebie.** Flaga `pick_one`
   zamieniala WSZYSTKIE pozycje w alternatywy. Scenariusz wlasciciela nie
   mial jak powstac: "klucz 56 mm albo 68 mm, do tego opcjonalnie
   polerowanie" wymaga wyboru jednej rzeczy z dwoch ORAZ dodatku obok,
   a "pierscionek albo sygnet albo obraczka" plus "figurka albo szkatulka"
   wymaga dwoch niezaleznych wyborow w jednej ofercie.
5. **Nie dalo sie wskazac, co jest zaznaczone na starcie.** Klient otwieral
   oferte z wyborem, ktory zrobil za niego przypadek (pierwsza wyceniona
   pozycja), a nie my.

## Decyzja

### 1. Wybor schodzi na poziom pozycji

`quote_items` dostaje trzy kolumny:

| kolumna | znaczenie |
|---|---|
| `kind` | `fixed` skladnik rachunku, `variant` propozycja do wyboru, `option` dodatek |
| `group_key` | nazwa grupy wyboru: warianty jednej grupy wykluczaja sie wzajemnie |
| `selected` | co jest zaznaczone teraz; przed wyslaniem to nasza propozycja, potem wybor klienta |

Reguly sa trzy i mieszkaja w jednej funkcji `selectedQuoteItems()`:

- `fixed` wchodzi do kwoty zawsze,
- z kazdej grupy `variant` wchodzi DOKLADNIE JEDEN,
- `option` wchodzi, gdy jest zaznaczony i ma kwote.

Kwota do zaplaty to suma tych pozycji. Czyta to jedna funkcja i wszystkie
cztery bramki: strona oferty, rabat, konwersja na zamowienie i panel. Druga
regula gdziekolwiek indziej znaczylaby zamowienie na inna rzecz niz ta, za
ktora klient zaplacil.

### 2. `pick_one` zostaje jako slad, nie jako mechanizm

Kolumna `quotes.pick_one` i `quotes.chosen_item_id` zostaja w tabeli, bo
stoja za nimi oferty juz wyslane. Migracja przepisuje ich pozycje na jedna
grupe wariantow i przenosi wskazanie klienta do `selected`. Kod czyta stara
flage TYLKO wtedy, gdy zadna pozycja wyceny nie ma jeszcze rodzaju, a zapis
z nowego edytora gasi ja na trwale. Dwie reguly naraz znaczylyby pozycje
oznaczona jako skladnik rachunku, ktora dalej zachowuje sie jak alternatywa.

### 3. Jeden formularz, jedna trasa zapisu

Edytor wycen ma teraz jeden formularz i jeden przycisk. Kwota jednostkowa
stoi przy pozycji, notatka i waznosc pod pozycjami, wszystko idzie jedna
trasa `POST /quotes/:ref/edit`. Trasa `POST /quotes/:ref/price` w panelu
znika; API `POST /api/quotes/:ref/price` zostaje, bo to nadal osobne wejscie
dla wyceniania i ma wlasny test.

Regula kwoty ma jedno miejsce (`kwotaJednostkowa`): dodatnia albo zadna.
Wpisanie pierwszej kwoty dalej czyni z zapytania oferte i nadaje termin
waznosci, bo to nie zalezy od tego, ktorym formularzem kwota przyszla.

### 4. Olowek i krzyzyk zamiast listy "co zrobic"

Ikona olowka otwiera pola pozycji, czerwony krzyzyk usuwa ja po pytaniu
"czy na pewno". Awaria, przed ktora bronila lista, zostaje zamknieta inaczej:
**numer wiersza jedzie w WARTOSCI pola**, a nie w jego obecnosci. Krzyzyk
niesie identyfikator pozycji, przelacznik wariantu i pole dodatku niosa numer
wiersza. Tablice formularza zostaja przez to rowne niezaleznie od tego, ile
pol jest zaznaczonych.

### 5. Zaznaczenie domyslne ustawia sie w edytorze

Nowy wariant jest zaznaczony, gdy jest pierwszy w swojej grupie; nowy
dodatek jest zaznaczony. Jedno i drugie przestawia sie w edytorze i to ten
uklad klient zobaczy jako gotowy. Regule "w grupie zaznaczony jest dokladnie
jeden" pilnuje SERWER, a nie przegladarka: formularz nie wie o pozycjach
dodanych w tym samym zapisie, a dwa zaznaczenia w jednej grupie znaczylyby
kwote za dwie rzeczy, z ktorych robimy jedna.

### 6. Waznosc dwiema drogami

"Wazna przez, dni" liczy od dzisiaj, "wazna do dnia" ustawia date wprost.
Liczba dni ma pierwszenstwo, bo wpisuje sie ja swiadomie, a data w polu obok
stoi tam z poprzedniego zapisu. Puste oba pola nie ruszaja terminu, pusta
data go zdejmuje.

## Konsekwencje

- Oferta potrafi teraz opisac koszyk z wyborem, a nie tylko rachunek albo
  liste alternatyw. To jest jedyny powod tej zmiany.
- Kazde klikniecie klienta idzie na serwer i wraca z nowa kwota. Wolniej niz
  liczenie w przegladarce i tak ma zostac: kwota z przegladarki nie jest
  kwota, tylko propozycja kwoty.
- Kod rabatowy przestaje obowiazywac po kazdej zmianie ukladu, bo byl
  policzony od innej sumy. Klient musi wpisac go ponownie.
- Mail z oferta oznacza teraz warianty i dodatki w nawiasie kwadratowym
  i dopisuje zdanie o tym, ze kwota dotyczy zaznaczonego ukladu. Bez tego
  wiersze sumowaly sie do kwoty innej niz "Razem" i wygladalo to na blad
  rachunkowy.
- Migracja ma trzy kroki i musi isc po kolei, bo przepisanie starych ofert
  czyta kolumny zakladane krok wczesniej. Reszta migracji w `chat-api`
  jedzie rownolegle, ta jedna nie.

## Czego ta decyzja nie rozstrzyga

1. **Dodatek jest zwiazany z karta, a nie z konkretnym wariantem.**
   Polerowanie z karty "klucz" doklada sie niezaleznie od tego, ktory klucz
   klient wybral, i ma jedna cene dla obu. Wariant z wlasnym zestawem
   dodatkow wymagalby czwartej kolumny (`depends_on`) i tego tu nie ma.
2. **Ilosc przy wariancie zostaje.** Klient wybiera wariant, ale nie zmienia
   jego ilosci na stronie oferty; ilosc ustawia sie w edytorze.
3. **Nazwa grupy jest tekstem.** Dwie grupy o tej samej nazwie zlewaja sie
   w jedna, i to jest zamierzone, bo tak sie je laczy. Literowka w nazwie
   rozdziela grupe na dwie i widac to od razu w podgladzie.

## Poprawki po pierwszym uzyciu (2026-08-26, ten sam dzien)

Wlasciciel obejrzal panel i zglosil trzy rzeczy: termin waznosci "nie zapisuje
sie i wraca 14 dni", "nie da sie zrobic dwoch grup jednokrotnego wyboru" oraz
"nie da sie ustawic domyslnie zaznaczonego pola". Test na prawdziwej bazie
(`scripts/it-offer-groups.mjs`) pokazal, ze silnik robi WSZYSTKIE trzy rzeczy
poprawnie. Bledy byly w tym, co widac.

### 7. Slowo "karta" wycofane, jest "grupa wyboru"

W tym projekcie karta znaczy karte uslugi w sklepie i tak stoi w kilkunastu
miejscach dokumentu marki. Nazwanie tym samym slowem grupy wariantow kazalo
czytelnikowi zgadywac, o ktora karte chodzi. Pole w panelu nazywa sie teraz
**Grupa wyboru**, a nad lista pozycji stoi objasnienie trzech rodzajow pozycji
i zdanie o tym, ze druga nazwa grupy to druga, niezalezna ramka u klienta.

### 8. Rodzaj i grupa wracaja do widocznego wiersza

Pierwsza wersja chowala je pod ikona olowka. Swiezo zalozona oferta ma wszystkie
pozycje w rodzaju `fixed`, wiec na ekranie nie bylo ani jednego przelacznika
i ani jednego pola zaznaczanego: mozliwosci, ktora wlasnie dodalismy, po prostu
nie bylo widac. **Kontrolka, ktora tworzy nowa mozliwosc, nie moze byc schowana
za ikona bez podpisu.** Pod olowkiem zostaja rzeczy, ktore poprawia sie rzadko:
nazwa, ilosc, opis i parametry z kalkulatora.

### 9. Pole waznosci przestaje udawac zapisany termin

Pole "Wazna przez, dni" bylo puste z zalozenia, a jego podpowiedz brzmiala `14`.
Wygladalo to jak zapisany termin i wracalo po kazdym zapisie, cokolwiek by sie
wpisalo. Teraz podpowiedz brzmi `np. 30`, a obok stoi prawdziwa data konca
waznosci razem z liczba pozostalych dni. Pole nadal jest puste z zalozenia
i puste znaczy "nie ruszaj terminu": wypelnienie go biezaca liczba dni
przesuwaloby termin przy kazdym zapisie literowki.

### 10. Naglowek panelu pokazuje wersje obu uslug

Panel i backend sklepu wdrazaja sie osobno. Nowy formularz rozmawiajacy ze
starym backendem gubi po cichu pola, ktorych tamten nie zna, i na ekranie
wyglada to identycznie jak blad w kodzie. Panel czyta wiec `GET /api/version`
(w tle, najwyzej raz na minute, brak odpowiedzi go nie wywala) i pokazuje
`v1.1.02 - api v1.1.01`; numer rosnie na TRZECIEJ pozycji, zawsze dwucyfrowej,
a rozne numery obu uslug nie sa bledem, bo kazda zmienia sie wtedy, gdy naprawde
sie zmienia. Backend dopowiada, czy baza ma juz kolumny `kind`,
`group_key` i `selected`; jesli nie, w naglowku stoi bursztynowe ostrzezenie,
bo wtedy wybor nie ma sie gdzie zapisac. Numery podnosi sie recznie.
