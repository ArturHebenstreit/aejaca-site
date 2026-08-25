# TASK-009: odlew z metali szlachetnych w kalkulatorze sTuDiO

```yaml
task_id: TASK-009
status: review
author: Claude Code
branch: claude/fix-api-error-oge1r
base_commit: 3f64613
last_commit: uncommitted
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

### Swiadomie poza zakresem

- Szybka wycena (`SimpleStudioCalc`) nie dostaje odlewu. Pyta o piec rzeczy
  wspolnych dla druku i lasera, a odlew potrzebuje kruszcu i wariantu, wiec
  doklejenie go tam znaczyloby albo szoste pytanie dla wszystkich, albo
  wycene bez kruszcu.
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
| Build | `npm run build` | pass |

## Ryzyka i otwarte pytania

- Kwoty wiazacej nie sprawdzilem od konca do konca, bo `/api/price` nie jest
  osiagalne z tego srodowiska. Sprawdzona jest sciezka szacunku i to, ze
  `CalcToCart` dostaje `calculator: "jewelry_casting"` oraz plik i skale.
  Do potwierdzenia na zywym API: czy dodanie do koszyka z kalkulatora daje te
  sama kwote co karta uslugi w sklepie.
- Kurs euro w widelkach idzie ze stalej `CONFIG.EUR_PLN_RATE`, a nie z kursu
  zywego. Tak dziala kazdy kalkulator jubilerski, wiec nie zmienialem tego przy
  okazji, ale przy zlocie roznica jest juz widoczna w kwocie.
- Decyzja Artura: czy odlew ma sie takze pojawic w szybkiej wycenie.

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
- Model mieszczacy sie w kolbie daje cene, kazda inna sciezka daje wycene
  indywidualna i zablokowany koszyk.
- Widelki obejmuja kwote wiazaca.
- Liczba sztuk w sumie zamowienia jest ta, ktora klient ustawil.
- `npm run build` przechodzi z zerem bledow.
