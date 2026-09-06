---
status: draft
owner: Artur
date: 2026-09-04
deciders: Artur
supersedes: ADR-0039
related:
  - src/index.css
  - src/components/Layout.jsx
  - src/components/calculators/calcShared.jsx
  - scripts/check-kafelki-jasnosc.mjs
  - .claude/skills/aejaca-ux/pomiar/kafelki.mjs
---

# ADR-0041: Kafelek pokazuje produkt, a nie swój własny stan

## Problem

Poprzednia decyzja (ADR-0039) rozjaśniła kafelki i zamknęła skargę „wybrany
kafelek i ten pod myszką są ciemne". Właściciel obejrzał wynik i zgłosił
następną, tego samego dnia: **„są już jasne, ale jakby były za mgłą; mają być
jasne i ostre jak normalny podgląd zdjęcia, klient musi bardzo wyraźnie widzieć,
co przedstawiają"**.

Mgła nie miała jednej przyczyny. Miała cztery, nałożone na siebie, i każda
osobno wyglądała na dobry pomysł:

| Warstwa | Po co była | Co robiła naprawdę |
|---|---|---|
| `grayscale(0.72)` na niewybranych | odróżnić wybrany od reszty | odbarwione zdjęcie produktu nie sprzedaje produktu |
| `contrast(0.90)` na wszystkich | tanio podnieść średnią jasność ciemnej fotografii | ściąga czernie i biele do szarości, czyli **jest** mgłą |
| `opacity: 0.85` | subtelność | miesza zdjęcie z czarnym tłem kafelka, znowu mniej kontrastu |
| warstwa bieli `plus-lighter` | podnieść czerń, której mnożnik nie rusza | podnosi każdy piksel o tyle samo, więc ich stosunek maleje |

**Miara była dobra, mierzyła nie to, co trzeba.** Pomiar z ADR-0039 liczył
średnią jasność. Wszystkie cztery warstwy średnią podnosiły, więc pomiar
pokazywał poprawę, a ekran pokazywał mgłę. Mgła to wysoka średnia przy niskim
odchyleniu.

## Decyzja

**Fotografia zostaje fotografią. Stan wyboru niesie obwódka.**

Trzy rzeczy wynikają z tego wprost.

**Zdjęcie idzie przez krzywą gamma, a nie przez mnożnik.** Mnożnik na czerni nie
ma czego mnożyć: ten sam `brightness()`, który ledwo rusza najciemniejszą
fotografię, przepala najjaśniejszą, a fotografie kafelków mają średnią od 8 do
60 na 255. Krzywa `wyjście = 1,05 × wejście^0,58` podnosi cienie mocno, światła
prawie wcale, a jej nachylenie w cieniach jest **większe od jedynki**, czyli
kontrast tam rośnie zamiast maleć. Filtr stoi raz, w `src/components/Layout.jsx`,
bo `filter: url(#...)` szuka identyfikatora w całym dokumencie.

**Kontrast nigdy nie schodzi poniżej jedynki, nie ma odbarwiania, nie ma welonu
bieli i nie ma przezroczystości.** Cztery rzeczy z tabeli wyżej są odtąd
zabronione, a nie „do rozważenia".

**Klasa nazywa się `tile-foto`, a nie `tile-dim`.** Stara nazwa znaczyła „kafelek
wygaszony", więc kafelek WYBRANY nie miał jej wcale. Kiedy przestaliśmy wygaszać,
wybrany przestał dostawać cokolwiek i w siatkach kwadratowych zjechał na surową,
ciemną fotografię: pomiar złapał spadek z 0,068 na 0,0075. Nazwa mówi teraz, czym
element jest, a nie w jakim jest stanie, więc stan może się zmieniać bez gubienia
reguł.

Do tego dwie rzeczy z układu: **gradient pod napisem kończy się w dwóch trzecich
wysokości** zamiast sięgać szczytu, a **najmniejsze kafelki urosły** ze 140 na
176 pikseli, bo przy czterech linijkach opisu na zdjęcie zostawało około
czterdziestu pikseli.

## Konsekwencje

Zmierzone tym samym narzędziem, motyw ciemny, kafelki ze zdjęciem:

| Co | Przed | Po |
|---|---|---|
| jasność wygaszonego | 0,018 do 0,029 | 0,040 do 0,072 |
| kontrast (odchylenie jasności) | 44 do 53 | 46 do 68 |
| nasycenie | 0,07 do 0,12 | 0,25 do 0,47 |

Kolor wrócił, kontrast wzrósł, jasność się podwoiła. Zaznaczenie widać po pełnej
obwódce akcentu, pierścieniu i poświacie, czyli po tym, o co właściciel prosił.

Cena: filtr SVG na kilkudziesięciu obrazkach na stronę. Obrazki mają po 180
pikseli, więc koszt jest pomijalny, ale nie zerowy, i `filter: url()` wymaga, żeby
definicja stała w tym samym dokumencie. Gdyby kiedyś kafelek trafił do `iframe`,
filtr trzeba tam powtórzyć.

**Ta decyzja zastępuje ADR-0039**, bo odwraca jego mechanizm: tamten dokładał
warstwy nad fotografią, ten je zdejmuje. Zostaje z niego to, co się obroniło:
kafelek płaski (bez zdjęcia) w motywie jasnym nie może być ciemniejszy od siatki,
a najazd nigdy nie ciemnieje.

## Bramka i pomiar

`scripts/check-kafelki-jasnosc.mjs` w `npm run build` pilnuje sześciu rzeczy:
żadna reguła dotycząca zdjęcia w kafelku nie obniża kontrastu poniżej jedynki,
nie odbarwia, nie ustawia krycia poniżej jedynki i nie kładzie welonu bieli;
każdy komponent z kafelkami ze zdjęciem znaczy wybór pełną obwódką i pierścieniem;
a kafelek płaski w motywie jasnym nie ciemnieje.

`npm run ux:kafelki` niesie odtąd **trzy kolumny, nie jedną**: średnią jasność,
odchylenie standardowe jasności (czyli ostrość) i nasycenie. Pomiar samej średniej
przepuścił mgłę raz i przepuściłby ją znowu.

## Czego ta decyzja NIE rozstrzyga

Część fotografii jest ciemna sama z siebie: zrzut ekranu z programu CAD ma czarne
tło i jasny model, więc jego średnia zostaje niska po każdej krzywej. To nie jest
usterka renderowania, tylko właściwość zdjęcia. Jeśli takie kafelki mają wyglądać
inaczej, trzeba wymienić fotografię, a nie filtr.
