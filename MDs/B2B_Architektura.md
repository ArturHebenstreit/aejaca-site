# Architektura strony /b2b/ - specyfikacja implementacyjna (zadanie 3.1)
**Status:** specyfikacja dla agentów 3.2-3.5 | **Trasa:** /b2b/ (jedna dla pl/en/de, jak reszta serwisu)
**Decyzje bazowe:** MDs/Plan_MSLA_B2B_Figurki.md, Etap 0 (wszystkie zatwierdzone)

## Pozycjonowanie
Strona sprzedażowa pod dwa profile klienta:
- "Twórca marki" (ma wizję, nie ma warsztatu): kupuje cały łańcuch, rozliczenie etapowe
- "Pracownia partnerska" (ma warsztat): kupuje pojedyncze ogniwa (druk 16K, laser, wykończenie, foto)
Ton: partnerski, konkretny, bez marketingowej waty. Nagłówki krótkie. Motyw kolorystyczny Studio (blue/emerald).

## Struktura sekcji (kolejność na stronie)

### 1. Hero
- H1 pl: "Produkcja jubilerska B2B" / en: "B2B Jewelry Production" / de: "B2B-Schmuckproduktion"
- Podtytuł pl: "Od wizji do wyrobu. Albo tylko ten jeden etap, którego Ci brakuje."
  en: "From vision to finished piece. Or just the one stage you are missing."
  de: "Von der Vision zum fertigen Stück. Oder nur die eine Etappe, die Ihnen fehlt."
- Hero image 21:9: /img/b2b/hero.webp (zadanie 3.5)
- 2 CTA obok siebie: "Buduję markę" (scroll do #white-label) i "Prowadzę pracownię" (scroll do #uslugi)

### 2. Dwie ścieżki (id="sciezki")
Dwie karty obok siebie (wzorzec HeroCards-podobny, statyczny):
- Karta A "Budujesz markę biżuterii": 2 zdania o pełnym cyklu + link #white-label
- Karta B "Prowadzisz pracownię lub odlewnię": 2 zdania o usługach jednostkowych + link #uslugi

### 3. Filary usług (id="uslugi") - 4 karty z cennikiem
Kazdy filar: ikona/grafika (3.5), naglowek, 2-3 zdania, widelki cen, "co otrzymujesz".

**Filar 1 - Projektowanie 3D / CAD**
- Zakres: od szkicu/zdjecia/opisu do pliku cast-ready; Rhino 8 + Grasshopper (parametryka),
  rendery do akceptacji, kompensacja skurczu per stop, rewizje w cenie (2 rundy)
- Cennik: prosta obraczka/sygnet gladki 400-600 zl netto; model sredni (kamienie, relief) 600-900;
  rzezbiarski/filigran/openwork 900-1200. Terminy: 2-5 dni roboczych
- Co otrzymujesz: STL/3MF do druku, STEP do edycji, render, raport wymiarowy

**Filar 2 - Wzorce castable 16K**
- Zakres: druk z pliku klienta lub naszego CAD; Elegoo Saturn 4 Ultra 16K (piksel 14 µm);
  BlueCast X-Wax Filigree (filigran, detal od 0,2 mm, >80% wosku) lub X-One V2 (masyw, zero skurczu);
  kontrola QC pod inwestycje
- Cennik: 90-180 zl/wzorzec; kolejne wzorce z tej samej platformy -40%; wysylka 24-48h od akceptacji pliku
- Co otrzymujesz: wzorzec gotowy do inwestycji, utwardzony, z raportem kontroli

**Filar 3 - Odlew + wykonczenie**
- Zakres: pelny cykl lost-resin/lost-PLA in-house: inwestycja Omni-II, wypalanie, odlew prozniowy,
  Ag 925 / Au 585; obrobka (tumbler, poler), opcjonalnie rodowanie/zlocenie, setting kamieni pod mikroskopem
- Cennik: prototyp w srebrze 180-300 zl + materialu; odlew z wykonczeniem: wycena wg wagi,
  proby i zlozonosci w 24h [UWAGA IMPLEMENTACYJNA: bez stawek za gram, do ustalenia pozniej]
- Cechowanie (WAZNE, doslownie wg decyzji 0.4): "Kazdy wyrob ze zlota lub srebra domyslnie
  oznaczamy znakiem wytworcy AEJaCA i zglaszamy do Urzedu Probierczego pod szyldem AEJaCA -
  otrzymujesz produkt z pelnymi cechami, gotowy do sprzedazy. Po indywidualnych ustaleniach
  mozemy przekazac wyrob lub surowy odlew bez cech, np. gdy Twoja pracownia cechuje pod
  wlasnym numerem ewidencyjnym - obowiazek zgloszenia do obrotu przechodzi wtedy na odbiorce."
  (en/de: wierne tlumaczenie + dopisek "(Polish hallmarking system)" w en, "(polnisches Punzierungssystem)" w de)

**Filar 4 - Uslugi uzupelniajace**
- Laser fiber 30W: grawer/personalizacja na zlocie, srebrze, stali, tytanie; grawer obrotowy (obraczki); od 20 zl/szt
- Fotografia produktowa: makro (Sony A7IV + Sigma 70 Macro + Godox MF12), pakiety od 3 ujec/produkt; wycena pakietowa
- Galwanika: rodowanie, zlocenie; wycena wg powierzchni

### 4. White-label (id="white-label") - "Twoja marka, nasza pracownia"
Proces etapowy OTWARCIE, BEZ KWOT (decyzja 0.5). Timeline/steps 6 krokow:
1. Konsultacja i brief (wizja, inspiracje, budzet docelowy)
2. Projekt CAD + rendery do akceptacji
3. Wzorzec 16K do oceny (opcjonalnie prototyp w srebrze)
4. Odlew Au/Ag + wykonczenie + setting
5. Cechowanie i QC
6. Fotografia produktowa + dostawa
Pod spodem: "Rozliczenie per etap - platisz po akceptacji kazdego kamienia milowego.
Kolejne modele kolekcji na bazie umowy ramowej." + CTA do formularza

### 5. Produkcja seryjna (krotka sekcja, uczciwa)
"Serie z form gumowych realizujemy we wspolpracy z zaufanymi pracowniami partnerskimi -
przyjmujemy zlecenie i koordynujemy caly proces. Jednostkowe i maloseryjne wyroby
(do ok. 20 szt.) wykonujemy w calosci u siebie."

### 6. FAQ (id="faq") - 5 pytan (takze do FAQ schema)
1. Czy moge zamowic sam wydruk wzorca bez odlewu? (tak, filar 2, wysylka do Twojej odlewni)
2. Czy wyroby sa cechowane? (tekst z decyzji 0.4 w skrocie)
3. Jak wyglada rozliczenie przy budowie marki? (etapowe, per kamien milowy)
4. Czy podpisujecie NDA? (tak, standardowo przy projektach autorskich)
5. Jakie pliki przyjmujecie? (STL/3MF/STEP/OBJ; szkic/zdjecie gdy brak pliku - filar 1)

### 7. Formularz zapytania B2B (id="formularz") - zadanie 3.3
Pola: imie i nazwisko*, firma, NIP (opcjonalnie), email*, telefon, profil (select: buduje marke /
prowadze pracownie / inne), zakres (multiselect checkboxy: CAD / wzorce 16K / odlew+wykonczenie /
laser / foto / white-label), ilosc szt., termin, opis*, upload pliku (STL/3MF/STEP/OBJ/JPG/PNG/PDF).
Wzorzec: rozszerzenie InquiryForm z calcShared (sprawdz jak dziala wysylka istniejacych formularzy
i uzyj tego samego mechanizmu). RODO checkbox jak w istniejacych formularzach.

## Routing i nawigacja (zadanie 3.2)
- Nowa trasa /b2b/ w OBU plikach: src/main.jsx ORAZ src/entry-server.jsx (lekcja z audytu Ahrefs!)
- Komponent: src/pages/B2B.jsx (lazy jak inne strony w main.jsx; w entry-server wg konwencji tego pliku)
- Navbar: pozycja w dropdownie Studio (sekcja "Wspolpraca B2B") ORAZ w dropdownie Jewelry
  (ten sam link; sprawdz strukture t.nav.*Sections w i18n) - NIE nowy top-level (navbar jest pelny)
- Footer: link w kolumnie uslug
- Strona Studio: krotka sekcja-zajawka B2B (2 zdania + link) nad stopka strony

## SEO (zadanie 3.2, dane do src/seo/seoData.js + schemas)
- pageKey: "b2b", path: "/b2b/"
- Title pl: "Produkcja jubilerska B2B - CAD, wzorce 16K, odlew | AEJaCA" (max 60 znakow)
  en: "B2B Jewelry Production - CAD, 16K Patterns, Casting | AEJaCA"
  de: "B2B-Schmuckproduktion - CAD, 16K-Modelle, Guss | AEJaCA"
- Description pl (120-155 znakow): "Uslugi B2B dla marek i pracowni: projektowanie CAD,
  wzorce castable 16K, odlew Au 585 / Ag 925, wykonczenie, cechowanie. Wycena w 24h."
  (en/de analogicznie, pilnowac 110-155 znakow)
- Schemas: Service (B2B manufacturing), FAQPage (5 pytan z sekcji 6), BreadcrumbList
- sitemap.xml: dodac /b2b/ z dzisiejszym lastmod (reszta syncu w Etapie 6)

## Grafiki (zadanie 3.5, Imagen przez scripts/gemini-image.mjs, GEMINI_API_KEY jest w env)
Styl domowy: czarne tlo, swiatlo z gory-lewej, premium product photography, bez tekstu i ludzi.
- /img/b2b/hero.webp (21:9, via aspect "16:9"): warsztat jubilerski nocą, na pierwszym planie
  wydrukowany turkusowy wzorzec pierscienia obok surowego odlewu srebrnego i narzedzi
- /img/b2b/pillar_cad.webp (1:1): ekran z modelem 3D pierscienia w CAD, siatka, ciemne studio
- /img/b2b/pillar_patterns.webp (1:1): platforma drukarki MSLA z rzedem turkusowych wzorcow pierscieni
- /img/b2b/pillar_casting.webp (1:1): swiezy srebrny odlew pierscienia z drzewkiem odlewniczym
- /img/b2b/pillar_services.webp (1:1): laser graweruje obraczke, iskry, makro
- /img/b2b/whitelabel.webp (1:1 lub 16:9): eleganckie pudelko jubilerskie z pierscieniem na czarnym tle
Konwersja: webp quality 82 (sharp). Rozmiar kazdej < 150 kB.

## Twarde reguly
- NIGDY dlugi myslnik " — " w trisciach (uzyj przecinka, dwukropka, nawiasu)
- Kazdy string pl/en/de (konwencja: sprawdz czy strona uzywa i18n plikow czy inline; nowa strona
  moze trzymac wlasny slownik inline jak Reviews.jsx - wybierz konwencje zgodna z podobna strona)
- Waluty: pl = PLN (netto przy B2B!), en/de = EUR wg CONFIG.EUR_PLN_RATE, z dopiskiem "netto/net"
- npm run build musi przejsc z 0 bledow; /b2b/ musi byc w prerenderze (61 -> 62 stron)
