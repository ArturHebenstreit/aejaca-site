---
task_id: TASK-029
status: review
author: Claude Code
branch: claude/serwis-development-skills-3vuba9
base_commit: c1b0dcf
last_commit: 1284b31
updated: 2026-09-14
---

# Handoff: bizuteria na zamowienie obiecuje cene dopiero z pelna wiedza

## Zgloszenie

Zapytanie z Niemiec, 13 wrzesnia 2026. Wisiorek z kamieniem, wlasny render
klienta, prosba o kaboszon albo rozetke, trzy oprawy, dwa wykonczenia
powierzchni. Kalkulator podal 684 do 901 EUR za sztuke. Wlasciciel wycenil te
robote na 1100 do 1450 EUR i polecil: "jak sie zabezpieczyc przed takimi
wpadkami, wiazaca cena jedynie kiedy mamy pelna wiedze co jest do zrobienia".

Formularz 2026-09-14 wybral trzy zabezpieczenia: czyj projekt plus wymiar,
pytanie o zlozonosc, szlif jako pole. Wszystkie trzy sa wdrozone.

## Co znaleziono przy sprawdzaniu analizy wlasciciela

Analiza wlasciciela zgadza sie z kodem co do joty. Przy jej sprawdzaniu wyszly
jeszcze dwie rzeczy, ktorych w zapytaniu nie widac:

**1. Bramka stala wylacznie w przegladarce.** Kalkulator, karta uslugi
w sklepie i koszyk mialy KAZDE wlasna liste warunkow, a serwer nie mial zadnej:
`bindingBasis` oddawalo dla `jewelry_new` bezwarunkowe `binding: true`.
Zamowienie zlozone z pominieciem formularza przechodzilo przez kase w calosci.

**2. Masa z przegladarki.** `calcNew` przyjmuje gotowa mase w parametrze
`overrideWeightG` (korzysta z tego odlew z pliku, gdzie liczy ja serwer),
a `priceItem` przepuszczal parametry z zapytania bez filtrowania. Pierscionek
ze zlota dalo sie zamowic po masie podanej przez zamawiajacego.

**3. Ekran i kasa liczyly z dwoch roznych mas.** Kalkulator liczyl mase
z wymiarow i pokazywal ja klientowi, ale do koszyka jechaly same parametry
katalogowe, wiec cene wiazaca liczyla stala (wisiorek zawsze 4 g). Wisiorek
30 x 20 x 4 mm w srebrze wazy okolo 14 g.

## Co powstalo

| Plik | Rola |
|---|---|
| `src/pricing/jewelryScope.js` | NOWY. Jedyne miejsce z regula: czyj projekt, co jest w wyrobie, jakie wymiary. Powody wyceny czlowieka i zdania do nich w trzech jezykach |
| `src/pricing/bindingBasis.js` | `jewelry_new` wychodzi z `Z_PARAMETROW` i dostaje wlasna bramke |
| `src/pricing/jewelry.js` | `calcNew` bierze parametry w calosci, liczy mase z wymiarow, oddaje `weightG`; szlif kamienia w petli po kamieniach |
| `src/pricing/jewelryConfig.js` | `STONE_CUTS`, `METAL_DENSITY` i `gestoscKruszcu` przeniesione tutaj z `jewelry.js` |
| `src/pricing/weightEngine.js` | obraczka dostaje wreszcie wzor masy (dotad oddawala zero gramow) |
| `src/data/orderCatalog.js` | pytanie o projekt, lista cech wyrobu, osiem pol wymiarowych; `complexityId` znika z karty bizuterii |
| `src/data/describeParams.js` | wybor wielokrotny, rozmiar palca i pole liczbowe opisuja sie po ludzku |
| `src/components/calculators/JewelryCalc.jsx` | wymiary trzymaja sie w parametrach pozycji, jedna bramka zamiast wlasnej listy, masa na karcie idzie z wyceny |
| `src/components/calculators/SimpleJewelryCalc.jsx` | szybka wycena nowego wyrobu nie prowadzi juz do koszyka |
| `src/components/calculators/CalcToCart.jsx`, `src/components/shop/ServiceConfigurator.jsx` | ta sama bramka, powod wypisany wprost zamiast jednego zdania na wszystkie przypadki |
| `src/components/shop/ConfigControls.jsx`, `PolaUslugi.jsx` | zdanie o brakujacej odpowiedzi, opis przy wyborze wielokrotnym |
| `src/components/calculators/jewelry/StoneComposer.jsx` | wybor szlifu w wierszu kamienia |
| `chat-api/orders.js` | `priceItem` kasuje `overrideWeightG` z zapytania |
| `scripts/test-zakres-wyrobu.mjs` | 35 sprawdzianow, w lancuchu `npm run build` |
| `scripts/test-szlif-kamienia.mjs` | 30 sprawdzianow, w lancuchu `npm run build` |
| `MDs/decisions/ADR-0049-...` | decyzja, razem z tym, czego NIE zrobiono |
| `public/llms.txt`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md`, `public/sitemap.xml` | synchronizacja konfiguracji |

## Jak to dziala

**Trzy odpowiedzi.** Czyj projekt (bez wartosci domyslnej), co jest w wyrobie
(lista do zaznaczenia z pozycja "nic z ponizszych") i wymiary. Brak
ktorejkolwiek daje SZACUNEK z widelkami i droge do czlowieka, a nie blad.

**Pozycja "nic z ponizszych" nie jest ozdoba.** Bez niej klient, ktory pominie
pytanie, wygladalby dokladnie tak samo jak klient zamawiajacy rzecz prosta,
a to wlasnie ta roznica decyduje o kwocie wiazacej.

**Masa: wieksza z dwoch.** Z wymiarow albo katalogowa. Wisiorek zyskuje na tym
prawde (14 g zamiast 4 g), obraczka zostaje przy stalej, bo geometria wychodzi
lzejsza, a kwote wiazaca trzeba dotrzymac. To jest swiadomie jednostronne
i opisane w kodzie oraz w ADR.

**Jedna bramka.** `wymagaWycenyCzlowieka()` czyta kalkulator, karta uslugi
w sklepie i koszyk, a `bindingBasis` ta sama regula odmawia w kasie.

## Zmierzone w przegladarce

Kalkulator w trybie zaawansowanym, pierscionek, srebro 925:

| Ustawienie | Masa na ekranie | Cena za sztuke |
|---|---|---|
| EU 54, szerokosc 5 mm, scianka 1,5 mm | 4,00 g | 277 zl |
| szerokosc 12 mm | 7,99 g | 313 zl |
| scianka 3 mm | 17,27 g | 398 zl |
| to samo w zlocie 585 | 31,75 g | 12 052 zl |

Przed ta zmiana wszystkie cztery wiersze mialy mase 4,00 g w kwocie wiazacej.
Zero bledow w konsoli, oba pytania rysuja sie bez wyboru wstepnego, w 1280 px
i w 390 px.

## Czego NIE zrobiono

- **Wspolczynniki wypelnienia zostaja.** Dla pierscionka, obraczki i sygnetu
  liczymy juz bryle pierscienia, wiec wspolczynnik ponizej 1,0 odejmuje mase
  drugi raz. Poprawka podnioslaby ceny pierscionkow o okolo 28 procent, czyli
  jest decyzja cenowa, a nie poprawka. Do czasu jej podjecia chroni nas regula
  "wieksza z dwoch".
- **Robocizna nie reaguje na zawartosc wyrobu.** Trzy oprawy kieruja do
  czlowieka, ale nie podnosza kwoty szacunkowej.
- **Mnozniki szlifow nie sa nasze.** Pochodza z praktyki rynkowej i sa tak
  opisane w `jewelryConfig.js`.
- **Bramki nie sprawdzono na zywej kasie**, bo w tym srodowisku nie ma
  dzialajacego `chat-api`. Sprawdzona jest regula (sprawdziany) i ekran
  (przegladarka).

## Do rozstrzygniecia przez wlasciciela

1. **Wspolczynniki wypelnienia dla pierscionka, obraczki i sygnetu**: zostaja
   czy ida na 1,0. To jedyna rzecz, ktora nadal kaze nam liczyc mase dwoma
   sposobami i brac wieksza.
2. **Mnozniki szlifow** (kaboszon 0,5 na kamieniu i 1,25 na osadzeniu,
   rozetka 0,75 i 1,10, schodkowy 1,0 i 1,15): potwierdzic albo poprawic
   wlasnymi liczbami.
3. ~~Szybka wycena bez koszyka przy nowym wyrobie~~: wlasciciel wybral
   2026-09-15, ze zostaje bez koszyka, a strate lagodzi przeniesienie
   odpowiedzi do trybu zaawansowanego. Wdrozone tego samego dnia:
   `src/data/przekazanieTrybu.js`, przycisk pod kwota w szybkiej wycenie,
   sprawdzian `scripts/test-przekazanie-trybu.mjs`.
4. ~~Status ADR-0049~~: zatwierdzony przez wlasciciela 2026-09-15, status `accepted`.

## Jak sprawdzic

1. `node scripts/test-zakres-wyrobu.mjs`
2. `node scripts/test-szlif-kamienia.mjs`
3. `npm run build`
4. Recznie: kalkulator jubilerski, tryb zaawansowany, pierscionek. Zmiana
   szerokosci obraczki ma zmienic mase i cene. Bez odpowiedzi na pytanie
   o projekt i o zawartosc wyrobu koszyk ma odmowic kwoty wiazacej.
