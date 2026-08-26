# Handoff zadania

```yaml
task_id: TASK-011
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: a52941d108527f1874155746be048ba381e2b1e7
last_commit: b26f15a6d74b1582c0059d4a18c2a16bc23e42be
updated: 2026-08-26
```

## Cel

Klient z wycena ustalona z czlowiekiem trafia do platnosci takze bez linka
z maila, a pracownia moze poprawic i usunac wiersz w kolejce.

## Stan przed zmiana

Trzy mierzalne braki.

1. `/oferta/` przyjmowala sam numer od poczatku, ale nie prowadzil do niej
   zaden odnosnik: `noindex`, brak w menu, brak w mapie strony. Odtworzenie:
   szukanie slowa "oferta" w nawigacji serwisu nie daje nic.
2. Kolejka szla wylacznie naprzod. Klikniecie "zrobione" w zlym wierszu
   zamykalo zamowienie, ktore znikalo z ekranu razem z jedynym miejscem, gdzie
   dalo by sie je poprawic. Bledny numer przesylki zostawal na zawsze, bo
   `COALESCE` w trasie etapu nie nadpisuje wartosci juz zapisanej.
3. Wpisy testowe z toru oferty mieszaly sie w kolejce z prawdziwa praca i nie
   bylo ich jak usunac z panelu kolejki.

## Zalozenia i decyzje

- Wejscie z numerem w sklepie NIE omija drugiego skladnika. Zrodlo: ADR-0012.
  Pole przenosi na `/oferta/`, a ta pyta o adres albo o kod odbioru.
- Korekta etapu jest osobna regula (`korekta()`), nie rozluznieniem
  `przejscie()`. Zrodlo: ADR-0014.
- Trwale kasowanie kazdego rekordu, takze oplaconego. **Decyzja wlasciciela
  z 2026-08-26.** Zglosilem sprzecznosc z polityka retencji i zaproponowalem
  wariant lagodniejszy (kasowanie tylko nieoplaconych, reszta przez `cancelled`);
  wlasciciel wybral wariant twardy. Rozstrzygniecie w ADR-0014.
- Kasowanie idzie ISTNIEJACA trasa przez znacznik `force`, nie nowa trasa obok.
  Powod nizej, w ryzykach.

## Zakres

### Zmienione pliki

- `chat-api/productionQueue.js`: `korekta()`, `ETAPY_KOLEJNO`.
- `chat-api/server.js`: filtr stanu w `/api/orders/queue`, trasa
  `POST /api/orders/:ref/queue` (poprawka wiersza), znacznik `force`
  w istniejacej `DELETE /api/orders/:ref`.
- `admin/server.js`, `admin/views/queue.ejs`, `admin/public/tailwind.css`:
  sekcja "Popraw wiersz", formularz usuwania, filtr stanu, adres powrotu
  w kazdym formularzu.
- `src/components/shop/OfferNumberEntry.jsx` (nowy), `src/pages/Shop.jsx`,
  `src/pages/Cart.jsx`: pole "Masz numer oferty?". W koszyku widoczne w obu
  stanach: przy pustym zamiast zawartosci, przy pelnym pod podsumowaniem.
- `chat-api/quotes.js`: `updateQuote()`, `deleteQuote()`, `wybranyWariant()`, `chooseVariant()`.
- `scripts/quotes-schema.sql` i blok startowy serwera: `quotes.pick_one`, `quotes.chosen_item_id`.
- `src/pages/Offer.jsx`: warianty jako pole wyboru, kwota za wybranym wariantem.
- `chat-api/server.js`: `POST /api/quotes/:ref/update`, `DELETE /api/quotes/:ref`, `POST /api/quotes/:ref/choose`.
- `admin/server.js`, `admin/views/quote-edit.ejs`, `admin/views/quotes.ejs`: edycja danych
  i pozycji oferty, usuwanie z potwierdzeniem, kolumna akcji w tabeli wycen.
- `src/pages/Payments.jsx` (nowa strona `/payments/`), `src/main.jsx`, `src/entry-server.jsx`,
  `scripts/prerender.mjs`, `src/seo/seoData.js`, `src/components/PolicyLinks.jsx`,
  `src/i18n/{pl,en,de}.js`: strona "Proces platnosci" i wpis w menu pod "Sklep".
- `src/pricing/config.js`: `QUOTE_VALIDITY_DAYS` przeniesione z `chat-api/quotes.js`.
- `scripts/test-production-queue.mjs`: sekcje 5 i 6.
- `scripts/test-quote-edit.mjs`: nowy test edycji, wariantow i usuwania oferty.
- `MDs/decisions/ADR-0014-poprawianie-i-usuwanie-w-kolejce.md`,
  `MDs/AEJaCA_Brand_Reference.md` (wersja 5.5), `public/llms.txt`,
  `chat-api/context.js`.

### Swiadomie poza zakresem

- **Powiadomienie klienta o zmianie etapu.** Dalej nie wychodzi zaden mail,
  tak samo jak po TASK-010.
- **Anulowanie zamowienia z ekranu kolejki.** Trasa rezygnacji istnieje
  (`/api/orders/:ref/cancel`) i obsluguje ja panel przelewow, ale kolejka jej
  nie wola. Kolejka umie poprawic etap albo usunac wiersz.
- **`sitemap.xml` i `seoData.js`** nietkniete: `/oferta/` ma `noindex`,
  a `/shop/` i `/cart/` nie zmienily tresci na tyle, zeby ruszac `lastmod`.
- **PROJECT_RULES.md** nietkniety. Sekcja 1 pozwala zmienic regule biznesowa
  dopiero po ZAAKCEPTOWANYM ADR, a ADR-0014 ma status `draft`. Po akceptacji
  warto dopisac tam jedno zdanie o recznym wyjatku od retencji.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Reguly korekty | `node scripts/test-production-queue.mjs` sekcja 5 | pass |
| Kontrola negatywna: wysylka bez zaplaty przez korekte | proba `korekta("awaiting_payment", "in_production")` | odrzucona, `not_in_queue` |
| Kontrola negatywna: druga trasa kasowania | dopisanie drugiego `app.delete("/api/orders/:ref")` | fail zgodnie z oczekiwaniem, 3 czerwone linie |
| Szablony panelu | `node admin/check-views.mjs` | pass, 8 widokow renderuje sie |
| Arkusz panelu | `node admin/check-styles.mjs` po `npm run build:css` | pass |
| Tryb jasny | `node scripts/check-light-theme.mjs` | pass, 188 klas z nadpisaniem |
| Start API | `node scripts/test-chat-api-boot.mjs` | pass |
| Build | `npm run build` | pass, 99 stron, zero bledow |

## Ryzyka i otwarte pytania

- **Bledu, ktory sam popelnilem, nie zlapal zaden straznik.** Pierwsza wersja
  dokladala DRUGA trase `DELETE /api/orders/:ref`. Express odpowiada ta
  zarejestrowana wczesniej, wiec istniejaca trasa razem z warunkami
  z `orderCleanup.js` przestawala odpowiadac na cokolwiek, bez jednego bledu
  w buildzie i bez sladu w diffie. Znalazlem to dopiero czytajac komentarz
  w `retention.js`. Test liczy teraz trasy, ale ta sama pulapka dotyczy KAZDEJ
  sciezki w `server.js`, a sprawdzana jest jedna. Warta osobnego strażnika.
- **Nie sprawdzilem niczego na zywej bazie.** Korekta, kasowanie i oddawanie
  kodu rabatowego sa zweryfikowane statycznie i jednostkowo. Zachowanie kaskad
  i licznika `used_count` wynika z odczytania schematu, nie z uruchomienia.
- **Usuniecie oplaconego zamowienia zabiera pozycje i kwoty**, ktore moga byc
  potrzebne przy rozliczeniu podatkowym albo reklamacji platnosci. Dowod wplaty
  zostaje w `payment_notifications`, ale to, za co ta wplata byla, juz nie.
  Ryzyko przyjete swiadomie przez wlasciciela, opisane w ADR-0014.
- **Decyzja Artura:** status ADR-0014 i ADR-0015, dzis oba `draft`.
- **Oferta wielowariantowa ma JEDEN termin waznosci dla calej oferty.** Przy
  ofercie mieszajacej kruszce (srebro obok zlota) calosc dostaje ten krotszy
  termin, bo `valid_until` stoi na naglowku. Rozdzielenie terminow na warianty
  to osobna kolumna i osobna decyzja.
- **Wariant nie rozklada sie na podpozycje.** Decyzja wlasciciela z 2026-08-26:
  jedna kwota, opis w tresci oferty. Rozbicie wariantu na pozycje skladowe jest
  swiadomie poza zakresem.

## Instrukcja dla recenzenta

1. **Najwazniejsza hipoteza do podwazenia:** czy `korekta()` na pewno nie
   otwiera drogi, ktorej broni `przejscie()`. Sprawdz kazdy stan spoza
   `ETAPY_KOLEJNO`, w szczegolnosci `payment_review` i `awaiting_transfer`.
2. **Granica systemu:** `DELETE /api/orders/:ref`. Sprawdz, czy bez `force`
   zachowuje sie dokladnie jak przed zmiana, bo wola ja panel przelewow, oraz
   czy `force` nie da sie ustawic inaczej niz jawnym `true`.
3. **Dokumenty do potwierdzenia:** ADR-0014, `Brand_Reference.md` sekcja 10b
   (oferta i kolejka), `llms.txt`, `chat-api/context.js`.

## Warunek uznania zadania za gotowe

1. Pole numeru oferty na `/shop/` i w koszyku, pustym i pelnym, przenosi na
   `/oferta/` z numerem w adresie, w kazdym z trzech jezykow.
2. Sam numer nadal nie wystarcza do zobaczenia oferty.
3. Zadna korekta nie wprowadza zamowienia nieoplaconego do etapow pracy.
4. Cofniecie etapu kasuje stemple etapow po docelowym i nie kasuje docelowego.
5. Kasowanie bez `force` nadal odmawia na warunkach z `orderCleanup.js`.
6. `DELETE /api/orders/:ref` istnieje w `server.js` dokladnie raz.
7. Edycja oferty nie rusza kwot jednostkowych, a zmiana ilosci przelicza wartosc
   pozycji i sume naglowka.
8. Wycena `converted` nie daje sie edytowac ani wycenic, a jej usuniecie wymaga
   drugiego potwierdzenia.
9. Usuwanie pozycji w formularzu idzie lista, nie polem zaznaczanym.
10. Oferta wielowariantowa nigdy nie zostaje bez kwoty: bez wskazania wybrany
    jest pierwszy wyceniony wariant, a wskazanie na pozycje usunieta spada na
    pierwszy pozostaly.
11. Do zamowienia i do rabatu idzie WYLACZNIE wybrany wariant, nie suma
    propozycji.
12. Wyboru wariantu nie da sie ustawic na pozycje spoza tej oferty ani na
    wariant bez kwoty, i nie da sie go zmienic po konwersji.
