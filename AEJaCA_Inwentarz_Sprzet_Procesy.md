# AEJaCA Studio - Pełny inwentarz sprzętu i możliwości procesowe
**Data aktualizacji:** lipiec 2026  
**Autor:** AEJaCA Studio  
**Przeznaczenie:** dokument referencyjny do współdzielenia między wątkami Claude

---

## KONTEKST

AEJaCA Studio to warsztat jubilerski łączący parametryczne projektowanie CAD, druk FDM i żywiczny, odlewnictwo próżniowe lost-PLA/lost-resin oraz ręczne złotnictwo. Dwa sub-brandy: **AEJaCA Jewelry** (wyroby dla klientów) i **AEJaCA Studio** (technologia i proces). Aktywny projekt: pierścionek **Leaf** w Au 585, EU rozmiar 50 (ID 16mm).

---

## 1. PROJEKTOWANIE CAD / PARAMETRYCZNE

### Sprzęt
- Mac Studio M4 Max, 36GB RAM, 512GB + 4TB WD SN850X via TB5

### Oprogramowanie
- Rhino 8 + Grasshopper + Peacock v0.99.1 + Grasshopper Gold (Taras Kydon) + Kangaroo 2
- Fusion 360
- Bambu Studio, Chitubox / Lychee Slicer
- LightBurn, xTool Studio
- Lightroom, Photoshop, CapCut

### Możliwości
- Pełne parametryczne projektowanie pierścionków, obrączek, wisiorków, bransolet
- Generatywne wzorce organiczne (lodygi, filigran, relief roślinny) przez MultiPipe, Like an Emboss, Azure Builder
- Automatyczne pozycjonowanie kamieni (Peacock Gems), krapów (Prongs), pavé
- Symulacja fizyczna układów kamieni (Kangaroo 2)
- Obliczanie masy metalu per stop (Au 585/750, Ag 925)
- Automatyczna kompensacja skurczu odlewniczego per stop
- Generator skryptów Python budujących definicje GH headless
- Wizualizacja koncepcyjna dla klientów

### Kluczowe parametry Peacock
- Formuła EU: Peacock Size = EU - 40; R = (Size+40)/(2pi)
- EU 50 = Size 10,27; ID 16mm
- Z kamienia empiryczne: 17,625mm
- Kompensacja skurczu Au 585: x1,0196; Ag 925: x1,016; Au 9K: x1,021; Au 18K: x1,018

---

## 2. DRUK FDM

### Sprzęt
**Bambu Lab H2D**
- Extruder L: 0,4HF-TC
- Extruder P: 0,4std + 0,2std (incoming)
- AMS 2 Pro + AMS HT
- Moduł tnący 300x285mm / 45°
- Moduł rysujący 300x255mm

### Materiały
- Spectrum PLA Natural SKU-80010 (wzorce do odlewu lost-PLA)

### Parametry FDM (pierścionki do odlewu)
- Prędkość ściany zewnętrznej: 40mm/s
- Temperatura dyszy PLA Natural: 210°C
- Retrakcja: 0,4-0,5mm (direct drive H2D)
- Prime Tower: wyłączony
- Orientacja: pionowo, sprue w dół, cienki dysk na sprue (bez supportów)

### Minimalne wymiary projektowe (FDM 0,2mm dysza)
- Ścianki: min 0,5mm (rekomendacja 0,7-1,2mm)
- Shank: 1,2-2,5mm
- Relief: 0,2-0,5mm
- Grawer wklęsły: 0,3-0,6mm
- Otwory: 0,6-1,0mm
- Krapy/pazury: 0,8-1,0mm+
- Tekst: min 1,2mm

### Możliwości
- Druk wzorców do odlewu metodą lost-PLA (szybki prototyp, niski koszt)
- Druk modeli koncepcyjnych dla klientów (wielokolorowy z AMS)
- Druk narzędzi pomocniczych, uchwytów, przyrządów warsztatowych
- Grawerowanie/cięcie przez moduł tnący
- Rysowanie szablonów przez moduł rysujący

### Ograniczenia FDM
- Minimalna grubość ścianki ok. 0,5mm (praktycznie 0,7mm bezpieczna)
- Widoczne linie warstw wymagające wygładzania przed inwestycją
- Gorszy od żywicy przy detalach poniżej 0,5mm

---

## 3. DRUK ŻYWICZNY (MSLA)

### Sprzęt
**Drukarka: Elegoo Saturn 4 Ultra 16K**
- Ekran 10" mono LCD, 16384x9216px
- Piksel 14x19µm
- Obszar roboczy 218x123x250mm
- Grzana wanna 30°C
- Tilt Release (redukcja sił ścinających przy separacji warstw)
- Auto-poziomowanie + detekcja AI

**Myjka/utwardzarka: Elegoo Mercury Plus V3.0**
- Mycie IPA lub woda (obrót 360°)
- Komora do 230x135x260mm bez platformy
- Kompatybilna z platformą Saturn 4 Ultra (mycie z platformą)

### Materiały eksploatacyjne
- IPA 99,9% - 5L
- Folia nFEP/PFA Elegoo Saturn 2/3/4/4 Ultra 273x176mm - 5szt zapasowych
- Filtry do żywicy - 100szt
- Szpachelka silikonowa
- PrimerCast 25g (adhezja platformy przy żywicach woskowych)

### Żywice testowe (kalibracja)
| Żywica | Ilość | Mycie | Przeznaczenie |
|---|---|---|---|
| Elegoo Water Washable 2.0 Ceramic Grey | 1kg | Woda | Test mechaniczny drukarki |
| Elegoo ABS-like 3.0 8K Space Grey | 0,1kg | IPA | Kalibracja ekspozycji (exposure matrix) |

### Żywice castable (wzorce do odlewu)
| Żywica | Ilość | Wosk | Przeznaczenie |
|---|---|---|---|
| BlueCast X-One V2 | 0,1kg | Zero skurczu | Szyna, korona, elementy masywne |
| BlueCast X-Wax Filigree | 0,1kg | >80% wosku | Filigran, lodygi, detal min. 0,2mm |

### Ustawienia startowe Saturn 4 Ultra 16K
- Wysokość warstwy: 0,05mm
- Liczba warstw dolnych: 5
- Czas ekspozycji normalnej (Water Washable): 2,3s
- Czas ekspozycji dolnych (Water Washable): 32s
- Czas odpoczynku po retract: 1,2s
- Żywice castable: używać oficjalnych profili BlueCast dla Chitubox

### Workflow post-print (IPA)
1. Kapanie z platformy: 3-5 min
2. Mycie w IPA (Mercury Plus): 3-5 min (dwa etapy - zgrubne + dokładne)
3. Suszenie (sprężone powietrze): 5-10 min
4. Zdejmowanie z platformy (szpachelka silikonowa)
5. UV utwardzanie (Mercury Plus): 2-4 min
6. Usuwanie podpór: po pełnym UV, szczypce jubilerskie

### Workflow post-print (Water Washable)
- Mycie wodą kranową letnią (25-35°C), max 10 min
- Utwardzanie UV wody po myciu (5-10 min) przed utylizacją
- Woda z mycia NIE idzie do zlewu - utwardzać UV, osad wyrzucać jako odpad stały

### Możliwości
- Druk precyzyjnych wzorców jubilerskich do odlewu lost-resin (piksel 14µm)
- Wzorce filigranowe, openwork, relief organiczny, mikrograwery do 0,2mm
- Druk figurek i miniatur dekoracyjnych
- Szybka iteracja wzorców (druk 2-4h, gotowy wzorzec tego samego dnia)

---

## 4. ODLEWNICTWO PRÓŻNIOWE

### Sprzęt

**Komora próżniowa (degassing only):** Resiners
- Wyłącznie do odgazowywania masy inwestycyjnej
- Nie nadaje się do castingu próżniowego

**Maszyna odlewnicza 3-w-1: VEVOR DMJ-0001**
- Pojemność 400ml, pompa 4,3 CFM, moc 290W
- Dzwon akrylowy + precyzyjny manometr, płyta robocza 28x28cm
- Funkcja 1: degassing masy inwestycyjnej (alternatywa/uzupełnienie Resiners)
- Funkcja 2: vacuum casting (metal wciągany próżnią)
- Funkcja 3: wspomaganie Resiners przy większych kolbach

**Piec topienia: VEVOR GF1150ND2-3KG-Y**
- Wkład grafitowy: średnica wewnętrzna 35,8mm, głębokość 113mm

**Piec wypalający: VEVOR KD-Z6652B**
- Moc 1650W, komora 203x127x152mm, max 1200°C (±5°C)
- 9 programowalnych profili, zakres 30-1200°C, czas 1-60 min
- Timer=0 w profilu 1 = tryb bezterminowy (brak auto-stop)
- Timer=0 w profilach 2-9 = segment pomijany automatycznie
- LIMIT OPERACYJNY: max 2h ciągłej pracy, min 30 min chłodzenia przed restartem
- Otwór wentylacyjny w pokrywie ZAWSZE otwarty

**Kolba odlewnicza**
- Średnica 30mm, wysokość 50mm, ściana 0,4mm
- Maks. średnica modelu 24mm (margines 3mm od ścian kolby)

### Materiały

**Masa inwestycyjna: Whip Mix Omni-II**
- Proporcje: 40:100 woda:proszek (mix ręczny)
- Wypełnienie kolby: 480-610g
- Minimum 15-20mm masy nad koroną modelu (zapobieganie zawaleniu pod próżnią)

**Olej do pompy:** Matrix Vacumax 46 ISO VG 46

### Parametry układu odlewniczego

**Vacuum-assist (VEVOR DMJ-0001) - AKTUALNE:**
| Element | Wymiar |
|---|---|
| Main sprue | 2,0-2,5mm (start: 2,2mm) |
| Dedykowane wenty | Zbędne (Omni-II odprowadza powietrze przez porowatość) |
| Wenty backup (głębokie kieszenie) | 0,6-0,8mm opcjonalnie |
| Feedery pośrednie | Zbędne przy vacuum |

**Grawitacyjny (bez maszyny) - tylko do porównania:**
| Element | Wymiar |
|---|---|
| Main sprue | 2,6-3,0mm |
| Feedery | 1,4-1,8mm |
| Wenty | 0,8-1,0mm |

### Parametry temperaturowe i skurcz
| Stop | Temperatura kolby | Temperatura metalu | Skurcz |
|---|---|---|---|
| Au 585 (14K) | 600°C | 1000°C (max 1050°C) | x1,0196 |
| Ag 925 | - | - | x1,016 |
| Au 9K | - | - | x1,021 |
| Au 18K | - | - | x1,018 |

### Możliwości
- Pełny cykl odlewniczy lost-PLA i lost-resin do Au 585 i Ag 925
- Vacuum casting: lepsze wypełnienie cienkich detali, mniejsza porowatość niż grawitacja
- Degassing masy inwestycyjnej (eliminacja pęcherzyków)
- Odlewy jubilerskie jednostkowe i małoseryjne

---

## 5. OBRÓBKA POWIERZCHNI METALU

### Sprzęt
- Tumbler magnetyczny (wygładzanie, polerowanie wstępne)
- Myjka ultradźwiękowa (czyszczenie po odlewie i polerze)
- Grawernik pneumatyczny (ręczny grawer, korekta detali po odlewie)
- Galwanizacja (powłoki ochronne, złocenie, rodowanie)
- Mikroskop (kontrola jakości, setting drobnych kamieni)
- Palniki propan/tlen + kompresor (lutowanie, wyzarzanie)

### Chemia Avalon Machines
| Preparat | Stężenie | pH | Materiał | Przeznaczenie |
|---|---|---|---|---|
| N51 | 1-3% | 4,9 | Wszystkie | Odtłuszczanie przed procesem |
| B3 | 1-3% | 3,0 | Ag/Au/mosiądz/brąz | Rozjaśnianie, szlifowanie, do tumblera magnetycznego |
| U32 | 2% | 3,7 | Tylko Ag | Polerowanie lustrzane (wymaga tublera wibracyjnego z porcelaną) |
| A1 | 100% | 1,1 | - | Kąpiel czyszcząca, używać ostrożnie |

**Uwaga:** U32 wymaga tublera wibracyjnego z wsadem porcelanowym - nie posiadamy jeszcze tego urządzenia.

**Sekwencja obróbki srebra:** N51 (odtłuszczanie) -> B3 (szlifowanie/rozjaśnianie) -> U32 (lustro, po zakupie tublera)

### Możliwości
- Pełna obróbka powierzchni srebra i złota
- Ręczny grawer i korekta detali po odlewie
- Lutowanie, naprawy, wyzarzanie
- Galwaniczne złocenie/rodowanie wyrobów
- Ustawianie kamieni pod mikroskopem

---

## 6. LASER

### Fiber 30W: Raycus + Rotary
- Oprogramowanie: LightBurn
- Soczewka 150x150mm (zamontowana)
- Soczewka 70x70mm (do srebra, wyższe zagęszczenie wiązki)

### CO2 55W: xTool P2 + Conveyor Feeder + Rotary RA2 Pro
- Oprogramowanie: xTool Studio

### Możliwości Fiber
- Grawer na metalu: złoto, srebro, stal, tytan
- Znakowanie i personalizacja biżuterii
- Grawer obrotowy na obrączkach i bransoletach (Rotary)
- Precyzyjny grawer jubilerski (soczewka 70x70mm)

### Możliwości CO2
- Cięcie i grawer: drewno, skóra, akryl, papier, tkanina
- Grawer obrotowy na nieregularnych przedmiotach (RA2 Pro)
- Produkcja opakowań, etykiet, materiałów marketingowych

---

## 7. FOTOGRAFIA I WIDEO

### Sprzęt
| Urządzenie | Zastosowanie |
|---|---|
| Sony A7 II + A7 IV | Dual body, pełna klatka |
| Sigma 70mm Macro | Fotografia produktowa biżuterii |
| Tamron 28-70mm f/2,8 | Reportaż, behind the scenes |
| Manfrotto 190 | Statyw |
| Feiyutech Scorp3 | Gimbal do wideo |
| Quadralite Thea 450 | Główne światło studyjne |
| Ulanzi RGB Bowens | Światło kolorowe/akcentowe |
| Godox MF12 Macro | Dedykowane oświetlenie makro biżuterii |

### Możliwości
- Profesjonalna fotografia produktowa biżuterii (makro)
- Sesje wizerunkowe i lifestyle z biżuterią
- Wideo procesowe (behind the scenes warsztatu, reels, shorts)
- Stabilizowane nagrania gimbalem
- Pełna postprodukcja: Lightroom, Photoshop, CapCut

---

## 8. AKTYWNY PROJEKT - PIERŚCIONEK LEAF

### Specyfikacja
- Stop: Au 585 (14K)
- Rozmiar: EU 50, ID 16mm
- Kamień centralny: owalny lab ruby 8x6mm (szafir.pl KRUOV8_6)
- Kamienie boczne: pear moissanite 6x4mm x2 (moissanit.pl M-PEAR-6x4MM, 79 PLN/szt)
- Akcenty: round brilliant moissanite 2,5mm (moissanit.pl M-BR-2.5MM, 19 PLN/szt)
- Motyw: liście i łodygi z ażurową strefą openwork

### Pipeline CAD (aktualny stan)
- Ring base: Peacock Ring Base z taperedWidth/Thickness (Multiline Data Panel)
- Kamienie boczne: Evaluate Curve (raw domain ~0-16, t=9,4 potwierdzone)
- Outer shank surface: DeBrep Index=1
- Iso Curve: komponent natywny GH (nie Peacock IsoCurve), 40%/50%/92% wysokości profilu
- Leaf module: planowany Arc 3Pt (Leaf_Length 3,5mm, Leaf_Width 1,6mm)
- Openwork: Azure Builder (GG) jako kandydat główny
- Pozycjonowanie krapów: Divide Curve (equal arc-length) na Gems.C, nie slider

### Cennik (brutto, z kamieniami)
| Wariant | Cena |
|---|---|
| 4 brylanty | 4 550 - 4 860 PLN |
| 6 brylantów | 4 860 - 5 170 PLN |
| 8 brylantów | 5 170 - 5 540 PLN |
| 10 brylantów | 5 470 - 5 845 PLN |

---

## 9. CENNIK USŁUG - POWIĘKSZANIE OBRĄCZEK

| Zakres | Cena |
|---|---|
| Do 1 rozmiaru | 80-100 PLN |
| 1,5-2 rozmiary | 120-180 PLN |
| 2-3 rozmiary (limit bezpieczeństwa) | 200-270 PLN + zgoda klienta na ryzyko |

Struktura wyceny złożonego przypadku (np. 2,5 rozmiaru, 7x wyzarzanie): robocizna bazowa 100 PLN + premia za złożoność/ryzyko 100-150 PLN + materiały 15-20 PLN = 215-270 PLN łącznie.

---

## 10. PEŁNY PIPELINE PRODUKCYJNY

```
Projekt CAD
Rhino 8 + Grasshopper + Peacock + Grasshopper Gold
              |
              v
     Weryfikacja headless Python
     (pozycje Z, przenikania bbox, głębokość cuttера)
              |
         _____|_____
        |           |
        v           v
   Druk FDM     Druk żywiczny
   Bambu H2D    Elegoo Saturn 4 Ultra 16K
   lost-PLA     lost-resin
        |           |
        |      Mycie IPA/woda
        |      Mercury Plus V3.0
        |      UV utwardzanie
        |           |
        |___________|
              |
              v
     Inwestycja Omni-II
     degassing - VEVOR DMJ-0001
              |
              v
     Wypalanie wzorca
     VEVOR KD-Z6652B
     Au 585: profil do 600°C
              |
              v
     Odlew próżniowy
     VEVOR DMJ-0001
     Au 585: metal 1000°C (max 1050°C)
     Ag 925
              |
              v
     Obróbka surowego odlewu
     tumbler magnetyczny
     myjka ultradźwiękowa
     pilnik, grawernik pneumatyczny
              |
              v
     Polerowanie chemiczne
     N51 -> B3 -> U32 (po zakupie tublera wibracyjnego)
              |
              v
     Setting kamieni
     mikroskop, krapy, pavé
              |
              v
     Galwanizacja (opcjonalna)
     złocenie, rodowanie
              |
              v
     Laser (opcjonalny)
     Fiber 30W - personalizacja, grawer
              |
              v
     Fotografia produktowa
     A7IV + Sigma 70mm Macro + Godox MF12
              |
              v
     Dostawa do klienta
```

Każdy etap pipeline'u zamknięty wewnątrz AEJaCA Studio - od pliku CAD do gotowego wyrobu bez outsourcingu.

---

*Dokument wygenerowany: lipiec 2026 | AEJaCA Studio | www.aejaca.com*
