---
task_id: TASK-027
status: review
author: Claude Code
branch: claude/serwis-development-skills-3vuba9
base_commit: f4826ad
last_commit: 90f081f
updated: 2026-09-13
---

# Handoff: przyjmowanie modelu klienta do odlewu w metalu

## Cel

Usluga odlewu przyjmowala plik klienta i nie pytala o nic, co dotyczy samego
modelu. Zlecenie: uwzglednic skurcz i potwierdzic, ze klient go uwzglednil,
oraz naddatek na szlif otworu przy obraczce i pierscionku. Podstawa: brief
`MDs/AEJaCA_Brief_Odlew_z_pliku_klienta.md`.

## Co zastalismy, wbrew zalozeniu briefu

Brief otwiera sie zdaniem, ze sciezki dla odlewu z pliku klienta brakuje. Ona
istnieje od 7 wrzesnia 2026 (TASK-009, TASK-012): usluga
`precious_metal_casting`, wariant `model_3d`, piec kruszcow, piec poziomow
wykonczenia, kontrola kolby. Brakowalo w niej wylacznie tego, o co pytal
wlasciciel. Dopisalismy do istniejacej, nie budowalismy drugiej.

Dalsze rozjazdy briefu wobec kodu i sposob ich rozstrzygniecia: ADR-0048.
Najkrocej: skurcz i gestosc zostaja w `castingAlloys.js`, gabaryt zostaje
Ø63 x 62 mm, gestosci zostaja te z wyceny, minimum sciany to 0,45 mm.

## Sprzecznosc w zleceniu i decyzja wlasciciela

Brief: klient oddaje model 1:1 i niczego nie kompensuje. Polecenie: klient
uwzglednia skurcz, a my potwierdzamy. Formularz 2026-09-13 wybral trzecie
wyjscie: **pytamy o stan pliku**, a klient wskazuje stop, nie mnoznik.

Dwie pozostale decyzje z tego samego formularza: rozbieznosc otworu ponad
0,2 mm zatrzymuje zamowienie; zakres tego przejscia to sciezka przyjecia pliku,
bez nowej strony uslugi i bez zmian w cenniku.

## Co powstalo

| Plik | Rola |
|---|---|
| `src/data/castingSpec.js` | stany pliku, kategorie wyrobu, naddatki, minimalne grubosci, rachunek wymiaru, prog rozbieznosci otworu |
| `src/pricing/castingIntake.js` | bramka: blokady, ostrzezenia, wiersze bloku przeliczenia |
| `src/analysis/printability.js` | dwa nowe pomiary: `analyzeSolids` i `analyzeAxialHole` |
| `chat-api/orders.js` | `jakoscSiatki` przy wgrywaniu, bramka przed wycena, skalowanie grubosci i otworu |
| `chat-api/server.js` | jakosc siatki w odpowiedzi na wgranie pliku |
| `src/data/orderCatalog.js` | szesc nowych pol uslugi |
| `src/components/shop/PolaUslugi.jsx` | nowy typ kontrolki `liczba` |
| `src/pages/Order.jsx` | `ukryjGdy` i pole liczbowe w uproszczonym renderze |
| `src/pricing/preciousMetalCasting.js` | cztery nowe pozycje na liscie brakow |
| `scripts/test-casting-intake.mjs` | 33 sprawdziany, w lancuchu `npm run build` |
| `src/components/calculators/CalcToCart.jsx` | `onOdpowiedz`: ustalenia bramki i kod bledu wychodza z zapytania o cene |
| `src/components/calculators/MetalCastCalc.jsx`, `src/components/shop/ServiceConfigurator.jsx` | blok przeliczenia, ostrzezenia, odmowa w tonie rozowym |
| `chat-api/orders.js` (`castingAcknowledgement`), `chat-api/server.js` | pokwitowanie ostrzezen: serwer zapisuje wlasna liste, odmawia bez pokwitowania |
| `src/data/termsContent.js` | sekcja 13, dwa ustepy o odlewie z modelu klienta, w trzech jezykach |
| `src/pages/OdlewZPliku.jsx`, `src/data/odlewZPliku.js`, `src/data/faq/odlewZPliku.js` | strona `/uslugi/odlew-z-pliku/`, tresc i siedem pytan |
| `src/routes.js`, `src/main.jsx`, `src/entry-server.jsx`, `src/seo/seoData.js`, `src/data/faq/index.js`, `src/pages/Faq.jsx`, `src/components/Footer.jsx`, `src/i18n/*` | rejestracja strony, SEO, spis pytan, stopka |
| `public/_redirects` | `/uslugi/` przestaje byc twardym 404 |
| `public/llms.txt`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md` | synchronizacja konfiguracji po nowej stronie |

## Jak to dziala

**Deklaracja stanu pliku.** Pole `modelStanId` bez wartosci domyslnej, dwie
odpowiedzi. Przy `compensated` dochodzi `modelStopId`. Korekta skali to iloraz
`skurcz(zamowiony) / skurcz(zadeklarowany)`, wiec przy zgodnym stopie wychodzi
dokladnie 1,0000 i plik idzie do druku nietkniety. To jest cala obrona przed
podwojna kompensacja.

**Naddatek otworu.** Odejmujemy 0,15 mm od srednicy docelowej, bo szlif otwor
POWIEKSZA. Znak tego dzialania jest cala trudnoscia rachunku, wiec kierunek
jest parametrem funkcji, a nie zalozeniem w glowie. Powierzchnia zdobiona nie
dostaje naddatku nigdy.

**Pomiar z pliku.** Przy wgrywaniu, bo bajty sa w calosci tylko wtedy: potem
ida na Dysk, a w bazie zostaje sam wiersz. Liczymy szczelnosc, liczbe bryl,
najciensza scianke (percentyl 1%) i srednice otworu. Powyzej 250 tysiecy
trojkatow pomiary promieniami sa pomijane, a bramka mowi wprost, ze ich nie
bylo, zamiast milczeniem sugerowac, ze jest dobrze.

**Pomiar otworu** szuka NAJWIEKSZEGO OKREGU WPISANEGO, a nie promienia od
srodka prostokata otaczajacego: przy soliterze korona przesuwa ten srodek o dwa
milimetry w gore i pierwsza wersja mierzyla 13,0 mm zamiast 17,2 mm. Punkt musi
lezec w powietrzu (parzysta liczba przeciec z powierzchnia), inaczej lita
kostka odpowiadalaby "otwor 10 mm". Jedna piata promieni moze uciec, bo
pierscionek z pave ma gniazda przewiercone na wylot.

## Zmierzone

| Bryla | Otwor zmierzony | Oczekiwany | Blad |
|---|---|---|---|
| soliter | 17,189 mm | 17,200 mm | 0,011 mm |
| obraczka | 17,191 mm | 17,200 mm | 0,009 mm |
| halo | 17,189 mm | 17,200 mm | 0,011 mm |
| pave | 17,189 mm | 17,200 mm | 0,011 mm |

Blad jest 18 razy mniejszy od progu rozbieznosci, wiec prog mierzy model, a nie
wlasna dyskretyzacje. Czas pomiaru: 0,05 s przy 2,9 tysiaca trojkatow, 0,35 s
przy 33 tysiacach.

## Czego NIE zrobiono

- **Skladniki ceny** (material, odlew dzielony przez liczbe wyrobow w kolbie,
  obrobka, cechowanie) oraz ostrzezenie o kursie starszym niz 7 dni. Cennik
  jest wrazliwy i wlasciciel odlozyl to swiadomie.
- **Pytanie o kamienie.** Brief chcial przenosic takie pozycje na wycene
  indywidualna. Ta droga juz istnieje jako wariant "pomysl klienta", wiec
  drugie wejscie do tego samego miejsca wymaga najpierw decyzji, ktore z nich
  jest glowne.
- **Przeliczenie w mailu.** Jedzie z pozycja w `item.odlewZPliku`, ale szablon
  maila jeszcze go nie rysuje.

## Znalezione przy okazji i naprawione

- **Kalkulator studyjny wysylal do serwera wyliczanke pol**, a nie caly stan
  formularza. Szesc nowych pytan nie dojechaloby wiec do wyceny i klient
  dostawalby "parametry niekompletne" przy formularzu wypelnionym do konca.
  Teraz idzie `stan` w calosci.
- **`llms.txt` obiecywal kolbe 80 x 90 mm i limit 42 x 42 x 65 mm**, czyli
  wymiary sprzed 7 wrzesnia 2026. Poprawione na 83 x 100 mm i Ø63 x 62 mm.
- **Trzy dokumenty oferowaly odlew ze zlota czystego**, ktorego nie odlewamy od
  10 wrzesnia 2026 (`NIE_DO_ODLEWU`). Poprawione w `llms.txt`, `context.js`
  i Brand Reference; zloto 24k zostaje tam, gdzie dotyczy innych technik.

## Rozstrzygniete przez wlasciciela 2026-09-13, druga tura

Pelne uzasadnienia: ADR-0048, rozdzial "Cztery rozstrzygniecia".

1. **Minimum sciany zostaje 0,45 mm.** Model miedzy 0,45 a 1,0 mm przechodzi
   z ostrzezeniem i decyduje klient.
2. **Nieudany odlew z winy modelu: rozstrzyga ostrzezenie.** Ostrzeglismy i
   klient pokwitowal, to jego koszt. Nie ostrzeglismy, to nasz. Wdrozone:
   pokwitowanie przy kasie, serwer zapisuje przy pozycji SWOJA liste ostrzezen,
   regulamin sekcja 13 dostal dwa ustepy w trzech jezykach.
3. **Srebro 800 ma wlasny wspolczynnik 1,017** z literatury odlewniczej.
   Rekomendacja brzmiala inaczej i jest to w kodzie opisane: liczba nie
   pochodzi z pomiaru naszej probki. Pomiar zamknalby sprawe.
4. **Nastepna w kolejce byla strona uslugi**, przed skladnikami ceny i przed
   przeliczeniem w mailu.

## Tresc czekajaca na przeczytanie przez wlasciciela

Strona `/uslugi/odlew-z-pliku/` jest zbudowana i przechodzi build, ale jej tekst
sprzedaje najdrozsza usluge w serwisie i nie byl akceptowany. Cztery miejsca,
ktore warto przeczytac najpierw:

1. Odpowiedzialnosc za nieudany odlew (pytanie `co-gdy-odlew-nie-wyjdzie`).
   Tresc zgadza sie z ustepem dopisanym do sekcji 13 regulaminu, wiec oba
   moga isc razem, ale to jest zdanie o pieniadzach.
2. Cechowanie: strona mowi "po ustaleniu", FAQ dla B2B mowi "domyslnie tak".
3. Tolerancja 0,2 mm podana wprost klientowi detalicznemu.
4. Tabela metali pokazuje gestosc podstawowa, nie osobna dla bialego zlota,
   z dopiskiem, ze wycena liczy to osobno.

## Nadal do rozstrzygniecia

1. Pomiar wlasnej probki srebra 800, zeby 1,017 przestalo byc liczba z cudzej
   receptury stopu.
2. Cechowanie w Urzedzie Probierczym: w cenie czy opcja platna.
3. Minimalna wartosc zamowienia przy odlewie w zlocie.
4. Naprawa pliku jako osobna platna usluga i jej cena.
5. Status ADR-0048. Stoi `draft`, bo status ustala wlasciciel.

## Uwaga o historii commitow

`chat-api/orders.js` z funkcja `castingAcknowledgement` wszedl do commita
`d7ec05d`, ktorego opis mowi o srebrze 800 i o regulaminie. Powod: `git add -A`
wykonany w chwili, gdy rownolegly agent pisal ten plik. Kod jest kompletny i
przechodzi sprawdziany, myli tylko opis commita. Wniosek na przyszlosc: przy
pracy rownoleglej commitujemy sciezki wprost, nigdy `-A`.

## Jak sprawdzic

1. `node scripts/test-casting-intake.mjs`
2. `npm run build` (bramka synchronizacji kopii, potem reszta lancucha)
3. Recznie: wgrac model obraczki w kalkulatorze odlewu, wskazac "model juz
   powiekszony" i ten sam stop, ktory sie zamawia. Blok przeliczenia ma
   pokazac mnoznik 1,0000.
