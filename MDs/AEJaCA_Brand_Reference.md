# AEJaCA - Kompletny dokument referencyjny marki
*Wygenerowano: 2026-08-02 | Wersja: 2.3*

---

## 1. TOŻSAMOŚĆ MARKI

### Pełna nazwa
**AEJaCA** - Artisan Elegance Jewelry and Crafted Art

### Tagline / slogan
- PL: "Noś to, co znaczące. Nie to, co seryjne."
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

Dostawa: paczkomat InPost 15,90 PLN, kurier 24,90 PLN, odbiór osobisty 0 PLN.

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

**Kod powitalny z newslettera** wystawia `POST /api/discounts/welcome`, wołany przez przepływ n8n, który wysyła maila (nagłówek `X-Newsletter-Token`, sekret w `NEWSLETTER_CODE_TOKEN`). Kod osobisty, 10%, ważny 90 dni. Powtarzalny: drugi zapis tym samym adresem oddaje ten sam kod, zamiast rozdawać kolejne.

Panel: zakładka **Kody** w aplikacji AEJaCA Admin. Lista z liczbą użyć, rezerwacji w toku i sumą udzielonych rabatów, tworzenie akcji, generowanie paczki kodów osobistych, włącznik. Kodu nigdy nie kasujemy, tylko wyłączamy, bo historia użyć ma zostać.

Schemat: `scripts/discounts-schema.sql`, migracje wykonują się też przy starcie backendu.

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

### Wysyłka i cło

Strefy i ceny leżą w `src/pricing/shipping.js`, czyli w rdzeniu kopiowanym do `chat-api`. Strona `/shipping/` i kasa czytają te same liczby, więc nie mogą się rozjechać. Wcześniej były wpisane osobno i różniły się kilkukrotnie.

| Strefa | Kurier | Cena do 2 kg |
|---|---|---|
| Polska | InPost | paczkomat 15,90, kurier 24,90, od 400 zł za darmo |
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

Strona **`/terms/`** (`src/pages/Terms.jsx`, treść w `src/data/termsContent.js`), trójjęzyczna, 17 sekcji, obowiązuje od 2026-07-29. Wersja polska wiążąca.

Sekcje wykraczające poza typowy wzór, bo dopasowane do naszej technologii:
- **§ 10**, wyłączenie prawa odstąpienia dla rzeczy nieprefabrykowanej wykonanej według specyfikacji konsumenta, z wyliczeniem pięciu naszych przypadków (wydruk z pliku klienta, grawer, biżuteria na projekt, kamienie na życzenie, usługa projektowa)
- **§ 12**, prawa do plików klienta, odmowa realizacji broni i zabezpieczeń, przekazanie pliku STL/STEP przy usłudze projektowej wraz z prawem do użycia u innego wykonawcy
- **§ 13**, właściwości technologiczne, które nie są wadą: odchyłki do 0,5 mm dla FDM i 0,2 mm dla żywicy, widoczna struktura warstw, ślady podpór, różnice odcienia między partiami, inkluzje kamieni naturalnych

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
- H1: "Noś to, co znaczące. Nie to, co seryjne."
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

*Dokument odzwierciedla stan serwisu aejaca.com z 2026-07-17.*
*Repozytorium: ArturHebenstreit/aejaca-site, gałąź claude/fix-api-error-oge1r*
