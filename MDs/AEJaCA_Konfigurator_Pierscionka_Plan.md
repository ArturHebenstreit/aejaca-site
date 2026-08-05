# Wizualny konfigurator pierścionka zaręczynowego: plan

*Sporządzono: 2026-08-05. Status: plan po prototypie, przed decyzją o budowie.*

---

## 1. Wnioski z prototypu, a nie z przeczucia

Zanim napisałem ten plan, zbudowałem działający prototyp (187 linii) i zmierzyłem go.
**Rzeczy niepewne są tu opisane jako niepewne.**

### Co zostało udowodnione

| Sprawdzone | Wynik |
|---|---|
| Generowanie pierścionka z samych parametrów | **14 ms**, 3088 trójkątów |
| Bryła zamknięta, gotowa do cięcia na warstwy | tak, potwierdzone przez `manifold` i przez **naszą własną sprawdzarkę** |
| Realizm masy | 0,207 cm³ → **2,71 g w Au 585**, 2,14 g w Ag 925 |
| Realizm kamienia | 6,5 mm brylant → **0,99 ct** (podręcznikowa wartość to 1,00 ct) |
| Werdykt naszej sprawdzarki | „Model gotowy do druku", MSLA bez uwag |
| Koszt dostarczenia do przeglądarki | **529 kB WASM + 73 kB JS** |

Ostatnia liczba jest ważniejsza, niż wygląda. OpenCascade, którego już używamy do STEP,
waży **7 MB**. `manifold-3d` to **jedna trzynasta tego**, a do naszego zadania wystarcza
w zupełności.

### Czego prototyp NIE udowodnił

Głowica nadal siedzi w złym miejscu względem obrączki, a bryła rozpada się na 4 składowe
zamiast jednej. To nie podważa koncepcji, ale pokazuje, gdzie leży realna praca: nie
w „czy się da", tylko w geometrii złożenia.

### Cztery pułapki, które prototyp już ujawnił

Każda z nich **nie zgłasza błędu**, tylko po cichu psuje wynik. To najcenniejszy plon
prototypu, bo bez niego kosztowałyby po pół dnia każda.

1. **Kierunek nawinięcia profilu.** `revolve` przy profilu nawiniętym zgodnie z zegarem
   zwraca bryłę **pustą**, bez ostrzeżenia. Pole liczymy sami i w razie czego odwracamy.
2. **`scale` skaluje względem początku układu, nie środka bryły.** Kamień na wysokości
   9,8 mm powiększony o 2% podskakuje o 0,2 mm i przecina łapki, odcinając je od reszty.
   Luz robimy przez większy nominał kamienia, nie przez skalowanie.
3. **Spójność bryły trzeba mierzyć, nie oglądać.** Głowica niepołączona z obrączką wygląda
   na podglądzie idealnie, a po odlaniu odpada. Liczba składowych (`decompose().length`)
   musi wynosić 1 i to jest warunek do testu w buildzie.
4. **Szerokość obrączki ogranicza, gdzie mogą stać słupki galerii.** Przy obrączce 2,2 mm
   słupek w odległości 1,6 mm od osi mija ją w powietrzu.

---

## 2. Wybór technologii

### Odrzucone i dlaczego

**OpenCascade (mamy już w repo).** Prawdziwe jądro CAD z B-rep, więc dawałoby dokładne
powierzchnie i eksport do STEP. Odrzucone: 7 MB do pobrania przy każdym wejściu na stronę,
znacznie wolniejsze operacje logiczne i API, które przy zmianie suwaka nie nadąży za
podglądem na żywo. Zostaje tam, gdzie jest: do wczytywania STEP-ów od klientów.

**Gotowe SaaS (Pencil, Configurator.tech, iJewel3D).** Pencil to najbliższy odpowiednik
tego, co chcemy: parametryczny CAD generujący pliki produkcyjne, ponad pięć milionów
kombinacji. **Cennika nie podają publicznie**, trzeba rozmowy handlowej, i to jest pierwszy
sygnał ostrzegawczy przy naszej skali. Drugi: konfigurator na cudzej platformie to cudzy
adres, cudzy wygląd i cudza polityka cenowa, a my mamy własny kalkulator, własną wycenę
wiążącą i własną sprawdzarkę, do których to musi się wpiąć. **Warto jednak zapytać o cenę
przed budową**: jeśli wyjdzie poniżej kilkuset złotych miesięcznie, budowa własnego traci
sens ekonomiczny.

**Trzy.js bez jądra CSG.** Wystarczyłby do podglądu, ale nie da gniazda kamienia ani
połączenia łapek z galerią bez operacji logicznych. Model do druku by z tego nie wyszedł.

### Wybrane: `manifold-3d`

Apache-2.0, 529 kB WASM, gwarantowana bryła zamknięta na wyjściu. Ostatnia cecha jest
kluczowa i wiąże się z tym, co już mamy: **model wychodzący z konfiguratora jest z definicji
szczelny**, więc przechodzi naszą sprawdzarkę bez fałszywych alarmów, a wycena liczona
z objętości jest dokładna, nie przybliżona.

Podział ról: `manifold` buduje bryłę, `three.js` (już w repo) ją pokazuje.

---

## 3. Architektura

```
  suwaki i wybory
        │
        ▼
  slownik ksztaltow  ──►  generator (Web Worker, manifold-3d)
  (parametry, mm)              │
        │                      ├─► siatka do podgladu  ──► three.js
        │                      ├─► objetosc  ──────────► istniejacy cennik
        │                      └─► bryla  ─────────────► istniejaca sprawdzarka
        ▼
  trwaly zapis konfiguracji (krotki kod w URL)
```

**Generowanie idzie w Web Workerze**, tak samo jak analiza drukowalności. Przy 14 ms na
model wątek główny wytrzymałby, ale suwak przeciągany płynnie to kilkadziesiąt przeliczeń
na sekundę i to już zamraża kartę.

**Konfiguracja mieści się w URL.** To nie jest ozdoba: pierścionek zaręczynowy wybiera się
we dwoje albo pokazuje znajomym. Link do własnego projektu jest naturalnym kanałem
udostępniania i darmową dystrybucją.

### Co ponownie wykorzystujemy, a nie budujemy od nowa

| Element | Skąd |
|---|---|
| Rozmiary EU/US/UK/JP i średnice | `src/data/ringSizes.js` |
| Podgląd 3D z obrotem i zrzutem | `STLViewer.jsx` |
| Wycena z objętości i masy metalu | `src/pricing/jewelry.js`, `weightEngine.js` |
| Kontrola drukowalności i odlewalności | `src/analysis/printability.js` |
| Kompensacja skurczu odlewniczego | `/toolstudio/shrinkage/` |
| Ceny metali na żywo | `/api/market-rates` |
| Ścieżka do koszyka z ceną wiążącą | `CalcToCart.jsx` |

To jest sedno: **konfigurator to nie nowy produkt, tylko nowe wejście do wszystkiego, co
już działa.**

---

## 4. Zakres wersji pierwszej

Konfigurator nie ma być Rhino w przeglądarce. Ma pokryć **to, co ludzie faktycznie zamawiają**,
i robić to dobrze. Słownik kształtów zamiast dowolności.

**Obrączka:** szerokość 1,6 do 3,5 mm, grubość 1,2 do 2,2 mm, profil (płaski, półokrągły,
comfort fit), zwężenie ku górze, rozmiar EU 44 do 70.

**Kamień:** brylant okrągły 3,0 do 8,0 mm (0,1 do 2,0 ct), owal, princess. Karat liczony
z geometrii, nie z tabeli.

**Oprawa:** łapki 4 lub 6, wysokość głowicy, kotwica (bezel), galeria otwarta lub zamknięta.

**Dodatki:** kamienie boczne na obrączce (pavé), grawer wewnątrz.

Wszystko poza tym słownikiem prowadzi do istniejącej usługi projektowej za 500 do 750 zł.
**Konfigurator ma odsyłać do niej wprost**, gdy klient dojedzie do granicy, zamiast udawać,
że granicy nie ma.

---

## 5. Model biznesowy: to jest trudniejsze niż kod

Darmowy plik STL pierścionka **kanibalizuje usługę projektową za 500 do 750 zł**. To realny
konflikt i trzeba go rozstrzygnąć świadomie.

**Propozycja, spójna z tym, co już mamy w regulaminie:**

| Co | Cena | Uzasadnienie |
|---|---|---|
| Projektowanie i podgląd 3D | **0 zł** | to jest przynęta i ona ma być darmowa |
| Cena wiążąca i zamówienie wykonania | **0 zł** | prowadzi do sprzedaży |
| Pobranie pliku STL / 3MF | **149 zł** | zaliczane **w 100%** na poczet zamówienia złożonego w 90 dni |
| Projekt poza słownikiem kształtów | 500 do 750 zł | istniejąca usługa CAD, bez zmian |

Zaliczenie w 90 dni to dokładnie ta sama zasada, którą już stosujemy przy opłacie projektowej
(§ 8a regulaminu), więc nie wprowadza nowego wyjątku, tylko rozszerza istniejący.

**Dlaczego nie za darmo:** plik STL pierścionka to gotowy produkt do odlania u kogokolwiek.
Oddanie go za darmo zamienia nas w darmową pracownię CAD dla konkurencji.

**Dlaczego nie drożej:** 149 zł jest poniżej progu decyzji, a zaliczenie na poczet zamówienia
sprawia, że dla kogoś, kto i tak zamówi, jest efektywnie darmowe. Płacą wyłącznie ci, którzy
i tak by u nas nie zamówili.

---

## 6. Fazy

**Faza 1: silnik, bez interfejsu (2 do 3 dni).**
Moduł `src/analysis/ringBuilder.js` z pełnym słownikiem kształtów, plus test w buildzie
sprawdzający na kilkunastu konfiguracjach: jedna spójna bryła, ścianki powyżej progu
odlewniczego, masa w sensownym zakresie, powtarzalność wyniku. **Bez testu ten moduł
nie ma prawa wejść**, bo błąd geometrii kosztuje odlew, nie wyświetlenie.

**Faza 2: podgląd i suwaki (2 do 3 dni).**
Strona `/jewelry/konfigurator/`, generowanie w Workerze, podgląd na `STLViewer`, masa
i cena na żywo z istniejącego cennika, konfiguracja w URL.

**Faza 3: wyjścia (1 do 2 dni).**
Przycisk do koszyka z ceną wiążącą (istniejąca ścieżka), płatne pobranie pliku, przekazanie
konfiguracji do zapytania ofertowego przy wyjściu poza słownik.

**Faza 4: dopracowanie (otwarte).**
Materiały metalu w podglądzie (złoto żółte, białe, różowe), kamienie boczne, grawer,
zdjęcie poglądowe do maila potwierdzającego.

**Razem do wersji użytecznej: około tygodnia pracy.** To szacunek po prototypie, a nie
przed nim, więc jest wart więcej niż zwykle, ale nadal jest szacunkiem.

---

## 7. Ryzyka, uczciwie

**Największe: estetyka, nie technika.** Prototyp dowiódł, że geometria się liczy i drukuje.
Nie dowiódł, że wygląda **ładnie**. Pierścionek zaręczynowy sprzedaje się wyglądem, a
proceduralnie wygenerowana galeria bywa poprawna i brzydka. To wymaga Twojego oka
jubilera przy dobieraniu proporcji, i tego nie zastąpi żaden algorytm.

**Drugie: obietnica wykonalności.** Model, który konfigurator wypuści, musi dać się odlać,
a nie tylko wydrukować. Progi odlewnicze są ostrzejsze niż drukarskie (ścianka poniżej
0,8 mm w złocie potrafi nie zalać się do końca). Sprawdzarkę mamy, ale progi trzeba
ustawić pod odlew, nie pod druk.

**Trzecie: kamień to nie geometria.** Konfigurator pokaże oprawę pod kamień 6,5 mm, ale
realny kamień trzeba kupić i on ma tolerancję. Oprawa musi mieć zapas, a wycena musi
mówić wprost, czy kamień jest w cenie, czy powierzony.

**Czwarte: SEO i tak wygrywa co innego.** Konfigurator to narzędzie konwersji, a nie
źródło ruchu. Ruch dadzą treści wokół niego („ile kosztuje pierścionek z brylantem 1 ct"),
a nie sam konfigurator.

---

## 8. Rekomendacja

**Budować, ale najpierw jeden telefon.** Zapytać Pencil o cenę. Jeżeli poniżej kilkuset
złotych miesięcznie, to policzyć, ile miesięcy pokrywa tydzień pracy, i prawdopodobnie
kupić. Jeżeli więcej albo jeśli nie da się wpiąć naszej wyceny wiążącej, budować własne.

Argument za własnym jest mocniejszy, niż wygląda: **mamy już całą resztę.** Sprawdzarkę,
cennik, silnik masy, rozmiary, koszyk z ceną wiążącą, kompensację skurczu. Konfigurator
domyka to w produkt, którego nie ma żaden konkurent w naszej skali, bo pojedyncza pracownia
nie ma zaplecza, a duży sklep nie ma warsztatu.

---

## Załączniki

Prototyp: `parked/ring-poc/ring.mjs` razem z wygenerowanym `pierscionek.stl`.
Uruchomienie: `npm install manifold-3d && node ring.mjs`.
