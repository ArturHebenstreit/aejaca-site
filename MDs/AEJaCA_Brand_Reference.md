# AEJaCA - Kompletny dokument referencyjny marki
*Wygenerowano: 2026-08-20 | Wersja: 4.2*

---

## 1. TOŻSAMOŚĆ MARKI

### Pełna nazwa
**AEJaCA** - Artisan Elegance Jewelry and Crafted Art

### Tagline / slogan
- PL: "Noś to, co znaczące. Drukuj to, czego nie ma w sklepie."
- Sub: "Biżuteria i przedmioty projektowane pod Ciebie, od pomysłu do gotowego."
- Footer: "Gdzie rzemiosło spotyka technologię."

### Data założenia
2023

### Założyciel
Artur Hebenstreit

### Lokalizacja
Józefosław (k. Warszawy), Mazowsze, Polska
Współrzędne GPS: 52.0736, 21.0724

### Kontakt
- E-mail: contact@aejaca.com
- Telefon: +48 780 737 786
- Google Maps: https://maps.app.goo.gl/D9XHVQD4ufjjA5X18

### Języki serwisu
Polski (pl), English (en), Deutsch (de)

### Oceny (dane z 2026-07-30)

**Google: 5,0 / 5,0 przy 25 opiniach.** To jest ocena eksponowana w interfejsie i jedyna wpisana do `aggregateRating` w JSON-LD.

**Trustpilot: 2 opinie, obie na 5 gwiazdek, TrustScore 3,8.** TrustScore nie jest średnią arytmetyczną, Trustpilot waży go wolumenem i świeżością, więc przy dwóch opiniach wypada 3,8 i będzie rósł.

**Zasada prezentacji: liczby 3,8 nie pokazujemy nigdzie w interfejsie.** Zaniża to, co faktycznie ocenili klienci, a postawiona obok Google 5,0 działa przeciw nam. Pokazujemy sprawdzalny fakt: liczbę opinii i informację, że wszystkie są na 5 gwiazdek. Nie rysujemy też rzędu pięciu gwiazdek Trustpilot, bo to czytałoby się jako TrustScore 5,0, czyli błąd w drugą stronę. Wartość `rating: 3.8` żyje w `TRUSTPILOT_BUSINESS` wyłącznie jako zapis stanu faktycznego.

Rewizja tej zasady, gdy TrustScore osiągnie 4,5 lub więcej. Wtedy warto pokazywać liczbę, bo zacznie pracować na naszą korzyść.

**Nakładanie się platform:** obie opinie Trustpilot pochodzą od klientów, którzy mają też oceny Google (`tp1` = `r25` Jacob/Jakub, `tp2` = `r11` Aleksandra Kwaśnica). Liczb nie sumujemy.

**Profil Trustpilot zawiera klikalny link do aejaca.com** oraz adres Nowy Świat 33 lok. 13. To jeden z niewielu realnych linków zewnętrznych, jakie mamy, patrz `AEJaCA_Demand_Diagnosis.md`.

---

## 2. STRUKTURA MARKI (DWA BRANY POD JEDNYM DACHEM)

### AEJaCA Jewelry
Rękodzielnicza biżuteria artystyczna - srebro, złoto, kamienie szlachetne, personalizacja, grawerowanie, wyroby unikatowe.
Identyfikacja wizualna: paleta amber/rose, krój Playfair Display.

### AEJaCA sTuDiO
Cyfrowa fabrykacja na zamówienie - druk 3D FDM i MSLA, laserowanie CO2 i fiber, modelowanie CAD, odlewy żywiczne, wzorce do odlewu.
Identyfikacja wizualna: paleta blue/emerald, krój Inter.

---

## 3. OFERTA BIŻUTERIA (AEJaCA Jewelry)

### Usługi jubilerskie
- Biżuteria ze srebra (Ag 925): pierścionki, kolczyki, wisiorki, bransolety
- Biżuteria ze złota (Au 585/14K, Au 750/18K): pierścionki, zaręczynowe, obrączki ślubne
- Biżuteria z kamieniami szlachetnymi: diamenty, moissanit, cyrkonie, inne
- Personalizowany grawer (laser CO2 i fiber, pneumatyczny)
- Wzorce jubilerskie drukowane 16K + odlew metodą lost-resin (pełny cykl in-house)
- Filigran i ażur od 0.2 mm (drukarka Elegoo Saturn 4 Ultra 16K)

### Cennik biżuterii (orientacyjny, PLN / EUR)
| Produkt | PLN | EUR |
|---------|-----|-----|
| Srebrny pierścionek | 250 | 60 |
| Srebrne kolczyki | 180 | 40 |
| Złoty pierścionek 14K | 900 | 210 |
| Złoty wisiorek 14K | 600 | 140 |
| Pierścionek z kamieniem | 350 | 80 |
| Pierścionek zaręczynowy | 1200 | 280 |

Zakres cenowy (schema): EUR 80-3500, PLN ~340-15000

### Kruszce, ktore wykonujemy

Srebro 925 i 800, zloto 9k, 14k, 18k i 24k.

**Platyny nie wykonujemy i nie naprawiamy**, bo warsztat nie ma palnika o odpowiedniej temperaturze, lutu platynowego ani osobnego oprzyrzadowania odlewniczego. Walcarka VEVOR tez sie do niej nie nadaje (sekcja 4).

**Renowacja platyny jest dostepna**: czyszczenie, polerowanie i powloki nie wymagaja ognia. Dlatego lista metali jest rozdzielona: `RENOVATION_METALS` zawiera platyne, `REPAIR_METALS` juz nie, a `METALS` (nowe wyroby) tym bardziej.

Stale cenowe platyny zostaly w kodzie (`METAL_PRICES`, `REPAIR_METAL_MUL`), zeby dalo sie odtworzyc kwote starego zamowienia. Nie sa nigdzie pokazywane.

Klientowi szukajacemu platyny proponujemy **zloto biale 585 lub 750 z rodowaniem**: to najblizszy efekt wizualny, ktory naprawde umiemy wykonac.

### Precyzja nowego cyklu lost-resin (sekcja PRECISION_LABELS)
- Drukarka 16K, piksel 14 µm
- Filigran i ażur od 0.2 mm, mikrograwer
- Pełny cykl in-house: wzorzec drukowany -> odlew lost-resin
- Metale: Ag 925, Au 585, Au 750

### Rodzaje splotów łańcuszkowych (12 wzorów)
1. Klasyczny (curb / pancerka) - weaveFactor x2.15
2. Ankier (anchor)
3. Figaro
4. Pancerz (Byzantine-flat)
5. Cuban Link
6. Rolo
7. Kordel (rope)
8. Lisi ogon (foxtail)
9. Spiga (wheat)
10. Bizmark
11. Bizantyjski/Królewski (Byzantine) - weaveFactor x7.5
12. Franco

---

## 4. OFERTA STUDIO (AEJaCA sTuDiO)

### Technologie i cennik (ceny startowe)
| Usługa | PLN | EUR |
|--------|-----|-----|
| Druk 3D FDM (PLA/PETG) | 16 | 4 |
| Wycinanie laserem CO2 | 8 | 2 |
| Grawer laserowy CO2 | 8 | 2 |
| Znakowanie laserem fibrowym | 8 | 2 |
| Druk żywiczny MSLA 16K | 40 | 9 |
| Wzorzec castable (BlueCast) | 90 | 21 |
| Odlew żywiczny (epoksyd/UV) | 18 | 4 |

Zakres cenowy (schema): EUR 5-2000

**Skąd te liczby.** To najtańsza konfiguracja, jaką silnik wyceny potrafi policzyć dla jednej sztuki, wyprowadzona skryptem `scripts/derive-service-prices.mjs` i pilnowana przy każdym buildzie. Nie wpisujemy ich z pamięci, bo poprzedni zestaw rozjechał się z cennikiem nawet trzykrotnie. Pozycje jubilerskie dostają 10% zapasu na ruch kursu kruszcu.

### Sprzęt cyfrowej fabrykacji
| Urządzenie | Opis |
|------------|------|
| Bambu Lab H2D | Drukarka FDM multi-materiałowa |
| Elegoo Saturn 4 Ultra 16K | Drukarka żywiczna MSLA, piksel 14 µm, platforma 21.8x12.3x25 cm |
| xTool P2 55W | Laser CO2 do cięcia i grawerowania |
| Raycus 30W | Laser fiber do znakowania metalu |

### Sprzęt jubilerski
| Urządzenie | Opis |
|------------|------|
| Tumbler magnetyczny | Wygładzanie, wstępne polerowanie |
| Myjka ultradźwiękowa | Czyszczenie po odlewie i polerowaniu |
| Grawernik pneumatyczny | Grawer ręczny, korekta detalu |
| Galwanizacja | Powłoki ochronne, złocenie, rodowanie |
| Mikroskop | Kontrola jakości, osadzanie kamieni |
| Palniki propan/tlen | Lutowanie, wyżarzanie |
| Piece topienia i wypalania | Topienie stopu, wypalanie wzorca przed odlewem |
| Odlew próżniowy (maszyna + pompa) | Odlew metalu metodą próżniową |
| Walcarka jubilerska VEVOR 3w1 | Walcowanie blachy 0,03-6,5 mm, drutu i profili pierścionkowych; kanały: płaski/drut/półokrągły; produkcja lutu Au 585 i Ag 925 |

### Specyfikacja walcarki VEVOR 3w1

| Parametr | Wartość |
|----------|---------|
| Model | VEVOR 3w1 kombinowana |
| Szerokość rolek | 75 mm |
| Regulacja grubości | 0,03 - 6,5 mm |
| Material rolek | Stal narzędziowa 45# |
| Przekładnia | CNC (precyzyjne koła zębate) |
| Napęd | Ręczny (korbka) |
| Cena zakupu | ~638,90 zł |

**Trzy kanały robocze:**
| Kanał | Zastosowanie | Zakres |
|-------|-------------|--------|
| Płaski | Blacha, taśma, lut w blasze | 0,03-6,5 mm |
| Drut (rowki półokrągłe) | Drut okrągły, lut w drucie | kilka rozmiarów rowków |
| Półokrągły (profile) | Szyny pierścionkowe, profile D | profil jubilerski |

**Możliwości w AEJaCA:**
- Produkcja lutu Au 585 (twardy/średni/miękki) - blacha 0,15 mm lub drut 0,3-0,5 mm
- Produkcja lutu Ag 925
- Walcowanie odlewów na blachy do dalszej obróbki
- Formowanie szyn pierścionkowych z blachy/pręta (kanał półokrągły)
- Redukcja grubości elementów metalowych po odlewie
- Faktury powierzchniowe przez walcowanie z matrycą (tekstury na biżuterii)

**Ograniczenia:**
- Rolki 45# nie nadają sie do platyny (zbyt twarda, ściera rolki)
- Ręczna - przy twardszych stopach (Au 750 zahartowane) wymaga wyżarzania co 3-4 przejścia
- Drut poniżej 0,3 mm wymaga ciągadła (nie samej walcarki)

### Reguła podłoża dla usług laserowych (CO2 i fiber)

Każde zlecenie grawerowania, cięcia lub znakowania laserem musi deklarować podłoże, na którym ma być wykonane. Wynika to z tego, że moc, prędkość lasera i liczba przejść ustalamy próbnie, na rzeczywistym materiale docelowym.

Pytanie o podłoże stoi **w tej samej sekcji co materiał**, jako doprecyzowanie pierwszego wyboru. Wcześniej były to dwa osobne pytania o materiał (kafelki w kroku trzecim i lista w panelu wyceny), co czytało się jak usterka formularza. Kolejność sekcji szybkiej wyceny: co wykonać, jak duże, cięcie/grawer lub FDM/MSLA, materiał (z podłożem), jakość, ilość, technologia, wycena.

Panel **"jak dostarczyć przedmiot"** (paczkomat, adres) pokazuje się wyłącznie przy podłożach, przy których klient coś do nas wysyła. Przy materiale z naszego magazynu nie ma czego wysyłać, więc instrukcja wysyłki tylko zajmowała głowę przy decyzji zakupowej.

**Rabat na rynek polski (15%) obowiązuje od wartości zlecenia 150 zł.** Poniżej progu nie rabatujemy: piętnaście procent z kilkunastu złotych nic klientowi nie daje, a robocizna nie maleje razem z ceną. Między 150 a ~176 zł płaci się równe 150 zł, żeby większe zlecenie nigdy nie wyszło taniej od mniejszego (naiwny próg dawał dokładnie taki uskok). Rabat nigdzie nie jest nazwany, schodzi równo ze wszystkich kwot w rozpisce. Stała: `CONFIG.PL_DISCOUNT_MIN_PLN`, reguła: `plFactorFor()` w `src/pricing/config.js`, pilnuje jej `scripts/test-price-breakdown.mjs`.

Skutek uboczny wdrożenia progu: ceny "od" na kartach usług wzrosły, bo liczą się z najtańszej realnej konfiguracji, a ta jest poniżej progu. Druk FDM 16 → 19 zł, MSLA 40 → 47 zł, grawer i cięcie CO2 8 → 10 zł, fiber 8 → 9 zł, odlew żywiczny 18 → 21 zł. Liczby wyprowadza `npm run prices:derive`.

**Trzy rozłączne możliwości:**

1. **Przedmiot klienta** (talerzyki, drewniana deska, zegarek, biżuteria, brelok itp.)
   - Nasz materiał nie jest oferowany, bo nie ma czego dostarczać
   - Klient opisuje przedmiot, który przyśle (deska, zegarek, brelok), a listy materiałów z magazynu tu nie ma, bo nie ma czego wybierać
   - Klient podaje sposób dostarczenia rzeczy: w Polsce paczkomat InPost lub odbiór osobisty, z zagranicy wyłącznie kurier
   - Przy każdym takowym zleceniu klient wysyła JEDNĄ SZTUKĘ PONAD zamówienie na próby parametrów (przykład: grawer na pięciu talerzykach to sześć talerzyków w paczce, szósty na próby)

2. **Materiał klienta** (arkusz, płyta, pasek, kawałek skóry itp.)
   - Klient dostarcza materiał, my wykonujemy usługę na wgranych partach
   - Klient opisuje, jaki materiał przyśle (pole nieobowiązkowe, bo opis zlecenia i tak jest wymagany)
   - Ten sam tryb dostarczenia co powyżej: paczkomat, odbiór osobisty lub kurier
   - Zasada jednej sztuki ponad zamówienie dotyczy także tu: jeśli przysyła pięć arkuszy do grawerowania, szósty arkusz to próby

3. **Nasz materiał** (z naszego magazynu)
   - Klient WYBIERA materiał z listy, a wybór realnie zmienia kwotę. Lista pochodzi wprost z cennika (`src/data/ourStock.js` czyta `laserCo2.js` i `laserFiber.js`), więc nie da się jej rozjechać z wyceną
   - Grawer CO2: drewno, sklejka, akryl, szkło, skóra, papier, tkanina, guma, kamień
   - Cięcie CO2 z grubością, bo grubość wchodzi w cenę: sklejka 2/3/5/8 mm, akryl 3/5/8 mm, skóra 1-2 i 3-4 mm, papier/karton, tkanina/filc, guma 2-3 mm
   - Fiber: stal nierdzewna, aluminium, aluminium anodowane, mosiądz, miedź, tytan. Srebra i złota nie wydajemy z magazynu, mimo że je znakujemy: metal szlachetny ma własne rozliczenie wagowe
   - "Inny materiał" zostaje na końcu listy i odsłania pole tekstowe, bo lista nie wyczerpuje świata
   - Dostępność i koszt samego materiału potwierdzamy przy realizacji. Kwota z kalkulatora obejmuje wyłącznie robociznę
   - Nic się nie wysyła, wykonujemy na materiale, który już posiadamy
   - Brak zasady dodatkowej sztuki, bo materiał jest pod naszą kontrolą

**Wyjątek: przedmiot niepowtarzalny**

Jeśli klient wysyła rzecz, którą ma tylko jedną egzemplarzę (obrączka po babci, pamiątka, specjalna biżuteria), nie dołączamy szóstej sztuki. Klient deklaruje wtedy w notatce, że przedmiot jest niepowtarzalny, i zgadza się na próbę w miejscu niewidocznym (spód, krawędź). Wyjątek dotyczy WYŁĄCZNIE przedmiotów klienta, nigdy materiału w arkuszach.

---

## 5. OFERTA B2B (strona /b2b/)

### Dwa ścieżki klienta B2B
1. **Projektant / brand-builder** - outsourcing całego cyklu od CAD po wzorzec
2. **Partner-warsztat** - dostawca elementów do własnej produkcji

### Filar 1: Modelowanie CAD
| Model | PLN netto | EUR netto |
|-------|-----------|-----------|
| Prosta obrączka / sygnet | 400-600 | 95-140 |
| Model średni (kamienie, relief) | 600-900 | 140-210 |
| Rzeźbiarski / filigran / openwork | 900-1200 | 210-280 |
Czas realizacji: 2-5 dni roboczych

### Filar 2: Wzorce castable 16K
| Usługa | PLN netto | EUR netto |
|--------|-----------|-----------|
| Wzorzec | 90-180 | 21-42 |
| Kolejny wzorzec z platformy | -40% | -40% |
Wysyłka: 24-48h

### Filar 3: Casting i wykończenie
| Usługa | PLN netto | EUR netto |
|--------|-----------|-----------|
| Prototyp w srebrze | 180-300 + materiał | 42-70 + material |
| Odlew z wykończeniem | wycena wg wagi, próby i złożoności w 24h | - |

### Filar 4: Usługi dodatkowe
| Usługa | PLN netto |
|--------|-----------|
| Laser fiber | od 20/szt |
| Fotografika produktowa | pakiety od 3 ujęć/produkt |
| Galwanizacja | wycena wg powierzchni |

### Hallmarking (cechowanie) - zasada
Domyślnie: znak AEJaCA + Urząd Probierczy pod szyldem AEJaCA.
Na indywidualne ustalenie: produkt bez cech (obowiązek halmarkingu przechodzi na odbiorcę).

### White-label (6 kroków)
1. Klient dostarcza własne pliki lub zamawia CAD
2. Wycena i akceptacja
3. Druk 16K + odlew / wydruk FDM
4. Wykończenie i QC
5. Dostawa anonimowa (brak logo AEJaCA)
6. Faktury na firmę klienta

### Pełen cykl produkcji seryjnej
Via partnerzy - guma silikonowa, wulkanizacja, odlewy galwaniczne w seriach (AEJaCA jako koordynator, nie wykonawca)

---

## 6. KALKULATORY (szczegóły techniczne)

### 6.0 Liczba sztuk i progi nakładu (obowiązuje wszędzie)

Od 2026-08-18 **liczba sztuk jest źródłem prawdy**, a próg nakładu z niej wynika,
nie odwrotnie. Klient wpisuje liczbę licznikiem (przyciski minus i plus), a chipsy
albo suwak progu tylko za nią podążają. Wybór progu ustawia licznik na najniższej
liczbie należącej do tego przedziału, czyli znaczy "chcę co najmniej tyle".

- Studio (`QUANTITY_TIERS`): 1 (prototyp), 2-10 rabat 5%, 11-20 rabat 10%,
  21-50 rabat 15%, 51-100 wycena indywidualna. Licznik chodzi od 1 do 100,
  a kolejne "+" przy setce przełącza w jeden stan otwarty pokazywany jako **∞**
  (próg `custom`, wycena indywidualna) i wygasza "+".
- Biżuteria (`QTY_TIERS`): 1, 2-5 rabat 5%, 6-10 rabat 10%, powyżej 10 stan otwarty.

Reguła siedzi w `src/pricing/config.js` (`tierForQty`, `qtyForTier`, `qtyLimit`,
`qtyOpenValue`), kontrolka w `src/components/shop/ConfigControls.jsx`
(`QuantityStepper`), a pilnuje jej `scripts/test-quantity.mjs` w buildzie.
Do koszyka idzie **wpisana liczba**, a nie nakład reprezentatywny progu: wcześniej
klient proszący o trzy sztuki dostawał wycenę sześciu.


### 6.0b Wielkość wydruku z wgranego pliku

Po wgraniu modelu cena liczy się z **jego własnych wymiarów**, a nie z listy rozmiarów
(lista chowa się automatycznie, `hiddenWithFile`). Klient zmienia wielkość suwakiem
skali, którego górną granicę wyznacza realne pole robocze maszyny. Porównujemy wymiary
**posortowane**, bo część ustawiamy na stole tak, jak nam wygodnie: słupek 24 cm nie
mieści się wzdłuż osi X drukarki żywicznej (21,8 cm), ale postawiony pionowo mieści się
w 25 cm.

Regułę liczy `maxScaleForBuildVolume` w `src/pricing/print3d.js`, a serwer odmawia
kwoty wiążącej kodem `too_large_for_printer` w `priceItem`. Kontrolka to `ScaleControl`
w `src/components/shop/ConfigControls.jsx`, obecna na karcie usługi i w `/order/`.
Pilnuje tego `scripts/test-print-scale.mjs` w buildzie.

### 6.0c Szybka wycena liczy teraz z geometrii pliku, jednym silnikiem (od 2026-08-18)

Szybka wycena (`SimpleStudioCalc.jsx`, zakładka /studio/) wgrywała plik, pokazywała jego
wymiary i objętość, po czym je odrzucała i liczyła cenę z widełek wielkości ("pudełko po
butach" itd.). Widełki zakładają bryłę WYPEŁNIAJĄCĄ pudełko, więc płaska płyta 30 x 2 x 14 cm
(420 cm3) trafiała w przedział "pudełko po butach" i wychodziła na 187-374 zł zamiast
poprawnych 43-85 zł liczonych z rzeczywistej objętości. To była **awaria cicha**: dane wejściowe
(wymiary, objętość) były poprawnie odczytane i wyświetlone klientowi, ale nie brały udziału w
liczeniu ceny, więc nic na ekranie nie sygnalizowało błędu.

Naprawa: oba tryby (szybka wycena i tryb zaawansowany) liczą teraz **tym samym silnikiem** z tej
samej geometrii, w `src/pricing/simpleQuote.js` (mapowanie pięciu pytań na parametry, bez
warstwy interfejsu, testowalne w node przez `scripts/test-simple-quote.mjs`) i
`src/pricing/scaleGeometry.js` (skalowanie siatki/wektora). Widełki wielkości zostają wyłącznie
dla klientów bez pliku.

**Nowy układ pytań:** ① co wykonać (z dwoma kafelkami na skróty: plik 3D albo plik wektorowy)
→ ② jak duże → ③ materiał → ④ jakość → ⑤ ile sztuk. Wcześniej wgrywanie pliku stało PRZED
pytaniami, jako osobna sekcja, więc pierwszym ekranem dla klienta bez pliku (większości
odwiedzających) było pole, którego nie dało się wypełnić.

**Pole robocze zależy od wybranej drukarki (od 2026-08-19).** Szybka wycena sprawdza model względem pola tej
maszyny, która realnie go wykona: Bambu Lab H2D 30 x 32 x 32,5 cm, Elegoo Saturn 4 Ultra 21,8 x 12,3 x 25 cm.
Model 20 x 20 x 20 cm drukuje się z filamentu i nie mieści się na żywicy, bo Saturn ma w osi Y tylko 12,3 cm.
Wcześniej sprawdzaliśmy zawsze pole drukarki filamentowej, także po przełączeniu na żywicę, więc cena była,
a zamówienie odbijało się dopiero o serwer. Gdy model zmieściłby się z filamentu, pierwszą proponowaną naprawą
jest powrót do filamentu jednym kliknięciem, a nie zmniejszanie wyrobu.

**Szybka wycena nazywa tworzywo i mówi, gdzie je zmienić (od 2026-08-19).** Karta druku pokazuje
teraz konkret: "Filament: PLA" albo nazwę żywicy, zamiast rodzajowego słowa "filament". Pod kartami
stoi notka, że wybraliśmy je sami, a w trybie dla zaawansowanych klient wybiera z **21 filamentów**
(PETG, TPU 95A, ABS) albo **13 żywic**, plus wypełnienie, liczba kolorów i precyzja; przy laserze ta
sama notka wymienia materiał i grubość, poziom detali, złożoność i obszar roboczy. Notka niesie
przycisk, który przełącza na tryb zaawansowany **we właściwej zakładce** (grawer otwiera kalkulator
CO2, a nie druk 3D), a przy druku dodatkowo odsyła do sklepu. Powód jest handlowy, nie kosmetyczny:
zdanie "Filament: PLA" bez alternatywy czyta się jak deklaracja, że innych nie robimy, a klient,
który chciał PETG, nie pisze z pytaniem, tylko wychodzi bez śladu. Liczby i przykłady idą wprost
z cennika (`src/data/advancedOptions.js`), więc nowy filament pojawi się w notce sam; pilnuje tego
`scripts/test-advanced-options.mjs`.

**Materiał z magazynu jako pozycja wyceny, sterowana z panelu (od 2026-08-20).** Materiał liczył się
dotąd **źle w obie strony**, i obie pomyłki były ciche, bo kwota zawsze wyglądała poprawnie: przy
**cięciu** doliczaliśmy go zawsze, także gdy klient przysyłał własną płytę, a przy **grawerze** nie
doliczaliśmy nigdy, także gdy deska była nasza. Powód był jeden: wybór "Na czym pracujemy" w ogóle
nie docierał do silnika wyceny.

Teraz stawka za metr kwadratowy żyje w tabeli `material_stock` w bazie, a wzór brzmi:
**pole wyrobu × 1,15 (zapas na odpad) × stawka z tabeli**, doliczane **tylko wtedy, gdy materiał jest
nasz**. Osobna pozycja "Materiał / szt." pojawia się w rozpisce dokładnie wtedy, gdy coś liczymy.
Realne ceny rynkowe siedzą w tabeli i poprawia się je
w panelu administracyjnym pod **`/materials`**, gdzie można dodawać, edytować i usuwać rekordy.
Zapisanie zmiany czyści pamięć podręczną po obu stronach naraz, inaczej nowa stawka doszłaby do
przeglądarki od razu, a do kwoty wiążącej dopiero po godzinie.

**Ceny rynkowe wpisane, plus cena za sztukę (2026-08-20).** Tabela została wypełniona cenami
rynkowymi zebranymi z hurtowni (bez Allegro): sklejka 3 mm 24 zł/m², HDF/MDF 42, lite drewno dębowe
115, akryl 3/5/8 mm 167/265/425, skóra 115-200, filc 32, guma do pieczątek 320, papier 10, stal
nierdzewna 300, aluminium 200, anodowane 250, mosiądz 750, miedź 850, tytan 1200.
**Średnia wynosi 241 zł/m², mediana 141 zł/m²** z 24 pozycji liczonych na metry.

Doszła kolumna **cena za sztukę** (`pln_per_piece`) dla materiałów, których nie kupuje się na metry:
szkło 12 zł, łupek 15 zł. Gdy jest wypełniona, ma **pierwszeństwo** przed stawką za m² i **nie dolicza
zapasu na odpad**, bo przy przedmiocie nie ma odpadu między elementami, jest albo cała szklanka, albo
nic. **Zero w obu kolumnach** znaczy "wycena indywidualna": tak stoją srebro i złoto, bo metal
szlachetny rozlicza się wagowo, a nie powierzchniowo. Rozpiska pokazuje wtedy pozycję "Materiał /
szt.: wycena indywidualna", bo znikająca linia czytałaby się jak materiał gratis.

Stawka domyślna dla materiału spoza tabeli to **mediana 140 zł/m²**, a nie średnia: średnią ciągną
tytan i miedź, których prawie nie tniemy. `scripts/test-material-stock.mjs` przelicza medianę z tabeli
i wywala build, gdy stała od niej odjedzie o więcej niż ćwierć.

**Skutek cenowy, do świadomego przyjęcia.** Poprzednia stawka materiału w cenniku (`matCost`) była
znacznie wyższa niż 100 zł/m²: dla akrylu 5 mm wynosiła 0,18 zł/cm², czyli **1800 zł/m²**. Cięcie
ścieżki S z akrylu miało więc 41,40 zł samego materiału, a po zmianie ma 2,30 zł. Pole `matCost`
zostaje w cenniku jako zapis tego, ile liczyliśmy wcześniej, bo przy ustalaniu realnych stawek
w panelu jest to jedyny punkt odniesienia (`matCost × 10000` = złotówki za metr kwadratowy).
Do czasu wpisania realnych cen cięcie jest **niedoszacowane**.

Przy grawerze zmiana idzie w drugą stronę: deska z naszego magazynu zaczyna kosztować, więc grawer
"na materiale AEJaCA" podrożał, a grawer na przedmiocie klienta został bez zmian.

**Kafelek materiału zawęża listę, a maszyna rozstrzyga cięcie kontra grawer (od 2026-08-20).** Kliknięcie
"Drewno" dawało poniżej pełen cennik razem z gumą, papierem i tkaniną. Teraz kafelek filtruje listę
"z naszego magazynu": drewno pokazuje drewniane, metal metalowe, a kafelek "Szkło / kamień / inne"
zbiera akryl, skórę, papier, tkaninę, gumę, szkło i kamień. Grupa stoi **przy stawce w cenniku**
(pole `grupa`), więc materiał dopisany bez grupy wywala build zamiast po cichu zniknąć z wyboru przy
zachowanej cenie. Lista światłowodu **otwiera się srebrem i złotem** (decyzja właściciela z 2026-08-20;
dostępność samej blaszki potwierdzamy przy realizacji, tak jak przy każdym innym materiale).

Grawer i cięcie pytają o **co innego**, bo ograniczenie jest inne: wiązka przy grawerze sięga tylko
powierzchni, więc pytamy o rodzaj materiału (Lite drewno, Sklejka, Inne materiały drewnopochodne),
a przy cięciu musi przejść na wylot, więc pytamy o grubość (Sklejka 2/3/5-6 mm, Płyta HDF/MDF do 8 mm,
Lite drewno do 10 mm). Sklejka 8 mm wyszła z oferty cięcia na rzecz HDF/MDF (polecenie właściciela,
2026-08-20): prasowane włókno tnie się równiej niż osiem milimetrów sklejki, gdzie kleje między
warstwami potrafią zatrzymać wiązkę.

Przy metalu karta "Cięcie czy grawerowanie" **zostaje na ekranie**, z wygaszonym cięciem, powodem
("Metalu nie tniemy: laser światłowodowy znakuje powierzchnię") i grawerem wybranym. Znikająca sekcja
nie tłumaczy niczego: klient nie wie, czy pytanie zniknęło, bo odpowiedź jest oczywista, czy dlatego,
że coś zepsuł. Wygaszony kafelek nie przyjmuje też fokusu, więc nie udaje klikalnego.

Doszło lite drewno: **10 mm tniemy** (`wood10`), grubszego nie. Stawka **1,00 zł za centymetr ścieżki
i 0,16 zł materiału**, zatwierdzona przez właściciela 2026-08-20. Interpolacja ze sklejki dawała 0,67,
ale właściciel podniósł do 1,00 z powodu warsztatowego: lita deska ma słoje, żywice i niejednorodną
gęstość, więc przejście na wylot wymaga kilku powtórzeń i pilnowania, a nie jednego przejazdu jak przy
sklejce. Rachunek ze sklejki tego nie widzi, bo sklejka jest materiałem jednorodnym. Skutek na ekranie:
cięcie ścieżki S kosztuje 44-88 PLN zamiast 15-30 PLN dla sklejki 3 mm.

**Podwyżka dotyczy wyłącznie cięcia.** Grawer na sklejce, litej desce i płycie drewnopochodnej wygląda
tak samo i tyle samo trwa, więc kosztuje tyle samo (potwierdzone przez właściciela 2026-08-20).
Sklejka miała tu wcześniej 0,4 przygotowania zamiast 0,5, co przy małych powierzchniach było
niewidoczne, a przy dużych dawało złotówkę różnicy bez powodu, który dałby się obronić przed klientem.
Wyrównane. `scripts/test-laser-capabilities.mjs` przemiata 36 kombinacji powierzchni, nakładu
i szczegółowości i wywala build, gdyby cena graweru znów zaczęła zależeć od rodzaju drewna, a osobno
sprawdza, że przy cięciu ta zależność zostaje. Zdolności maszyny są teraz zapisane i pilnowane: xTool P2 (CO2 55 W) grawerujemy na szkle,
kamieniu i grubym litym drewnie, ale ich **nie przetniemy**, a metalu nie rusza w ogóle. Dlatego po wybraniu
metalu pytanie "cięcie czy grawerowanie" znika, bo wycena idzie światłowodem. Szybka wycena, tryb
zaawansowany i sklep czytają **jedną parę tablic** (`ENGRAVE_MATERIALS`, `CUT_MATERIALS`), więc
spójność między nimi jest własnością konstrukcji, a nie rzeczą do pilnowania;
`scripts/test-laser-capabilities.mjs` sprawdza, czy to nadal prawda, i wywala build, gdy ktoś dopisze
szkło do cięcia albo obieca je w opisie usługi w sklepie.

**Podgląd rysunku pokazuje rysunek, a nie arkusz (od 2026-08-20).** Program eksportujący SVG zapisuje
zwykle całą stronę, więc znak 20 x 20 mm na arkuszu A4 zajmował w podglądzie jedną setną powierzchni:
klient widział pustą ramkę i kreskę, czyli nie miał jak sprawdzić, czy wgrał właściwy plik. Parser
zwraca teraz położenie treści (`contentBox`) obok prostokąta płótna (`canvasBox`), a podgląd przycina
do treści (dla znaku na A4 wychodzi około 13x). Do tego kółko myszy przybliża, przeciąganie przesuwa,
a przycisk "Dopasuj" wraca do widoku całości. Ten sam komponent (`VectorPreview.jsx`) obsługuje
szybką wycenę i tryb zaawansowany.

Dwie rzeczy warte zapamiętania. Plik klienta **zostaje w `<img>`**: SVG to dokument, który może nieść
`<script>`, więc wstawienie go wprost do drzewa strony wykonałoby cudzy kod na naszej domenie;
przybliżanie robimy transformacją CSS. Kółko jest podpięte **bezpośrednio i nie-pasywnie**, bo React
rejestruje `onWheel` na korzeniu strony pasywnie i wtedy strona przewija się pod kursorem zamiast
przybliżać (sprawdzone w przeglądarce, guard tego pilnuje).

**Plik jedzie razem z klientem (od 2026-08-20).** Rada "przejdź do trybu dla zaawansowanych" kosztowała
dotąd ponowne wgranie pliku i ponowne ustawienie wielkości, czyli była karą za posłuchanie. Teraz
model albo rysunek przechodzi razem ze skalą z suwaka, w skali **oryginału** (skala jedzie osobno,
bo tryb zaawansowany ma własny suwak i nałożyłby ją drugi raz). Przycisk sklepu odkłada tę samą
paczkę do poczekalni, a karta usługi odbiera ją **raz**, tylko jeśli obsługuje ten rodzaj geometrii
i nie minął kwadrans. Plik przeniesiony idzie tą samą drogą co wybrany na miejscu, więc przechodzi
tę samą kontrolę serwera. Twarde odświeżenie strony paczkę traci: obiektu `File` nie da się zapisać
w `sessionStorage`, a trzymanie kilkunastu megabajtów między sesjami byłoby gorsze niż jedno
powtórzone wgranie. Umowę pilnuje `scripts/test-advanced-options.mjs` (sekcje 6 i 7).

Przy okazji naprawiona cicha usterka: nazwa żywicy czytana była z pola `name`, którego cennik żywic
nie ma, więc karta MSLA nie pokazywała żadnej żywicy, choć kod wyglądał poprawnie i nic nie zgłaszało
błędu. Teraz czyta `label`, a guard sprawdza oba warunki.

**DXF wyceniamy automatycznie (od 2026-08-19).** Rysunek DXF czytamy tak samo jak SVG, czyli z rzeczywistej
długości ścieżki, a nie z przedziału. Obsługiwane encje: LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE,
ELLIPSE. Jednostkę bierzemy z nagłówka $INSUNITS, więc rysunek w calach nie jest czytany jak milimetry.
Bloków (INSERT) nie rozwijamy: gdy rysunek je zawiera, mówimy to na ekranie i potwierdzamy wycenę przed
realizacją. Podglądu z DXF nie rysujemy, bo format niesie współrzędne, a nie obrazek. AI i PDF nadal idą
jako załącznik do wyceny ręcznej. Test porównuje cenę z DXF i z SVG dla tego samego kształtu.

**Poprawka czytania 3MF (2026-08-19).** Pliki zapisane jako projekt z Bambu Studio albo PrusaSlicera trzymają
scenę w `3D/3dmodel.model`, a geometrię w osobnym `3D/Objects/*.model` wskazywanym przez p:path. Czytaliśmy
tylko pierwszy plik z archiwum, więc taki 3MF nie dostawał żadnej ceny. Teraz czytamy całe archiwum.

**Pole robocze laserów na linii wielkości (od 2026-08-19).** Rysunek wektorowy jest sprawdzany względem
realnego pola maszyny: CO2 (xTool P2) 600 x 308 mm, przy czym przelotka z podajnikiem wydłuża dłuższą oś
(do około 3000 mm), a nie poszerza pola, i wydłuża przygotowanie. Laser światłowodowy: pole 150 x 150 mm.
Rysunek, który się nie mieści, nie dostaje żadnej ceny automatycznej: pokazujemy przycisk zmniejszenia do
największej mieszczącej się wielkości albo drogę do wyceny indywidualnej. Wcześniej rysunek 573,9 x 901,0 mm
dostawał kwotę wiążącą 497,83 zł, mimo że nie da się go wykonać na żadnej naszej maszynie.

**Poprawka danych soczewki fiber (2026-08-19).** Kalkulator podawał pole soczewki 150 mm jako 110 x 110 mm
(121 cm2) i na tej podstawie odrzucał prace, które realnie wykonujemy. Poprawione na 150 x 150 mm (225 cm2).

**Cięcie kontra grawerowanie w szybkiej wycenie (od 2026-08-19).** Przy wgranym rysunku i technologii CO2
pokazujemy dwie karty, "Cięcie na wylot" i "Grawerowanie powierzchni", każdą z własną kwotą policzoną z tego
samego rysunku. Wybór idzie do wyceny wiążącej i do koszyka.

**Kafelki znikają po wgraniu pliku (od 2026-08-19).** Po wgraniu jakiegokolwiek pliku kafelki rodzaju pracy
są ukrywane w całości, bo plik już mówi, co wykonujemy. Wcześniej stały obok podglądu i czytały się jak druga,
konkurencyjna odpowiedź na to samo pytanie.

**Plik główny nie jest proszony dwa razy (od 2026-08-19).** Wgrany plik jedzie do koszyka i zaspokaja wymóg
"Projekt do wykonania". Pole na plik w koszyku zmienia znaczenie na "Pliki dodatkowe (opcjonalnie)".

**Wybór technologii druku w szybkiej wycenie (od 2026-08-19).** Gdy odpowiedzi prowadzą do druku 3D, kalkulator
pokazuje dwie karty: "Z filamentu (FDM)" i "Z żywicy (MSLA)", każdą z opisem zastosowania i z własną kwotą
policzoną z tych samych odpowiedzi. Klient widzi różnicę w cenie i we właściwościach przed zamówieniem, a nie po
odbiorze. Wycena żywiczna liczy się teraz także z wgranego pliku; wcześniej żywica była osiągalna wyłącznie przez
kafelek "Figurka z żywicy" i wyłącznie bez pliku.

**Pytanie kafelków zmienia treść po wgraniu pliku (od 2026-08-19).** Dopóki pliku nie ma, sekcja
pyta "Co chcesz wykonać?". Po wgraniu pliku pytanie zmienia się na "Do czego to służy?", żeby nie
konkurowało z już wgranym plikiem na ekranie. Kafelki nadal wybierają materiał i technologię.

**Wykrywanie jednostki pliku (od 2026-08-19).** STL i OBJ nie zapisują jednostki, więc czytamy je
jako milimetry. Gdy odczytany wymiar jest nieprawdopodobnie mały, szybka wycena i kalkulator druku
3D pokazują panel z możliwymi odczytami (metry, centymetry, cale) i jednym kliknięciem przeliczają
model na wybraną jednostkę.

**Wielkość to suwak, nie pięć kafelków** (`SizeSlider.jsx`). Skala logarytmiczna 1-100 cm,
pokazuje konkretny wymiar i nazwę przedziału ("Jak moneta" do 3 cm, "Jak dłoń" 3-10, "Jak
książka" 10-25, "Pudełko po butach" 25-40, "Większe" powyżej 40). Wgranie pliku ustawia suwak
na oryginale i daje znacznik powrotu jednym kliknięciem. Suwak **realnie skaluje geometrię**;
cena liczy się z przeskalowanego modelu, nie z etykiety.

**Powyżej pola roboczego (30 x 32 x 32,5 cm, FDM) nie pokazujemy ceny.** Zamiast kwoty: przycisk
"Zmniejsz do największej, która się mieści" i informacja, że przy dużych obiektach tniemy model
na części i sklejamy po wydruku, ze szwem na krawędzi. Cena za rzecz, której nie da się wykonać
w całości, byłaby obietnicą bez pokrycia.

**Formaty wyrównane w górę:** pole modelu 3D w koszyku (`/order/`) przyjmuje teraz
`.stl,.obj,.3mf,.step,.stp` (wcześniej samo `.stl`), formularz B2B dodatkowo `.svg,.ai,.dxf`,
pole zdjęcia referencyjnego w sklepie `.heic,.heif`, a `.ai` przyjmują wszystkie pola wektorowe
i serwer. Szybka wycena przyjmuje pełny zestaw modeli i wektorów; DXF, AI i PDF (bez parsera
geometrii) idą jako załącznik do wyceny przez człowieka, co ekran mówi klientowi wprost.

### 6.1 Kalkulator MSLA (Print3DCalc - ścieżka MSLA)

**Konfiguracja silnika (MSLA_CONFIG):**
- Amortyzacja maszyny: 3.00 PLN/h
- Energia: 0.25 kW
- Opłata obsługi: 8.00 PLN
- Post-processing platforma: 20.00 PLN
- Post-processing per sztuka: 3.00 PLN
- Mnożnik QC castable: 3.0x (premia robocizny za kontrolę wzorca)
- Minimum zamówienia: 49.00 PLN
- Odpad domyślny: 1.25 (125%)
- Odpad figurki: 1.35 (135%)

**Objętość platformy Elegoo Saturn 4 Ultra:** 21.8 x 12.3 x 25.0 cm

**Zastosowania (APPLICATIONS):**
- Prototyp: "Części, obudowy, testy dopasowania"
- Figurka/miniatura: "Kolekcjonerskie, do gier, dekoracyjne"
- Wzorzec odlewniczy: "Biżuteria, odlew lost-resin" (wymusza żywice castable)

**Wysokości warstw:**
- Standard 0.05 mm -> prędkość 35 mm/h
- Jakość 0.03 mm -> prędkość 20 mm/h

**Rozmiary modelu:**
| ID | Opis | Max cm | ml ref | szt/platforma |
|----|------|--------|--------|---------------|
| XS | do 2 cm | 2 | 3 | 30 |
| S | 2-5 cm | 5 | 20 | 12 |
| M | 5-10 cm | 10 | 80 | 4 |
| L | 10-15 cm | 15 | 220 | 2 |
| XL | powyżej 15 cm | - | - | 1 (custom) |

### 6.2 Katalog żywic MSLA (13 typów, src/data/resins.js)

**Segment: Standardowe (wizualne, hobby)**
| ID | Żywica | PLN/kg | Warstwa mm | Mycie | Twardość | Barwiona |
|----|--------|--------|------------|-------|----------|----------|
| standard | Standard | 120 | 0.025-0.05 | IPA | 84D | tak (18 kolorów) |
| water_washable | Water-washable | 130 | 0.025-0.05 | woda | 82D | tak |
| plant_based | Plant-based (eco) | 140 | 0.025-0.05 | IPA | 80D | tak |
| clear | Transparentna (Clear) | 130 | 0.025-0.05 | IPA | 84D | nie |

**Segment: Techniczne (funkcjonalne)**
| ID | Żywica | PLN/kg | Warstwa mm | Mycie | Twardość | Barwiona |
|----|--------|--------|------------|-------|----------|----------|
| abs_like | ABS-like 3.0+ | 160 | 0.05 | IPA | 80D | tak |
| tough | Tough (wytrzymała) | 150 | 0.05 | IPA | 78D | nie |
| flexible | Flexible (elastyczna) | 320 | 0.05 | IPA | 60-70A | nie |
| heat_resistant | Heat-resistant* | 350 | 0.05 | IPA | 85D | nie |
| fast | Fast (szybka) | 140 | 0.05-0.1 | IPA | 82D | nie |

**Segment: Precyzyjne i odlewnicze (jubilerskie)**
| ID | Żywica | PLN/kg | Warstwa mm | Mycie | Twardość | Barwiona |
|----|--------|--------|------------|-------|----------|----------|
| high_precision | High-precision 14K | 280 | 0.02-0.03 | IPA | 84D | nie |
| rigid | Rigid / Ceramic-filled* | 250 | 0.03-0.05 | IPA | 88D | nie |
| castable_xone | Castable BlueCast X-One V2 | 1399 | 0.03-0.05 | IPA | n/d (burnout) | nie |
| castable_xwax | Castable BlueCast X-Wax Filigree | 1399 | 0.02-0.03 | IPA | n/d (burnout) | nie |

*cena szacowana z klasy materiału

**Dostępne kolory** (dla żywic colorable: standard, water_washable, plant_based, abs_like):
Grey, Black, White, Clear, Beige, Blue, Clear Blue, Clear Green, Clear Red, Translucent, Yellow, Mint Green, Smoky Black, Maroon, Neon-Lime, Neon-Lemon, Neon-Peach, Neon-Pumpkin (18 kolorów)

**Post-cure UV [minuty] per typ:**
Standard 10, Water-washable 10, Plant-based 10, Clear 8, ABS-like 15, Tough 15, Flexible 15, Heat-resistant 20, Fast 8, High-precision 10, Rigid 15, Castable x2 30

### 6.3 Kalkulator FDM (Print3DCalc - ścieżka FDM)

**Filamenty - Segment Standardowe (11 materiałów):**
| Materiał | PLN/kg | Gęstość g/cm3 |
|----------|--------|---------------|
| PLA | 80 | 1.24 |
| PLA Silk | 110 | 1.24 |
| PLA Matte | 95 | 1.24 |
| PLA Wood | 120 | 1.20 |
| PLA Marble | 115 | 1.24 |
| PETG | 90 | 1.27 |
| PETG-CF | 160 | 1.30 |
| TPU 95A | 130 | 1.21 |
| PVA | 200 | 1.19 |
| ASA | 100 | 1.07 |
| ABS | 85 | 1.04 |

**Filamenty - Segment Inżynieryjne (10 materiałów):**
| Materiał | PLN/kg | Gęstość g/cm3 |
|----------|--------|---------------|
| PA6-CF | 280 | 1.18 |
| PA6-GF | 220 | 1.25 |
| PA12-CF | 300 | 1.15 |
| PPA-CF | 350 | 1.22 |
| PPA-GF | 300 | 1.30 |
| PC | 180 | 1.20 |
| PC-ABS | 170 | 1.15 |
| PET-CF | 240 | 1.35 |
| PPS | 500 | 1.35 |
| PPS-CF | 600 | 1.40 |

### 6.4 Kalkulator Odlewów Żywicznych (EpoxyCastCalc)

**Żywice:**
| ID | Nazwa | PLN/ml | Gęstość | Czas utwardzania |
|----|-------|--------|---------|-----------------|
| uv | Żywica UV | 0.35 | 1.10 | 0.1 h |
| epoxy_clear | Epoksyd transparentny | 0.18 | 1.15 | 48 h |
| epoxy_color | Epoksyd kolorowy | 0.22 | 1.15 | 48 h |
| custom | Inna żywica | - | - | - |

**Objętości:**
- XS: 7 ml (biżuteria, do 10 ml)
- S: 30 ml (brelok / mały, 10-50 ml)
- M: 150 ml (podkładka / deko, 50-250 ml)
- L: 600 ml (duży obiekt, 250 ml - 1L)
- XL: custom (river table, powyżej 1L)

**Typy form:**
- Istniejąca forma: koszt 0 PLN, trwałość 1 odlew
- Nowa forma mała: 60 PLN, 40 odlewów
- Nowa forma średnia: 150 PLN, 35 odlewów
- Nowa forma duża: 350 PLN, 25 odlewów
- Forma klienta: 0 PLN, 1 odlew
- Forma niestandardowa: cena custom

### 6.5 Kalkulator Kompensacji Skurczu (ShrinkageCalc)

**Czynniki skurczu per stop:**
| Stop | Czynnik | Zastosowanie |
|------|---------|--------------|
| Au 585 (14K) | 1.0196 | złoto żółte/białe/różowe 14K |
| Ag 925 | 1.016 | srebro jubilerskie |
| Au 9K | 1.021 | złoto 9K |
| Au 18K | 1.018 | złoto 18K |

**Rozmiary pierścionków EU:** 48-58 (co 1 rozmiar)
Wzór: ID wewnętrzna = EU / pi; wymiar wzorca = ID x czynnik_stopu

### 6.6 Kalkulator Łańcuszka / Biżuterii

**Wzór obliczenia masy:**
`masa = dlugosc_cm x pi x (drut_d_cm/2)^2 x gestosc x weaveFactor x wasteFactor`

**Stawka robocizny:** 48 PLN / 10 cm łańcucha (modyfikowana przez złożoność splotu 1.0-2.2x)

**Kursy walut:** live NBP (PLN) + LBMA (ceny metali), fallback EUR/PLN = 4.28

---

## 7. BEZPŁATNE NARZĘDZIA (ToolsStudio - /toolstudio/)

### 1. Parametry druku 3D FDM
URL: /toolstudio/print-settings/
Opis: 4-krokowy kreator dopasowania filamentu - filtry wymagań, picker materiału z bazy (API chat-api), wybór marki (verified/community), karta parametrów + mini kalkulator zużycia. Baza 38+ filamentów w PostgreSQL przez API.
SEO title PL: "Parametry druku 3D FDM: PLA, PETG, ABS, PA-CF | AEJaCA"

### 2. Parametry druku 3D MSLA
URL: /toolstudio/resin-settings/
Opis: Kreator doboru żywicy (filtr zastosowania, 9 chipów), karty 13 żywic w 3 segmentach (cena, trudność 1-3, mycie IPA/woda, badge kolorów), panel parametrów z wskazówkami per segment, tabela porównawcza 13 żywic, FAQ x5. Statyczny (bez API).
SEO title PL: "Parametry druku 3D MSLA: żywice, ceny, dobór | AEJaCA"

### 3. Kreator parametrów laserowania
URL: /toolstudio/laser-parameters/
Opis: 7 typów laserów, 88 materiałów, ponad 1000 kombinacji. Wybór akcji, materiału i lasera daje gotową kartę parametrów.

### 4. Kompensacja skurczu odlewniczego
URL: /toolstudio/shrinkage/
Opis: Przelicznik wymiaru wzorca na wymiar po odlewie, tabela rozmiarów EU 48-58 dla 4 stopów.
SEO title PL: "Kalkulator kompensacji skurczu odlewniczego | AEJaCA sTuDiO"

### 5. Sprawdzarka modeli 3D (od 2026-08-05)

`/toolstudio/printability/`. Odpowiada na pytanie, które dziś przychodzi mailem po wgraniu pliku
do wyceny: **czy to się wydrukuje**. Kalkulator mówi ILE TO KOSZTUJE i zakłada, że model jest
poprawny. To narzędzie sprawdza, czy założenie jest prawdziwe.

**Plik nie opuszcza przeglądarki.** Parsowanie i analiza idą lokalnie, w Web Workerze. To warunek
użyteczności, nie hasło: konstruktor sprawdzający część przed zapytaniem ofertowym nie wyśle jej
na cudzy serwer. Potwierdzone w teście: zero żądań POST poza domenę.

**Odpowiedź zależy od dyszy i to jest sedno narzędzia.** Płyta 0,3 mm jest blokadą przy dyszy 0,4
i tylko ostrzeżeniem przy 0,2. Ta sama geometria, inna odpowiedź.

| Dysza | Minimum (jedna ścieżka) | Bezpiecznie (dwie ścieżki) | Warstwa | U nas |
|---|---|---|---|---|
| 0,2 mm | 0,20 mm | 0,42 mm | 0,06 do 0,14 mm | **na stałe** |
| 0,4 mm | 0,40 mm | 0,84 mm | 0,08 do 0,28 mm | **na stałe** |
| 0,6 mm | 0,60 mm | 1,25 mm | 0,15 do 0,42 mm | po uzgodnieniu |
| 0,8 mm | 0,80 mm | 1,65 mm | 0,20 do 0,56 mm | po uzgodnieniu |

Rozróżnienie minimum i bezpiecznie nie jest ozdobą. Ścianka o szerokości jednej ścieżki powstanie,
ale nie ma w niej wiązania poprzecznego i pęka przy nacisku. Świadomie stosuje się ją w obudowach
i wzorach ażurowych.

**MSLA rządzi się inaczej:** granicy nie wyznacza rozdzielczość (piksel 14 µm), tylko siła
odklejania od folii FEP. Ścianka poniżej 0,4 mm urywa się w trakcie druku, poniżej 0,8 mm przetrwa
druk, ale niekoniecznie mycie. Przy MSLA dysza nie ma znaczenia.

**Co sprawdza:** szczelność siatki (krawędzie bez pary i nierozmaitościowe), kierunek normalnych
i siatkę wywróconą, grubość ścianek, gabaryty wobec realnych stołów z uwzględnieniem obrotu,
udział powierzchni pod podpory, pole styku ze stołem, podejrzaną skalę.

#### Bramka w kalkulatorze i w sklepie (od 2026-08-05)

Sprawdzarka nie jest już wyspą. Ta sama analiza działa przy zamawianiu, z parametrami, które klient
właśnie wybrał, razem z dyszą. Objęte są trzy ścieżki: **szybka wycena, tryb zaawansowany
i karta usługi w sklepie**. Bez tej trzeciej klient omijałby bramkę, wybierając łagodniejszą drogę.

#### Model jedzie razem z odnośnikiem (od 2026-08-18)

Bramka odsyła po pełną analizę na stronę narzędzia i do tej pory był to goły odnośnik, więc klient
ładował ten sam plik drugi raz i ręcznie ustawiał tę samą technologię oraz tę samą dyszę. Każdy
z tych kroków można wykonać inaczej, a wtedy pełna analiza odpowiada na inne pytanie niż to, które
ją wywołało. Teraz przenosimy **siatkę, technologię, dyszę, wielkość wydruku i nazwę pliku**,
przez `src/analysis/modelHandoff.js`.

Nośnikiem jest IndexedDB, bo strona otwiera się w nowej karcie: pamięć modułu tego nie przekroczy,
`sessionStorage` nie przyjmie tablicy typowanej bez kosztownej zamiany na tekst. Rekord kasujemy
przy odczycie i odrzucamy po kwadransie. Obietnica „plik nie opuszcza przeglądarki" zostaje
nienaruszona, ale FAQ narzędzia mówi o tym zapisie wprost, a `check-browser-storage.mjs` obejmuje
teraz także IndexedDB, bo wcześniej najpojemniejszy magazyn w przeglądarce był jedynym, którego
nikt nie oglądał.

Przy okazji naprawiona **awaria cicha**: analiza szła na siatce w oryginale, mimo że komentarz
w kodzie twierdził inaczej. Skalowanie przeliczało tylko objętość i gabaryt, więc model zmniejszony
do połowy miał połowę grubości muru, a bramka widziała grubość sprzed zmniejszenia i przepuszczała
wydruk, którego nie da się wykonać. Skalowanie siedzi teraz w jednym miejscu, w `flattenTriangles`,
i pilnuje go `test-model-handoff.mjs`.

**Blokujemy tylko ustalenia poziomu `blocker`.** Przycisk zmienia napis na „Potwierdź uwagi
do modelu" i odblokowuje się dopiero po zaznaczeniu potwierdzenia. Ostrzeżenia pokazujemy bez
kwitowania: 30% nawisów to normalna część, a ostrzeżenie, które pojawia się zawsze, przestaje być
ostrzeżeniem i uczy klikać bez czytania.

#### Bramka dwuetapowa: najpierw naprawa, potem potwierdzenie (od 2026-08-19)

Bramka pokazuje teraz najpierw, jak poprawić plik: wymaganą grubość w mm, o ile powiększyć model,
konkretne narzędzia (Blender, Meshmixer) i alternatywę w postaci druku z żywicy. Dopiero po
świadomym wyborze „chcę zamówić ten plik bez zmian" pokazuje się ryzyko i prośba o potwierdzenie.
Potwierdzenie razem z całą drogą (że instrukcje naprawy pokazano i że klient mimo to poszedł dalej)
trafia do zamówienia i do maila potwierdzającego.

Analiza idzie na geometrii **po przeskalowaniu**, bo to ona zostanie wydrukowana. Model zmniejszony
o połowę ma o połowę cieńszy mur.

#### Kalibracja: co blokuje, a co jest tylko informacją (korekta 2026-08-05)

Pierwsza wersja **odrzucała poprawne modele** i to był błąd konstrukcyjny, nie przeoczenie.
Werdykt o grubości opierał się na percentylu p1, a percentyl pierwszy z definicji reaguje, gdy
jakikolwiek jeden procent powierzchni jest cienki. Skutek: każdy model z napisem, fazką albo
fakturą dostawał blokadę.

Pomiar, który to ujawnił:

| Model | Percentyl p1 | Udział poniżej progu | Werdykt przed | Werdykt po |
|---|---|---|---|---|
| Kostka 20 mm z logo 0,3 mm | 0,30 mm | **2,6%** | BLOKADA | informacja |
| Płyta 0,3 mm | 0,30 mm | **98,5%** | BLOKADA | BLOKADA |

Identyczny percentyl, przeciwne przypadki. **Rozróżnia je udział, nie percentyl.**

**Blokują wyłącznie trzy rzeczy**, bo tylko przy nich wydruk nie powstanie:

1. model nie mieści się na stole nawet po obrocie,
2. plik zawiera powierzchnię zamiast zamkniętej bryły (brzeg > 25% krawędzi),
3. przeważająca część modelu (≥ 40% powierzchni) jest cieńsza niż jedna ścieżka.

**Reszta jest informacją i niczego nie zatrzymuje:** cienkie ścianki na fragmencie modelu, jedna
ścieżka zamiast dwóch, detale poniżej progu, drobne nieszczelności, dużo nawisów, mała podstawa.

Dwie poprawki poboczne z tej samej korekty. **Nieszczelności przestały być blokadą**, bo współczesne
slicery naprawiają je same i milczą; grubość mierzymy teraz mimo nich, dopóki brzeg nie przekracza
2% krawędzi (promień wylatujący przez dziurę daje odczyt ZAWYŻONY, a werdykt oparty na udziale to
znosi). **Mała podstawa ostrzega tylko przy smukłej bryle** (wysokość > 3× pierwiastek z pola styku),
bo płaski krążek też ma mało styku, a trzyma się doskonale.

Progi żyją w `CALIBRATION` w `src/analysis/printability.js`, a nie rozsypane po kodzie.

**Zasada nadrzędna, której nie wolno naruszyć:** narzędzie, które odrzuca poprawne modele, szkodzi
bardziej niż jego brak, bo klient przestaje wierzyć ostrzeżeniom i klika dalej bez czytania. Test
`test-printability.mjs` zawiera zestaw dziesięciu codziennych modeli i sprawdza, że **żaden**
nie zostaje zablokowany.

#### Charakter pokwitowania: to NIE jest zrzeczenie się praw

Najważniejsza rzecz w całej konstrukcji i nie wolno jej przeformułować.

**Konsument nie może z góry zrzec się uprawnień z tytułu niezgodności towaru z umową.** Klauzula,
która tak stanowi, jest abuzywna i nieważna z mocy prawa. Podpis pod nią nie chroni nas, tylko
tworzy pozór ochrony i wygląda źle przy pierwszym sporze.

Chroni co innego i mocniej: **udokumentowanie, że ujawniliśmy konkretną właściwość JEGO pliku przed
zamówieniem, a on polecił wykonanie mimo to**. Wynik jest wtedy zgodny z umową, bo to klient określił
specyfikację. Podstawa w regulaminie: **sekcja 13**, razem z wyraźnym zastrzeżeniem, że pozostałe
uprawnienia zostają nienaruszone.

Prawo odstąpienia przy wydrukach z pliku klienta i tak jest wyłączone w sekcji 10, więc to
pokwitowanie dotyczy reklamacji, a nie zwrotu.

Zapis idzie do `params.printability`, czyli tam, gdzie i tak jadą parametry pozycji, więc trafia
do zamówienia i do maili bez osobnej kolumny. Do maila potwierdzającego trafiają **wyłącznie
ustalenia blokujące**, bo tylko one wymagały zgody; przypominanie ostrzeżeń w dokumencie
potwierdzającym sugerowałoby zgodę, której nie było. Zapis jest w wersji HTML **i** tekstowej,
inaczej dokumentacja zależałaby od ustawień poczty odbiorcy. Mail warsztatowy dostaje osobny
wiersz `!! KLIENT POTWIERDZIL DRUK MIMO UWAG`, bo w JSON-ie parametrów zostałby przeoczony.

Trzyma to test `scripts/test-print-consent.mjs`, który sprawdza także, że w mailu **nie ma**
sformułowań o zrzeczeniu się praw, i że zastrzeżenie o zachowaniu uprawnień jest we wszystkich
trzech językach.

#### Decyzje, których nie wolno cofnąć bez powodu

**Grubości NIE mierzymy na nieszczelnej siatce.** Promień pomiarowy wylatuje przez dziurę i trafia
w przypadkową ściankę po drugiej stronie modelu, dając odczyt kilkanaście razy za duży. Fałszywe
zapewnienie, że model się wydrukuje, jest gorsze niż brak odpowiedzi, bo klient dostaje wtedy odpad.

**Promień idzie po siatce przestrzennej algorytmem DDA**, komórka po komórce w kolejności od
najbliższej, a nie krokiem stałej długości. Krok stały jest prostszy, ale potrafi przeskoczyć
cienką ściankę, czyli pomylić się w stronę zawyżenia grubości. Dokładnie tej pomyłki nie wolno
popełnić. Zweryfikowane na torusie o znanej grubości: mediana 6,00 mm przy teorii 6,00 mm.

**Losowanie próbek jest deterministyczne** (własny generator, stałe ziarno). Ten sam plik musi dać
ten sam wynik przy każdym wgraniu, inaczej klient dostaje dwie różne odpowiedzi.

**Moduł leży w `src/analysis`, nie w `src/pricing`.** Katalog `pricing` jest kopiowany do
`chat-api` przez `sync-pricing`, bo backend musi umieć przeliczyć cenę. Drukowalność ceny nie
dotyka, a trzymanie jej w rdzeniu cenowym wysyłałoby na serwer martwy kod.

**Topologia liczy się na kluczach całkowitych, nie tekstowych.** Pierwsza wersja składała miliony
łańcuchów i przy 490 tys. trójkątów zajmowała 6,5 s. Po zmianie 3,0 s, a całość i tak idzie
w Web Workerze, więc karta nie zamarza.

---

### Narzędzia jubilerskie (/toolsjewelry/)

| Narzędzie | URL | Opis |
|---|---|---|
| Skład stopów jubilerskich | /toolsjewelry/alloy-composition/ | Skład, temperatura topnienia i twardość stopów Au, Ag, Pt |
| **Ile warte jest moje złoto** | /toolsjewelry/metal-pricing/ | Wartość kruszcu z ceny spot XAU/XAG/XPT/XPD i kursu NBP, plus realne widełki skupu (70-90%). Próby Au 333-999 z karatami, Ag 800-999, Pt 850-999, Pd 500-999. Tabela ceny za gram dla każdej próby, przelicznik próba↔karat. Schematy HowTo + FAQPage (7 pytań x 3 języki). |
| Kalkulator blanku obrączki | /toolsjewelry/ring-blank/ | Długość pręta i masa blanku dla metalu, średnicy i szerokości |
| Konwerter rozmiarów pierścionków | /toolsjewelry/ring-size/ | EU / US / UK / JP, z obwodu lub średnicy |
| **Miarka do pierścionków do wydruku** | /toolsjewelry/ring-sizer/ | Pasek owijany (obwód 40-76 mm) i tabela kółek (Ø 14,0-22,3 mm), z wbudowaną kontrolą skali wydruku: prostokąt karty płatniczej 85,6 x 53,98 mm i linijka 100 mm. Schematy HowTo + FAQPage. |

Miarka i konwerter odpowiadają na dwa różne zapytania: „jaki mam rozmiar" kontra „ile to jest w US".
Obie strony linkują do siebie nawzajem. Wspólna tabela rozmiarów siedzi w `src/data/ringSizes.js`,
żeby narzędzia nie rozjechały się przy pierwszej korekcie.

**Warunek działania:** wydruk w skali 100%. „Dopasuj do strony" zmniejsza arkusz o kilka procent,
co daje błąd o jeden do dwóch rozmiarów. Stąd kontrola skali na samej górze arkusza.

#### Wartość metalu: jedna strona, dwie intencje

Strona `/toolsjewelry/metal-pricing/` nazywała się wcześniej „Wycena surowca" i była napisana dla
jubilera liczącego koszt materiału. Zapytanie, które realnie generuje ruch, brzmi jednak
„ile warte jest moje złoto" i zadaje je osoba ze złomem w szufladzie. Osobna strona pod tę intencję
została **odrzucona świadomie**: kalkulator byłby w 95% ten sam, a dwie strony o wartości złota na
jednej domenie konkurują ze sobą w wynikach zamiast się sumować. Zamiast tego nagłówek pod intencję
konsumencką i sekcje obsługujące obie.

**Zasada, której nie wolno złamać:** wartość kruszcu i cena skupu to dwie różne liczby i obie muszą
być widoczne z tą samą wagą wizualną. Skup płaci 70 do 90% wartości kruszcu (rafinacja kosztuje,
a próba jest niepotwierdzona do przetopu). Klient, który zobaczy 4500 PLN i dostanie 3200, poczuje
się oszukany przez nas, choć to nie my skupujemy.

Kalkulator celowo **nie korzysta** z hooka `useMarketRates`, bo ten ma wartości zapasowe
(au 645 PLN/g). W pasku w stopce są akceptowalne, w wycenie czyjegoś majątku już nie. Przy braku
kursu dla danego metalu strona prosi o ręczne wpisanie ceny uncji troy.

Próba Au 333 jest w tabeli dlatego, że to najczęstsza próba w starszej biżuterii niemieckiej,
a niemiecki to jeden z trzech języków serwisu. W Polsce ta próba nie występuje.

**Odnośniki przychodzące:** 20 stron (blog x6, słownik x4, sklep x6, B2B, /jewelry/, hub, sama strona).

#### Strażnik `check-tool-links`

Rejestr `toolLinks.js` miał trzy klucze wskazujące na slugi, które nie istnieją
(`pierscionek-zareczynowy` zamiast `pierscionek-zareczynowy-na-zamowienie` i dwa podobne).
Nic się nie wywaliło, bo `getToolsForPost` ma fallback na domyślne narzędzia z tej samej
kategorii. Strony renderowały się poprawnie, tylko z innymi narzędziami niż przypisane ręcznie,
i trzy wpisy blogowe cicho zgubiły odnośnik do wyceny metalu.

`scripts/check-tool-links.mjs` sprawdza w buildzie, że każdy klucz odpowiada realnemu slugowi
wpisu lub haśle słownika, że każdy identyfikator narzędzia istnieje, że komplet tłumaczeń
(pl/en/de) jest na miejscu i że `audience` ma dozwoloną wartość. Nie wymaga, żeby każdy wpis
miał narzędzie, bo brak przypisania bywa decyzją.

### Zapisana wycena z linkiem (od 2026-08-05)

Pod kwotą wiążącą w **każdym** kalkulatorze jest przycisk „Zapisz wycenę". Klient dostaje
prywatny adres `/quote/?ref=WY...&token=...`, opcjonalnie także mailem. Strona jest `noindex`,
w `robots.txt` ma `Disallow: /quote/` we wszystkich grupach.

**Adres e-mail jest dobrowolny.** Sam link nie wymaga zostawiania danych. Żądanie adresu za
możliwość wrócenia do własnej kalkulacji zamieniłoby narzędzie w bramkę na dane, a część ludzi
po prostu zamknęłaby kartę, czyli zrobiła dokładnie to, czemu mamy zapobiec.

**Zasada cenowa: robocizna wiążąca 14 dni, kruszec z dnia otwarcia.** Blokada ceny złota na dwa
tygodnie byłaby otwartą pozycją na rynku towarowym. Różnicy nie liczymy przez przeliczenie
pozycji od nowa, bo wtedy zmiana **naszego** cennika po cichu podniosłaby też obiecaną
robociznę. Wyceniamy pozycję dwa razy, kursami z chwili zapisu i z dzisiaj, i do kwoty zapisanej
dokładamy samą różnicę. Po terminie ważności nie przeliczamy nic.

Kwotę liczy **serwer**, tym samym silnikiem co `/api/price`. Liczba przysłana przez przeglądarkę
nie jest czytana: przyjmując ją, wystawialibyśmy ofertę na kwotę wpisaną przez kupującego.

**Retencja:** wyceny zapisane 90 dni, zapytania o wycenę ręczną 24 miesiące, przekute
w zamówienie nie znikają nigdy.

#### Dwa uśpione błędy znalezione przy tej pracy

Silnik wycen (`chat-api/quotes.js`, cztery endpointy, tabele `quotes` i `quote_items`) istniał
od dawna i **nic go nie wywoływało**. Podłączanie go ujawniło dwie rzeczy:

1. **Kursy kruszcu nie docierały do kalkulatora.** `calcNew` i `calcChain` przyjmują kursy
   trzecim argumentem, a `priceItem` wkładał je do obiektu parametrów, gdzie destrukturyzacja
   ich nie wymienia. Przeglądarka liczyła cenę z bieżącego kursu, serwer ze stałej z konfiguracji
   (Au 645 PLN/g, Ag 10,15 PLN/g). Ta sama pozycja: 325,43 PLN z serwera niezależnie od tego,
   czy srebro kosztowało 1 czy 40 PLN/g. Po naprawie ceny biżuterii ze złota realnie rosną,
   bo stała była poniżej rynku.
2. **`priceQuote` nie potrafiło wycenić żadnej pozycji.** `quote_items.id` to BIGSERIAL,
   a node-postgres oddaje bigint jako **tekst**. Mapa po surowym `id` miała klucze `"1"`,
   a odpytywana była liczba `1`. Każde wycenianie kończyło się błędem „pozycja nie należy
   do wyceny". Wykrył to dopiero test na prawdziwej bazie.

**Strażnicy:** `scripts/test-saved-quote.mjs` w buildzie (pierwszy test sprawdza, czy kurs
w ogóle dociera do kalkulatora, bo bez tego cała reszta przechodzi na zielono) oraz
`scripts/it-quotes-db.mjs` poza buildem, do uruchomienia na bazie przy zmianach w `quotes.js`.

#### Trzeci błąd tej samej klasy: ceny kamieni (naprawiony 2026-08-05)

`calcNew` ma sygnaturę `(params, lang, rates, gemstones)`. `priceItem` **nie przekazywał
czwartego argumentu w ogóle**, więc kamień wyceniał się po cenie wpisanej w kod
(`GEMSTONES` w `jewelryConfig.js`), a nie po tej z tabeli `gemstone_prices`, którą
przeglądarka nakłada przez `useGemPrices`.

Skala, ten sam pierścionek z jednym brylantem 0,5 ct:

| Źródło ceny kamienia | Kwota wiążąca |
|---|---|
| statyczna z kodu (12 800 PLN/ct) | 15 199,43 PLN |
| z bazy, gdyby wynosiła 25 000 PLN/ct | 29 229,43 PLN |

Czternaście tysięcy złotych różnicy na jednej pozycji, bez żadnego błędu w logu.

**Ile to znaczy przy DZISIEJSZYCH danych:** 25 000 PLN/ct powyżej to wartość testowa,
dobrana tak, żeby różnica była widoczna. Ceny zasiane w bazie przeliczone kursem 4,25
różnią się od tych z kodu o pojedyncze złote (brylant 12 750 wobec 12 800, rubin 6 375
wobec 6 400), czyli **poniżej jednego procenta**. Realny skutek naprawy jest więc dziś
niewielki i sprowadza się do dwóch rzeczy: ceny kamieni **zaczynają zależeć od kursu euro**
(bo w bazie leżą w euro), i **zmiana ceny w bazie wreszcie działa**. Wcześniej edycja
tabeli `gemstone_prices` zmieniała tylko to, co widział klient w kalkulatorze, a nie kwotę,
którą płacił. To jest właściwy powód, dla którego trzeba było to naprawić: mechanizm był
martwy, nie kwota była zła.

Przy okazji wyszło, że `currentMetalRates` pobierała cztery kruszce i **pomijała
`pln_per_eur`**. Ceny kamieni leżą w bazie w euro, więc nawet po przekazaniu ich do
kalkulatora nie byłoby czym ich przeliczyć. Kurs dołączony do tego samego zapytania.

Ceny kamieni trafiają teraz do **wszystkich trzech** miejsc, w których serwer liczy kwotę
wiążącą: `/api/price`, zapis wyceny i zamiana koszyka w zamówienie. Pamięć podręczna cen
bazowych czyści się razem z tą dla `/api/gemstone-prices`, więc zmiana ceny nie dociera
do przeglądarki o dobę wcześniej niż do rachunku.

**Strażnik:** `scripts/test-live-pricing.mjs` w buildzie. Pilnuje całej klasy błędu:
że kurs kruszcu zmienia kwotę, że cena kamienia z bazy zmienia kwotę, i że zapytanie
o kursy pobiera komplet pięciu pól. Ma też warunek wstępny sprawdzający, czy kamień
w ogóle wchodzi do wyceny, bo bez `stoneSizeId` kalkulator go pomija i test przeszedłby
na zielono, niczego nie sprawdzając.

### Hydratacja: prerender był wyrzucany do kosza (częściowo naprawione 2026-08-05)

Błędy React **#418** i **#423** w konsoli na każdej stronie były objawem, nie usterką
kosmetyczną. Znaczą one: *hydratacja się nie powiodła, cała zawartość zostaje narysowana
od nowa po stronie klienta*. Gotowy HTML z prerenderu leciał do kosza u każdego
odwiedzającego. Roboty wyszukiwarek nadal widziały treść, więc SEO nie cierpiało i nic
nie wyglądało na zepsute.

**Znaleziona i naprawiona przyczyna: brak granicy `Suspense` po stronie serwera.**
`src/main.jsx` owija `<Routes>` w `<Suspense>` (trasy ładowane leniwie), a
`src/entry-server.jsx` nie miał tej granicy w ogóle. Renderowanie na serwerze znaczy
granice komentarzami `<!--$-->` i `<!--/$-->`; klient ich szukał, nie znajdował
i przewracał się. Przy okazji wyrównane zostały dwa inne węzły drzewa, `StrictMode`
i `ScrollToHash`, bo `useId` liczy identyfikatory z położenia w drzewie i pola
formularzy dostawały różne id na serwerze i u klienta.

Efekt sprawdzony na zbudowanym serwisie: **strona główna jest czysta**, wcześniej nie była.

**Nie naprawione:** pozostałe 15 z 16 sprawdzonych stron nadal zgłasza niezgodność.
Diagnoza doprowadziła do konkretnego miejsca: `Navbar`, wskaźnik aktywnej pozycji menu
(`<span>` wewnątrz `<Link>`). Porównanie drzewa DOM po hydratacji pokazuje **identyczną
strukturę** po obu stronach (869 węzłów do 869 na `/contact/`), a wyjście SSR jest takie
samo z ukośnikiem na końcu adresu i bez niego. Niezgodność jest więc **przejściowa**:
pojawia się w pierwszym renderze klienta i znika po nim. Ustalenie, co ją powoduje,
wymaga instrumentacji pierwszego renderu i jest osobnym zadaniem.

**Strażnik:** `scripts/prerender.mjs` kończy build błędem, gdy `main.jsx` ma `<Suspense>`,
a wyrenderowany HTML nie ma znaczników granicy. Sprawdzone kontrolą pozytywną.

**Narzędzie do dalszej pracy:** `scripts/check-hydration.mjs`, poza buildem, bo wymaga
zbudowanego `dist/`, serwera statycznego i przeglądarki. Robi przegląd 16 stron
(`node scripts/check-hydration.mjs`) i porównuje drzewa (`--diff /contact/`). W nagłówku
ma instrukcję zbudowania Reacta w wersji rozwojowej, bez której w konsoli widać tylko
„Minified React error #418" zamiast nazwy komponentu.

Uwaga do diagnozowania: `scripts/prerender.mjs` czyta szablon z `dist/index.html`,
który sam potem nadpisuje. **Uruchomiony bez wcześniejszego `vite build` pracuje na
własnym poprzednim wyniku** i pokazuje nieaktualny HTML. Pierwsza kontrola pozytywna
tego strażnika wypadła fałszywie zielono właśnie z tego powodu.

---

## 8. STRATEGIA SEO

### Podejście ogólne
- Statyczny prerender SSR dla 70 stron (Vite + `scripts/prerender.mjs`)
- Pełna obsługa hreflang pl/en/de na wszystkich stronach
- Schematy strukturalne JSON-LD na każdej stronie

### Zaimplementowane schematy JSON-LD
| Schemat | Gdzie |
|---------|-------|
| Organization | Strona główna, Studio, Jewelry |
| LocalBusiness | Strona główna (geo: Józefosław) |
| Product + aggregateRating (5.0 / 25) | Studio (3x SKU), Jewelry (3x SKU) |
| Service + priceRange | Studio, Jewelry |
| BreadcrumbList | Wszystkie podstrony |
| FAQPage | B2B, narzędzia, blog |
| Article | Wszystkie posty bloga |
| HowTo | Strony procesowe |
| ItemList | Lista usług |
| WebPage | Każda strona |
| OfferShippingDetails | Studio, Jewelry (10 krajów EU + worldwide) |
| MerchantReturnPolicy | Studio, Jewelry (14 dni, bezpłatny zwrot) |

### Metadane stron (page key / title / description)

**Strona główna**
- PL: "AEJaCA - Biżuteria Artystyczna & sTuDiO Fabrykacji Cyfrowej"
- EN: "AEJaCA - Handcrafted Jewelry & Digital Fabrication Studio"
- DE: "AEJaCA - Handgefertigter Schmuck & Studio für Digitalfertigung"

**Biżuteria (/jewelry/)**
- PL: "AEJaCA Biżuteria, Ręcznie Robione Srebro, Złoto, Kamienie"
- EN: "AEJaCA Jewelry, Handmade Silver, Gold & Gemstone Pieces"
- DE: "AEJaCA Schmuck, Handgefertigte Ringe, Ohrringe, Anhänger"

**Studio (/studio/)**
- PL: "AEJaCA sTuDiO, Druk 3D, Laser, Modelowanie 3D, Odlewy"
- EN: "AEJaCA sTuDiO, 3D Printing, Laser Engraving & 3D Modeling"
- DE: "AEJaCA sTuDiO, 3D-Druck, Lasergravur, 3D-Modellierung"

**B2B (/b2b/)**
- PL: "Produkcja jubilerska B2B, CAD, wzorce 16K, odlew | AEJaCA"
- EN: "B2B Jewelry Production, CAD, 16K Patterns, Casting | AEJaCA"
- DE: "B2B-Schmuckproduktion, CAD, 16K-Modelle, Guss | AEJaCA"

**O nas (/about/)**
- PL: "O AEJaCA, Rzemiosło i technologia od 2023 roku"
- EN: "About AEJaCA, Craft and technology for 3+ years"
- DE: "Über AEJaCA, Handwerk und Technologie seit 3+ Jahren"

**Narzędzia hub (/toolstudio/)**
- Tagline PL: "Wiedza otwarta / Narzędzia dla Makerów"

### Blog jako SEO
18 postów blogowych pokrywających:
- Biżuteria: pierścionki zaręczynowe, obrączki, srebro vs złoto, pielęgnacja biżuterii, biżuteria inwestycyjna, rodzaje splotów łańcuszkowych, ile kosztuje biżuteria
- Wpisy o obrączkach i o pierścionku zaręczynowym mają od 2026-08-05 sekcję o rozmiarze, z odesłaniem do miarki do wydruku. Wcześniej oba omawiały metal, kamienie, cenę i termin, a o rozmiarze nie wspominały ani razu, mimo że przy pierścionku na niespodziankę to jest pytanie numer jeden.
- Studio: druk 3D krok po kroku, grawerowanie laserowe, odlewy żywiczne, jak przygotować plik STL, materiały do laser cuttingu, modelowanie 3D na zamówienie, lost-resin krok po kroku, druk miniatur figurek 16K
- Specjalne: projektowanie AI, warsztat od kuchni, prezenty personalizowane

### Słownik jubilersko-techniczny (34 terminy)
Dedykowane strony /glossary/[slug] dla każdego terminu, budujące topical authority w dwóch niszach.

**Terminy jubilerskie:** srebro-925, złoto-probowane, pierscioek-zareczynowy, obraczki-slubne, kamien-szlachetny, rodowanie, moissanit, rozmiar-pierscionka, personalizowany-grawer, bizuteria-inwestycyjna

**Terminy techniczne (studio):** druk-3d-fdm, plik-stl, pla, petg, zywica-uv, laser-co2, laser-fiber, plik-svg, odlew-zywiczny, prototypowanie, lost-resin, zywica-castable, druk-msla, kompensacja-skurczu

**Terminy ogólne:** cad, modelowanie-3d, personalizacja, projektowanie-ai, wycena-online

### Crawlery AI (robots.txt)
Wszystkie główne crawlery AI są explicite dozwolone:
OpenAI (GPTBot, OAI-SearchBot, ChatGPT-User), Anthropic (ClaudeBot, Claude-SearchBot, Claude-User), Google-Extended, Googlebot, bingbot, PerplexityBot, Perplexity-User, Applebot, Applebot-Extended, Amazonbot, meta-externalagent, meta-externalfetcher, cohere-ai, DuckAssistBot, YouBot, CCBot

**Parametry zapytań:** od 2026-07-28 nie ma już reguły `Disallow: /*?*`. Adresy z `?tab=`, `?category=`, `?co2mode=` to realna nawigacja wewnątrz stron, linkowana z naszych własnych menu, a każda strona wystawia canonical na czysty adres. Blokada powodowała, że Search Console raportowało 7 własnych, linkowanych wewnętrznie URL jako "Zablokowana przez plik robots.txt".

### Strony lokalne (SEO lokalne, od 2026-07-28)

Pierwsze dwie strony celujące w zapytania z nazwą miejscowości. Powód: przez 3 miesiące Search Console pokazał 26 kliknięć i ani jednego zapytania z intencją zakupową, a profil Google odwiedzano prawie wyłącznie po pełnej nazwie marki. Serwis nie istniał dla nikogo, kto nie znał nazwy.

| URL | Fraza docelowa | Wyróżnik treści |
|---|---|---|
| `/druk-3d-warszawa/` | druk 3d warszawa | wysyłka następnego dnia, krótkie serie dla firm, makiety, wzorce odlewnicze |
| `/druk-3d-piaseczno/` | druk 3d piaseczno | bezpłatny odbiór osobisty, ~10 min od centrum, naprawa części przyniesionych na miejsce |

Treść w `src/data/localPages.js`, komponent `src/pages/LocalPrint3D.jsx`, jedna trasa na miasto z propem `city`.

**Zasada:** treść każdego miasta musi być realnie inna. Sklonowane strony z podmienioną nazwą miasta Google traktuje jako strony przejściowe i obniża całą witrynę. Różnicujemy sposób odbioru, czas dojazdu, typ odbiorcy, przykłady zleceń i FAQ. Park maszynowy i materiały mogą się powtarzać, bo to specyfikacja techniczna.

Linki wewnętrzne: sekcja "Obsługujemy" na `/studio/`, bez niej strony byłyby sierotami w strukturze witryny.

Tytuły zaczynają się od frazy, nie od marki. `AEJaCA` idzie na koniec, bo nikt nie szuka frazy "AEJaCA sTuDiO", a pierwsze słowa tytułu ważą najwięcej.

### Kanoniczne przekierowania (_redirects)
Poza przekierowaniami trailing-slash dla stron głównych, plik zawiera:
- `/gallery/` → `/jewelry/` i `/resources/` → `/blog/` (301). To pozycje rozwijane w menu bez własnych stron; bez tych reguł wpadały w catch-all SPA i zwracały stronę NotFound z kodem 200, czyli soft 404 raportowany przez Google jako "noindex".
- Stare slugi bloga: `/blog/grawerowanie-laserowe/` → `/blog/grawerowanie-laserowe-przewodnik/`, `/blog/pierscionek-zareczynowy/` → `/blog/pierscionek-zareczynowy-na-zamowienie/` (301).

**Brak catch-all SPA (od 2026-07-28):** reguła `/* /index.html 200` została usunięta. Wcześniej każdy nieistniejący adres zwracał kod 200 ze stroną NotFound, czyli soft 404. Teraz wszystkie 70 tras jest prerenderowanych jako osobne pliki `index.html`, a Cloudflare Pages serwuje `dist/404.html` z prawdziwym kodem HTTP 404 dla reszty. Plik `404.html` powstaje w `scripts/prerender.mjs` z tego samego komponentu NotFound, więc jest w pełni obrandowany i ma `noindex, nofollow`.

**Zabezpieczenie przed rozjazdem tras:** `scripts/prerender.mjs` czyta slugi bloga z `POSTS_META` i identyfikatory słownika z `GLOSSARY` (koniec ręcznych list), a listę `STATIC_ROUTES` porównuje z trasami zadeklarowanymi w `src/main.jsx`. Rozjazd w którąkolwiek stronę przerywa build. To krytyczne: bez catch-all trasa pominięta w prerenderze byłaby żywą stroną zwracającą 404.

### Plik llms.txt
Publiczny plik /llms.txt (specyfikacja llms.txt) zawierający:
- Pełny opis marki i usług dla crawlerów AI
- Zaktualizowany 2026-07-28
- Katalog 13 żywic z cenami
- Cennik wszystkich usług
- Linki do wszystkich kluczowych stron
- FAQ z odpowiedziami

### IndexNow
Po każdym deployu uruchamiany `npm run indexnow` (Bing/Yandex) z lokalnej maszyny.
Klucz weryfikacyjny: `public/1cc7ba768716151f4028f5c9d6127177.txt`

---

## 9. TECHNOLOGIA (stack)

### Frontend
- React 18 + Vite 6
- Tailwind CSS v4
- React Router DOM
- SSR prerender: Vite SSR + `scripts/prerender.mjs` (statyczne 70 stron)
- Internacjonalizacja: własny system i18n (pl.js, en.js, de.js)

### Hosting
- Cloudflare Pages (JAMstack)
- `public/_headers` - nagłówki bezpieczeństwa + cache
- `public/_redirects` - przekierowania

### Backend
- Chat API: Node.js na Railway (`aejacachatapi-production.up.railway.app`)
- Baza danych filamentów: PostgreSQL
- Endpoint `/api/filaments` - baza 38+ filamentów z weryfikowanymi markami
- AI asystent (chatbot) - własny context.js z systemowym promptem

### Generowanie obrazów
- Gemini Imagen 4 via API (`GEMINI_API_KEY`)
- Konwersja PNG -> WebP quality 82 via sharp
- Styl: czarne tło, światło z lewego górnego rogu, premium product photography

### Kluczowe pliki konfiguracyjne do synchronizacji przy zmianach
| Plik | Co zawiera |
|------|-----------|
| `public/llms.txt` | Opis marki dla AI crawlerów |
| `public/robots.txt` | Polityka crawlerów |
| `public/sitemap.xml` | Mapa stron (70 URL-i) |
| `chat-api/context.js` | System prompt asystenta AI |
| `src/seo/seoData.js` | Meta tytuły i opisy |
| `src/seo/schemas.js` | Schematy JSON-LD |

---

## 10. WYSYŁKA

### Polska
- InPost kurier: 30 PLN (~7 EUR)
- Paczkomat InPost: 17 PLN (~4 EUR)
- Darmowa wysyłka: zamówienia powyżej 400 PLN (~100 EUR)

### Unia Europejska
- InPost (kraje objęte): od 50 PLN (~12 EUR), 5-10 dni roboczych

### Wielka Brytania
- DHL Express / UPS / FedEx:
  - do 5 kg: 70-120 PLN (~17-28 EUR)
  - do 10 kg: 110-150 PLN (~26-35 EUR)
  - 20-30 kg: 150-270 PLN (~35-63 EUR)

### USA i reszta świata
- DHL Express (2-5 dni roboczych):
  - do 1 kg: 140-190 PLN (~33-45 EUR)
  - do 10 kg: 330-400 PLN (~78-94 EUR)

Polityka zwrotów: 14 dni, bezpłatny zwrot (MerchantReturnPolicy)

---

## 10b. SKLEP I KREATOR ZAMÓWIEŃ (od 2026-07-31)

### Zasada nadrzędna

**Cena, którą płaci klient, jest liczona wyłącznie na serwerze.** Rdzeń cenowy leży w `src/pricing/` i jest kopiowany do `chat-api/pricing/` skryptem `scripts/sync-pricing.mjs`. `npm run build` sprawdza dryf między kopiami i przerywa build, gdy cena zmieni się tylko po jednej stronie. Kalkulatory w przeglądarce pokazują wynik, ale nie decydują o kwocie.

Przy pozycjach z plikiem geometria przysłana przez przeglądarkę jest kasowana i liczona od nowa z wgranego pliku. Podmiana `stlData` w konsoli nie zmienia ceny.

### Cena wiążąca kontra widełki

`applyPricing` zwraca `unitGrosze`, czyli kwotę sprzed rozrzutu tolerancji. To ona trafia na zamówienie. Widełki -30% / +40% zostają wyłącznie w kalkulatorach poglądowych, bo opisują niepewność szacunku, a nie ofertę. Kwoty w bazie i w komunikacji z Autopay są w **groszach**, jako liczby całkowite.

### Kreator `/order/`

Pięć kroków: usługa, parametry (lub plik), cena wiążąca, dane i zgody, płatność.

Zamówić i zapłacić od razu można: druk FDM, druk MSLA, grawer CO2, cięcie CO2, znakowanie fiber, odlew żywiczny, renowację i naprawę biżuterii oraz biżuterię bez kamieni.

Ścieżką wyceny indywidualnej idą: biżuteria z kamieniami, łańcuszki, projekty CAD i konfiguracje oznaczone przez kalkulator jako niestandardowe.

Dostawa: paczkomat InPost 16,49 PLN, kurier 19,49 PLN, odbiór osobisty 0 PLN.

### Zgody

Akceptacja regulaminu i oświadczenie z art. 38 UPK to **dwa osobne checkboxy**. Wyłączenie prawa odstąpienia przy rzeczy wykonywanej na zamówienie działa tylko wtedy, gdy klient złożył wyraźne, odrębne oświadczenie. Ukrycie go w akceptacji regulaminu unieważnia wyłączenie.

### Integracja Autopay

Szczegóły protokołu w `MDs/AEJaCA_Autopay_Integration.md`. Trzy reguły, które muszą przetrwać każdą zmianę kodu:

1. Puste pole wypada z sumy kontrolnej **razem ze swoim separatorem**.
2. Status zamówienia zmienia **wyłącznie** komunikat ITN. Strona powrotu tylko weryfikuje podpis i niczego nie zapisuje.
3. Realizacja zamówienia (maile, wydanie plików) dzieje się **raz**, przy pierwszym `SUCCESS`, mimo że potwierdzamy każdy komunikat.

Kwota z ITN jest porównywana z kwotą zamówienia, więc sam poprawny podpis nie wystarczy do opłacenia zamówienia niższą kwotą.

### Sprzedaż w euro i przelew z ręcznym potwierdzeniem

Żaden kanał Autopay nie działa bez konta w polskim banku: lista włączonych bramek to BLIK i 22 linki do polskich banków, kart nie ma. Klient z zagranicy nie ma więc czym zapłacić od ręki.

Przy `en` i `de` sklep pokazuje **wyłącznie euro**, przeliczone z ceny w groszach PLN po kursie NBP powiększonym o **8%** na różnice kursowe. Stała `EUR_FX_MARGIN` leży w `src/pricing/currency.js`, czyli w rdzeniu kopiowanym do `chat-api`, żeby strona i backend liczyły identycznie. Zaokrąglenie idzie w górę do pełnego centa.

Zamówienie w euro:

1. Klient wybiera przelew, widzi pięć kroków procesu, jeszcze nic nie płaci.
2. Backend zamraża kwotę w `amount_eur_cents` razem z `eur_rate` i ustawia status `awaiting_transfer`. Numer rachunku pojawia się dopiero teraz: na stronie zamówienia i w mailu.
3. Kwota i rezerwacja towaru obowiązują **3 dni robocze**, liczone z pominięciem sobót, niedziel i polskich świąt (`src/pricing/businessDays.js`). Czwartego dnia roboczego bez zaksięgowanej wpłaty rezerwacja spada, a towar wraca do sprzedaży. To zdanie stoi w kasie, w mailu z danymi do przelewu, na stronie zamówienia i w regulaminie, w trzech językach.
4. Po wpływie potwierdzamy ręcznie w zakładce **Przelewy** w aplikacji AEJaCA Admin. Potwierdzenie robi dokładnie to, co `SUCCESS` z ITN: ustawia `paid`, wysyła maile i przenosi pliki do folderu Zamówienia. Wykonuje się raz, bo pilnuje tego `fulfilled_at`.
5. Niedopłata do 2% przechodzi bez pytania (opłaty banków pośredniczących), większa wymaga świadomego potwierdzenia.

Termin realizacji liczy się od zaksięgowania wpłaty, nie od złożenia zamówienia, i tak mówi regulamin w trzech językach.

Dane rachunku żyją w zmiennych środowiskowych Railwaya: `TRANSFER_IBAN_EUR` (wymagana), `TRANSFER_BIC`, `TRANSFER_ACCOUNT_HOLDER`, `TRANSFER_BANK_NAME`. Bez pierwszej z nich backend odrzuca zamówienie przelewem, zamiast przyjąć je i zostawić klienta bez danych do zapłaty.

### Produkty i stany magazynowe

Źródłem prawdy o produkcie jest **baza**, nie repozytorium: tytuł, opis, dane techniczne, zdjęcia, cena, waga, czas wysyłki, konfiguracja personalizacji i stan magazynowy siedzą w tabeli `products`. Zmiana stanu nie wymaga wdrożenia.

Przed sprzedaniem tej samej sztuki dwa razy broni nas `product_reservations`:

| Moment | Co się dzieje |
|---|---|
| złożenie zamówienia | powstaje rezerwacja, stan **nie** schodzi |
| brak zapłaty | rezerwacja wygasa sama: 20 minut przy BLIK i pay-by-link, 3 dni robocze przy przelewie |
| potwierdzona płatność | rezerwacja zamienia się w sprzedaż, stan schodzi, rośnie `sold_count` |
| zamówienie po terminie | godzinny cron ustawia `expired` i oddaje towar do sprzedaży |

Dostępność liczy widok `product_availability`: `stock` minus suma aktywnych rezerwacji. Produkt cyfrowy ma `stock = NULL`, czyli bez limitu, i nic go nie rezerwuje.

Sprawdzenie dostępności i założenie rezerwacji idą w jednej transakcji z `SELECT ... FOR UPDATE` na wierszu produktu, więc dwa równoległe zamówienia na ostatnią sztukę ustawiają się w kolejce zamiast obydwa zobaczyć ją jako wolną. Gdy towaru zabraknie, świeże zamówienie jest kasowane, a klient dostaje `409 out_of_stock` z liczbą realnie dostępnych sztuk, zamiast linku do zapłaty za coś, czego nie wyślemy.

Endpointy: `GET /api/products`, `GET /api/products/:slug` publicznie; `PUT /api/products/:slug`, `PATCH /api/products/:slug/stock`, `PATCH /api/products/:slug/status` i `GET /api/admin/products` za nagłówkiem `X-Admin-Token`.

Schemat: `scripts/products-schema.sql`, migracje wykonują się też przy starcie backendu.

### Panel administracyjny

Wszystko, co obsługuje się ręcznie, mieszka w jednej aplikacji `admin/` (Express + EJS, osobna usługa na Railway, logowanie przez Google, dostęp po liście adresów). Zakładki: Dashboard, **Produkty**, **Kody**, **Przelewy**, Analytics, Leads, Subscribers, Chat, Email, Laser Matrix, Gems, Filamenty.

Menu siedzi w jednym pliku `admin/views/partials/header.ejs`. Wcześniej każdy widok miał własną, przepisaną ręcznie kopię i kopie się rozjechały: na jednej podstronie brakowało Emaila, na innej Filamentów, co wyglądało, jakby pozycje znikały przy klikaniu. Nowa zakładka dopisuje się teraz raz.

Trzy zakładki sklepowe nie piszą do bazy same, tylko wołają backend sklepu nagłówkiem `X-Admin-Token` (`CHAT_API_URL` i `ADMIN_API_TOKEN` w usłudze panelu). Powód: zapis ma skutki uboczne, których w samym SQL nie ma. Zmiana stanu wchodzi w rezerwacje towaru, potwierdzenie przelewu wysyła maile i przenosi pliki klienta do folderu Zamówienia.

### Kody rabatowe

Jedna tabela `discount_codes` obsługuje dwie rodziny kodów, rozróżnione wyłącznie ustawieniami.

| | Kod osobisty | Akcja |
|---|---|---|
| przykład | `AEJ10-K7QMP4` | `MATKA15` |
| ile użyć | dokładnie jedno, globalnie | bez limitu albo z pułapem |
| na osobę | nie dotyczy | domyślnie raz na adres e-mail |
| termin | zwykle 90 dni | okno akcji (Dzień Matki, Black Friday) |
| jak powstaje | panel, pojedynczo albo paczką do 200 sztuk | panel, własne hasło |

Kod niesie: rodzaj (procent do 80 albo kwota w groszach), zakres (`all`, `products`, `services`, `jewelry`, `studio`), minimalną wartość zamówienia, limit użyć łącznie, limit na adres e-mail, okno czasowe, nazwę akcji, komu wręczony i notatkę wewnętrzną.

**Zniżka nigdy nie obejmuje wysyłki.** Dwadzieścia procent od kuriera zjada nasz koszt, a nie marżę. Liczy się wyłącznie od pozycji objętych zakresem kodu, zaokrąglana w dół, i nigdy nie przekracza wartości tych pozycji.

**Jednorazowość bez kont.** Bez rejestracji nie da się zagwarantować, że ta sama osoba nie użyje kodu akcji z drugiego adresu. Da się natomiast to, co realnie potrzebne: kod osobisty jest jednorazowy naprawdę (limit liczy się globalnie, nie na osobę), a kod akcji nie da się zmielić dziesięć razy z jednej skrzynki. Sprawdzenie limitu i zapis użycia idą w jednej transakcji z blokadą wiersza kodu, więc dwa zamówienia złożone w tej samej sekundzie nie wykorzystają tego samego kodu jednorazowego.

**Kod rezerwuje się przy zamówieniu, a zużywa przy zapłacie**, dokładnie jak towar. Porzucony koszyk nie spala kodu. Przy przelewie kod trzyma się te same 3 dni robocze co cena i rezerwacja towaru, więc klient dostaje jedną datę, a nie trzy.

Kwota rabatu jest liczona po stronie serwera dwa razy: przy podglądzie w kasie i jeszcze raz przy składaniu zamówienia. Rozbieżność przerywa zamówienie zamiast wystawić inną kwotę niż widział klient. `orders.discount_code` i `orders.discount_grosze` zostają na zamówieniu, więc kwotę da się odtworzyć po latach bez zaglądania do tabeli kodów.

Kod wystawiony przy zapisie do newslettera trafia też do kolumny `subscribers.discount_code`, więc w zakładce Subscribers widać, kto jaki kod dostał. Kolumna miała wcześniej domyślną wartość `AEJACA10` z czasów jednego wspólnego kodu i wpisywała ją każdemu nowemu zapisowi, mimo że mail niósł już inny kod. Domyślna wartość została usunięta.

**Kod powitalny z newslettera** wystawia `POST /api/discounts/welcome`, wołany przez przepływ n8n, który wysyła maila (nagłówek `X-Newsletter-Token`, sekret w `NEWSLETTER_CODE_TOKEN`). Kod osobisty, 10%, ważny 90 dni. Powtarzalny: drugi zapis tym samym adresem oddaje ten sam kod, zamiast rozdawać kolejne.

Panel: zakładka **Kody** w aplikacji AEJaCA Admin. Lista z liczbą użyć, rezerwacji w toku i sumą udzielonych rabatów, tworzenie akcji, generowanie paczki kodów osobistych, włącznik i kasowanie.

Kasować wolno wyłącznie kod, którego nikt jeszcze nie użył i który nie ma rezerwacji w toku, czyli pomyłkę albo pozycję testową. Kod z historią stoi za kwotą na czyimś zamówieniu i skasowany zostawiłby rabat, którego nie da się już wytłumaczyć, więc taki się wyłącza. Przycisk kasowania po prostu nie pojawia się przy kodach z historią, a backend odmawia z `409 already_used` także wtedy, gdy ktoś spróbuje z pominięciem panelu.

Schemat: `scripts/discounts-schema.sql`, migracje wykonują się też przy starcie backendu.

### Kasa: dane zamawiającego, paczkomat, płatność (2026-08-03)

**Wymagany komplet danych: adres e-mail, imię i nazwisko, numer telefonu.** Wcześniej wymagany był sam adres e-mail, więc do zamówienia przechodził numer `2342342342342rrrr` i imię bez nazwiska. Kurier dzwoni przed doręczeniem, InPost wysyła numerem kod odbioru, a nazwisko idzie na etykietę przesyłki, więc każde z tych pól ma konkretne zastosowanie i formularz mówi wprost, jakie.

Reguły leżą w `src/shop/customerFields.js` i jadą do backendu razem z rdzeniem cenowym (`npm run sync:pricing`), więc przeglądarka i serwer uznają za poprawne dokładnie to samo. Telefon: dziewięć cyfr krajowo, zapisy `+48`, `0048` oraz numery zagraniczne z plusem (8 do 15 cyfr). Nazwisko: dwa człony, litery dowolnego alfabetu z myślnikiem i apostrofem, bez cyfr. Kontrola w przeglądarce jest uprzejmością, obowiązuje ta na serwerze (`400 customer_invalid` z listą pól).

**Kiedy pokazujemy błąd.** Po wyjściu z pola albo po kliknięciu „Zapłać", nigdy w trakcie pisania. Zieleń odwrotnie, od razu gdy dane są poprawne. Przycisk zapłaty jest szary, dopóki czegokolwiek brakuje, i niebieski gdy komplet jest poprawny, ale przez cały czas pozostaje klikalny: kliknięcie odsłania wszystkie braki naraz i przewija do pierwszego. Wyłączony przycisk nie mówi, czego chce.

**Paczkomat wybiera się z wyszukiwarki.** Klient wpisuje kod pocztowy albo miasto, dostaje listę punktów z adresem i opisem miejsca („przy sklepie Żabka"), wybiera kliknięciem. Zapytanie idzie przez `GET /api/lockers` w chat-api, nie z przeglądarki: polityka treści zostaje szczelna, odpowiedzi leżą godzinę w pamięci, a adres klienta nie wychodzi do InPostu przy każdym naciśnięciu klawisza. Ręczne wpisanie kodu nadal działa i włącza się samo, gdy InPost nie odpowiada.

**Wybór metody płatności.** Na wierzchu „Wybiorę na stronie płatności Autopay", BLIK i portfele, a ponad dwadzieścia banków chowa się pod jednym wierszem „Płacę z banku" z wyszukiwarką ignorującą polskie znaki. Wcześniej cała lista stała jedna pod drugą, czyli kilkanaście ekranów przewijania na telefonie, zanim dojdzie się do przycisku zapłaty. Reguła podziału siedzi w `src/components/shop/paymentGroups.js` i jest objęta testem w buildzie, bo listę kanałów oddaje bramka i zmienia się sama.

**Darmowa dostawa** w Polsce od 400 zł pokazuje się jako „Gratis" z przekreśloną ceną normalną, a nie jako „0,00 zł", które czyta się jak zepsuty cennik. Próg liczy się od wartości pozycji przed rabatem.

### Rezygnacja i kasowanie zamówień (2026-08-03)

Zakładka **Przelewy** w panelu ma przy każdym zamówieniu przycisk **Rezygnacja**: status przechodzi na `cancelled`, towar i kod rabatowy wracają do sprzedaży natychmiast, a wiersz zostaje z zapisem kto, kiedy i dlaczego. To ta sama czynność, którą wykonuje zadanie wygaszające zamówienia po terminie, tylko od ręki.

Pod listą roboczą stoi sekcja **Zamknięte bez zapłaty** (rezygnacje i zamówienia wygasłe) z przyciskiem kasowania. Kasować wolno wyłącznie zamówienie, przy którym nic się nie wydarzyło, czyli pomyłkę albo test. Blokuje dziewięć śladów: zapłata, rozliczenie, ręczne potwierdzenie przelewu, powiadomienie z bramki, zdjęcie towaru ze stanu, użycie kodu, wydane pliki, wisząca dopłata i powiązanie z wyceną. Powód odmowy panel wypisuje z nazwy. Reguła leży w `chat-api/orderCleanup.js` z testami, bo wiersz zamówienia kasuje się kaskadowo razem z pozycjami, rezerwacjami i użyciami kodu, więc skasowanie czegoś, co żyło, wymazałoby dowody.

### Zgodność prawna (audyt 2026-08-03)

Pełny zapis w `MDs/AEJaCA_Legal_Audit.md`. Rzeczy, które zmieniły treść widoczną dla klienta:

- **Mail po zakupie** dobiera pouczenie o odstąpieniu do rodzaju zamówienia i przy rzeczach z półki dołącza wzór formularza. Wcześniej odbierał prawo odstąpienia każdemu, także tym, którym przysługuje.
- **Polityka Prywatności** napisana od nowa, 11 sekcji w trzech językach, z podstawami prawnymi, odbiorcami i okresami przechowywania. Okresy egzekwuje zadanie `chat-api/retention.js`, więc zmiana terminu w polityce wymaga zmiany także tam.
- **Strona Zwroty** zgodna z Regulaminem (bieg 14 dni od otrzymania oświadczenia, zwrot kosztu najtańszej dostawy) i ze wzorem formularza do skopiowania.
- **Opinie Google** opatrzone informacją, skąd pochodzą i czego o nich nie wiemy. Po dyrektywie Omnibus prezentowanie opinii bez takiej informacji jest praktyką wprowadzającą w błąd.
- **Okno czatu** informuje przed pierwszą wiadomością o zapisie na 12 miesięcy i o dostawcy spoza EOG.
- **Przycisk zamówienia** brzmi „Kupuję i płacę" albo „Zamawiam z obowiązkiem zapłaty przelewem", bo ustawa wymaga oznaczenia wskazującego wprost na obowiązek zapłaty.
- **Historia cen produktów** (`product_price_history`) zapisywana przy każdej zmianie ceny, a panel produktów pokazuje kolumnę „Min. 30 dni". Karta produktu i strona produktu **same** wystawiają „Najniższa cena z 30 dni przed obniżką", gdy cena bieżąca spadnie poniżej najwyższej z okna porównawczego, i milczą, gdy obniżki nie ma. Pozycja w sprzedaży krócej niż 30 dni dostaje zdanie „Najniższa cena od rozpoczęcia sprzedaży". Reguła: `src/shop/priceHistory.js`, testy w budowaniu.
- **Dane kupujących**: po 6 latach od zapłaty zamówienie traci imię i nazwisko, telefon, adres i skrót IP, a adres e-mail zostaje zastąpiony adresem w domenie `.invalid`. Kwoty, daty i numer zostają, bo dokument sprzedaży musi przetrwać. Surowe komunikaty od bramki czyszczone po 12 miesiącach. Całość w `chat-api/retention.js`, terminy jeden do jednego z sekcją 3 Polityki Prywatności.
- **Analityka nie zapisuje niczego w przeglądarce**, a kontrola w budowaniu (`scripts/check-browser-storage.mjs`) wymaga uzasadnienia dla każdego miejsca sięgającego do pamięci urządzenia. Dołożenie narzędzia innej firmy zatrzyma budowanie.

### Bezpieczeństwo (audyt 2026-08-03)

Pełny zapis w `MDs/AEJaCA_Security_Audit.md`: przegląd chat-api, panelu, integracji Autopay, kodów rabatowych, nagłówków i zależności, razem z pięcioma etapami napraw i uzasadnieniem decyzji. Najważniejsze zmiany, które dotykają sklepu: limity zapytań na sprawdzaniu kodu rabatowego i składaniu zamówień, najwyżej dwie rezerwacje towaru naraz z jednego adresu, kody rabatowe losowane generatorem kryptograficznym oraz kontrola danych zamawiającego po stronie serwera.

#### Droga produktu do koszyka

Przycisk na karcie dokłada pozycję do tego samego koszyka, co usługi. Ta sama rzecz dołożona drugi raz podbija ilość istniejącej pozycji, a nie tworzy drugiej, i nie da się dołożyć więcej sztuk, niż mamy na półce.

Do zamówienia idzie **sam adres pozycji** (`productSlug`) razem z ilością. Cenę, wagę i dostępność backend bierze z katalogu, więc podmiana kwoty w przeglądarce nic nie daje.

Koszyk pyta o dostępność na żywo i blokuje przejście do kasy, gdy któraś pozycja sprzedała się w międzyczasie: przy linii pojawia się „sprzedane" albo „zostało już tylko sztuk: N". Klient dowiaduje się o tym w koszyku, a nie po wypełnieniu całego formularza w kasie. Backend i tak sprawdza to jeszcze raz przy składaniu zamówienia i odmawia z `409 out_of_stock`, bo między koszykiem a płatnością mija czas.

#### Stan pozycji w ofercie

Jedno pole `products.status` zamiast kilku znaczników. Trzy osobne flagi (aktywny, widoczny, wyprzedany) dawałyby osiem kombinacji, z czego połowa nie znaczy nic, a pytanie "czy klient to kupi" wymagałoby sprawdzenia trzech pól w każdym miejscu.

| Stan | W sklepie | Można kupić | Po co |
|---|---|---|---|
| `draft` | nie | nie | przygotowywany, nigdy nie był wystawiony |
| `live` | tak | tak, jeśli są wolne sztuki | normalna sprzedaż |
| `sold_out` | tak, z plakietką "wyprzedany, będzie ponownie" | nie | sprzedany poza sklepem, wróci na półkę |
| `hidden` | nie | nie | chwilowo zdjęty, np. do poprawki zdjęć |
| `retired` | nie | nie | wycofany na stałe |

**Sprzedane na Etsy albo na miejscu**: jedno kliknięcie w panelu, skutek natychmiast, bez wdrożenia. Karty pytają o dostępność na żywo, więc `sold_out` od razu gasi przycisk zakupu i zostawia plakietkę, a `hidden` i `retired` zdejmują kafelek z listy. Strona produktu zostaje (bywa w zakładkach i w wynikach wyszukiwania), ale mówi wprost, że pozycji nie ma, i oddaje `Discontinued` w danych strukturalnych.

`sold_out` nie rusza stanu magazynowego, bo rzecz nadal fizycznie leży, tylko jest już czyjaś. Własna sprzedaż zdejmuje sztuki sama, więc tam wystarcza `stock`.

Rezerwacja przy zamówieniu wymaga `live`, więc pozycji zdjętej ze sprzedaży nie da się kupić także ze starej, otwartej karty ani z pominięciem sklepu.

Dawna kolumna `active` została, ale niczym już nie steruje: wylicza się ze stanu wyzwalaczem, żeby zapytanie napisane ręcznie w bazie nie mogło rozjechać się z tym, co widzi sklep.

#### Podkategorie i ikony

Dwa działy to za grube sito, więc każdy produkt ma podkategorię (`products.subcategory`). Ona rysuje ikonę na karcie, buduje filtr nad listą i dzieli listę na półki. Definicja w jednym miejscu: `src/data/shopFacets.js`, zgodna z ograniczeniem w bazie.

| Dział | Podkategoria | Ikona | Dlaczego ta ikona |
|---|---|---|---|
| Biżuteria | Damska | Venus | przyjęty znak płci, czytelny bez podpisu |
| Biżuteria | Męska | Mars | j.w. |
| Biżuteria | Dla zwierząt | PawPrint | łapa, jedyny oczywisty znak w tym zestawie |
| sTuDiO | Druk FDM | Layers | druk warstwa po warstwie |
| sTuDiO | Druk żywiczny MSLA | Sun | utwardzanie światłem |
| sTuDiO | Laser CO2 | Flame | wiązka wypala materiał |
| sTuDiO | Laser fiber | Zap | impuls znakujący metal |
| sTuDiO | Żywica | Droplets | materiał lany |
| sTuDiO | Cyfrowy | Download | nic nie wysyłamy, plik idzie mailem |

Usługi mają własny podział, bo pytanie brzmi tam inaczej: nie "dla kogo", tylko "czym to wykonujemy". Pięć wartości: **Druk 3D** (Layers), **Laser** (Zap, cała rodzina CO2 i fiber razem, bo maszynę do materiału dobieramy my), **Żywica** (Droplets), **Jubilerstwo** (Gem), **Projektowanie** (FileCode).

#### Wyszukiwarka i filtry

Nad wszystkimi trzema sekcjami stoi jedno pole wyszukiwania. Szuka po tytule, zajawce, opisie i adresie pozycji w aktywnym języku, wymaga wystąpienia wszystkich słów zapytania, i obejmuje produkty, personalizacje oraz usługi naraz. Klient szukający "grawer" nie wie z góry, czy odpowiedzią jest gotowa wizytówka, personalizacja czy usługa, więc nie powinien szukać trzy razy.

Filtry stoją nad każdą listą osobno i pokazują wyłącznie wartości obecne w tej liście, razem z liczbą pozycji. Filtr prowadzący do pustej listy jest gorszy niż jego brak, bo wygląda jak awaria. Przy jednej wartości pasek znika.

Bez wybranego filtru lista dzieli się na półki po podkategorii, z nagłówkiem i ikoną. Po wybraniu filtru grupowanie znika, bo klient sam już zawęził. Pozycje bez podkategorii trafiają do grupy "Pozostałe" i nigdy nie wypadają z listy.

#### Panel produktów

Zakładka **Produkty** w aplikacji AEJaCA Admin (`admin/`, logowanie przez Google). Tabela obejmuje **wszystkie** pozycje, także zdjęte ze sprzedaży: miniatura, tytuł, dział z podkategorią i ikoną, rodzaj oferty, cena, stan, rezerwacje, dostępność, licznik sprzedanych i wybór stanu pozycji. Do tego szukanie po nazwie i adresie oraz filtr "poza sprzedażą".

Od ręki robi się tu dwie rzeczy, bo są codzienne: korekta stanu (`PATCH /api/products/:slug/stock`) i zmiana stanu pozycji (`PATCH /api/products/:slug/status`). Panel administracyjny nie pisze do bazy sam, tylko woła te endpointy backendu sklepu, gdzie siedzą reguły, więc istnieje jedna ich implementacja. Pięć stanów leży na wierzchu jako przyciski, bez rozwijanej listy, bo rzecz sprzedana na Etsy ma zejść ze sprzedaży jednym kliknięciem, a nie dwoma. Obie zmiany działają w sklepie natychmiast, bo karty pytają o dostępność na żywo. Zmiana treści, ceny albo zdjęć idzie przez `PUT /api/products/:slug` i wymaga jeszcze `npm run products:pull` oraz wdrożenia.

#### Zdjęcia produktów

Baza trzyma **ścieżki**, pliki leżą w repozytorium pod `/public/img/shop/`. Wybór świadomy: zdjęcia produktowe zmieniają się rzadko, a serwowane z tej samej domeny co strona ładują się szybciej niż z zewnętrznego dysku, co przy sklepie przekłada się na sprzedaż i pozycję w wyszukiwarce.

Zasady, pilnowane przez `scripts/check-shop-images.mjs` w buildzie i przez walidację w `PUT /api/products/:slug`:

| Reguła | Wartość |
|---|---|
| liczba zdjęć na produkt | od 1 do 5 |
| ścieżka | zaczyna się od `/img/`, plik musi istnieć w repozytorium |
| waga pliku | ostrzeżenie powyżej 200 kB, **błąd budowania** powyżej 400 kB |
| format | webp (inne przechodzą z ostrzeżeniem) |

Karta produktu pokazuje duże zdjęcie wybrane, a pod nim miniatury pozostałych.

#### Katalog w repozytorium: odcisk bazy

Strony sklepu są budowane statycznie i każda karta produktu musi istnieć jako plik, więc katalog wchodzi do repozytorium jako odcisk bazy: `src/data/products.generated.js`, plik generowany, nie edytujemy go ręcznie. Zdjęcia i tak wymagają wdrożenia, więc odcisk i pliki idą jednym commitem.

Kolejność przy zmianie asortymentu:

1. produkt w bazie (panel albo `PUT /api/products/:slug`), zdjęcia do `/public/img/shop/`
2. `npm run products:pull` (odcisk katalogu)
3. `npm run sitemap:shop` (adresy kart produktów)
4. `npm run build`, commit, push

Stan magazynowy z odcisku jest tylko punktem wyjścia: strony sklepu i karta produktu dopytują `/api/products` na żywo (`src/shop/availability.js`), więc sprzedana sztuka przestaje zachęcać do zakupu, nie czekając na kolejne wdrożenie.

Dane startowe do pustej bazy: `src/data/productSeed.js` plus `npm run products:seed` (pozycje trafiają tam jako ukryte, chyba że dodasz `--activate`).

### Tryb jasny: kontrola w buildzie

Tryb jasny nie działa przez warianty `dark:`, tylko przez listę nadpisań w `src/index.css` (`[data-theme="light"] .klasa`). Klasa spoza tej listy zostaje w kolorze przeznaczonym na czarne tło, więc jasny tekst na kremowym tle po prostu znika. Zdarzyło się to dwa razy i za każdym razem wyszło dopiero ze zrzutu ekranu.

`scripts/check-light-theme.mjs` wywala build w dwóch sytuacjach. Pierwsza: jasny tekst (odcienie 50-300) albo ciemne tło panelu (700-950) bez nadpisania. Druga: klasa `hover:` bez własnej reguły na elemencie, którego stan podstawowy nadpisanie ma. Nadpisania niosą `!important`, więc taki hover nigdy nie zadziała i element w trybie jasnym wygląda tak samo z kursorem i bez niego. Tak zniknęło podświetlenie kafelka opinii Google. Gradienty i czerń z przezroczystością są pomijane, bo to przyciemnienia zdjęć, które mają wyglądać tak samo w obu trybach. Świadome wyjątki, na przykład ciemny przycisk z białym tekstem, leżą w `scripts/light-theme-allow.json` i każdy musi mieć uzasadnienie.

Uruchomienie osobno: `npm run check:light`.

### Linkowanie narzędzi

Zasada: treść, która dotyka tematu obsłużonego narzędziem, prowadzi do tego narzędzia. Mapowanie leży w `src/data/toolLinks.js`, renderuje je `src/components/ToolLinks.jsx`, a korzystają z niego wpisy blogowe, hasła słownika, sklep, karty usług, strona B2B oraz sekcje pod oboma kalkulatorami.

Stan przed wprowadzeniem zasady i po, mierzony na zbudowanym serwisie (odnośniki do konkretnych narzędzi, bez hubów):

| Grupa stron | Przed | Po |
|---|---|---|
| Wpis blogowy (19) | 0,21 | 1,63 |
| Hasło słownika (30) | 0,03 | 1,37 |
| Strona sklepu (16) | 0,75 | 2,12 |
| B2B | 0 | 7 |

Siedem z dziewięciu narzędzi miało dokładnie dwie strony przychodzące: hub narzędzi i siebie samo. Były zbudowane, opisane w mapie witryny i dla czytelnika praktycznie nieistniejące. Po zmianie najmniej linkowany jest kalkulator blanku obrączki (5 stron), co jest w porządku, bo to narzędzie czysto warsztatowe.

Pole `audience` rozdziela odbiorców: `buyer`, `maker`, `both`. Sklep pokazuje wyłącznie narzędzia dla kupującego, B2B odwrotnie, bo po drugiej stronie siedzi pracownia. Dwa wpisy blogowe (projektowanie z AI, warsztat od kuchni) celowo nie mają przypisanych narzędzi.

### Karta podarunkowa: ODŁOŻONA

Zbudowana i **wycofana z kodu 2026-08-05**, bez wdrożenia. Powód: temat okazał się grząski
(bon VAT, klauzule abuzywne, zobowiązanie w księgach) i przy braku sygnału o popycie nie był wart
zaangażowania. Nic z pracy nie przepadło.

Całość leży w `parked/gift-card/`: kod strony, moduł API, schemat bazy, testy, sekcja 7a regulaminu
w trzech językach, wiedza asystenta, wpisy do `llms.txt` i pełny opis konstrukcji razem z
przeglądem rynku. `parked/gift-card/README.md` zawiera listę kroków do wznowienia.

**Trzy ustalenia z tamtej pracy, które warto pamiętać niezależnie od karty:**

1. Klauzula o przepadku niewykorzystanych środków po terminie ważności jest w Polsce uznawana za
   **niedozwoloną** (SR w Słupsku 6.03.2020, SR dla Warszawy-Mokotowa 2022) i za bezpodstawne
   wzbogacenie. Dotyczy każdego bonu, nie tylko karty podarunkowej.
2. Bon na ofertę mieszaną (towary i usługi o różnych stawkach) to **bon różnego przeznaczenia**,
   więc VAT rozlicza się przy realizacji, nie przy sprzedaży. Nadal do potwierdzenia z księgową.
3. Strażnik `check-terms-parity` powstał przy tej pracy i **zostaje w buildzie**, bo pilnuje
   całego regulaminu, a nie samej karty.

---

### Pozostali strażnicy w buildzie

| Strażnik | Czego pilnuje | Skąd się wziął |
|---|---|---|
| `scripts/check-reveal.mjs` | klasa `reveal` bez `ref` z `useScrollReveal()` | trzy bloki na `/shipping/` były trwale niewidoczne, w tym obowiązkowa informacja o cle i sekcja FAQ odbijana w schemacie `FAQPage` |
| `scripts/check-emdash.mjs` | długie myślniki (U+2014) i ich encja HTML w całym repozytorium | jednorazowe sprzątanie objęło 2720 znaków w 234 plikach; bez strażnika wracają, bo w kodzie źródłowym nikt ich nie widzi aż do publikacji |
| `scripts/check-tool-links.mjs` | klucze `TOOLS_BY_POST` i `TOOLS_BY_TERM` wskazujące na realne slugi i hasła, komplet tłumaczeń pl/en/de, dozwolone `audience` | trzy klucze wskazywały na nieistniejące slugi, a fallback po cichu podstawiał domyślne narzędzia, więc trzy wpisy zgubiły odnośnik do wyceny metalu przy zielonym buildzie |
| `scripts/test-printability.mjs` | analiza modeli: topologia, objętość, grubość ścianek, nawisy, gabaryty, progi dysz | błędy w geometrii są ciche; źle policzona grubość nie wywala niczego, tylko zapewnia klienta, że model się wydrukuje, a klient dostaje odpad |
| `scripts/test-model-handoff.mjs` | przeniesienie modelu z bramki na stronę analizy oraz skala, w której analizujemy siatkę | werdykt policzony na oryginale zamiast na zamawianej wielkości wygląda tak samo jak prawdziwy; model zmniejszony o połowę ma o połowę cieńszy mur |
| `scripts/test-print-consent.mjs` | pokwitowanie wady modelu: filtr ustaleń, obecność w obu wersjach maila, brak sformułowań o zrzeczeniu się praw | dokument jest jedynym śladem, na którym opiera się cała konstrukcja; klauzula o zrzeczeniu się praw byłaby nieważna i szkodliwa |
| `scripts/check-terms-parity.mjs` | te same sekcje, ustępy i punkty list w pl, en i de | regulamin żyje w trzech wersjach w jednym pliku, a dodanie sekcji tylko do jednej niczego nie wywala: build przechodzi, a dokument jest niekompletny w dwóch językach na trzy |
| `npm run lint:undef` (`eslint.undef.config.js`) | reguła `no-undef`, czyli sięganie po nazwę spoza zasięgu | odnośnik dodany do pola rozmiaru w kalkulatorze użył `lang`, którego funkcja nie przyjmowała; efekt to biała strona po przełączeniu na tryb zaawansowany, a build, prerender i wszyscy pozostali strażnicy przeszli bez słowa |

Włączona jest wyłącznie reguła `no-undef`. Pełny eslint daje w tym repozytorium ponad 1400 zgłoszeń, prawie same `react/prop-types`, więc zaszumiłby build zamiast go chronić. `eslint` i `@eslint/js` muszą trzymać tę samą główną wersję, inaczej czysta instalacja na Cloudflare wywala się na `ERESOLVE`, a build lokalny z `--legacy-peer-deps` tego nie pokaże.

### Wysyłka i cło

Strefy i ceny leżą w `src/pricing/shipping.js`, czyli w rdzeniu kopiowanym do `chat-api`. Strona `/shipping/` i kasa czytają te same liczby, więc nie mogą się rozjechać. Wcześniej były wpisane osobno i różniły się kilkukrotnie.

| Strefa | Kurier | Cena do 2 kg |
|---|---|---|
| Polska | InPost | paczkomat 16,49, kurier 19,49, od 400 zł za darmo |
| Niemcy, Czechy, Słowacja, Litwa | DHL | 100 zł |
| Pozostała UE | DHL | 140 zł |
| Europa poza UE | DHL | 190 zł |
| Ameryki | DHL / FedEx | 390 zł |
| Azja, Australia, Bliski Wschód, Afryka | DHL / FedEx | 450 zł |

Każda cena zagraniczna zawiera 10 zł obsługi nadania u brokera. Powyżej 2 kg wysyłka idzie do wyceny indywidualnej. Paczkomat działa wyłącznie w Polsce, bo międzynarodowa sieć InPost wymaga osobnej umowy.

Ceny nie pochodzą z API przewoźnika: cennik DHL i FedEx wymaga konta firmowego z umową, którego przy działalności nierejestrowanej nie ma. Tabela jest utrzymywana ręcznie i celowo konserwatywna. Struktura jest przygotowana pod podmianę na odpytanie brokera, wystarczy zastąpić `shippingGrosze`.

**Cło.** Poza Unią cło i VAT importowy nalicza kraj odbiorcy, a pobiera kurier przy doręczeniu. Nie doliczamy ich do ceny i nie wolno tego robić: nie jesteśmy agentem celnym w kraju odbiorcy, więc pobranych pieniędzy nie mielibyśmy komu przekazać. Kasa pokazuje ostrzeżenie przy każdym kraju spoza UE, a regulamin mówi to samo w trzech językach. Do paczki dołączamy deklarację celną.

**VAT w UE.** Sprzedaż wysyłkowa do konsumentów w innych krajach UE powyżej 10 000 EUR rocznie oznacza rejestrację w OSS i VAT kraju odbiorcy. Limit działalności nierejestrowanej (~43 000 zł rocznie) uderza wcześniej, więc dziś to nie dotyczy, ale wymaga potwierdzenia u księgowej przed rejestracją działalności.

Koszt wysyłki liczy **backend**, z kraju i metody. Przyjęcie kwoty od przeglądarki pozwalałoby zamówić paczkę do Australii za cenę paczkomatu.

### Limit kwartalny w kodzie

`checkQuarterlyLimit` blokuje przyjęcie płatności przy **10 613,50 PLN**, czyli 200 zł przed progiem 10 813,50 PLN, żeby zamówienie w locie nie przebiło limitu działalności nierejestrowanej. Widok `quarterly_revenue` w bazie pokazuje obrót narastająco.

### Pliki klienta i podgląd modelu

Przyjmujemy **STL, OBJ i 3MF**. To formaty siatkowe, więc objętość i gabaryty liczy ten sam kod po obu stronach (`src/pricing/mesh.js`, kopiowany do `chat-api/pricing/`). `scripts/test-mesh-formats.mjs` sprawdza przy każdym buildzie, że ten sam sześcian zapisany w trzech formatach daje identyczną objętość, razem z przeliczeniem jednostek deklarowanych w 3MF (mikron, mm, cm, cal, stopa, metr).

STL i OBJ nie zapisują jednostki, więc czytamy je jako milimetry. `assertPlausibleScale` odrzuca modele poniżej 0,5 mm i powyżej 2 m z prośbą o sprawdzenie eksportu, bo eksport z programu ustawionego na metry dałby cenę tysiąc razy za wysoką.

**STEP** nie jest siatką, tylko opisem powierzchni, i wymaga tesselacji jądrem CAD. Do czasu wdrożenia idzie ścieżką wyceny indywidualnej.

Wgrany model pokazujemy jako **obracający się podgląd 3D** (`STLViewer.jsx`, three.js ładowany leniwie). Po chwili obrotu komponent robi zrzut ujęcia trzy czwarte w WEBP, zrzut trafia do kolumny `uploads.thumbnail` i staje się miniaturą pozycji w koszyku oraz linkiem podglądu w mailu warsztatowym. Klient widzi własny model zamiast ikony usługi, a warsztat wie, co ma zrobić, bez otwierania Dysku.

### Trzy rodzaje oferty

Granica miedzy nimi to **ile pracy dzieli zamowienie od wysylki**. Klient czyta z tego termin i zakres swojego wplywu na wyrob, wiec granice musza byc ostre.

| Rodzaj | Co to znaczy | Przyklady | Praca |
|---|---|---|---|
| **Produkt gotowy** | lezy na polce, pakujemy i wysylamy | wyrob z witryny, plik do pobrania | zero |
| **Produkty personalizowane** | polprodukt lezy na polce, dopasowujemy go do klienta | kamienne podstawki pod drinki, drewniane szkatulki, deski z grawerem | minuty |
| **Usluga** | wykonujemy od nowa albo prawie od nowa | druk 3D, bizuteria, odlew, projekt CAD | godziny |

W `shopCatalog.js` rozroznia je pole `offer` (`OFFER_KIND.READY` / `PERSONALIZED` / `SERVICE`). Sekcje w sklepie ida w kolejnosci rosnacej ilosci naszej pracy, bo tak tez rosnie termin.

Personalizacja to nie to samo co usluga: przy podstawce baza istnieje i termin liczy sie w dniach, przy pierscionku nie istnieje nic i termin liczy sie w tygodniach. Wrzucenie obu do jednego worka konczy sie klientem, ktory dziwi sie, czemu grawer na gotowej desce trwa tyle co odlew.

### Produkty gotowe: chwilowo brak

Baza produktow jest pusta, wiec sklep pokazuje kafelek "Chwilowo brak produktow gotowych" z odsylaczem do uslug. Trzy dawne przykladowe wpisy leza teraz w `src/data/productSeed.js` jako dane startowe do wgrania (`npm run products:seed`) i domyslnie sa ukryte.

Sekcja produktow zostaje widoczna takze wtedy, gdy jest pusta. Milczenie czytaloby sie jak brak dzialu, a nie jak stan przejsciowy.

### Co musi byc podane, zeby pozycja trafila do koszyka

Cena policzona co do grosza nie znaczy jeszcze, ze wiadomo, co wykonac. Pozycja w koszyku ma byc gotowa do kupienia, a nie do dopytywania mailem, wiec przycisk zakupu jest nieaktywny do czasu uzupelnienia:

| Usluga | Wymog | Dlaczego |
|---|---|---|
| biżuteria (nowa, renowacja, naprawa) | **opis, min. 20 znakow** + opcjonalne zdjecie lub szkic | "pierscionek, srebro, bez kamienia" to nie jest zamowienie |
| grawer CO2, ciecie CO2, fiber | **plik projektu** (SVG, DXF, PDF) | bez rysunku nie ma czego wygrawerowac, wielkosc pola wybiera klient wyzej i to ona ustala cene |
| druk 3D, odlew zywiczny | nic ponad parametry | model albo rozmiar z listy opisuje zadanie w calosci |

Wymogi sa zapisane raz, w `src/data/orderCatalog.js` (`requiresDescription`, `requiresVector`), i czyta je zarowno konfigurator w sklepie, jak i blok zakupowy w kalkulatorze. Opis trafia do `order_items.params.description` i do maila warsztatowego jako osobna linia.

### Grawer: limity i moment przejscia na wycene

| Gdzie | Limit | Powyzej limitu |
|---|---|---|
| grawer na wyrobie (bizuteria, laser) | **30 znakow** | przycisk zakupu ustepuje miejsca odnosnikowi do wyceny |
| wieko pudelka drewnianego | **60 znakow** | jak wyzej |
| wewnetrzna strona wieka | 60 znakow, pole nieobowiazkowe | jak wyzej |

To sa **trzy niezalezne teksty**, nie jeden. Jedno zamowienie moze miec grawer na pierscionku i inny na wieku pudelka, wiec kazdy ma wlasne pole i wlasny stan. Wspolne pole kasowalo jeden tekst przy wpisywaniu drugiego.

Opis zlecenia to osobna sprawa: minimum 20 znakow, gorna granica 700. Licznik pokazuje "jeszcze X znakow", dopoki prog nie zostanie osiagniety, bo "0 / 20" czytalo sie jak limit.

Limity leza w `src/pricing/packaging.js` (`ENGRAVING_LIMITS`) i obowiazuja identycznie w sklepie i w kalkulatorze.

Tekstu **nie ucinamy w polu**. Klient widzi licznik przekroczony i zdanie wyjasniajace, ze dluzszy grawer to inne ustawienia lasera i inna kompozycja, wiec wycenia go czlowiek. Ciche skrocenie dedykacji o polowe byloby gorsze niz odmowa.

Wybranie wariantu graweru bez wpisania tresci blokuje zakup: to zlecenie, ktorego nie da sie wykonac.

### Projektowanie 3D (CAD): cennik i poprawki

Jedyna usluga, ktora dotad nie miala kalkulatora, wiec kazde zapytanie zaczynalo sie od nieodplatnego doradztwa. Teraz ma cene wiazaca zlozona z dwoch rzeczy, ktore naprawde decyduja o czasie pracy.

| Zlozonosc | Cena bazowa | Termin |
|---|---:|---|
| prosty (gladka obraczka, sygnet, powtarzalna czesc) | 500 PLN | 3 dni robocze |
| sredni (oprawy, relief, mechanizm z tolerancjami) | 750 PLN | 4 dni |
| rzezbiarski / wysoka zlozonosc | **wycena indywidualna** | ustalany |

Zakres plikow: STL bez doplaty, STL + STEP +15%, komplet z renderem i raportem wymiarowym +30%. STEP ma wlasna cene, bo to plik, z ktorym klient moze pojsc do dowolnego wykonawcy.

Prog rzezbiarski **nie ma ceny z automatu**. Przy formie organicznej czas pracy zalezy od tego, jak daleko klient ma sprecyzowany pomysl, a tego nie widac w zadnym parametrze. Ryczalt bylby albo strata, albo kwota zaporowa liczona na wszelki wypadek. Kwota 1050 PLN zostaje w kodzie jako podstawa doplat za poprawki, gdy juz wycenimy takie zlecenie recznie.

**Nie ma stawki godzinowej ani ekspresu.** Klient nie wie, ile godzin zajmuje jego pomysl, wiec kazda liczba, ktora by wybral, bylaby negocjacja od nowa. Ekspres przy jednoosobowym warsztacie oznacza przesuniecie czyjegos innego zlecenia.

**Poprawki: 2 w cenie, kazda kolejna +15% ceny bazowej** (75 / 112,50 / 157,50 PLN) i +1 dzien terminu. Klient moze dokupic je z gory albo pozniej.

**Doplata po fakcie jest platna zanim zaczniemy runde, nigdy po.** Przy dzialalnosci nierejestrowanej sciganie kogos o 90 zl kosztuje wiecej niz te 90 zl, a jedyny moment z realna dzwignia to ten, w ktorym klient czegos chce. `POST /api/orders/:ref/revision` (token administratora) tworzy zamowienie doplaty powiazane z projektem przez `parent_order_id` i zwraca link do platnosci. Dalej idzie ta sama droga co kazdy zakup.

Licznik `wykorzystane / w cenie` widnieje na stronie statusu **od poczatku**. Klient, ktory dowiaduje sie o wyczerpaniu limitu dopiero przy rachunku, czuje sie naciagniety.

**Usluga cyfrowa.** Projekt 3D ma w katalogu `digital: true`. Konfigurator nie pokazuje przy niej opakowania (nie ma czego pakowac), pozycja trafia do koszyka z rezimem `digital`, a kasa sama pomija wybor dostawy i liczy 0 zl transportu. Wystarczy ta jedna flaga, zeby cala sciezka zachowala sie poprawnie.

**Oplata projektowa zaliczana na poczet wykonania.** Klient, ktory w ciagu 90 dni zamowi u nas wykonanie zaprojektowanej rzeczy, odzyskuje cala oplate za projekt. Odliczenie jest jednorazowe, nie obejmuje dostawy i nalicza sie automatycznie przy zamianie wyceny w zamowienie. Stawka i okno czasowe siedza w `CAD_CONFIG.CREDIT_RATE` i `CREDIT_DAYS`, wiec zmiana na polowe albo wylaczenie to jedna liczba.

Sens: dla klienta, ktory naprawde zamawia, projekt jest darmowy, a dla zbierajacego darmowe koncepcje po pieciu pracowniach juz nie. Nieodplatne doradztwo zamienia sie w zaliczke.

**Regulamin, sekcja 8a** opisuje zakres uslugi, rundy poprawek, skutki nieoplacenia kolejnej rundy oraz zaliczenie oplaty. Limit kwartalny liczy sie od kwoty po odliczeniu, bo tyle realnie wplywa.

### Kiedy bizuteria dostaje cene wiazaca

Wiazaca kwota za nowy wyrob ma pokrycie tylko wtedy, gdy czas pracy jest przewidywalny. Stad dwie bramki, identyczne w sklepie i w kalkulatorze:

| Warunek | Wiazaca cena |
|---|---|
| odlew (lost wax / lost resin) + prosty ksztalt | tak |
| wykonanie reczne (lutowanie, osadzanie) | nie, wycena czlowieka |
| ksztalt sredni lub zlozony (faktura, azur, filigran, forma rzezbiarska) | nie, wycena czlowieka |
| kamienie, sploty lancuszkow, metal powierzony przez klienta | nie, wycena czlowieka |

**Przebieg przed konfiguratorem.** Na kazdej karcie uslugi sekcja "Jak to przebiega" stoi nad narzedziem konfiguracyjnym. Klient ma najpierw zrozumiec, co sie wydarzy, a dopiero potem podawac parametry: odwrotna kolejnosc kaze mu decydowac, zanim wie, o czym decyduje.

**Uwaga na dwa rozne znaczenia tego samego slowa.** Przy **bizuterii** zlozonosc jest bramka: sredni i zlozony ksztalt ida do wyceny czlowieka. Przy **projekcie 3D** zlozonosc jest progiem cenowym: podnosi kwote i pozwala normalnie zlecic prace. Oba pola nazywaja sie `complexityId`, wiec bramka jest zawezona do kalkulatora `jewelry_new`.

Zlozonosc ksztaltu bizuterii (`SHAPE_COMPLEXITY` w `jewelryConfig.js`) **nie jest mnoznikiem ceny**, tylko bramka. Naklad pracy przy ornamentowanej bryle nie wynika ani z masy, ani z metody, wiec mnozenie przez wspolczynnik byloby zgadywaniem udajacym rachunek.

### Dlaczego nie da sie kupic: lista warunkow

Wygaszony przycisk bez wyjasnienia to najgorszy mozliwy komunikat. Wczesniej powod byl jednym zdaniem drobnym drukiem i ginal, zwlaszcza przy brakujacym opisie.

`BlockedReasons` pokazuje teraz **kazdy warunek osobno**, z wlasnym znacznikiem i podpowiedzia, gdzie go spelnic. Spelnione sa przekreslone, brakujace opisane zdaniem. Ten sam komponent obsluguje konfigurator w sklepie i blok zakupowy w kalkulatorze, wiec komunikat jest identyczny niezaleznie od tego, gdzie klient stoi.

### Formaty plikow klienta

| Format | Jak liczymy | Uwagi |
|---|---|---|
| STL, OBJ | siatka trojkatow, odczyt natychmiastowy | brak jednostki w pliku, czytamy jako mm, `assertPlausibleScale` odrzuca modele ponizej 0,5 mm i powyzej 2 m |
| 3MF | siatka w archiwum ZIP | format deklaruje jednostke (mikron, mm, cm, cal, stopa, metr), przeliczamy |
| STEP, STP | tesselacja jadrem OpenCascade (WASM) | jednostka jest w pliku, modul 7 MB ladowany leniwie z `public/wasm/` |
| SVG, DXF, PDF | **nie liczymy**, zalacznik do zlecenia | cene wyznacza wybrane pole grawerowania |

`scripts/test-mesh-formats.mjs` sprawdza przy kazdym buildzie, ze ten sam szescian 20 x 10 x 5 mm zapisany jako STL, OBJ, 3MF (w trzech jednostkach) i STEP daje **identyczna objetosc i pole**. Plik STEP do testu generuje `scripts/make-step-fixture.mjs`, bo STEP opisuje bryle powierzchniami i nie da sie go zlozyc recznie w kilku linijkach.

### Droga pliku klienta

| Kiedy | Co sie dzieje |
|---|---|
| klient wybiera plik w kalkulatorze albo na karcie uslugi | idzie raz na serwer, liczymy geometrie, wraca sam identyfikator |
| dalej: koszyk, kasa, zamowienie | podrozuje wylacznie identyfikator, plik **nigdy nie jest wgrywany drugi raz** |
| rownolegle | n8n zapisuje plik na Dysku w folderze **roboczym** |
| po zaplacie (pierwszy SUCCESS z ITN) | `moveOrderFilesToOrders` prosi n8n o przeniesienie do **AEJaCA / Zamowienia / \<numer zamowienia\>** |
| po 14 dniach bez zamowienia | wpis dostaje status `abandoned` |

Folder roboczy istnieje dlatego, ze plik trafia na Dysk juz w chwili wgrania (inaczej klient czekalby na wycene), a wiekszosc wgranych plikow nigdy nie stanie sie zamowieniem. Bez tego podzialu folder Zamowienia zapelnialby sie probami wyceny.

Nieudane przeniesienie zostawia plik w folderze roboczym i nie wywraca obslugi platnosci. Link w mailu warsztatowym dziala niezaleznie od tego, w ktorym folderze plik lezy.

Przeplywy n8n: `n8n/order-file-workflow.json` (zapis) i `n8n/order-files-ready-workflow.json` (przeniesienie po zaplacie).

### Projekt jako zalacznik

Grawer CO2, ciecie CO2 i znakowanie fiber przyjmuja drugi plik: SVG, DXF albo PDF, do 15 MB. To **material do wykonania, nie podstawa wyceny**. Serwer nie liczy z niego geometrii i nigdy nie wpuszcza go do `/api/price`, bo cene wyznacza wybrane pole grawerowania albo dlugosc sciezki. Zalacznik wiszy przy zamowieniu (`uploads.order_id`), nie przy linii, i wchodzi do maila warsztatowego osobna sekcja z linkiem do Dysku.

### Kalkulator i sklep to jedno

Kalkulatory i konfigurator w sklepie wolaja ten sam rdzen z `src/pricing/` i **uzywaja tych samych nazw parametrow**, wiec nie ma miedzy nimi warstwy tlumaczacej. Roznica jest wylacznie w prezentacji: kalkulator pokazuje widelki (niepewnosc szacunku), sklep kwote wiazaca (oferte).

Pod wynikiem kazdego kalkulatora siedzi `CalcToCart.jsx`: pyta `/api/price` o kwote wiazaca i pozwala dodac konfiguracje do koszyka razem z plikiem. Kalkulator przestal byc slepa uliczka konczaca sie formularzem.

Do koszyka nie trafia to, czego nie umiemy wycenic bez czlowieka, i mowimy o tym wprost zamiast pokazywac kwote, ktora i tak bysmy poprawili:

| Blokada | Powod |
|---|---|
| wgrany SVG w laserach CO2 i fiber | cene wyznacza realna dlugosc sciezki, nie preset pola |
| bizuteria z kamieniami | dobor i osadzenie kamienia zalezy od rzeczy spoza parametrow |
| sploty lancuszkow | masa splotu zalezy od wykonania |
| metal powierzony przez klienta | trzeba ocenic material |

### Wyceny indywidualne: tabele i sciezka

`quotes` i `quote_items` (`scripts/quotes-schema.sql`) sa lustrem `orders` i `order_items`. Roznica jest jedna: **kwota moze byc pusta**, bo podaje ja czlowiek. Pusta `total_grosze` znaczy "jeszcze niczego nie obiecalismy".

| Krok | Kto | Co sie dzieje |
|---|---|---|
| 1. zapytanie | klient | `POST /api/quotes`, pozycje z parametrami, opisem i plikiem, status `new` |
| 2. wycena | AEJaCA | `POST /api/quotes/:ref/price` z kwotami per pozycja, status `priced`, wazna 14 dni |
| 3. zamowienie | AEJaCA | `POST /api/quotes/:ref/convert`, powstaje zamowienie `kind = quoted` w stanie `awaiting_payment` |
| 4. zaplata | klient | dokladnie ta sama droga co zakup ze sklepu: Autopay, ITN, maile |

Kroki 2 i 3 wymagaja naglowka `X-Admin-Token` rownego `ADMIN_API_TOKEN`. Konwersja sprawdza limit kwartalny tak samo jak sklep, wiec wycena nie przebije progu dzialalnosci nierejestrowanej.

Klient oglada wycene pod `GET /api/quotes/:ref?token=...`. Bez tokenu numer zapytania nic nie daje.

Widok `quotes_pending` pokazuje, co czeka na odpowiedz, razem z liczba pozycji i plikow.

**Czego jeszcze nie ma:** interfejsu do wpisywania kwot. Na razie robi sie to zapytaniem HTTP z tokenem administratora.

### Zapytania o wycene w bazie

Zapytanie o wycene jest zobowiazaniem tak samo jak zamowienie i musi dac sie odtworzyc po roku. Tabela `leads` (`scripts/leads-schema.sql`) trzyma teraz:

| Kolumna | Co niesie |
|---|---|
| `description` | **pelna tresc od klienta**, bez obcinania |
| `params_json` | parametry i widelki jako struktura, nie sklejony tekst |
| `upload_id` | wiersz w `uploads`: nazwa, suma kontrolna, link do Dysku |
| `quote_ref` | numer `WY20260801-XXXXXXXX` cytowany w korespondencji |
| `source` | contact, quote, chat |

Wczesniej opis byl obcinany do 400 znakow w formularzu kontaktowym i do 1000 w podsumowaniu wyceny, a plik szedl wylacznie mailem, bez zadnego sladu w bazie. Klient, ktory dokladnie opisal pierscionek, zostawial w bazie kikut.

Kolumny dopisuja sie same przy starcie serwera (`ALTER TABLE ... IF NOT EXISTS`), wiec wdrozenie nie wymaga recznej migracji.

Widok `open_quotes` pokazuje zapytania czekajace na odpowiedz, od najstarszego.

### Schemat bazy

`scripts/orders-schema.sql`: `orders`, `order_items`, `products`, `downloads`, `payment_notifications`, widok `quarterly_revenue`. Parametry wejściowe wyceny zapisujemy razem z wynikiem, żeby dało się odtworzyć cenę po latach. Surowe komunikaty ITN trafiają do bazy, bo bez nich reklamacja płatności to słowo przeciwko słowu.

---

## 10a. STATUS PRAWNY, PŁATNOŚCI I REGULAMIN (od 2026-07-29)

### Forma prowadzenia działalności

**Działalność nierejestrowana** (art. 5 ust. 1 Prawa przedsiębiorców), prowadzona przez Artura Hebenstreita pod marką AEJaCA. **Brak NIP i REGON**, identyfikatorem podatkowym jest PESEL. Zwolnienie z VAT, dokumentem sprzedaży jest **rachunek**, nie faktura VAT.

Plan: formalna spółka po osiągnięciu przychodu uzasadniającego rejestrację. Do tego czasu obowiązuje miesięczny limit przychodu, który jest warunkiem brzegowym planu sklepu i planu przepustowości.

Konsekwencje operacyjne, o których trzeba pamiętać:
- polskie katalogi firm (Panorama Firm, ALEO, pkt.pl) identyfikują podmiot po NIP-ie, więc są dla nas **niedostępne**
- większość bramek płatniczych (PayU, Przelewy24, Tpay) wymaga zarejestrowanej działalności

### Płatności

Operator: **Autopay S.A.**, ID serwisu 218869, podpis SHA256. Klucz wyłącznie w zmiennych środowiskowych backendu, nigdy w repozytorium.

- Dostępne: **BLIK, szybki przelew online (PBL), przelew tradycyjny**
- Niedostępne: **karta płatnicza, Apple Pay, Google Pay**
- Waluta rozliczeniowa: **PLN**

Podział rynków: Polska przez sklep na aejaca.com, zagranica przez Etsy (własne płatności Etsy). PayPal jako opcja dopiero po rejestracji spółki.

### Dane podmiotu w kodzie

Jedno źródło prawdy: **`src/data/sellerInfo.js`**. Po rejestracji spółki zmienia się ten jeden plik, nie komponenty.

**Otwarty punkt:** brak pełnego adresu do korespondencji. Adres pracowni jest adresem prywatnym i nie jest publikowany. Przed uruchomieniem sprzedaży potrzebna skrytka pocztowa w Piasecznie. Flaga `hasFullPostalAddress: false` w `sellerInfo.js`.

### Regulamin

Strona **`/terms/`** (`src/pages/Terms.jsx`, treść w `src/data/termsContent.js`), trójjęzyczna, 17 sekcji, obowiązuje od 2026-08-26. Wersja polska wiążąca.

Sekcje wykraczające poza typowy wzór, bo dopasowane do naszej technologii:
- **§ 10**, wyłączenie prawa odstąpienia dla rzeczy nieprefabrykowanej wykonanej według specyfikacji konsumenta, z wyliczeniem pięciu naszych przypadków (wydruk z pliku klienta, grawer, biżuteria na projekt, kamienie na życzenie, usługa projektowa)
- **§ 12**, prawa do plików klienta, odmowa realizacji broni i zabezpieczeń, przekazanie pliku STL/STEP przy usłudze projektowej wraz z prawem do użycia u innego wykonawcy
- **§ 13**, właściwości technologiczne, które nie są wadą: odchyłki do 0,5 mm dla FDM i 0,2 mm dla żywicy, widoczna struktura warstw, ślady podpór, różnice odcienia między partiami, inkluzje kamieni naturalnych

**Trzy nowe ustępy (od 2026-08-26):**
- W sekcji „Zawarcie umowy": podsumowanie wysyłane mailem stanowi zapis uzgodnionej specyfikacji.
- W sekcji „Właściwości technologiczne, które nie są wadą": Serwis wskazuje sposób usunięcia
  właściwości modelu (naprawa pliku) zanim poprosi o potwierdzenie zamówienia bez zmian.
- W tej samej sekcji: wymiarem wiążącym jest wymiar do realizacji zaakceptowany przez Klienta,
  wraz z zasadą odczytu jednostki plików STL i OBJ (brak jednostki w formacie, odczyt jako
  milimetry).

Dokumenty powiązane bez zmian: `/returns/`, `/warranty/`, `/shipping/`, `/privacy/`.

**Zastrzeżenie:** regulamin napisany bez udziału prawnika. Przed uruchomieniem prawdziwej sprzedaży wymaga przeglądu przez osobę z uprawnieniami.

---

## 11. OPINIE GOOGLE (24 recenzje, 5.0/5.0)

| Imię | Ocena | Data | Treść |
|------|-------|------|-------|
| Renata Strzerzysz | 5★ | 2026-06-29 | "Świetny kontakt, profesjonalne podejście do klienta. Propozycja wzoru pierścionka była idealna. Bardzo szybka realizacja zamówienia. Nic dodać, nic ująć. Gorąco polecam !!!" |
| Ika Ryczkowska | 5★ | 2026-06-05 | "Biżuteria oryginalna, niepowtarzalna. Polecam, miło mieć coś nietuzinkowego." |
| Paweł Kołaszewski | 5★ | 2026-03-16 | "Świetny sklep z biżuterią - możliwość graweru i druku 3D pozwala stworzyć naprawdę wyjątkowe, spersonalizowane projekty. Profesjonalna obsługa, wysoka jakość wykonania i szybka realizacja zamówienia sprawiają, że z czystym sumieniem polecam to miejsce." |
| Andrzej Ryczkowski | 5★ | 2026-03-15 | "Bursztyn, srebro ... Wszystko pięknie" |
| Martin Sabaranski | 5★ | 2026-03-14 | "Pełen profesjonalizm. Polecam" |
| Krzysztof Kapica | 5★ | 2026-03-13 | "Super sprawa ;)" |
| Alicja Wiśniewska | 5★ | 2026-03-12 | "Cuda! 🤩" |
| Natalia Mietlicka-Szymańska | 5★ | 2026-03-11 | "Super!" |
| Krzysztof Haczynski | 5★ | 2026-03-10 | "Super" |
| Artur Hebenstreit | 5★ | 2026-02-15 | "Highly recommend!" |

Pozostałe 14 recenzji: ocena 5★ bez tekstu

---

## 12. KLUCZOWE PRZEKAZY COPYWRITERSKIE

### Strona główna
- H1: "Noś to, co znaczące. Drukuj to, czego nie ma w sklepie."
- Sub: "Biżuteria i przedmioty projektowane pod Ciebie, od pomysłu do gotowego."

### Biżuteria
- "Gdzie Sztuka Spotyka Rzemiosło"

### Studio
- "Innowacja Spotyka Precyzję"

### Narzędzia
- "Wiedza otwarta / Narzędzia dla Makerów"
- "Parametry to teoria, wykonanie to nasza specjalność."
- "Cyfrowa fabrykacja stała się dostępna, ale wiedza o parametrach wciąż bywa strzeżona. Udostępniam te narzędzia, bo uważam, że społeczność makerów rośnie, gdy wiedza jest otwarta."

### Footer
- "Artisan Elegance Jewelry and Crafted Art. Gdzie rzemiosło spotyka technologię."

---

## 13. REGUŁY WYŚWIETLANIA CEN

- `lang === "pl"`: ceny w PLN (złoty polski)
- `lang === "en"` lub `lang === "de"`: ceny w EUR
- Przelicznik: `eur = pln / 4.28` (fallback stały; live: kurs NBP z `/api/market-rates`)
- W kalkulatorze: cena główna w walucie aktywnej, cena pomocnicza (mniejsza) w drugiej walucie
- B2B: ceny netto (dla "en"/"de" ekwiwalent net)

---

## 14. SKALOWANIE I PLANY ROZWOJU

### Zrealizowane etapy (stan na 2026-07-17)
- Etap 1: Kalkulator MSLA z 13 żywicami + obrazki segmentów
- Etap 2: Zaktualizowane komunikaty biżuterii (lost-resin 16K, filigran od 0.2 mm)
- Etap 3: Strona B2B (/b2b/, 62. strona serwisu)
- Etap 4+5: Narzędzie Shrinkage (/toolstudio/shrinkage/), 2 posty blogowe (lost-resin, figurki 16K), 4 terminy słownikowe -> 69 stron
- Etap 6: Sync llms.txt / context.js / robots / sitemap
- Dodatki: Elegoo Saturn 4 Ultra 16K w sekcji Sprzętu, sekcja Jubilerstwo (8 maszyn), fix GSC aggregateRating Product schemas
- Narzędzie MSLA resin-settings (/toolstudio/resin-settings/) -> 70 stron

### Odroczone / planowane
- Stawki per gram dla odlewu B2B (filar 3): "wycena wg wagi w 24h" (do ustalenia)
- Panel admina bazy żywic (analogiczny do filamentów) - Opcja B: PostgreSQL + API (warunkowo)
- Obiekty `review` w schematach Product (GSC sugeruje; aggregateRating już naprawione)
- Galeria/portfolio realizacji

---

## 15. ASYSTENT AI (CHATBOT)

Wbudowany chatbot na stronie, oparty o:
- Własny endpoint `chat-api/context.js` (system prompt ~747 linii)
- Obsługa kalkulacji inline (łańcuszek, msla, fdm, epoxy)
- Przekierowanie do odpowiednich narzędzi wg zapytania
- Znajomość pełnej oferty, cen, godzin pracy
- Trilingual (pl/en/de)
- Dwa tryby: klientowski (biżuteria/studio) i B2B

---

*Dokument odzwierciedla stan serwisu aejaca.com z 2026-08-03.*
*Repozytorium: ArturHebenstreit/aejaca-site, gałąź claude/fix-api-error-oge1r*
