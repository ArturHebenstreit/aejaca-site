---
status: draft
owner: Artur
date: 2026-08-26
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0017-uklad-wyboru-w-ofercie.md
  - admin/views/quote-edit.ejs
  - admin/server.js
  - chat-api/quotes.js
---

# ADR-0019: Edytor wycen zapisuje na poziomie rekordu, bez przycisku zapisz

## Kontekst

Wlasciciel poprosil o edytor bez przycisku "zapisz": wpisane dane maja same
trafiac do bazy. Poprosil tez o ocene, ktora droga jest lepsza wydajnosciowo:
zapis po kazdej zmianie czy zapis na poziomie rekordu.

Trzy fakty, ktore rozstrzygaja te ocene:

1. **Kazdy zapis to dwa skoki po sieci i jedna transakcja.** Panel jest osobna
   usluga: przegladarka pyta panel, panel pyta `chat-api`, dopiero on pyta baze.
   `updateQuote` to BEGIN, zapis pol, odczyt wszystkich pozycji, pilnowanie
   reguly "jeden wariant w grupie", przeliczenie sumy i COMMIT, czyli okolo
   szesciu do dziesieciu zapytan.
2. **Oferta jest dokumentem, ktory klient moze miec otwarty.** Oferta wyslana
   zyje pod swoim linkiem. Stan zapisany w bazie jest natychmiast widoczny.
3. **Wpisywanie tekstu nie ma stanow posrednich, ktore cokolwiek znacza.**
   "Wydruk klu" nie jest nazwa pozycji, a `4` w polu kwoty to cztery grosze.

## Decyzja

### Zapis na poziomie REKORDU, z jednym wyjatkiem

**Rekord** to jedna pozycja albo naglowek oferty (dane klienta, jezyk, waluta,
termin, tresc zapytania, notatka). Olowek otwiera rekord, zielony ptaszek
wysyla go do bazy jednym zadaniem, strzalka odrzuca zmiany. W trakcie edycji
olowek i krzyzyk gasna, zeby nie dalo sie skasowac wiersza w polowie wpisywania.

**Wyjatek: przelacznik i pole zaznaczane zapisuja sie od razu po kliknieciu.**
Klikniecie JEST cala decyzja, nie ma stanu posredniego i nie ma czego
zatwierdzac. Dotyczy to wyboru domyslnego wariantu i wlaczania dodatku.

### Dlaczego nie po kazdej zmianie

Sesja edycji oferty z szescioma pozycjami to okolo siedmiu zapisow przy
regule rekordowej. Przy zapisie po kazdej zmianie, nawet z opoznieniem po
ostatnim znaku, ta sama sesja daje kilkadziesiat zapisow, czyli kilkaset
zapytan do bazy. **Ale nie liczba zapytan jest tu najwazniejsza.**

Wazniejsze jest to, ze kazdy taki zapis wklada do bazy stan niedokonczony,
a przy ofercie juz wyslanej pokazuje go klientowi. Kwota `4` widziana przez
kogos, kto akurat odswiezyl strone oferty, jest obietnica handlowa, ktorej
nie chcemy zlozyc. Do tego kazdy zapis przelicza sume i potrafi przestawic
stan oferty miedzy "nowa" a "oferta", wiec polowa wpisanej kwoty potrafi
zdjac oferte termin waznosci.

### Co musi zastapic przycisk

Zniknal moment, w ktorym czlowiek mowil "teraz zapisz", wiec:

- kazdy rekord pokazuje swoj stan przy ikonach: "zapisuje...", "zapisano 14:32",
  "niezapisana" przy swiezo dodanej pozycji,
- wyjscie ze strony w trakcie otwartej edycji ostrzega,
- blad z serwera zostaje przy rekordzie i **nie zamyka edycji**, wiec wpisane
  dane nie przepadaja,
- Enter zatwierdza rekord, Escape odrzuca zmiany.

### Nowa pozycja powstaje w przegladarce

Przycisk "Dodaj pozycje" dokłada wiersz otwarty do wpisania, ale do bazy
trafia on dopiero po zatwierdzeniu. Zapis pustej pozycji w chwili klikniecia
zostawialby po kazdej pomylce wiersz bez nazwy i bez kwoty, a taki wiersz
liczy sie do sumy i do reguly "wycena bez pozycji nie ma sensu".

### Jedna droga do zapisu

Trasa `POST /quotes/:ref/edit`, ktora zapisywala cala oferte jednym
formularzem, **znika**. Zostaja dwie trasy JSON: `/quotes/:ref/item`
i `/quotes/:ref/header`. Kazda przyjmuje WYLACZNIE pola, ktore przyszly,
wiec zapis jednego przelacznika nie kasuje opisu, ktorego to zadanie nie nioslo.

## Konsekwencje

- **Edytor wymaga JavaScriptu.** Bez niego widac tresc oferty, ale nie da sie
  jej poprawic. Panel ma jednego uzytkownika i wlasna przegladarke, wiec ten
  koszt jest do przyjecia; strona mowi o tym wprost w `<noscript>`.
- **Zaznaczenie z biezacego zapisu wygrywa z zastanym.** Bez tej zasady
  przestawienie wariantu pojedynczym zadaniem cofaloby sie po cichu: w grupie
  bylyby wtedy dwa zaznaczenia, a regula "zostaje pierwszy" trzymalaby sie
  starego wyboru.
- **Dwa okna z ta sama wycena rozjada sie po cichu.** Kto zapisze pozniej, ten
  wygrywa. Panel ma jednego uzytkownika, wiec nie zakladamy blokad ani wersji
  wiersza; gdyby to sie zmienilo, potrzebna jest osobna decyzja.
- **Blok edycji chowa sie stylem, nie atrybutem `hidden`.** Klasa `grid`
  ustawia `display:grid` z ta sama moc co `[hidden]{display:none}` i stoi
  w arkuszu nizej, wiec wygrywa. Wyszlo to dopiero z klikania w przegladarce,
  bo szablon wygladal poprawnie.

## Czego ta decyzja nie rozstrzyga

1. **Blokada rownoczesnej edycji.** Przy jednym uzytkowniku niepotrzebna.
2. **Historia zmian oferty.** Zapis rekordowy bylby dobrym miejscem, zeby ja
   prowadzic, ale to osobna praca.
3. **Zapis pola po polu przy edycji naglowka.** Naglowek jest jednym rekordem;
   rozbicie go na osobne pola dalo by wiecej zadan bez zysku dla czytelnosci.

## Poprawki po pierwszym uzyciu (2026-08-26, ten sam dzien)

Wlasciciel zapisal dwie pozycje ze zmienionym rodzajem i zglosil, ze "miesza
sie mozliwosc zaznaczenia domyslnosci, dopiero odswiezenie strony pomaga".
Mial racje i byl to blad tej zmiany.

### Wiersz musi przerysowac sie z ODPOWIEDZI, nie z wlasnych pol

Po zapisie przepisywalem podglad z pol formularza. To wystarcza dla nazwy
i kwoty, ale NIE dla rzeczy, ktore rozstrzyga serwer:

- zmiana rodzaju pozycji zmienia KONTROLKE: wariant ma przelacznik, dodatek
  pole zaznaczane, skladnik nie ma nic. Kontrolki nie da sie przerobic
  w miejscu, wiec trzeba ja wymienic;
- wybor wariantu GASI pozostale w tej samej grupie, wiec zapis jednej pozycji
  zmienia wyglad innych;
- swiezy dodatek wchodzi zaznaczony, co tez ustala serwer.

Odpowiedz trasy zapisu niesie juz wszystkie pozycje oferty, wiec po kazdym
zapisie przerysowujemy z niej cala liste: kontrolke, opis rodzaju, grupe,
kwoty i wartosc pozycji. Wiersz OTWARTY do edycji zostaje nietkniety, bo
inaczej zapis sasiada nadpisywalby to, co ktos wlasnie wpisuje.

### Nazwa przelacznika liczy sie z nazwy grupy, po obu stronach tak samo

Szablon numerowal grupy (`pickGroup_0`), a skrypt musialby te numeracje
odtworzyc. Po pierwszym zapisie czesc wierszy miala by nazwe stara, czesc
nowa, i przelaczniki przestalyby sie wykluczac. Obie strony licza teraz nazwe
z NAZWY GRUPY, jedna regula.

### Grupy z innych pozycji stoja do klikniecia

Lista `datalist` pokazuje sie dopiero po kliknieciu w strzalke, a przy pustej
ofercie nie ma w niej jeszcze nic. Grupowanie wymaga nazwy DOKLADNIE tej samej,
wiec nazwy uzyte przy innych pozycjach stoja pod polem jako przyciski i wpisuja
sie jednym kliknieciem. Lista odswieza sie po kazdym zapisie.
