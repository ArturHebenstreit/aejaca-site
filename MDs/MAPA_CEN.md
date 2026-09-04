# Mapa cen: gdzie co stoi i czego dotknąć nie wolno

Ten dokument odpowiada na jedno pytanie: **chcę zmienić kwotę, gdzie ją znajdę
i co się stanie, jeśli zmienię ją w złym miejscu.**

Powstał, bo przegląd z 2026-09-03 pokazał, że ta wiedza istnieje wyłącznie
w kodzie. Kto ma zmienić stawkę, musi dziś przeczytać kilkanaście plików, żeby
się dowiedzieć, że stawka jest kosztem, a nie ceną, i że ma swoje lustro po
stronie serwera.

---

## 1. Jedna zasada, od której zależy reszta

**Rdzeń cenowy żyje w dwóch miejscach i to nie jest pomyłka.**

Przeglądarka liczy z `src/pricing/`, serwer z `chat-api/pricing/`. Railway
buduje `chat-api/` jako osobny katalog główny i nie widzi `src/`, więc kopia
jest konieczna. Kopiuje ją `npm run sync:pricing`.

**Po każdej zmianie w `src/pricing/` albo w plikach z listy `EXTRA`
w `scripts/sync-pricing.mjs` uruchom `npm run sync:pricing`.** Zapomnienie nie
jest ciche: `node scripts/sync-pricing.mjs --check` stoi jako **pierwsza**
rzecz w `npm run build` i zatrzymuje wdrożenie z komunikatem
`Uruchom: npm run sync:pricing`. Sprawdzone na żywo 2026-09-03.

Nie edytuj plików w `chat-api/pricing/` ręcznie. Są nadpisywane.

---

## 2. Koszt czy cena: różnica, która kosztuje 40 procent

W biżuterii kwoty dzielą się na dwie rodziny i mylenie ich jest najczęstszym
błędem przy zmianie cennika.

| Rodzaj | Co to jest | Co się z nim dzieje |
|---|---|---|
| **Koszt** | ile nas kosztuje robocizna, kruszec, kamień, oprawa, powłoka | dostaje narzut i marżę |
| **Cena dla klienta** | kwota, którą klient płaci za dodatek | dokleja się PO marży, jeden do jednego |

Marże stoją w `src/pricing/jewelryConfig.js`:

- `MARGIN = 0.40` marża warsztatowa na robociźnie, oprawie i powłoce
- `MATERIAL_MARKUP = 0.15` narzut na kruszec i kamienie (obsługa, ubytek)
- `REPAIR_MARGIN = 0.15` naprawy i renowacje, gdzie robocizna JEST produktem

**Przykład, na którym to już raz poszło źle.** Do 2026-09-03 cennik graweru
trafiał do `workCost`, czyli dostawał 40 procent marży. Wpis `cost: 80` kończył
się kwotą 112 zł na rachunku, a podpis pod kafelkiem obiecywał „+80 zł".
Dziś grawer ma `pricePLN` i dokleja go `withEngraving()` w `src/pricing/jewelry.js`,
po marży i po rabacie ilościowym.

Jeśli dodajesz nową dopłatę, rozstrzygnij najpierw, do której rodziny należy.

---

## 3. Gdzie stoi która liczba

### Biżuteria, `src/pricing/jewelryConfig.js`

| Co | Nazwa | Uwaga |
|---|---|---|
| ceny kruszców | `METAL_PRICES` | zapasowe; żywe kursy z `/api/market-rates` je nadpisują |
| marże | `MARGIN`, `MATERIAL_MARKUP`, `REPAIR_MARGIN` | patrz rozdział 2 |
| pasmo tolerancji szacunku | `TOL_LOW`, `TOL_HIGH` | widełki kalkulatora, nie kwota wiążąca |
| powłoki galwaniczne | `PLATING` | pole `cost`, czyli KOSZT przed marżą |
| grawer | `ENGRAVING_OPTIONS`, `ENGRAVING_FREE_ABOVE_PLN` | pole `pricePLN`, czyli CENA dla klienta |
| kamienie | `GEMSTONES` | `basePLN` za kamień odniesienia 0,5 ct; baza danych może nadpisać |
| progi nakładu biżuterii | `QTY_TIERS` | do 10 szt., powyżej wycena indywidualna |

### sTuDiO i wspólne, `src/pricing/config.js`

| Co | Nazwa |
|---|---|
| kurs euro do wyświetlania | `CONFIG.EUR_PLN_RATE` |
| progi nakładu z rabatem | `QUANTITY_TIERS` (2-10 → 5%, 11-20 → 10%, 21-50 → 15%, 51+ → wycena) |
| format kwoty w walucie języka | `fmtCost(kwotaPLN, lang)` |

### Pozostałe tabele

| Obszar | Plik | Co tam stoi |
|---|---|---|
| wysyłka | `src/pricing/shipping.js` | `ZONES` (stawka na strefę), `FREE_SHIPPING_FROM_GROSZE` (400 zł, **tylko Polska**) |
| terminy realizacji | `src/pricing/terminy.js` | `TERMIN_DOMYSLNY` 7-14 dni, `TERMINY_USLUG`, `dodatkiTerminu()` (powłoka +2 dni) |
| odlew | `src/pricing/preciousMetalCasting.js` | `CASTING_FLASK_MM` (kolba), `CASTING_ENVELOPE_MM` (limit modelu, LICZONY z kolby), `CASTING_RESERVE_RATE` |
| opakowania i limity graweru | `src/pricing/packaging.js` | `PACKAGING`, `ENGRAVING_LIMITS` |
| materiał z magazynu | `src/pricing/materialStock.js` | stawki za metr kwadratowy, `MATERIAL_MARKUP = 1.5` |
| laser CO2 i światłowodowy | `src/pricing/laserCo2.js`, `laserFiber.js` | pola robocze, materiały, tryby |
| kody rabatowe | `chat-api/discounts.js` | `RODZAJE_KODOW` (procent, ważność, kampania), `MAX_PERCENT = 80` |

**Kwoty trzymamy w GROSZACH** wszędzie, gdzie dotyczą pieniędzy klienta
(`unitGrosze`, `lineGrosze`, `min_order_grosze`). Złotówki pojawiają się dopiero
przy wyświetlaniu i przy wpisywaniu w panelu. Pomylenie tych dwóch daje kod
stukrotnie hojniejszy, niż ktokolwiek zamierzał.

---

## 4. Waluta

Polski czyta złotówki, angielski i niemiecki euro. Reguła pełna:
`PROJECT_RULES.md`, sekcja `Waluta`. Przelicznik do wyświetlania stoi raz,
w `CONFIG.EUR_PLN_RATE`; żywy kurs NBP przychodzi z `/api/market-rates`.

**Reguły biznesowe liczą się w złotówkach**, także te progowe. Próg graweru
to 400 zł, a nie „równowartość": euro jest przeliczeniem do czytania, nie
drugą regułą. To samo dotyczy progu darmowej wysyłki.

---

## 5. Gdzie powstaje kwota WIĄŻĄCA

Kalkulator pokazuje widełki. Kwota, którą realnie pobiera Autopay, powstaje
**po stronie serwera**, w pętli wyceniającej pozycje koszyka
(`chat-api/server.js`, trasa tworząca zamówienie). Każde źródło danych pominięte
w tym miejscu znaczy, że klient płaci inną cenę niż widział, i nic tego nie
zgłosi.

Zasada, co może być podstawą kwoty wiążącej, stoi w `src/pricing/bindingBasis.js`
i jest lustrzana po obu stronach: przeglądarka wygasza przycisk z tego samego
powodu, dla którego serwer odmawia.

---

## 6. Zanim zmienisz jakąkolwiek kwotę

1. Ustal, czy to koszt przed marżą, czy cena dla klienta (rozdział 2).
2. Zmień w `src/pricing/`, nigdy w `chat-api/pricing/`.
3. `npm run sync:pricing`.
4. `npm run build`. Bramki sprawdzą między innymi, czy wiedza asystenta
   (`chat-api/context.js`) nadal podaje tę samą liczbę: patrz
   `scripts/test-wiedza-asystenta.mjs`.
5. Sprawdź na ekranie, a nie tylko w teście. Kwota widoczna klientowi bywa
   składana w trzech miejscach naraz: kalkulator, koszyk, potwierdzenie mailem.

Spis wszystkich bramek i tego, czego pilnują: `MDs/MAPA_BRAMEK.md`.
