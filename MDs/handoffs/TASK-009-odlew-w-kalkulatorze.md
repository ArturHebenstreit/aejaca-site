# TASK-009: odlew z metali szlachetnych w kalkulatorze sTuDiO

```yaml
task_id: TASK-009
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: 3f64613
last_commit: c56fa43cbf22b5bc21c6b90fecf68a61ed39a567
updated: 2026-08-25
```

## Cel

Klient, ktory wchodzi na `/studio/` i otwiera kalkulator zaawansowany, ma
policzyc odlew ze srebra albo zlota tak samo jak druk, laser i odlew zywiczny,
bez szukania karty uslugi w sklepie.

## Stan przed zmiana

Odlew z metali szlachetnych istnial wylacznie jako karta uslugi w sklepie
(`/shop/service/precious_metal_casting/`). Kalkulator sTuDiO mial cztery
zakladki i o tej usludze nie wiedzial. Rdzen cenowy juz istnial i liczyl
poprawnie, wiec brakowalo wylacznie powierzchni.

Odtworzenie stanu sprzed zmiany: `/studio/?tab=metal_cast` otwieral szybka
wycene na druku FDM, bo `metal_cast` nie byl rozpoznawana zakladka.

## Zalozenia i decyzje

- Zakladka nalezy do sTuDiO, nie do jubilerki. Zrodlo: `serviceCatalog`
  (`category: "studio"`) i sciezka realizacji przez model 3D i wydruk wzorca.
- Jeden rdzen cenowy dla sklepu i kalkulatora, wiec dwie liczby nie moga sie
  rozjechac. Zrodlo: ADR-0011.
- Pole pliku i suwak skali brane ze sklepu (`ConfigControls`), a nie pisane
  drugi raz. Odrzucona alternatywa: wlasne pole w kalkulatorze; odrzucone, bo
  ostrzezenia o limicie kolby i o skalowaniu rozjechalyby sie ze sklepem.

## Zakres

### Zmienione pliki

- `src/components/calculators/MetalCastCalc.jsx`: nowy kalkulator.
- `src/components/StudioCalculator.jsx`: piaty kafelek, podpisy w trzech
  jezykach, siatka na piec kolumn.
- `src/pricing/preciousMetalCasting.js` i mirror `chat-api/pricing/`:
  przesuniecie widelek o doplaty oraz przyjmowanie `qty`.
- `scripts/test-precious-metal-casting.mjs`: cztery nowe grupy sprawdzen.
- `public/llms.txt`, `chat-api/context.js`, `MDs/AEJaCA_Brand_Reference.md`
  (nowa sekcja 6.4b), `public/sitemap.xml`: synchronizacja.
- `MDs/decisions/ADR-0011-odlew-w-kalkulatorze-studio.md`.

- `src/components/calculators/SimpleStudioCalc.jsx`, `src/pricing/simpleQuote.js`,
  `src/data/advancedOptions.js`: odlew w szybkiej wycenie.
- `scripts/test-simple-quote.mjs`: siedem sprawdzen sciezki odlewu.

### Swiadomie poza zakresem

- Odlew nie ma wpisu w `GRUPY` w `advancedOptions.js`, wiec zdanie "co dodaje
  tryb zaawansowany" przy nim nie powstaje. Tak samo dziala odlew zywiczny.
  Wpis wymagalby przeniesienia etykiet kalkulatora do modulu cenowego.
- `fitsCastingFlask` przyjmuje skale jako liczbe. Gdyby ktos kiedys przeslal
  skale osobno dla kazdej osi, `Number(obiekt)` da `NaN` i model zostanie
  odrzucony jako za duzy. Zaden dzisiejszy wywolujacy tego nie robi (sklep i
  kalkulator podaja liczbe), wiec zostawiam to nazwane, a nie naprawione.

## Testy i dowody

| Kontrola | Polecenie lub metoda | Wynik |
|---|---|---|
| Blad przed poprawka: progi ilosci | kalkulator z `QUANTITY_TIERS`, przegladarka | fail: karta wyceny pokazywala "wybierz wszystkie parametry" mimo poprawnego modelu |
| Blad przed poprawka: widelki | usuniecie przesuniecia, `node scripts/test-precious-metal-casting.mjs` | fail: `kwota wiazaca 310.67 poza widelkami 103-135` |
| Progi ilosci po poprawce | `scripts/test-precious-metal-casting.mjs` | pass, kazdy prog z `QTY_TIERS` daje cene, kazdy studyjny daje `null` |
| Rzeczywista liczba sztuk | ten sam test, `qty: 2` | pass, `lineGrosze === unitGrosze * 2` |
| Kontrola negatywna waluty | przywrocona koncowka "PLN" | fail zgodnie z oczekiwaniem |
| Przegladarka, sciezka wiazaca | Playwright, `/studio/?tab=metal_cast`, kostka 12 mm | pass: 17.90 g Ag, 102-120 EUR za sztuke |
| Przegladarka, sciezki reczne | pomysl klienta, kruszec powierzony | pass: "Individual terms required", koszyk zablokowany |
| Przegladarka, kruszec i naklad | zloto 18k, prog 2-5, licznik 4 szt. | pass: 26.92 g, rabat 5%, suma za 4 sztuki, nie za naklad progu |
| Bledy konsoli | ten sam przebieg | brak, poza nieosiagalnym API kursow w sandboxie |
| Zywy endpoint `/api/price` | `chat-api` uruchomiony lokalnie, dwa zapytania tym samym plikiem | pass: kalkulator i karta sklepu oddaja `unitGrosze=47704`, identycznie; przy zlocie 18k w skali 1.5 obie po `5415881` |
| Granice na zywym endpoincie | ten sam serwer | pass: model ponad kolba daje 400 `too_large_for_casting`, kruszec powierzony 409 `needs_quote` |
| Szybka wycena, zgodnosc z trybem zaawansowanym | `scripts/test-simple-quote.mjs` | pass, obie drogi po 47704 gr, czyli tyle samo co serwer |
| Szybka wycena bez pliku | ten sam test i przegladarka | pass: wycena indywidualna, koszyk zablokowany |
| Szybka wycena, kruszec i seria | ten sam test | pass: zloto zmienia kwote, seria ponad 10 sztuk idzie do rozmowy |
| Build | `npm run build` | pass |

## Ryzyka i otwarte pytania

- POTWIERDZONE: uruchomilem `chat-api` lokalnie i zapytalem `/api/price` tym
  samym plikiem raz tak, jak pyta kalkulator, raz tak, jak pyta karta sklepu.
  Obie drogi oddaly identyczne `unitGrosze`, takze przy zlocie i przy skali 1.5.
  Ta sama liczba wychodzi z rdzenia w przegladarce, wiec trzy powierzchnie
  licza to samo.
- NIESPRAWDZONE: przejscie `plik -> /api/uploads -> token -> /api/price`, bo
  odczyt geometrii z tokenu wymaga bazy, ktorej w tym srodowisku nie ma. To jest
  droga wspolna dla wszystkich kalkulatorow przyjmujacych pliki i nie ma w niej
  niczego swoistego dla odlewu.
- Kurs euro w widelkach idzie ze stalej `CONFIG.EUR_PLN_RATE`, a nie z kursu
  zywego. Tak dziala kazdy kalkulator jubilerski, wiec nie zmienialem tego przy
  okazji, ale przy zlocie roznica jest juz widoczna w kwocie.
- Rozstrzygniete przez Artura 2026-08-25: odlew ma byc takze w szybkiej wycenie. Zrobione.

## Instrukcja dla recenzenta

1. Podwaz hipoteze, ze doplaty maja isc poza pasmo tolerancji. Przyjalem, ze
   przygotowanie wzorca i wykonczenie sa kwotami stalymi, wiec nie powinny
   rozszerzac widelek proporcjonalnie. Alternatywa jest obrona.
2. Granica do sprawdzenia: `calculate()` przyjmuje `qtyId` z dwoch roznych
   slownikow progow i tylko jeden dziala. Test to pilnuje, ale warto sprawdzic,
   czy nie ma trzeciego wywolujacego, ktory podaje wlasna liste.
3. Dokumenty do potwierdzenia: `llms.txt`, `chat-api/context.js` i sekcja 6.4b
   `Brand_Reference` opisuja te sama granice automatu (24 x 24 x 35 mm, model 3D,
   kruszec AEJaCA) co kod.

## Warunek uznania zadania za gotowe

- `/studio/?tab=metal_cast` otwiera kalkulator odlewu w trzech jezykach.
- Szybka wycena z wgranym modelem 3D i kafelkiem kruszcu podaje te sama kwote
  co tryb zaawansowany, a bez modelu kieruje do wyceny indywidualnej.
- Model mieszczacy sie w kolbie daje cene, kazda inna sciezka daje wycene
  indywidualna i zablokowany koszyk.
- Widelki obejmuja kwote wiazaca.
- Liczba sztuk w sumie zamowienia jest ta, ktora klient ustawil.
- `npm run build` przechodzi z zerem bledow.
