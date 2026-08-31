---
status: accepted
owner: Artur
date: 2026-08-25
deciders: Artur
supersedes: null
related:
  - MDs/decisions/ADR-0011-odlew-w-kalkulatorze-studio.md
  - src/pages/Offer.jsx
  - chat-api/quotes.js
  - admin/views/quote-edit.ejs
  - scripts/test-offer-payment.mjs
---

# ADR-0012: Zaplata za oferte ustalona z czlowiekiem

## Kontekst

Serwis umial przyjac pieniadze wylacznie za kwote policzona przez wlasny silnik.
Kazda inna droga konczyla sie slepym zaulkiem: klient dostawal wycene mailem
albo slyszal ja w rozmowie telefonicznej i nie mial gdzie zaplacic. Zapytania
z telefonu nie mialy nawet numeru, wiec nie bylo czym nazwac ani watku
w korespondencji, ani przelewu na wyciagu.

Jednoczesnie kod rabatowy dzialal tylko w kasie sklepu. Klient z mailowa wycena
i wlasnym kodem nie mial jak go uzyc, choc kod dostal od nas.

## Decyzja

Kazde zapytanie, niezaleznie od kanalu, dostaje numer `WY20260825-XXXXXXXX`
w chwili zalozenia, jeszcze przed wpisaniem kwot. Ten sam numer jest tytulem
platnosci, wiec wplata zawsze wskazuje prace, ktorej dotyczy.

Panel `/quotes` prowadzi caly tor: lista wedlug stanu, wpisanie kwot pozycji,
notatka o zakresie, termin waznosci, wysylka oferty. Wycene z rozmowy mailowej
albo telefonicznej zaklada sie tym samym formularzem, co odbiera obu kanalom
status wyjatku.

Strona `/oferta/` przyjmuje zaplate. Wejscie jest dwojakie: link z oferty albo
sam numer podany razem z adresem e-mail, na ktory poszla oferta. Klient bez
adresu dostaje krotki kod odbioru wyprowadzony z tokenu dostepu.

**Sam numer nigdy nie wystarcza.** Oferta niesie nazwisko, telefon i adres,
wiec wejscie na sam numer znaczyloby, ze kto zobaczy go przez ramie, zobaczy
tez czyjes dane.

Kod rabatowy podaje sie na tej stronie, PRZED zaplata. Kwota schodzi od razu,
a nie zwrotem po fakcie: zwrot to druga operacja pieniezna i drugie miejsce,
w ktorym cos moze pojsc nie tak.

## Alternatywy

- **Wrzucenie oferty do koszyka.** Odrzucone: koszyk liczy ceny z katalogu
  i z kalkulatora, a tu kwota pochodzi od czlowieka. Zeby ja przepuscic,
  trzeba byloby otworzyc w kasie furtke na cene z zewnatrz, czyli dokladnie
  te dziure, ktora zamknal ADR o podstawie kwoty wiazacej.
- **Wejscie na sam numer wyceny.** Odrzucone z powodu opisanego wyzej.
- **Osobna kolumna na kod odbioru.** Odrzucone: kod wyprowadzony z tokenu nie
  ma jak sie z nim rozjechac i nie wymaga migracji.
- **Przelew tradycyjny w euro na stronie oferty.** Odrzucone na teraz: wymaga
  kursu i kwoty w euro zapisanych przy zamowieniu, a wycena reczna ich nie
  niesie. Bramka obsluguje i BLIK-a, i przelew online, wiec klient ma obie drogi.

## Konsekwencje

- Rozmowa telefoniczna konczy sie numerem i linkiem, a nie kwota w powietrzu.
- Zamowienie z oferty idzie dalej dokladnie ta sama droga co zakup ze sklepu:
  ITN, maile, pliki, kolejka.
- `convertQuoteToOrder` dziala teraz w transakcji. Bylo to konieczne, bo
  rezerwacja kodu blokuje wiersz przez `FOR UPDATE`, a blokada poza transakcja
  zwalnia sie natychmiast, wiec dwie osoby z tym samym kodem jednorazowym
  zabralyby go obie.
- Oferta po terminie waznosci nie przyjmuje zaplaty.

## Niezmienniki i testy

- Rabat schodzi wylacznie z pozycji, nigdy z dostawy, i nie schodzi ponizej zera.
- Rezerwacja kodu stoi miedzy `BEGIN` a `COMMIT` i zna numer zamowienia.
- Odrzucony kod wycofuje cale zamowienie, zamiast zostawiac je bez znizki.
- Odliczenie za projekt zapisuje sie na STARYM zamowieniu, inaczej ten sam
  projekt dalby sie odliczyc drugi raz.
- Kazde zapytanie ma tyle parametrow, ile miejsc `$N`.
- Test: `scripts/test-offer-payment.mjs`, w buildzie. Kontrola negatywna:
  usuniecie `Math.max(0, ...)` daje kwote ujemna, zamiana kolejnosci parametrow
  odliczenia wychodzi na czerwono.

## Synchronizacja

- `public/llms.txt`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md` (10b).
- `public/sitemap.xml` CELOWO bez wpisu: strona jest `noindex` i bez numeru
  pokazuje sam formularz.
