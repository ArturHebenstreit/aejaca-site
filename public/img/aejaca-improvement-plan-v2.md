# AEJaCA.com — Plan Ulepszeń Strony v2.0
## Dokument roboczy do wdrożenia przez Claude Code

_Wersja: 2.0 | Data: 24 kwietnia 2026_
_Źródła: analiza kodu CSS/HTML, 37 screenshotów, robots.txt, sitemap.xml, product-marketing-context.md, dane od właściciela, skille: CRO, SEO, AI-SEO, page-CRO, UX heuristics, schema-markup, content-strategy, site-architecture_

---

## SPIS TREŚCI

1. Problemy krytyczne (indeksacja, architektura)
2. Ulepszenia UX/UI (konwersja, czas na stronie)
3. Brakujące treści i elementy informacyjne
4. SEO i indeksacja
5. AI SEO (widoczność w AI wyszukiwarkach)
6. Konwersja i zatrzymanie użytkownika
7. Geolokalizacja cen (DE/UK/EU)
8. Technical improvements
9. Priorytetyzacja wdrożenia
10. Aktualizacja product-marketing-context.md

---

## 1. PROBLEMY KRYTYCZNE

### 1.1 Brak SSR/SSG — strona niewidoczna dla wyszukiwarek

**Problem:** Cała treść renderowana client-side przez React (SPA z `<div id="root">`). Google crawler otrzymuje pusty HTML. Treść sekcji, nagłówki H1-H6, tekst paragrafów, linki wewnętrzne nie istnieją w statycznym HTML.

**Wpływ:** KRYTYCZNY. 3 schematy JSON-LD + hreflang + canonical w head, ale content niewidoczny. Fundamentalna sprzeczność.

**Hosting:** Cloudflare (potwierdzony). Opcje: Cloudflare Pages (SSG) lub Vercel (SSR/ISR).

**Zadanie dla Claude Code:**
```
1. Zainicjuj projekt Next.js 14+ (App Router, TypeScript)
2. Przenieś istniejące komponenty React do struktury /app
3. SSG dla stron statycznych (/, /jewelry, /studio, /contact, /glossary, /privacy)
4. ISR (revalidate: 3600) dla /blog/[slug]
5. Przenieś Tailwind CSS v4
6. Google Fonts (Playfair Display + Inter) przez next/font
7. Zachowaj meta tagi, schema.org JSON-LD, hreflang, canonical
8. next/image dla optymalizacji (WebP, lazy loading, priority dla hero)
9. next-sitemap do automatycznego generowania sitemap.xml
10. Deploy na Cloudflare Pages (preferowane, istniejąca infrastruktura)
    lub Vercel jako fallback
```

### 1.2 Rozbicie mega-stron na osobne URL-e

**Problem:** /jewelry i /studio to mega-strony z 14+ sekcjami. Dropdown menu sugeruje podstrony, ale prowadzą do anchorów (#section). Google nie indeksuje anchorów jako osobnych stron.

**Nowa struktura:**
```
/jewelry                    → Hub (skrócony, karty linkujące do podstron)
/jewelry/about              → Gdzie Sztuka Spotyka Rzemiosło
/jewelry/services           → Produkty i Usługi (6 kart)
/jewelry/calculator         → Estymator Kosztów biżuterii
/jewelry/process            → Jak Powstaje Twoja Biżuteria (6 kroków)
/jewelry/faq                → Często Zadawane Pytania
/jewelry/reviews            → Opinie klientów
/jewelry/tips               → Porady Biżuteryjne
/jewelry/shop               → Przekierowanie do Etsy (lub przyszły e-commerce)

/studio                     → Hub
/studio/about               → Innowacja Spotyka Precyzję
/studio/technologies        → Technologie (6 kart)
/studio/calculator          → Estymator Kosztów Studio
/studio/services            → Usługi
/studio/process             → Od Pomysłu do Produktu (4 kroki)
/studio/faq                 → FAQ Studio
/studio/reviews             → Opinie
/studio/tips                → Porady Makerskie

/about                      → O AEJaCA / O założycielu (NOWA)
/returns                    → Polityka zwrotów i reklamacji (NOWA)
/shipping                   → Informacje o wysyłce (NOWA)
/warranty                   → Gwarancja (NOWA)
```

**Zadanie dla Claude Code:**
```
1. Utwórz routing Next.js dla powyższej struktury
2. Każda podstrona: unikalny <title>, <meta description>, canonical, 
   BreadcrumbList schema, linkowanie wewnętrzne
3. Huby (/jewelry, /studio) = krótkie strony z kartami do podstron
4. Dodaj nowe URL-e do sitemap.xml
5. Redirecty ze starych anchorów (jeśli linkowane)
```

### 1.3 Brakujące schematy JSON-LD

**Obecny stan:** 3 schematy na /: Organization, LocalBusiness, WebSite. Podstrony prawdopodobnie bez.

**Zadanie dla Claude Code:**
```
/jewelry → Service + FAQPage + AggregateRating (5.0, 22 opinii)
/studio → Service + FAQPage + AggregateRating
/blog/[slug] → BlogPosting (headline, datePublished, dateModified, 
               author: "Artur Hebenstreit", publisher: AEJaCA, wordCount)
/glossary → DefinedTermSet
/glossary/[slug] → DefinedTerm
/contact → ContactPage + rozszerzenie LocalBusiness (openingHours, geo)
/about → Person (Artur Hebenstreit) + Organization
/jewelry/calculator, /studio/calculator → WebApplication schema
```

---

## 2. ULEPSZENIA UX/UI

### 2.1 Hero section

**Zmiany:**
```
1. Pod headline "Noś to, co znaczące..." dodaj rozróżnienie:
   "Ręcznie robiona biżuteria ze srebra, złota i kamieni naturalnych | 
    Druk 3D, grawerowanie laserowe i produkcja na zamówienie"

2. Badge Google Reviews above the fold:
   "★ 5.0 — 22 opinie na Google"

3. CTA biżuteria: "Zaprojektuj biżuterię →" → "Zobacz kolekcję →"
   CTA studio: "Zleć projekt studia →" → "Wyceń projekt online →"
```

### 2.2 Dropdown menu — ciemny motyw
```
- Tło: neutral-900/95 z backdrop-blur-xl
- Tekst: neutral-300 (idle), white (hover)
- Border: border-white/10
- Hover: bg-white/5
- Usuń biały/jasny motyw
```

### 2.3 Kontrast tekstu
```
Zmień wszystkie secondary text:
- text-neutral-500 → text-neutral-400 (minimum)
- text-neutral-600 → text-neutral-500
Żaden tekst na ciemnym tle nie może być ciemniejszy niż neutral-400.
```

### 2.4 Glassmorphism — redukcja
```
Zachowaj glass na: navbar (po scrollu), karty kalkulatora, floating CTA
Pozostałe: bg-neutral-900 lub bg-neutral-900/80 z border-white/10 (bez blur)
```

### 2.5 Floating CTA
```
- Biżuteria: bg-amber-500 text-black
- Studio: bg-emerald-500 text-white
- shadow-lg, animate-bounce przy pierwszym pojawieniu
- Pojawia się po scrollu 40vh
- Mobile: fixed bottom-0 w-full
```

---

## 3. BRAKUJĄCE TREŚCI I ELEMENTY INFORMACYJNE

### 3.1 Strona /about — O AEJaCA

**Treść od właściciela (do wdrożenia):**

Założyciel: Artur Hebenstreit. Marka istnieje ponad 3 lata (start ~2023).

Kluczowe elementy bio:
- Pasja do pięknych przedmiotów z formą, detalem i charakterem
- Połączenie technologii (AI, druk 3D, laser CO₂, laser fiber) z klasycznymi metodami rzemieślniczymi
- Dwie linie: AEJaCA (biżuteria, produkty osobiste/estetyczne) + AEJaCA sTuDiO (projekty techniczne, personalizacja, B2B/B2C)
- Jakość i zgodność: weryfikacja przez Urząd Probierczy, marka zarejestrowana w Urzędzie Patentowym
- Współpraca z lokalnymi przedsiębiorcami

**Zadanie dla Claude Code:**
```
Utwórz stronę /about:
- Hero z zdjęciem warsztatu (do dostarczenia przez Artura)
- Bio Artura (z dostarczonego tekstu, zachowaj ton)
- Sekcja "Dwie linie — jedna filozofia" (AEJaCA + sTuDiO)
- Sekcja "Jakość i zgodność" (Urząd Probierczy, Urząd Patentowy)
- Sekcja "Sprzęt" (Bambu Lab H2D, laser fiber Raycus 30W, laser CO2 xTool P2 55W)
- Person schema (Artur Hebenstreit, founder, AEJaCA)
- CTA: "Rozpocznij projekt →" i "Wyceń online →"

Title: "O AEJaCA — Artur Hebenstreit, twórca biżuterii i studio produkcji"
Meta: "AEJaCA to marka łącząca rzemiosło jubilerskie z technologią. 
       Ponad 3 lata doświadczenia, 150+ projektów, 5.0 na Google."
```

### 3.2 Strona /warranty — Gwarancja

**Dane + benchmarki rynkowe:**

Standard rynkowy polskich jubilerów: 24 miesiące gwarancji na wady produkcyjne. Jubiler Tarmex oferuje dożywotnią. La Marqueuse: 24 miesiące + 12 mies. bezpłatny serwis. Nomination: 24 miesiące.

Artur: gwarancja zgodna z prawem polskim, wyłączenie rękojmi dla przedsiębiorców.

**Rekomendacja:** 24 miesiące gwarancji na wady produkcyjne (standard rynkowy). Dodatkowo: bezpłatne pierwsze czyszczenie/odświeżenie w ciągu 12 mies. (wyróżnik dla handmade).

**Zadanie dla Claude Code:**
```
Utwórz stronę /warranty z treścią:

GWARANCJA AEJaCA

1. Okres gwarancji: 24 miesiące od daty zakupu
2. Zakres: wady produkcyjne (wady materiałowe, błędy wykonania)
3. Gwarancja NIE obejmuje:
   - Uszkodzenia mechaniczne (zarysowania, zgniecenia, złamania)
   - Przebarwienia z kontaktu z kosmetykami, detergentami, potem
   - Naturalne zużycie (ścieranie rodu, matowienie)
   - Wypadnięcie kamieni z powodu niewłaściwego użytkowania
   - Modyfikacje dokonane przez osoby trzecie
4. Bezpłatne pierwsze czyszczenie/odświeżenie biżuterii w ciągu 12 mies.
5. Wyłączenie rękojmi wobec przedsiębiorców (B2B)
6. Reklamacja: contact@aejaca.com, 14 dni na rozpatrzenie

Dodaj sekcję "Jak dbać o biżuterię" (link do bloga /blog/jak-dbac-o-bizuterie)

Title: "Gwarancja na biżuterię — 24 miesiące | AEJaCA"
```

### 3.3 Strona /returns — Polityka zwrotów

**Dane od Artura:**
- Produkty personalizowane na zamówienie: brak zwrotów
- Produkty uniwersalne: zwrot w ciągu 14 dni (prawo konsumenta)
- Wyjątek: drogie elementy sprowadzane na życzenie (kamienie, drogi kruszec)

**Zadanie dla Claude Code:**
```
Utwórz stronę /returns:

POLITYKA ZWROTÓW

Prawo odstąpienia od umowy (14 dni):
- Dotyczy produktów uniwersalnych (niespersonalizowanych)
- Towar musi być nieużywany, w oryginalnym opakowaniu
- Koszt wysyłki zwrotnej ponosi kupujący

Wyłączenia z prawa zwrotu:
- Biżuteria wykonana na indywidualne zamówienie (personalizacja)
- Produkty z elementami sprowadzonymi na specjalne życzenie 
  (kamienie szlachetne, konkretne kruszce)
- Wyroby studio wykonane wg indywidualnej specyfikacji

Reklamacje: osobna procedura (link do /warranty)

Title: "Zwroty i wymiany — polityka AEJaCA"
```

### 3.4 Strona /shipping — Informacje o wysyłce

**Dane od Artura:**
- Wysyłka krajowa: InPost, od 12 zł (mała przesyłka)
- Darmowa wysyłka od 400 zł wartości zamówienia
- Europa: wszystkie kraje UE + UK
- US i inne kontynenty: do indywidualnego ustalenia

**Zadanie dla Claude Code:**
```
Utwórz stronę /shipping:

WYSYŁKA

Polska:
- Kurier InPost: od 12 zł
- Paczkomat InPost: od 12 zł  
- DARMOWA WYSYŁKA przy zamówieniu od 400 zł
- Odbiór osobisty: Józefosław (darmowy)

Europa (UE + UK):
- Wysyłka do wszystkich krajów europejskich
- Koszt: od 25 zł (zależy od kraju i wagi)
- Czas dostawy: 5-10 dni roboczych

USA i inne kraje:
- Wysyłka możliwa po indywidualnym ustaleniu
- Kontakt: contact@aejaca.com

Czas realizacji:
- Biżuteria (materiały na stanie): do 7 dni roboczych
- Biżuteria (zamawianie materiałów): 10-14 dni roboczych
- Studio (materiały na stanie): 3-5 dni roboczych
- Studio (zamawianie materiałów): 6-12 dni roboczych

Title: "Wysyłka i dostawa — Polska, Europa, świat | AEJaCA"
```

### 3.5 Uzupełnienie FAQ na istniejących stronach

**Zadanie dla Claude Code:**
```
Dodaj do FAQ /jewelry:
Q: "Ile trwa realizacja zamówienia?"
A: "Jeśli posiadamy materiały (kruszec + kamienie), realizacja trwa do 7 dni 
   roboczych. Jeśli materiały wymagają zamówienia, proces wydłuża się o 3-7 
   dni roboczych (dostawcy krajowi)."

Q: "Czy mogę zwrócić biżuterię?"
A: "Produkty uniwersalne — tak, w ciągu 14 dni. Biżuteria personalizowana 
   wykonana na indywidualne zamówienie nie podlega zwrotowi. 
   Szczegóły: [link do /returns]"

Q: "Ile kosztuje wysyłka?"
A: "Wysyłka InPost od 12 zł. Darmowa przy zamówieniu od 400 zł. 
   Wysyłamy do całej Europy. Szczegóły: [link do /shipping]"

Q: "Jaka jest gwarancja?"
A: "24 miesiące na wady produkcyjne. Bezpłatne pierwsze czyszczenie 
   w ciągu 12 miesięcy. Szczegóły: [link do /warranty]"

Dodaj do FAQ /studio:
Q: "Ile trwa realizacja projektu?"
A: "Jeśli materiał jest na stanie, realizacja trwa 3-5 dni roboczych 
   (w zależności od ilości). Zamówienie materiałów wydłuża czas o 3-7 dni."
```

### 3.6 Orientacyjne ceny na stronach hub

**Zadanie dla Claude Code:**
```
Dodaj sekcję "Orientacyjne ceny" na /jewelry i /studio:

Biżuteria (ceny PLN, rynek PL):
- Wisiorek srebrny personalizowany: od 150 zł
- Pierścionek srebrny (bez kamienia): od 200 zł
- Pierścionek srebrny z kamieniem: od 350 zł
- Obrączki ślubne (para, srebro): od 690 zł
- Pierścionek złoty 14k: od 1500 zł
- Naprawa/odświeżenie biżuterii: od 80 zł

Studio (ceny PLN, rynek PL):
- Druk 3D (prosty element): od 25 zł
- Grawerowanie laserowe: od 35 zł
- Cięcie laserowe CO2: od 2 zł/mb
- Brelok NFC: od 45 zł
- Projekt grafiki/przygotowanie pliku: od 50 zł/h

Pod cennikiem: "Dokładną wycenę sprawdzisz w naszym kalkulatorze → [link]"
Uwaga: "Ceny orientacyjne, ostateczna wycena po konsultacji."
```

---

## 4. SEO I INDEKSACJA

### 4.1 Unikalne title i meta description

**Zadanie dla Claude Code:**
```
/ → title: "AEJaCA — biżuteria na zamówienie i studio produkcji kreatywnej"
    desc: "Ręcznie robiona biżuteria ze srebra 925, złota i kamieni naturalnych. 
           Druk 3D, grawerowanie laserowe. Wycena online w 30 sekund. ★ 5.0 Google."

/jewelry → title: "Biżuteria na zamówienie — srebrna, złota, z kamieniami | AEJaCA"
           desc: "Unikatowa biżuteria ręcznie robiona. Pierścionki, wisiorki, 
                  obrączki ze srebra 925 i złota 14k/18k. Kalkulator cen online."

/studio → title: "Druk 3D i grawerowanie laserowe na zamówienie | AEJaCA sTuDiO"
          desc: "Druk 3D FDM, grawerowanie fiber/CO2, odlewy żywiczne. 
                 Prototypy, produkcja małoseryjna. Wycena STL/SVG w 30 sekund."

/blog → title: "Blog — biżuteria, druk 3D, grawerowanie | AEJaCA"
        desc: "Poradniki: jak dbać o biżuterię, jak przygotować plik STL, 
               porównanie materiałów. Wiedza od rzemieślnika z 3-letnim doświadczeniem."

/glossary → title: "Słownik biżuterii i fabrykacji — od A do Z | AEJaCA"
            desc: "Srebro 925, laser fiber vs CO2, druk FDM vs SLA, moissanit, 
                   rodowanie. Kluczowe pojęcia wyjaśnione prosto."

/contact → title: "Kontakt — biżuteria na zamówienie, wycena projektu | AEJaCA"
           desc: "Napisz: biżuteria na zamówienie, druk 3D, grawerowanie. 
                  WhatsApp, email, formularz. Józefosław."

/about → title: "O AEJaCA — Artur Hebenstreit, rzemiosło + technologia"
         desc: "Ponad 3 lata doświadczenia, 150+ projektów. Biżuteria ze srebra 
                i złota + studio druku 3D i grawerowania. ★ 5.0 Google."

/blog/[slug] → title: "[Tytuł artykułu] | AEJaCA Blog"
```

### 4.2 Struktura nagłówków H1
```
Każda strona: dokładnie 1x <h1> z frazą kluczową.

/ → "Biżuteria na zamówienie i studio produkcji kreatywnej"
/jewelry → "Biżuteria na zamówienie ze srebra, złota i kamieni naturalnych"
/studio → "Druk 3D, grawerowanie laserowe i produkcja na zamówienie"
/blog → "Blog: biżuteria, druk 3D, grawerowanie laserowe"
/glossary → "Słownik pojęć biżuterii i fabrykacji"
/about → "O AEJaCA — rzemiosło i technologia od ponad 3 lat"
```

### 4.3 Linkowanie wewnętrzne
```
1. Blog → kalkulator ("Sprawdź ile kosztuje w kalkulatorze →")
2. Blog → glossary (linkuj terminy techniczne do definicji)
3. Glossary → blog ("Czytaj więcej w poradniku →")
4. Kalkulator → blog (pod wyceną: "Jak powstaje biżuteria →")
5. FAQ → /warranty, /returns, /shipping (linki w odpowiedziach)
6. Strony hub → blog (3 powiązane artykuły)
7. /about → /jewelry + /studio (CTA)
```

### 4.4 Breadcrumbs
```
Dodaj na każdej podstronie z BreadcrumbList schema:

/jewelry/calculator → Home > AEJaCA Biżuteria > Estymator Kosztów
/blog/obraczki-slubne → Home > Blog > Obrączki ślubne na zamówienie
/glossary/srebro-925 → Home > Słownik > Srebro 925

Styl: text-neutral-500, separator ">", 
link text-amber-400/80 hover:text-amber-300
```

### 4.5 Hreflang — korekta
```
ZACHOWAJ hreflang pl/en/de (rynki UE + UK + DE to priorytet).
Ale: upewnij się, że każdy hreflang href prowadzi do treści 
w odpowiednim języku, nie do tej samej strony.
Jeśli DE content nie istnieje jeszcze → tymczasowo wskaż na EN.
```

---

## 5. AI SEO

### 5.1 Robots.txt — OK ✓
Wszystkie AI crawlery mają Allow: /. Bez zmian.

### 5.2 Struktura treści pod AI cytowanie
```
Dla artykułów i stron informacyjnych:

1. Definition block w pierwszym paragrafie (40-60 słów, self-contained)
2. Tabele porównawcze:
   - Laser fiber vs CO2 (materiały, zastosowania, ceny)
   - Srebro 925 vs złoto 14k vs 18k (trwałość, cena, alergie)
   - Druk FDM vs SLA (jakość, materiały, ceny)
3. Statystyki ze źródłami:
   - "AEJaCA zrealizowała ponad 150 projektów od 2023 roku"
   - "5.0/5 na Google Maps na podstawie 22 opinii"
   - "Weryfikacja przez Urząd Probierczy"
4. FAQ: pytanie + bezpośrednia odpowiedź (konkretna, potem niuanse)
5. dateModified widoczna na stronie + w schema
6. Autor: "Artur Hebenstreit, założyciel AEJaCA" z linkiem do /about
```

### 5.3 Glossary — osobne strony terminów
```
1. Każdy termin → osobny URL: /glossary/[slug]
2. Na stronie terminu:
   - Definicja (40-60 słów)
   - Wyjaśnienie (200-400 słów)
   - Zdjęcie/ilustracja
   - "Powiązane usługi AEJaCA" (link do kalkulatora)
   - "Powiązane artykuły" (link do bloga)
   - DefinedTerm schema
3. Na liście /glossary: skrócone karty + "Czytaj więcej →"
```

---

## 6. KONWERSJA I ZATRZYMANIE

### 6.1 Kalkulatory — uzupełnienia
```
Pod wyceną szacunkową dodaj:
- Czas realizacji: "Do 7 dni roboczych (materiały na stanie)" / 
  "10-14 dni (zamawianie materiałów)"
- "Darmowa wysyłka od 400 zł"
- Prepopulowany formularz z danymi z kalkulatora
- Social proof: "★ 5.0 — 22 zadowolonych klientów"
- Po wysłaniu: "Odpowiemy w ciągu 24h"
```

### 6.2 Newsletter / email capture
```
1. Exit-intent popup (raz na sesję):
   "Odchodzisz? Odbierz 10% zniżki na pierwsze zamówienie"
2. Inline CTA w artykułach (po 50% scrollu)
3. Info w formularzu: "Nowinki z warsztatu, porady. Max 2 emaile/miesiąc."
```

### 6.3 Blog — optymalizacja
```
1. Filtrowanie: "Wszystkie | Biżuteria | Studio"
2. W artykułach:
   - Table of Contents dla > 5 min
   - 3 powiązane artykuły na końcu
   - CTA do kalkulatora (kontekstowy)
   - Autor: "Artur Hebenstreit" z awatarem
   - Data publikacji + ostatnia aktualizacja
   - BlogPosting schema

3. Nowe artykuły do napisania:
   - "Ile kosztuje biżuteria na zamówienie? Kompletny cennik 2026"
   - "Biżuteria personalizowana — kompletny przewodnik"
   - "Grawerowanie na biżuterii — co warto wiedzieć"
   - "Druk 3D w biżuterii — jak technologia zmienia rzemiosło"
   - "NFC breloki i smart tagi — co to jest i jak działa"
   - "Prezent na rocznicę / zaręczyny — przewodnik"
```

---

## 7. GEOLOKALIZACJA CEN (DE/UK/EU)

### 7.1 Architektura techniczna

**Problem:** Ceny muszą być dostosowane do rynku (PLN dla PL, EUR dla DE/EU, GBP dla UK). Cloudflare daje dostęp do geolokalizacji przez headers.

**Rozwiązanie:**

```
Metoda detekcji (priorytet):
1. Wybór języka przez użytkownika (przełącznik PL/EN/DE) → najwyższy priorytet
2. Cloudflare header CF-IPCountry → geolokalizacja IP
3. Navigator.language (fallback)

Mapowanie:
- PL → język polski, ceny PLN
- DE/AT/CH → język niemiecki, ceny EUR
- UK → język angielski, ceny GBP
- Pozostałe EU → język angielski, ceny EUR
- US/inne → język angielski, ceny USD lub EUR

Zadanie dla Claude Code:
1. Middleware Next.js: odczytaj CF-IPCountry z request headers
2. Ustaw cookie "locale" (pl/en/de) i "currency" (PLN/EUR/GBP)
3. Komponent PriceDisplay: renderuj cenę w odpowiedniej walucie
4. Kalkulatory: przeliczaj szacunkowe ceny wg kursu (lub stałych przeliczników)
5. Przełącznik języka w navbar: przy zmianie aktualizuj cookie
6. Trzymaj kursy w env lub pobieraj z API (np. ECB rates)
```

### 7.2 Przeliczniki cenowe

```
Cennik bazowy: PLN (rynek PL)

Przelicznik rynkowy (uwzględnia wyższy koszt życia w DE/UK):
- EUR: cena PLN / 4.30 * 1.15 (15% premium za rynek EU/DE)
- GBP: cena PLN / 5.30 * 1.20 (20% premium za rynek UK)
- USD: cena PLN / 4.00 * 1.10 (10% premium)

Przykład:
Pierścionek srebrny 350 PLN → ~94 EUR → ~79 GBP

Zaokrąglanie: do najbliższej pełnej wartości (.00) lub .95

UWAGA: przeliczniki powinny być konfigurowalne w pliku konfiguracyjnym,
nie hardcodowane. Artur musi mieć możliwość łatwej zmiany mnożników.
```

### 7.3 Treść wielojęzyczna

```
Obecny stan: strona ma przełącznik PL/EN/DE.
Problem: nie wiadomo, czy treść DE faktycznie istnieje.

Zadanie dla Claude Code:
1. Zweryfikuj, które treści istnieją w PL, EN, DE
2. Jeśli DE brakuje → stwórz tłumaczenie kluczowych stron:
   - /jewelry (hub)
   - /studio (hub)
   - /contact
   - /about
   - Kalkulatory (interfejs)
3. Blog i glossary: na razie tylko PL i EN (DE w kolejnej fazie)
4. Implementuj i18n routing w Next.js:
   /pl/jewelry, /en/jewelry, /de/jewelry
   lub subdirectory: /jewelry?lang=de (prostsze, mniej URL-ów)
```

---

## 8. TECHNICAL IMPROVEMENTS

### 8.1 Performance
```
- Lazy loading obrazów poniżej fold
- Preload hero images (zachować)
- next/image: automatyczny WebP + responsive sizes
- Cache headers na statyczne assety (Cloudflare CDN)
```

### 8.2 Accessibility
```
- Zweryfikuj skip-to-content (CSS istnieje, sprawdź HTML)
- aria-labels na interaktywnych elementach
- FAQ accordion: keyboard-accessible
- Kalkulator: aria-labels na kartach wyboru
- Focus styles: OK (amber outline via focus-visible)
```

---

## 9. PRIORYTETYZACJA WDROŻENIA

### FAZA 1: Quick Wins (1-2 dni, bez migracji)

| # | Zadanie | Wpływ | Wysiłek |
|---|---------|-------|---------|
| 1 | Kontrast tekstu (neutral-500 → neutral-400) | Średni | Niski |
| 2 | Dropdown menu (ciemny motyw) | Średni | Niski |
| 3 | Dodaj czas realizacji + wysyłkę do FAQ | Wysoki | Niski |
| 4 | dateModified na artykułach | Średni | Niski |
| 5 | Breadcrumbs (wizualne) | Średni | Niski |
| 6 | CTA hero (mniej zobowiązujące) | Średni | Niski |
| 7 | Badge Google Reviews above the fold | Wysoki | Niski |

### FAZA 2: Nowe strony informacyjne (3-5 dni)

| # | Zadanie | Wpływ | Wysiłek |
|---|---------|-------|---------|
| 8 | Strona /about (bio Artura, historia, sprzęt) | Wysoki (E-E-A-T) | Średni |
| 9 | Strona /warranty (gwarancja 24 mies.) | Wysoki (konwersja) | Niski |
| 10 | Strona /returns (polityka zwrotów) | Wysoki (konwersja) | Niski |
| 11 | Strona /shipping (wysyłka, czas realizacji) | Wysoki (konwersja) | Niski |
| 12 | Orientacyjne ceny na hub pages | Wysoki | Niski |
| 13 | FAQPage + Service schema | Wysoki (SEO) | Średni |
| 14 | BlogPosting schema na artykuły | Wysoki (SEO) | Średni |

### FAZA 3: Migracja na Next.js (1-2 tygodnie)

| # | Zadanie | Wpływ | Wysiłek |
|---|---------|-------|---------|
| 15 | Migracja na Next.js SSG/ISR | KRYTYCZNY | Wysoki |
| 16 | Rozbicie mega-stron na osobne URL-e | Wysoki | Wysoki |
| 17 | next/image + next-sitemap | Średni | Średni |
| 18 | Deploy na Cloudflare Pages | Średni | Niski |

### FAZA 4: Geolokalizacja + i18n (3-5 dni)

| # | Zadanie | Wpływ | Wysiłek |
|---|---------|-------|---------|
| 19 | Middleware geolokalizacji (CF headers) | Wysoki | Średni |
| 20 | PriceDisplay component + przeliczniki | Wysoki | Średni |
| 21 | Weryfikacja/uzupełnienie treści DE | Średni | Wysoki |
| 22 | i18n routing | Średni | Średni |

### FAZA 5: Content i AI-SEO (ongoing)

| # | Zadanie | Wpływ | Wysiłek |
|---|---------|-------|---------|
| 23 | 6 nowych artykułów blogowych | Wysoki | Wysoki |
| 24 | Glossary: osobne strony terminów | Wysoki (AI-SEO) | Średni |
| 25 | Definition blocks w artykułach | Średni | Średni |
| 26 | Tabele porównawcze | Średni | Średni |
| 27 | Linkowanie wewnętrzne | Wysoki | Średni |
| 28 | Exit-intent popup | Średni | Średni |

---

## 10. AKTUALIZACJA PRODUCT-MARKETING-CONTEXT.MD

**Następujące informacje wymagają aktualizacji w product-marketing-context.md:**

```
ZMIANY:
1. "1,5 roku na rynku (start: jesień 2024)" → "Ponad 3 lata na rynku (start: ~2023)"
2. Dodaj sekcję "Warunki sprzedaży":
   - Gwarancja: 24 miesiące na wady produkcyjne
   - Zwroty: 14 dni dla produktów uniwersalnych, brak zwrotów na personalizowane
   - Wysyłka PL: InPost od 12 zł, darmowa od 400 zł
   - Wysyłka EU/UK: do wszystkich krajów europejskich
   - Wysyłka US/inne: do indywidualnego ustalenia
   - Płatności: przelew, BLIK, gotówka (odbiór osobisty)
   - Czas realizacji biżuteria: 7 dni (materiały na stanie), 10-14 dni (zamawianie)
   - Czas realizacji studio: 3-5 dni (materiały na stanie), 6-12 dni (zamawianie)
3. Dodaj "Jakość i zgodność":
   - Weryfikacja przez Urząd Probierczy
   - Marka zarejestrowana w Urzędzie Patentowym
4. Rynki docelowe: PL (priorytet), DE, UK, EU
```
