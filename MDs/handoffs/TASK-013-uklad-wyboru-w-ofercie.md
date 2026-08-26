# Handoff zadania

```yaml
task_id: TASK-013
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: 792e7a7
last_commit: (uzupelnic po commicie)
updated: 2026-08-26
```

## Cel

Edytor wycen ma pozwalac ulozyc oferte tak, jak sie ja sprzedaje: pozycja
z kwota w jednym miejscu, wybor jednego wariantu z kilku, dodatki obok
wariantow i wskazanie, co ma byc zaznaczone, gdy klient otworzy link.

## Stan przed zmiana

Piec braków, wszystkie zglosil wlasciciel po pierwszej ofercie wystawionej
na zywym kliencie (WY20260825, dwa warianty wydruku klucza).

1. **Kwoty w drugim formularzu.** Pozycje na gorze, ceny nizej, osobny
   przycisk. Zapis jednej polowy nie zapisywal drugiej.
2. **Lista "Co zrobic"** z opcjami "zostaw" i "usun te pozycje" przy kazdym
   wierszu. Odtworzenie: dowolna wycena, sekcja pozycji.
3. **Waznosci nie dalo sie zmienic bez wpisywania kwot od nowa**, bo pole
   "Wazna przez, dni" stalo przy przycisku wyceniania.
4. **Wybor byl na poziomie CALEJ oferty** (`quotes.pick_one`): albo wszystkie
   pozycje sa rachunkiem, albo wszystkie sa alternatywami. Scenariusz
   "klucz 56 albo 68 mm plus opcjonalne polerowanie" nie mial jak powstac,
   tak samo jak dwa niezalezne wybory w jednej ofercie.
5. **Zaznaczenia domyslnego nie dalo sie wskazac.** Klient dostawal wybor
   zrobiony przez przypadek: pierwsza wyceniona pozycja.

## Zalozenia i decyzje

- Rodzaj pozycji (`fixed`, `variant`, `option`), karta (`group_key`)
  i zaznaczenie (`selected`) mieszkaja w `quote_items`. Zrodlo: ADR-0017, p. 1.
- `pick_one` zostaje w tabeli jako slad po starych ofertach i gasnie przy
  pierwszym zapisie z nowego edytora. Zrodlo: ADR-0017, p. 2.
- Jeden formularz, jedna trasa zapisu w panelu; API `/price` zostaje.
  Zrodlo: ADR-0017, p. 3.
- Numer wiersza jedzie w WARTOSCI pola, nie w jego obecnosci. To zamyka te
  sama awarie, przed ktora bronila lista "co zrobic". Zrodlo: ADR-0017, p. 4.
- Regule "w grupie zaznaczony jest dokladnie jeden" egzekwuje serwer.
  Zrodlo: ADR-0017, p. 5.

## Zakres

### Zmienione pliki

- `chat-api/quotes.js`: `ITEM_KINDS`, `selectedQuoteItems()`,
  `quoteAmountGrosze()`, `quoteGroups()`, wspolna `kwotaJednostkowa()`,
  `chooseQuoteOption()` w miejsce `chooseVariant()`, `updateQuote()` przyjmuje
  kwoty, rodzaje, karty, zaznaczenia, notatke i waznosc w dniach.
- `chat-api/server.js`: migracja trzech kolumn i przepisanie starych ofert,
  `kind`/`groupKey`/`selected` w obu payloadach oferty, trasa `/choose`
  przyjmuje `selected`.
- `chat-api/orderMail.js`: mail oznacza warianty i dodatki, dopisuje zdanie
  o tym, ze kwota dotyczy zaznaczonego ukladu.
- `admin/server.js`: `POST /quotes/:ref/edit` zapisuje cala oferte,
  `POST /quotes/:ref/price` usuniete.
- `admin/views/quote-edit.ejs`: jeden formularz, kwota przy pozycji, olowek
  i krzyzyk, rodzaj i grupa wyboru w widocznym wierszu, objasnienie nad lista,
  waznosc dwiema drogami z prawdziwa data i liczba pozostalych dni.
- `admin/wersja.js`, `admin/views/partials/header.ejs`: wersja panelu i wersja
  backendu sklepu w naglowku, z ostrzezeniem przy rozjezdzie.
- `scripts/it-offer-groups.mjs`: test na prawdziwej bazie (poza buildem).
- `admin/public/tailwind.css`: przebudowany po zmianie klas w szablonie.
- `admin/check-views.mjs`: dane przykladowe z trzema rodzajami pozycji.
- `src/pages/Offer.jsx`: karty wyboru u klienta, wspolny `Wiersz`,
  `ustawWybor()`, nowe klucze pl/en/de.
- `scripts/quotes-schema.sql`, `scripts/test-quote-edit.mjs`.
- `MDs/decisions/ADR-0017-uklad-wyboru-w-ofercie.md`.

### Swiadomie poza zakresem

- **Dodatek zwiazany z konkretnym wariantem.** Dodatek nalezy do karty, nie do
  wariantu, wiec ma jedna cene niezaleznie od wybranego wariantu. Powod
  w ADR-0017, "Czego ta decyzja nie rozstrzyga".
- **Zmiana ilosci przez klienta na stronie oferty.** Ilosc ustawia edytor.
- **`quotes.pick_one` i `chosen_item_id` NIE znikaja z tabeli.** Stoja za nimi
  oferty juz wyslane.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Rachunek, karta, dwie karty, dodatek | `node scripts/test-quote-edit.mjs`, sekcja 5 | pass |
| Odznaczony dodatek nie wchodzi do kwoty | ten sam test | pass |
| Dodatek bez kwoty nie wchodzi do rachunku | ten sam test | pass |
| Karta bez zaznaczenia bierze pierwszy wyceniony wariant | ten sam test | pass |
| Stara oferta `pick_one` dalej oddaje wskazany wariant | ten sam test | pass |
| Kazde pole wiersza stoi w szablonie dokladnie raz | ten sam test, sekcja 4 | pass |
| Kwota ma jedna regule w obu drogach | ten sam test, sekcja 3 | pass |
| Wybor klienta chroniony tokenem i sprawdzany po stronie serwera | ten sam test, sekcja 6 | pass |
| Szablony panelu renderuja sie na danych z trzema rodzajami pozycji | `node admin/check-views.mjs` | pass |
| Klasy szablonu sa w arkuszu | `cd admin && npm run build:css` | pass |
| Wycenianie starym API dalej dziala | `node scripts/test-saved-quote.mjs` | pass |
| Termin waznosci naprawde siedzi w bazie | `node scripts/it-offer-groups.mjs` | pass |
| Dwie niezalezne grupy jednokrotnego wyboru w jednej ofercie | ten sam test | pass |
| Przestawienie domyslnego zaznaczenia przezywa zapis | ten sam test | pass |
| Odznaczony dodatek zostaje odznaczony | ten sam test | pass |
| Rodzaj i grupa stoja w widocznym wierszu | `node scripts/test-quote-edit.mjs`, sekcja 4 | pass |
| Wersje panelu i backendu widac z ekranu | ten sam test, sekcja 7 | pass |
| Build | `npm run build` | pass, kod wyjscia 0 |

## Ryzyka i otwarte pytania

- **Migracja rusza produkcyjne wiersze.** Trzy `ALTER TABLE` i dwa `UPDATE`
  ida po sobie przy starcie `chat-api`. Krok drugi dotyka WYLACZNIE ofert
  z `pick_one`, krok trzeci wylacznie grup bez zaznaczenia. Warto obejrzec
  log startu: `[migracja] warianty oferty:` przy bledzie.
- **Kwoty w edytorze zapisuja sie teraz ta sama trasa co reszta.** Regula
  "dodatnia albo zadna" jest jedna (`kwotaJednostkowa`), ale drog do niej sa
  dwie: edycja i `/api/quotes/:ref/price`. Rozjazd miedzy nimi byl by cichy,
  dlatego test sprawdza, ze obie wolaja te sama funkcje.
- **Kod rabatowy pada po kazdej zmianie ukladu.** Tak bylo juz przy wyborze
  wariantu, teraz dotyczy tez zaznaczenia dodatku. Klient musi wpisac kod
  ponownie i dowiaduje sie o tym dopiero po zniknieciu znizki.
- **Nazwa grupy jest tekstem.** Literowka rozdziela grupe na dwie. Widac to od
  razu w podgladzie, ale nic tego nie blokuje.
- **Numery wersji podnosi sie recznie.** `PANEL_WERSJA` w `admin/wersja.js`
  i `WERSJA_API` w `chat-api/server.js`. Zapomniany numer znaczy naglowek, ktory
  mowi, ze wszystko sie zgadza, kiedy sie nie zgadza. Rozjazd schematu bazy jest
  odporny na to zapomnienie, bo backend czyta go z `information_schema`.
- **Wlasciciel zglosil trzy braki, ktorych w silniku nie bylo.** Wszystkie trzy
  byly widoczne wylacznie z ekranu: schowane kontrolki, podpowiedz "14"
  wygladajaca jak zapisany termin i slowo "karta" znaczace w tym projekcie
  co innego. Warto o tym pamietac przy nastepnej zmianie w panelu: test
  tekstowy przechodzil, a funkcji nie dalo sie uzyc.
- **Mail z oferta nie pokazuje sumy pozycji zaznaczonych**, tylko kwote
  z naglowka i liste wszystkiego z oznaczeniami. Przy szesciu pozycjach
  na dwoch kartach moze to byc za duzo tresci w mailu.

## Instrukcja dla recenzenta

1. **Najwazniejsza hipoteza do podwazenia:** czy `selectedQuoteItems()` na
   pewno jest jedynym miejscem, ktore rozstrzyga o kwocie. Sprawdz cztery
   bramki: `GET /api/quotes/:ref` (strona oferty), `quoteItemsForDiscount`,
   `convertQuoteToOrder` i `updateQuote`. Druga regula gdziekolwiek indziej
   znaczy zamowienie na inna rzecz niz zaplacona.
2. **Granica systemu:** `chooseQuoteOption`. Klient moze podac dowolne
   `itemId`; sprawdz, ze pozycja obca, pozycja bez kwoty i pozycja typu
   `fixed` sa odrzucane, a wariant nie da sie odznaczyc.
3. **Zgodnosc wstecz:** wez oferte wyslana przed zmiana (`pick_one = true`)
   i otworz ja linkiem. Ma pokazac ten sam wybrany wariant i te sama kwote,
   takze przed uruchomieniem migracji.
4. **Formularz:** dodaj pozycje, usun inna i zmien zaznaczenie w JEDNYM
   zapisie. Zmiany maja trafic w te pozycje, ktore wskazano.
5. **Dokumenty do potwierdzenia:** ADR-0017.

## Warunek uznania zadania za gotowe

1. Kwota pozycji wpisuje sie przy pozycji, jednym przyciskiem razem z reszta.
2. W wierszu pozycji nie ma listy "co zrobic", jest olowek i czerwony krzyzyk,
   a krzyzyk pyta o potwierdzenie.
3. Waznosc oferty zmienia sie bez wpisywania kwot od nowa, dniami albo data.
4. Da sie ulozyc karte "klucz 56 albo 68 mm plus opcjonalne polerowanie"
   i druga karte obok, z niezaleznym wyborem.
5. Zaznaczenie domyslne ustawia edytor; w grupie wariantow zaznaczony jest
   dokladnie jeden, i pilnuje tego serwer.
6. Klient widzi ten uklad na stronie oferty, przestawia go i placi za to,
   co zaznaczyl.
7. Do zamowienia trafiaja WYLACZNIE pozycje wybrane.
8. Oferta wyslana przed zmiana dalej pokazuje sie i placi tak samo.
