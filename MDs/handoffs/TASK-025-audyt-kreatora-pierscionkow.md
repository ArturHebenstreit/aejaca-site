---
task_id: TASK-025
status: review
author: Claude Code
branch: claude/serwis-development-skills-3vuba9
base_commit: df293658c98f363441354dfdb3808bac7e150abb
last_commit: 8769e89a190ecc5366ecf4e0cf6f236c9dd59cf1
updated: 2026-09-12
---

# Handoff: audyt kreatora pierscionkow w przegladarce

## Cel

Kreator pierscionkow stoi pod adresem `/toolsjewelry/kreator/` do testow, nie
dla klientow, i dziala od pierwszego wejscia po cene wiazaca, a kazda awaria
warstwy, ktorej testy w Node nie widza, ma czytelny komunikat.

## Stan przed zmiana

Wlasciciel zglosil, ze "bardzo duzo nie dzialalo". Oba sprawdziany w Node
(`test-ring-generator`, 49 sekcji, i `test-ring-pricing`) przechodzily, wiec
wina lezala w warstwach, ktorych one nie dotykaja. Odtworzone trzy:

1. **Strona nie istniala pod adresem.** Trasa zostala usunieta 4 wrzesnia,
   a komentarz w `src/routes.js` obiecywal, ze "wpisanie tu jednej linii wraca
   z nia na strone". Nieprawda: strona musi byc zarejestrowana takze
   w `src/main.jsx` i `src/entry-server.jsx`, inaczej adres daje pusty ekran.
   Razem z trasa wypadlo tez wykluczenie z mapy witryny.
2. **Cena wiazaca oddawala 500 "Wycena chwilowo niedostepna".**
   `/api/price/ring` czytalo `rates.pln_per_eur` bez sprawdzenia, a
   `currentMetalRates()` oddaje `null` bez bazy, przy padnietym zapytaniu
   i przy pustej tabeli kursow. Odtworzenie: serwer bez `DATABASE_URL`,
   POST domyslnych parametrow. Sasiednia trasa `/api/price` miala warunek.
3. **Watek geometrii, ktory nie wstal, milczal.** Komponent podpinal tylko
   `onmessage`. Przy zablokowanym pliku watku strona zostawala na "Licze
   bryle..." w nieskonczonosc, bez komunikatu i bez wpisu w konsoli; przy
   zablokowanym `manifold.wasm` klient widzial surowe "Aborted(NetworkError
   ...) Build with -sASSERTIONS". Odtworzenie: `context.route()` w Playwright
   blokujacy kolejno oba pliki.

## Zalozenia i decyzje

- Kreator jest osiagalny pod adresem, `noindex`, bez odnosnikow, poza mapa
  witryny i `llms.txt`; zrodlo: jawne ustalenie wlasciciela 2026-09-12
  ("nie powinien byc dostepny dla klientow, ale zeby mozna go testowac").
  Odrzucona alternatywa: bramka na token, bo stan sprzed 4 wrzesnia byl
  identyczny i wystarczal, a adres i tak zna tylko ten, komu go podamy.
- Brak kursow z bazy to przypadek normalny, nie awaria: wycena liczy
  z kursow zapasowych, tak jak w `/api/price`.
- Blad watku trzymamy w stanie jako RODZAJ i tlumaczymy przy rysowaniu,
  zeby obsluga zdarzen podpinana raz nie musiala znac slownika.

## Zakres

### Zmienione pliki

- `src/routes.js`, `src/main.jsx`, `src/entry-server.jsx`: rejestracja strony
  w trzech miejscach i prawdziwy komentarz zamiast obietnicy jednej linii.
- `scripts/build-sitemap.mjs`: adres kreatora z powrotem w `POZA_MAPA`.
- `chat-api/server.js`: `rates ? currentGemstones(rates.pln_per_eur) : null`.
- `chat-api/priceRing.test.mjs`, `chat-api/package.json`: test podnoszacy
  serwer bez bazy i zadajacy ceny domyslnego pierscionka; w lancuchu `npm test`.
- `src/components/calculators/RingConfigurator.jsx`: `onerror`,
  `onmessageerror`, straznik 30 s, tlumaczenie bledow jadra na zdanie
  w trzech jezykach.

### Swiadomie poza zakresem

- Konfiguracja w URL (plan z 2026-08-05 ja obiecywal; nie ma jej i nikt jej
  nie dopisal).
- Jasny motyw kreatora: bramka `check-light-theme` go nie obejmuje, strona
  ustawia ciemne tlo sama, podglad jest czarny. Spojne, ale nieprzegladane.
- Sciezka zakupu za koszykiem (plik, odlew, wyrob) nie byla testowana
  koncowo, bo wymaga platnosci.
- Estetyka proporcji (ryzyko nr 1 z planu): audyt sprawdza, czy sie liczy
  i rysuje, nie czy jest ladne.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Blad przed poprawka | serwer bez bazy, POST `/api/price/ring` | 500, `TypeError: Cannot read properties of null (reading 'pln_per_eur')` |
| Po poprawce | `node chat-api/priceRing.test.mjs` | pass: plik 58,80 zl, odlew 238,17 zl, wyrob 377,32 zl |
| Watek zablokowany, przed | Playwright `route().abort()` na pliku watku | "Licze bryle..." po 25 s, bez komunikatu i bez wpisu w konsoli |
| WASM zablokowany, przed | jak wyzej na `manifold-*.wasm` | surowy komunikat Emscriptena na ekranie |
| Watek zablokowany, po | ta sama symulacja na nowym buildzie | "Nie udalo sie uruchomic silnika geometrii. Odswiez strone; jesli to nie pomoze, napisz do nas.", napis zajetosci zgaszony |
| WASM zablokowany, po | jak wyzej | "Nie udalo sie pobrac silnika geometrii. Sprawdz polaczenie i odswiez strone." zamiast surowego Emscriptena |
| Wzory | 25 presetow w przegladarce, SwiftShader | 25/25 bryla bez bledu, masa 1,26-19,59 g, kamieni 0-31 |
| Suwaki na skrajach | szerokosc 1,6 i 3,5, grubosc 1,2, kamien 8, rozmiar 14 i 23, boczne 2,6 | bez bledu; przy 1,6 mm z pave kontrola wykonalnosci cofnela projekt, zgodnie z ADR-0005 |
| Cena z lokalnego API | pole ceny po naprawie trasy | trzy wyjscia z kwotami |
| Konsola, bledy strony, siec | caly przebieg | 0, 0, 0 |
| Telefon 390 px | przewijanie w bok | brak |
| Lustro geometrii | `sync-pricing --check` i `diff` | tylko naglowek generatora i sciezki importow |
| Bramki builda przed `vite build` | 98 sprawdzianow | pass |
| Pelny build | `npm run build` | pass, 222 stron prerenderu, 0 bledow, kod wyjscia 0 |
| Testy chat-api | `npm test` w `chat-api/` | pass, 14 zestawow |

Zastrzezenie do pomiaru czasu: pierwsze dwa przebiegi audytu padly na
bledach MOJEGO skryptu (regex na tekscie po `uppercase`, zapis raportu dopiero
na koncu, wpisanie wartosci spoza zakresu suwaka). W trzecim kazdy krok
pokazuje rowne ~30 s, bo skrypt czekal na nieistniejacy element bledu;
prawdziwy czas bryly to nadwyzka ponad 30 000 ms, od kilku milisekund
do 3 s. Watek w izolacji odpowiada w 213 ms.

## Ryzyka i otwarte pytania

- Nie sprawdzono na produkcji, czy 500 z ceny bralo sie z pustej tabeli
  kursow, czy z czego innego; poprawka zamyka wszystkie trzy drogi do `null`.
- Straznik 30 s jest dobrany do watku, ktory w izolacji odpowiada w 213 ms;
  przy bardzo wolnym telefonie i najciezszym halo moze byc za krotki.
  Wtedy komunikat kaze odswiezyc strone, a nie klamie o awarii serwera.
- Historia `WORKER_VERSION` w pliku watku to same wpisy o CSP i cache
  brzegowym: jesli produkcja znow pokaze "Licze bryle..." w nieskonczonosc,
  teraz pojawi sie komunikat, ale przyczyna nadal moze byc po stronie cache.

## Instrukcja dla recenzenta

1. Otworz `/toolsjewelry/kreator/` z gornego menu urzadzen: adres nie moze
   byc nigdzie linkowany, a strona ma niesc `noindex`.
2. Zablokuj w narzedziach przegladarki plik `ringGenerator.worker-*.js`
   i odswiez: ma byc zdanie o silniku geometrii, nie wieczne "Licze bryle...".
3. Na Railway sprawdz, czy tabela `market_rates` ma wiersze; jesli nie,
   cena wiazaca liczy teraz z kursow zapasowych i warto to wiedziec.
