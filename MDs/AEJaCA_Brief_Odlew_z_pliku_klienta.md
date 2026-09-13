# BRIEF: przyjmowanie modelu klienta do odlewu w metalu

*Dla Claude Code · aejaca.com · wersja 1.0 · wrzesień 2026*

---

## 0. Cel

Sklep obecnie przyjmuje pliki do **druku** (FDM, MSLA) i do **odlewu żywicznego**. Brakuje ścieżki dla **odlewu w metalu z pliku klienta** (Ag 925, Au 375/585/750), a to jest usługa o najwyższej wartości jednostkowej i najwyższym ryzyku reklamacji.

Ryzyko bierze się z jednego miejsca: **klient nie wie, że model do odlewu musi być inny niż model do druku.** Jeśli tego nie powiemy wprost i nie zwalidujemy, dostaniemy pliki, z których odlew jest niewykonalny albo nie da się go obrobić do wymiaru.

Ten dokument opisuje, co dodać w sklepie, żeby to odciąć.

---

## 1. ZASADA NADRZĘDNA (najważniejszy akapit tego briefu)

> **Klient dostarcza model w wymiarach wyrobu GOTOWEGO, w skali 1:1, bez żadnych kompensacji.**
>
> Skurcz metalu, naddatek na obróbkę i układ wlewowy dodaje AEJaCA.

Uzasadnienie: jeśli klient sam przeskaluje model na skurcz, a my przeskalujemy go drugi raz, wyrób wyjdzie o 2-4% za duży. Przy obrączce to **dwa do czterech rozmiarów** i całkowita strata materiału, kolby i dwunastu godzin pieca.

To musi być napisane w trzech miejscach: na stronie usługi, w kreatorze `/order/` i w podsumowaniu mailowym.

**Odpowiadający checkbox w kreatorze jest obowiązkowy i nie może być domyślnie zaznaczony.**

---

## 2. DANE TECHNICZNE DO ZAKODOWANIA

Wszystkie tabele idą do **jednego modułu**: `src/data/castingSpec.js`, eksportowanego również do `chat-api/` przez istniejący mechanizm synchronizacji (wzorem `scripts/sync-pricing.mjs`). Jedno źródło prawdy.

### 2.1 Skurcz metalu (mnożnik skali modelu)

```js
export const SHRINKAGE = {
  ag925:  { label: 'Srebro 925',      factor: 1.016,  density: 10.36 },
  au375:  { label: 'Złoto 9K (375)',  factor: 1.021,  density: 11.30 },
  au585:  { label: 'Złoto 14K (585)', factor: 1.0196, density: 13.10 },
  au750:  { label: 'Złoto 18K (750)', factor: 1.018,  density: 15.50 },
};
```

`density` w g/cm³, służy do wyceny materiału.

**Platyna i pallad nie są oferowane.** Temperatura odlewania przekracza możliwości pieca i masy formierskiej. Kalkulator ma je odrzucać z komunikatem, nie wyceniać.

### 2.2 Naddatek na obróbkę

| Powierzchnia | Naddatek | Stosuje się do |
|---|---|---|
| **Otwór obrączki / pierścionka** | **+0,15 mm na średnicy** | zawsze |
| Powierzchnia gładka zewnętrzna | +0,10 mm na wymiarze | gdy klient wybrał poler lustrzany |
| Powierzchnia teksturowana, młotkowana, matowa | **0,00 mm** | nigdy nie dodawać |
| Powierzchnia z grawerem / reliefem | **0,00 mm** | nigdy nie dodawać |

Ostatnie dwa wiersze są krytyczne: **naddatek na powierzchni dekoracyjnej oznacza, że przy szlifowaniu zniszczymy detal, dla którego klient złożył zamówienie.** Kalkulator musi wiedzieć, które powierzchnie są dekoracyjne, więc kreator musi o to zapytać.

### 2.3 Wzór na wymiar modelu drukowanego

```
d_model = (d_docelowa − naddatek) × factor
```

Przykład, obrączka Ø 17,00 mm w Au 585:

```
(17,00 − 0,15) × 1,0196 = 17,18 mm
```

**Kalkulator ma pokazywać ten wynik klientowi.** To buduje zaufanie i jednocześnie ujawnia, jeśli klient podał wymiar w złym standardzie.

### 2.4 Minimalne grubości (w wyrobie gotowym)

```js
export const MIN_THICKNESS = {
  wall:        { min: 0.8, safe: 1.0, label: 'Ścianka' },
  shank:       { min: 1.0, safe: 1.3, label: 'Szyna pierścionka' },
  prong:       { min: 0.7, safe: 0.9, label: 'Pazurek' },
  freeDetail:  { min: 0.6, safe: 0.8, label: 'Element wolnostojący' },
  reliefHeight:{ min: 0.3, safe: 0.5, label: 'Wysokość reliefu' },
  strokeWidth: { min: 0.4, safe: 0.6, label: 'Szerokość kreski napisu' },
  gap:         { min: 0.8, safe: 1.0, label: 'Prześwit między elementami' },
  hole:        { min: 0.8, safe: 1.2, label: 'Otwór przelotowy' },
  edgeRadius:  { min: 0.1, safe: 0.2, label: 'Zaokrąglenie krawędzi' },
};
```

Poniżej `min` odlew nie wypełni się. Między `min` a `safe` wykonamy, ale bez gwarancji odwzorowania i z adnotacją w podsumowaniu.

**`edgeRadius` wymaga wyjaśnienia w treści:** ostra krawędź na modelu tworzy w masie formierskiej cienki klin, który wykrusza się przy wypalaniu i daje wypływkę. To nie jest kaprys, tylko fizyka gipsu.

### 2.5 Gabaryt maksymalny

```js
export const FLASK = {
  id: 'radiance35',
  innerDiameter: 83,   // mm
  height: 100,         // mm
  maxModelDiameter: 60,  // 10 mm masy od ścianki z każdej strony
  maxModelHeight: 60,    // po odjęciu masy nad koroną i podstawy wlewowej
  maxModelVolume: 15,    // cm³, granica praktyczna jednego drzewa
};
```

Powyżej tych wartości kreator kieruje do wyceny indywidualnej, nie odrzuca.

### 2.6 Układ wlewowy (informacja wewnętrzna, nie dla klienta)

Klient **nie projektuje wlewu**. Dodajemy go sami. Reguła doboru, do wykorzystania w narzędziu wewnętrznym:

```
M_wyrobu = (t × w) / (2 × (t + w))     // moduł krzepnięcia sekcji prostokątnej
d_wlewu  > 4 × M_wyrobu                 // moduł walca = d/4
```

Wlew musi krzepnąć **po** wyrobie, inaczej przestaje zasilać skurcz i powstaje jama u nasady.

Wsad:

```
masa_odlewu = (V_wyrobów + V_wlewów) × gęstość
guzik       = 0,35 × masa_odlewu
zapas       = 0,12 × (masa_odlewu + guzik)
wsad        = masa_odlewu + guzik + zapas
```

---

## 3. WYMAGANIA DLA PLIKU

```js
export const FILE_REQUIREMENTS = {
  formats: ['stl', '3dm', 'step', 'stp', 'obj'],
  maxSizeMB: 100,
  meshTolerance: 0.01,     // mm, zalecane 0.005 dla biżuterii
  requireWatertight: true,
  requireZeroNakedEdges: true,
  requireSingleSolid: true, // albo boolean union wykonany przez klienta
};
```

**Jednostki.** STL i OBJ nie niosą jednostki w formacie. Regulamin § 13 już mówi, że odczytujemy je jako milimetry. Ta sama reguła musi pojawić się przy uploadzie, **zanim** klient wgra plik, a nie w regulaminie, którego nie przeczyta.

3DM i STEP niosą jednostkę, więc czytamy ją z pliku.

**Przenikające się bryły.** Jeśli model składa się z kilku brył, które się przecinają, klient musi wykonać `BooleanUnion` albo zaznaczyć, że mamy to zrobić (usługa płatna). Nieprzecięte bryły dają w sliserze niezdefiniowane wnętrze.

---

## 4. CO KLIENT MUSI PODAĆ (pola kreatora)

| Pole | Typ | Obowiązkowe | Uwagi |
|---|---|---|---|
| Metal i próba | select | tak | z `SHRINKAGE` |
| Plik modelu | upload | tak | walidacja jak wyżej |
| **Oświadczenie o skali 1:1** | checkbox | tak | nie może być domyślnie zaznaczony |
| Rozmiar palca | number | tak dla pierścionków | obwód w mm wg miarki AEJaCA |
| Czy wymiar otworu jest w pliku | radio | tak dla pierścionków | „w pliku" / „podaję osobno" |
| Wykończenie powierzchni | select | tak | poler lustrzany / satyna / matowa / tekstura zachowana |
| Powierzchnie dekoracyjne | checkbox + opis | nie | wyzwala naddatek 0,00 mm |
| Kamienie | radio | tak | „bez kamieni" / „z kamieniami" |
| Przeznaczenie | select | nie | codzienne / okazjonalne / ekspozycja |

**Pole „Kamienie" przy odpowiedzi twierdzącej przenosi zamówienie na ścieżkę wyceny indywidualnej.** Oprawa kamienia wymaga innego podejścia do naddatków (gniazdo nie może być szlifowane) i osobnej rozmowy.

---

## 5. WALIDACJA I KOMUNIKATY

Trzy poziomy, wzorowane na istniejącej logice kalkulatorów.

### Poziom 1: blokada (nie da się złożyć zamówienia)

| Warunek | Komunikat |
|---|---|
| Plik nie jest wodoszczelny | „Model ma otwarte krawędzie i nie da się go odlać. Napraw siatkę albo zamów naprawę pliku." |
| Gabaryt > `maxModelDiameter` lub `maxModelHeight` | „Model przekracza wymiary naszej kolby. Przejdź do wyceny indywidualnej." |
| Metal poza listą (platyna, pallad) | „Tego metalu nie odlewamy. Oferujemy srebro 925 oraz złoto 9K, 14K i 18K." |
| Brak oświadczenia o skali 1:1 | „Potwierdź, że model jest w wymiarach wyrobu gotowego." |

### Poziom 2: ostrzeżenie (można złożyć, trafia do podsumowania)

| Warunek | Komunikat |
|---|---|
| Grubość między `min` a `safe` | „Najcieńsza sekcja ma X mm. Odlejemy, ale przy tej grubości nie gwarantujemy pełnego odwzorowania." |
| Objętość > 10 cm³ | „Przy tej masie wycena materiału będzie znacząca. Sprawdź kalkulację przed potwierdzeniem." |
| Brak zaokrągleń krawędzi | „Model ma ostre krawędzie. Zaokrąglimy je promieniem 0,1 mm, bo inaczej masa formierska wykrusza się przy wypalaniu." |

### Poziom 3: informacja (wyświetlana zawsze)

Blok z przeliczeniem, widoczny przed potwierdzeniem:

```
Twój wymiar docelowy:        17,00 mm
Naddatek na obróbkę otworu:  +0,15 mm
Skurcz Au 585:               ×1,0196
─────────────────────────────────────
Model, który wydrukujemy:    17,18 mm
Wyrób po obróbce:            17,00 mm
```

---

## 6. TREŚĆ DLA KLIENTA

Nowa strona `/uslugi/odlew-z-pliku/` plus sekcja w istniejącej stronie usług.

Struktura, w kolejności:

1. **„Model do odlewu to nie to samo, co model do druku"**: akapit otwierający, bo to jest rzecz, której klient nie wie
2. **„Podajesz wymiar gotowy, resztą zajmujemy się my"**: zasada nadrzędna, wyróżniona
3. **Tabela minimalnych grubości**: z kolumną „minimum" i „bezpiecznie"
4. **Tabela metali** ze skurczem i gęstością, przejrzystość buduje zaufanie w tej branży
5. **Czego nie musisz robić**: nie skalujesz, nie dodajesz wlewu, nie dodajesz naddatku
6. **Wymagania pliku**: formaty, wodoszczelność, jednostki
7. **Co dostajesz**: odlew, obróbka, poler, opcjonalnie cechowanie
8. **FAQ** z JSON-LD `FAQPage`, zgodnie z istniejącym wzorcem

Trzy języki: PL, EN, DE, wzorem pozostałych stron. Wersja polska wiążąca.

**Ton:** rzeczowy, bez straszenia. Klient ma zrozumieć, dlaczego pytamy, a nie poczuć, że stawiamy przeszkody.

---

## 7. WYCENA

Rdzeń cenowy w `src/pricing/`, kopiowany do `chat-api/pricing/`. Cena wyłącznie serwerowa, geometria liczona od nowa z wgranego pliku.

Składniki:

```
cena = materiał + odlew + obróbka + ewentualne cechowanie
```

| Składnik | Podstawa |
|---|---|
| Materiał | `V_wyrobu × gęstość × cena_metalu_za_gram` + narzut na ubytek (12%) |
| Odlew | stawka za cykl, dzielona przez liczbę wyrobów w kolbie |
| Obróbka | funkcja powierzchni i wybranego wykończenia |
| Cechowanie | tylko Ag 925 i złoto, stawka Urzędu Probierczego + obsługa |

**Cena metalu musi być parametrem, nie stałą.** Złoto zmienia się codziennie. Potrzebne pole w panelu z datą ostatniej aktualizacji i ostrzeżeniem w kalkulatorze, gdy kurs jest starszy niż 7 dni.

**Odlew dzielony przez liczbę wyrobów w kolbie** to istotna decyzja biznesowa: pojedyncza obrączka w kolbie 83 × 100 zajmuje około 10% pojemności, a kosztuje pełny cykl. Cennik powinien to odzwierciedlać albo przez wyższą stawkę za sztukę pojedynczą, albo przez grupowanie zamówień z zapowiedzianym dłuższym terminem.

---

## 8. KRYTERIA AKCEPTACJI

- [ ] `src/data/castingSpec.js` istnieje i jest jedynym źródłem tabel
- [ ] Kopia w `chat-api/` synchronizowana skryptem, build przerywa się przy dryfie
- [ ] Checkbox skali 1:1 jest obowiązkowy i nie jest domyślnie zaznaczony
- [ ] Blok przeliczenia (punkt 5, poziom 3) wyświetla się przed potwierdzeniem
- [ ] Walidacja grubości działa na geometrii liczonej **na serwerze**, nie w przeglądarce
- [ ] Kamienie przenoszą na ścieżkę wyceny indywidualnej
- [ ] Platyna i pallad są odrzucane z komunikatem, nie wyceniane
- [ ] Strona `/uslugi/odlew-z-pliku/` w trzech językach, z JSON-LD `Service` i `FAQPage`
- [ ] Podsumowanie mailowe zawiera przeliczenie wymiarów i wszystkie ostrzeżenia poziomu 2
- [ ] Cena metalu jest parametrem z datą aktualizacji
- [ ] Testy: model nieszczelny, model za duży, grubość poniżej `min`, grubość między `min` a `safe`, metal niedozwolony

---

## 9. CZEGO NIE ROBIĆ

**Nie pozwalać klientowi podać własnego mnożnika skurczu.** To jedyna droga do podwójnej kompensacji. Mnożnik wynika z wybranego metalu i nie podlega negocjacji.

**Nie liczyć geometrii w przeglądarce.** Istniejąca zasada ze sklepu obowiązuje: geometria przysłana przez przeglądarkę jest kasowana i liczona od nowa z pliku.

**Nie obiecywać tolerancji lepszej niż 0,2 mm.** Regulamin § 13 już to ustala dla żywicy. Dla odlewu w metalu, po skurczu i obróbce, realna tolerancja jest podobna. Nie wpisywać liczb, których proces nie utrzyma.

**Nie dodawać naddatku na powierzchniach dekoracyjnych.** To jedyny naddatek, którego zastosowanie niszczy wyrób.

---

## 10. OTWARTE PUNKTY DO ROZSTRZYGNIĘCIA

- [ ] Czy cechowanie w Urzędzie Probierczym wchodzi w zakres usługi, czy jest opcją płatną
- [ ] Czy przyjmujemy metal powierzony przez klienta (własny złom do przetopu)
- [ ] Minimalna wartość zamówienia przy odlewie w złocie
- [ ] Polityka przy nieudanym odlewie z winy modelu: powtórka na koszt klienta czy podział kosztu
- [ ] Czy oferujemy naprawę pliku jako osobną usługę i w jakiej cenie

Punkt czwarty jest najważniejszy biznesowo. Odlew potrafi się nie udać z przyczyn leżących w geometrii, której nie da się wychwycić walidacją automatyczną. Potrzebny zapis w regulaminie, zanim usługa ruszy.

---

*AEJaCA Studio | www.aejaca.com*
