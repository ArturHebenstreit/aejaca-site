# AEJaCA Site — Design Snapshot v1.0

> **Data utworzenia**: 2026-05-20  
> **Commit**: `a5eaa9f9d4ef611067a6e174a66cdc763e955329`  
> **Gałąź**: `claude/fix-api-error-oge1r`  
> **Build**: 57 stron, 0 błędów (`npm run build`)  
>
> Ten dokument to kompletny snapshot stanu wizualnego i architektonicznego serwisu aejaca.com w wersji 1.0. Służy jako punkt odniesienia i punkt przywrócenia.

---

## 1. Stack technologiczny

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| Framework JS | React | 18.2 |
| Bundler | Vite | 6.x |
| CSS | Tailwind CSS | v4 (CSS-first) |
| Router | React Router DOM | 7.13 |
| SEO | react-helmet-async | 2.x |
| Ikony | lucide-react | 0.536 |
| Baza danych | PostgreSQL (via `pg`) | 8.x |
| Deployment | Cloudflare Pages | — |
| Języki | PL / EN / DE | — |

**Kluczowe pliki konfiguracyjne:**
- `vite.config.js` — chunking: `three`, `react-vendor`, `helmet`
- `src/index.css` — Tailwind v4 CSS-first (import + `@theme` + `:root` tokens)
- `.npmrc` — `optional=true` (niezbędne dla lightningcss na Cloudflare Pages)
- `public/_headers`, `public/_redirects` — Cloudflare Pages
- `public/sitemap.xml`, `public/robots.txt` — SEO

---

## 2. Identyfikacja wizualna marki

### 2.1 Dwie osobowości pod jedną marką

| Sub-marka | Pełna nazwa | Styl | Akcent główny |
|-----------|-------------|------|---------------|
| Biżuteria | **AEJaCA Biżuteria** | Artystyczny, luksusowy | Amber (złoty) |
| Studio | **AEJaCA sTuDiO** | Techniczny, inżynieryjny | Blue (niebieski) |

> **WAŻNE** — intercap `sTuDiO` (małe t, D, i) jest wymagany wszędzie tam, gdzie to nazwa własna (navbar, footer, eyebrows, H1). Nie dotyczy opisów usług.

### 2.2 Logo / Brand mark

```
Plik: /public/brand-sign.webp
Wymiary: 44×44px w navbarze, 40×40px w footerze, 144×144px w sekcji brand statement
Efekt: brightness-0 invert (biały monochromatyczny) + drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]
Hover navbar: scale-105
```

### 2.3 Typografia

| Rodzina | Rola | Klasa Tailwind |
|---------|------|----------------|
| **Playfair Display** / Noto Serif / Georgia | Biżuteria — nagłówki, display | `font-serif` |
| **Inter** / system-ui / sans-serif | sTuDiO — nagłówki, UI | `font-sans` |

**Hierarchia rozmiaru nagłówków (zdefiniowane praktyki):**

| Element | Klasy | Uwagi |
|---------|-------|-------|
| H1 homepage | `font-serif text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight` | Widoczny (nie sr-only) |
| H1 Jewelry | `font-serif text-5xl sm:text-6xl md:text-[72px] font-semibold` | Na hero |
| H1 Studio | `font-sans text-5xl sm:text-6xl md:text-[72px] font-semibold` | Na hero |
| H2 sekcji | `font-serif text-3xl md:text-4xl font-semibold` | Biżuteria |
| H2 sekcji studio | `font-sans text-3xl md:text-4xl font-semibold` | Studio |
| Eyebrow | `text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-medium` | Amber lub Blue |
| Body | `text-sm md:text-base leading-relaxed` | neutral-300 / neutral-400 |

---

## 3. Paleta kolorów

### 3.1 Kolory bazowe (dark canvas)

```css
bg-neutral-950   /* #0a0a0a — główne tło strony */
bg-neutral-900   /* Sekcje z lekkim kontrastem */
text-white        /* Główny kolor tekstu */
text-neutral-300  /* Body text (jasny) */
text-neutral-400  /* Body text (przyciemniony) */
text-neutral-500  /* Pomocniczy, etykiety */
text-neutral-600  /* Bardzo przyciszone */
```

### 3.2 Akcenty Jewelry (amber)

```css
text-amber-400       /* Eyebrow, ikony, linki aktywne */
text-amber-300       /* Hover na linkach amber */
text-amber-200       /* Tekst przycisku amber outlined */
bg-amber-400/10      /* Tło przycisku outlined (normalny) */
bg-amber-400         /* Tło przycisku outlined (hover) */
border-amber-400/40  /* Obramowanie przycisku outlined */
bg-amber-950/20      /* Tło kart kalkulatora */
text-black           /* Tekst na amber-500 (hover button) */

/* CSS tokeny */
--border-amber:    rgba(245, 158, 11, 0.18)
--border-amber-hi: rgba(245, 158, 11, 0.40)
--shadow-amber-glow: 0 20px 40px -16px rgba(120, 53, 15, 0.20)
```

### 3.3 Akcenty Studio (blue)

```css
text-blue-400        /* Eyebrow, ikony */
text-blue-300        /* Hover na linkach blue */
text-blue-200        /* Tekst przycisku blue outlined */
bg-blue-400/10       /* Tło przycisku outlined (normalny) */
bg-blue-500          /* Tło przycisku outlined (hover) */
border-blue-400/40   /* Obramowanie przycisku outlined */
bg-blue-950/20       /* Tło kart kalkulatora */
text-white           /* Tekst na blue-500 (hover button) */

/* CSS tokeny */
--border-blue:    rgba(59, 130, 246, 0.18)
--border-blue-hi: rgba(59, 130, 246, 0.40)
--shadow-blue-glow: 0 20px 40px -16px rgba(30, 58, 138, 0.20)
```

### 3.4 Akcent STL/upload (emerald)

```css
text-emerald-400     /* Ikony, linki, eyebrow */
border-emerald-400/20 / /30  /* Obramowanie kart */
bg-emerald-950/20    /* Tło dużego banera STL */
```

### 3.5 Efekty specjalne

```css
/* Glassmorphism */
.glass {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
}
.glass-amber { background: rgba(245,158,11,0.06); blur(16px); border: rgba(245,158,11,0.18) }
.glass-blue  { background: rgba(59,130,246,0.06);  blur(16px); border: rgba(59,130,246,0.18) }

/* Shadow glow na hover gateway card */
hover:shadow-amber-900/40  /* Biżuteria */
hover:shadow-blue-900/40   /* sTuDiO */

/* Pozostałe tokeny */
--shadow-white-glow: 0 10px 30px -10px rgba(255,255,255,0.10)
--ease-editorial: cubic-bezier(0.16, 1, 0.3, 1)
```

---

## 4. Design tokenów CSS (`src/index.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans:   "Inter", system-ui, sans-serif;
  --font-serif:  "Playfair Display", "Noto Serif", Georgia, serif;
  --color-paper: #fafafa;
  --color-card:  #ffffff;
  --radius-DEFAULT: 0.5rem;
}

:root {
  --border-amber:       rgba(245, 158, 11, 0.18);
  --border-amber-hi:    rgba(245, 158, 11, 0.40);
  --border-blue:        rgba(59, 130, 246, 0.18);
  --border-blue-hi:     rgba(59, 130, 246, 0.40);
  --shadow-amber-glow:  0 20px 40px -16px rgba(120, 53, 15, 0.20);
  --shadow-blue-glow:   0 20px 40px -16px rgba(30, 58, 138, 0.20);
  --shadow-white-glow:  0 10px 30px -10px rgba(255, 255, 255, 0.10);
  --ease-editorial:     cubic-bezier(0.16, 1, 0.3, 1);
}

body { @apply bg-neutral-950 text-white; }
[id] { scroll-margin-top: 5rem; }  /* offset dla fixed navbar h-16 */
```

---

## 5. Układ globalny

### 5.1 Navbar

```
Wysokość: h-16 (64px), fixed top-0, z-50
Tło scrolled:   bg-neutral-950/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20
Tło nie-scrolled: bg-neutral-950/80 backdrop-blur-md border-b border-white/5
Logo: /brand-sign.webp, font-serif text-xl
Nav items: text-sm tracking-wide text-neutral-300 hover:text-amber-400
Active link: text-amber-400 + h-0.5 underline bg-amber-400 absolute -bottom-1
Dropdown: bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl w-48
Jewelry dropdown: hover:text-amber-300 hover:bg-amber-400/5
Studio dropdown: hover:text-blue-300 hover:bg-blue-400/5
```

**Nawigacja główna (kolejność):**
1. Strona główna / Home / Startseite
2. AEJaCA Biżuteria / Jewelry / Schmuck + dropdown
3. AEJaCA sTuDiO / sTuDiO + dropdown
4. Galeria / Gallery / Galerie + dropdown (link nieaktywny → preventDefault)
5. Marka AEJaCA / About / Über AEJaCA + dropdown
6. Narzędzia i Wiedza / Tools & Knowledge / Werkzeuge & Wissen + dropdown
7. Kontakt / Contact / Kontakt
8. Przełącznik języka (🌐 PL/EN/DE)

### 5.2 Footer

```
bg-neutral-950 border-t border-white/10
Trzy kolumny: Brand (logo + tagline) | Quick Links | Follow Us (social)
Newsletter: nad kolumnami, max-w-2xl
Market Rates Bar: pod social icons, live z /api/market-rates
Waluty: PLN (lang=pl), EUR (lang=en lub de)
```

**Social icons (kolejność):** Etsy Jewelry, Etsy Studio, Instagram, TikTok, Facebook, YouTube, WhatsApp, Email

### 5.3 Sekcje strony — górny padding

```
Wszystkie strony: pt-16 (kompensacja fixed navbar 64px)
```

---

## 6. Komponenty UI — specyfikacja

### 6.1 Gateway Cards (strona główna)

Dwie karty z obrazem 3:4 — entry pointy do dwóch sub-marek.

```jsx
/* Kontener karty */
className="group relative overflow-hidden rounded-2xl cursor-pointer 
  shadow-lg shadow-black/40 
  hover:shadow-2xl hover:shadow-amber-900/40  /* lub blue-900/40 */
  transition-all duration-500 hover:-translate-y-1"

/* Obraz */
aspect-[3/4] relative overflow-hidden
img: "absolute inset-0 w-full h-full object-cover 
     transition-transform duration-700 group-hover:scale-105"
loading="eager" fetchpriority="high" decoding="async"
width="768" height="1024"

/* Gradienty na obrazie */
<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_50%,rgba(0,0,0,0.72)_100%)]" />

/* Overlay z tekstem i przyciskiem */
<div className="absolute bottom-0 left-0 right-0 h-48 md:h-52 
  flex flex-col justify-between items-center 
  px-6 md:px-8 pb-6 md:pb-7 pt-4 text-center">
  <div>  {/* górna sekcja: eyebrow + description razem */}
    <div className="text-amber-400 text-[10px] uppercase tracking-[0.25em] mb-3">{eyebrow}</div>
    <p className="text-neutral-200 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
  </div>
  <span className="...button...">  {/* przycisk — zawsze na dole */}
```

**Kluczowy trick**: eyebrow + description są w jednym `<div>` (flex child top), przycisk jest osobnym flex child (bottom). Dzięki temu eyebrow zawsze zaczyna się na tej samej wysokości Y, niezależnie od długości opisu.

**Przyciski gateway:**

Jewelry (amber outlined pill):
```jsx
"inline-flex items-center gap-2 px-7 py-3 
 border border-amber-400/40 bg-amber-400/10 backdrop-blur-md 
 text-amber-200 font-medium rounded-full text-sm tracking-wide 
 group-hover:bg-amber-400 group-hover:text-black group-hover:border-amber-400 
 group-hover:shadow-lg group-hover:shadow-amber-500/30 
 transition-all duration-300"
```

Studio (blue outlined pill):
```jsx
"inline-flex items-center gap-2 px-7 py-3 
 border border-blue-400/40 bg-blue-400/10 backdrop-blur-md 
 text-blue-200 font-medium rounded-full text-sm tracking-wide 
 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 
 group-hover:shadow-lg group-hover:shadow-blue-500/30 
 transition-all duration-300"
```

### 6.2 System przycisków (4 typy)

| Typ | Klasy | Zastosowanie |
|-----|-------|-------------|
| Primary white | `bg-white text-black hover:bg-neutral-200 px-6 py-3 rounded-full font-medium` | Główne CTA |
| Amber outlined pill | `border border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400 hover:text-black rounded-full px-7 py-3` | Jewelry CTA |
| Blue outlined pill | `border border-blue-400/40 bg-blue-400/10 text-blue-200 hover:bg-blue-500 hover:text-white rounded-full px-7 py-3` | Studio CTA |
| Ghost link + arrow | `text-amber-500 hover:text-amber-300` + `<ArrowRight group-hover:translate-x-1>` | Linki sekcji |

### 6.3 Karty kalkulatorów (Quick Quote section)

**Jewelry card:**
```jsx
"group relative rounded-2xl overflow-hidden 
 border border-amber-400/20 bg-gradient-to-br from-amber-950/20 to-neutral-950 
 p-6 md:p-8 
 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-900/20 
 hover:-translate-y-1 transition-all duration-300"
```

**Studio card:**
```jsx
"group relative rounded-2xl overflow-hidden 
 border border-blue-400/20 bg-gradient-to-br from-blue-950/20 to-neutral-950 
 p-6 md:p-8 
 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-900/20 
 hover:-translate-y-1 transition-all duration-300"
```

**STL/SVG upload banner (zielony):**
```jsx
"rounded-2xl overflow-hidden border border-emerald-400/20 
 bg-gradient-to-r from-emerald-950/20 via-neutral-900/50 to-emerald-950/20 
 p-6 md:p-8"
```

**Tile grid (4 kafelki STL):**
```jsx
"group relative rounded-xl overflow-hidden 
 border border-emerald-400/10 hover:border-emerald-400/30 
 hover:shadow-lg hover:shadow-emerald-900/10 
 transition-all duration-300 min-h-[180px]"
// Gradient: bg-gradient-to-t from-black/90 via-black/60 to-black/30
```

### 6.4 Divider między sekcjami

```jsx
<div className="gradient-divider" />
/* CSS: height:1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent) */
```

Umieszczony między każdą główną sekcją na `Home.jsx`, `Jewelry.jsx`, `Studio.jsx`.

### 6.5 Scroll Reveal animations

```css
.reveal       { opacity:0; transform:translateY(24px); transition: 0.7s cubic-bezier(0.16,1,0.3,1) }
.reveal-scale { opacity:0; transform:scale(0.95);       transition: 0.6s cubic-bezier(0.16,1,0.3,1) }
.reveal-left  { opacity:0; transform:translateX(-32px); transition: 0.7s cubic-bezier(0.16,1,0.3,1) }
.reveal-right { opacity:0; transform:translateX(32px);  transition: 0.7s cubic-bezier(0.16,1,0.3,1) }
/* data-visible="true" → opacity:1, transform:none */
```

Hook: `useScrollReveal()` (IntersectionObserver), `useStaggerReveal(delayMs)` dla list.

---

## 7. Układ strony głównej (Home.jsx) — sekcje

```
[Navbar h-16 fixed]
[pt-16 wrapper]
  1. Hero intro         — bg-neutral-950, pt-10 pb-6 md:pt-14 md:pb-8, text-center
     H1 (font-serif), subtitle, badge Google rating
  2. Gateway Cards      — bg-neutral-950, px-4, pb-3 md:pb-4
     max-w-5xl, grid 1→2 cols, gap-5 md:gap-6
  [gradient-divider]
  3. Brand Statement    — bg-neutral-950, py-12 px-4, text-center
     Logo 144×144, H2, body text, badge Google
  [gradient-divider]
  4. Quick Quote        — bg-gradient-to-b from-neutral-950 via-neutral-900/30 to-neutral-950
     py-12, eyebrow emerald, H2, 2 cards (Jewelry+Studio), STL banner
  [gradient-divider]
  5. Blog Highlights    — bg-neutral-950, py-16
     3 ostatnie posty BlogCard
  [gradient-divider]
  6. World Cards        — bg-neutral-950, py-16
     2 feature cards: AEJaCA Biżuteria + AEJaCA sTuDiO (lista punktów)
  [gradient-divider]
  7. Google Reviews     — <GoogleReviews /> z anchor id="reviews"
  [gradient-divider]
  8. CTA końcowe        — py-16, bg-gradient-to-b from-neutral-950 to-neutral-900/30
     H2, tekst, przycisk → /contact/
[Footer]
```

---

## 8. Układ strony Jewelry (Jewelry.jsx) — sekcje

```
[pt-16]
  1. Hero               — min-h-[540px], /hero-jewelry.webp, overlay gradient-to-b
     Eyebrow amber, H1 font-serif, subtitle
  2. About              — py-20, max-w-4xl, sekcja o marce
  [gradient-divider]
  3. Services           — id="services", 6 kart usług (ikony Lucide, grid 2/3 cols)
  [gradient-divider]
  4. Pricing            — id="pricing", orientacyjne ceny (tabelka)
  [gradient-divider]
  5. Calculator         — id="calculator", <JewelryEstimator />
  [gradient-divider]
  6. FAQ                — id="faq", <FAQ />
  [gradient-divider]
  7. Process            — id="process", 6 kroków zero-padded (01..06)
  [gradient-divider]
  8. Portfolio          — id="portfolio", <Portfolio />
  [gradient-divider]
  9. Tips               — id="tips", <Tips />
  [gradient-divider]
  10. Reviews            — id="testimonials", <GoogleReviews />
  [gradient-divider]
  11. Shop (Etsy)        — id="shop"
  [gradient-divider]
  12. CTA końcowe
[Footer]
```

---

## 9. Układ strony Studio (Studio.jsx) — sekcje

```
[pt-16]
  1. Hero               — min-h-[540px], /hero-studio.webp, overlay gradient-to-b
     Eyebrow blue, H1 font-sans, "AEJaCA <span text-blue-400>sTuDiO</span>"
  2. About              — py-20, max-w-4xl
  [gradient-divider]
  3. Technologies       — id="technologies", grid kart technologii (Printer, Zap, Box, Cpu, Layers, Wrench)
  [gradient-divider]
  4. Pricing            — id="pricing", orientacyjne ceny
  [gradient-divider]
  5. Calculator         — id="calculator", <StudioCalculator />
  [gradient-divider]
  6. FAQ                — id="faq", <FAQ />
  [gradient-divider]
  7. Portfolio          — id="portfolio", <Portfolio />
  [gradient-divider]
  8. Services           — id="services"
  [gradient-divider]
  9. Process            — id="process", kroki zero-padded (01..05)
  [gradient-divider]
  10. Tips              — id="tips", <Tips />
  [gradient-divider]
  11. Reviews           — id="testimonials", <GoogleReviews />
  [gradient-divider]
  12. Shop (Etsy)       — id="shop"
  [gradient-divider]
  13. CTA końcowe
[Footer]
```

---

## 10. Obrazy hero i kafelki

| Plik | Użycie | Loading |
|------|--------|---------|
| `/hero-home-jewelry.webp` | Gateway card Jewelry | eager, fetchpriority=high |
| `/hero-home-studio.webp` | Gateway card Studio | eager, fetchpriority=high |
| `/hero-jewelry.webp` | Hero na /jewelry/ | eager, fetchpriority=high |
| `/hero-studio.webp` | Hero na /studio/ | eager, fetchpriority=high |
| `/brand-sign.webp` | Logo wszędzie | lazy (poza navbarem) |
| `/img/calc/home/print3d.webp` | Kafelek STL — druk 3D | lazy |
| `/img/calc/home/co2engrave.webp` | Kafelek STL — CO2 engrave | lazy |
| `/img/calc/home/fiber.webp` | Kafelek STL — fiber | lazy |
| `/img/calc/home/co2cut.webp` | Kafelek STL — CO2 cut | lazy |
| `/img/calc/<kategoria>/<id>.png` | Kafelki kalkulatorów | lazy |

**Styl fotografii kafelków**: czarne tło, light top-left, premium product photography. AspectRatio `1:1` (kafelki) lub `21:9` (banery).

---

## 11. SEO i schematy

### 11.1 Zasady SEO

| Reguła | Specyfikacja |
|--------|-------------|
| `<title>` | ≤ 60 znaków, keyword na początku, sufiks `, AEJaCA` |
| `<description>` | ≤ 155 znaków, naturalne zdania |
| Jeden `<h1>` per strona | Widoczny (nie `sr-only`) |
| `scroll-margin-top` | `5rem` (kompensacja h-16 navbar) |
| Canonical | `<SEOHead pageKey="..." path="..." />` na każdej stronie |
| Open Graph | domyślny `/og-default.jpg`, strony: `/og-jewelry.jpg`, `/og-studio.jpg` |
| hreflang | pl_PL, en_US, de_DE |

### 11.2 Schematy (structured data)

| Schema | Strony |
|--------|--------|
| `Organization` (augmented z `aggregateRating` + `Review[]`) | Home |
| `WebPage` | Wszystkie |
| `Breadcrumb` | Wszystkie |
| `LocalBusiness` | Home |
| `Service` | Jewelry, Studio |
| `HowTo` | Jewelry (proces), Studio (proces) |
| `FAQ` | Jewelry, Studio |
| `ItemList` | Jewelry, Studio |
| `Product` (× kilka) | Jewelry (3 produkty), Studio (3 produkty) |

---

## 12. System i18n

**Pliki**: `src/i18n/pl.js`, `src/i18n/en.js`, `src/i18n/de.js`

**Zasady:**
- KAŻDY tekst widoczny dla użytkownika ma klucz w WSZYSTKICH trzech plikach
- Nazwy własne filamentów (PLA, PETG, PA6-CF) — bez tłumaczenia
- Nazwy marek (AEJaCA Biżuteria, AEJaCA sTuDiO) — bez tłumaczenia
- Tytuły narzędzi technicznych — bez tłumaczenia
- Brak em-daszów (` — `) w tekstach widocznych (usunięte v1.0) — zastąpione `, `

**Wyjątki od zasady braku em-daszów:**
- `src/blog/posts/` — artykuły long-form (poprawna typografia)
- `src/data/googleReviews.js` — treść pisana przez użytkowników

**Provider**: `useLanguage()` hook z `src/i18n/LanguageContext.jsx`  
**Helper**: `t(obj, lang)` z `calcShared.jsx` — multilingual label lookup

**Waluta:**
```js
const showEur = lang === "en" || lang === "de";
// PLN dla lang=pl, EUR dla en/de
// Kurs live: /api/market-rates → pln_per_eur, fallback: 4.25
```

---

## 13. Calculatory — wspólne prymitywy (`calcShared.jsx`)

```js
// Konfiguracja bazowa
CONFIG = {
  EUR_PLN_RATE: 4.28,
  TOLERANCE_LOW: 0.30,
  TOLERANCE_HIGH: 0.40,
  ENERGY_COST_PLN: 1.05,
  BASE_MARGIN: 0.40,
  PL_MARKET_DISCOUNT: 0.15,
}

// Tiers ilości
QUANTITY_TIERS = [proto(1), micro(2-10), small(11-20), medium(21-50), large(51-100), custom(100+)]

// Funkcje
t(obj, lang)              // multilingual label
fmtNum(n)                 // thin-space separator
fmtCost(plnAmount, lang)  // PLN lub EUR auto
applyPricing(...)         // margin + discount + tolerance range
```

**Komponenty UI współdzielone:**
- `<Chips>` — wybór opcji (multi-style)
- `<CalcCard>` — karta kalkulatora (amber lub blue)
- `<ResultDisplay>` — wynik wyceny (cena + zakres)
- `<InquiryForm>` — formularz zapytania ofertowego

---

## 14. Animacje i interakcje

### 14.1 Hover język kart

| Element | Normalny | Hover |
|---------|----------|-------|
| Karta (div) | stan bazowy | `-translate-y-1 shadow-lg` |
| Obraz wewnątrz | `scale-100` | `scale-[1.05]`, duration 700ms |
| Border | `/20` opacity | `/40` opacity |
| Arrow icon | `translateX(0)` | `translateX(4px)` |

### 14.2 Przyciski

| Typ | Hover |
|-----|-------|
| Amber outlined | `bg-amber-400`, `text-black`, `shadow-amber-500/30` |
| Blue outlined | `bg-blue-500`, `text-white`, `shadow-blue-500/30` |
| Ghost link amber | `text-amber-300` |

### 14.3 Navbar

```
Scroll trigger: window.scrollY > 20
Transition: bg + backdrop-filter + border + shadow, duration-300
Dropdown: hover enter/leave z 200ms debounce (nie migający)
Mobile menu: max-h slide + opacity, duration-300
Sekcje mobile: max-h-96 accordion
```

---

## 15. Dostępność i wydajność

| Aspekt | Implementacja |
|--------|---------------|
| Skip link | `.skip-to-content` (pokazuje się na :focus, absolute top:-100%) |
| Focus ring | `outline: 2px solid #f59e0b; outline-offset: 2px; border-radius: 4px` |
| Aria labels | `aria-label` na wszystkich ikonach i nawigacji |
| Reduced motion | `@media (prefers-reduced-motion)` — wyłącza animations, transitions |
| LCP images | `loading="eager" fetchpriority="high"` na hero images |
| Code splitting | `three`, `react-vendor`, `helmet` (oddzielne chunki) |
| Sitemapa | `/public/sitemap.xml` — 57 stron |
| Cloudflare | `.npmrc: optional=true` (fix dla lightningcss na CI) |

---

## 16. Struktura plików (kluczowe)

```
src/
  pages/
    Home.jsx          ← Strona główna (gateway cards, brand, quick quote, blog, CTA)
    Jewelry.jsx       ← Strona biżuteria
    Studio.jsx        ← Strona studio
    ToolsJewelry.jsx  ← Narzędzia dla jubilerów
    ToolsStudio.jsx   ← Narzędzia dla makerów
    Blog.jsx, BlogPost.jsx
    Contact.jsx
    About.jsx, Privacy.jsx, Warranty.jsx, Returns.jsx, Shipping.jsx
    Glossary.jsx, GlossaryTerm.jsx
    NotFound.jsx
  components/
    Navbar.jsx
    Footer.jsx
    GoogleReviews.jsx
    TrustpilotWidget.jsx
    NewsletterForm.jsx
    Breadcrumb.jsx
    FAQ.jsx, Tips.jsx, Portfolio.jsx, ProcessGallery.jsx
    JewelryEstimator.jsx, StudioCalculator.jsx
    calculators/
      calcShared.jsx       ← Wspólne prymitywy wszystkich kalkulatorów
      JewelryCalc.jsx, StudioCalc.jsx
      SimpleJewelryCalc.jsx, SimpleStudioCalc.jsx
      PrintSettings3DCalc.jsx, LaserParametersTool.jsx
      RingBlankCalc.jsx, RingSizeCalc.jsx, AlloyCompositionCalc.jsx
      STLViewerCalc.jsx
    blog/
      BlogCard.jsx
  i18n/
    LanguageContext.jsx
    pl.js, en.js, de.js
  seo/
    SEOHead.jsx
    schemas.js           ← Organization, Service, FAQ, Breadcrumb, HowTo, Product, ItemList
    seoData.js           ← SEO per page × language (title, description, keywords, ogAlt)
  data/
    googleReviews.js     ← REVIEWS[], GOOGLE_BUSINESS (rating, totalReviews)
  blog/
    posts.js             ← Registry artykułów (getSortedPosts, getPost)
    posts/               ← Treść artykułów .jsx
  hooks/
    useScrollReveal.js   ← IntersectionObserver hooks
  utils/
    analytics.js         ← trackCTA(), trackInquiry(), trackFunnel()
public/
  brand-sign.webp
  hero-home-jewelry.webp, hero-home-studio.webp
  hero-jewelry.webp, hero-studio.webp
  og-default.jpg, og-jewelry.jpg, og-studio.jpg
  img/calc/home/*.webp   ← Kafelki STL (print3d, co2engrave, fiber, co2cut)
  img/calc/<kat>/<id>.png ← Kafelki kalkulatorów
  sitemap.xml, robots.txt
  _headers, _redirects   ← Cloudflare Pages
  llms.txt               ← AI crawlers description
.npmrc                   ← optional=true (Cloudflare Pages fix)
```

---

## 17. Deployment (Cloudflare Pages)

```
Build command: npm run build
Build output: dist/
Node version: 18+
.npmrc: optional=true  ← WYMAGANE — bez tego lightningcss nie instaluje się na Cloudflare

npm run build wykonuje:
  1. vite build           → dist/ (client bundle, 57+ stron)
  2. vite build --ssr     → dist/server/ (SSR entry)
  3. node scripts/prerender.mjs → statyczne HTML per route (SEO)
```

**Pliki Cloudflare:**
- `public/_headers` — Cache-Control, CSP, security headers
- `public/_redirects` — trailing slash normalizacja, SPA fallback

---

## 18. API i zewnętrzne zależności

| Endpoint | Cel | Użycie |
|----------|-----|--------|
| `VITE_CHAT_API_URL/api/market-rates` | Kursy Au/Ag/Pt/Pd, EUR/PLN/USD | Footer MarketRatesBar, kalkulatory |
| `VITE_CHAT_API_URL/api/lasers` | Macierz parametrów laserowania | LaserParametersTool |
| `VITE_CHAT_API_URL/api/filaments` | Parametry druku 3D | PrintSettings3DCalc |
| `VITE_CHAT_API_URL/api/chat` | Chatbot | ChatWidget |
| `VITE_CHAT_API_URL/api/inquiry` | Formularz zapytania | InquiryForm (calcShared) |
| `VITE_CHAT_API_URL/api/newsletter` | Zapis na newsletter | NewsletterForm |
| `VITE_CHAT_API_URL/api/reviews` | Google Reviews | GoogleReviews |

---

## 19. Przywrócenie stanu v1.0

Aby przywrócić serwis do stanu opisanego w tym dokumencie:

```bash
# 1. Checkout commit
git checkout a5eaa9f9d4ef611067a6e174a66cdc763e955329

# 2. Zainstaluj zależności
npm ci

# 3. Zbuduj
npm run build

# 4. Weryfikacja: powinno być 57+ stron, 0 błędów
```

**Kluczowe pliki do weryfikacji po przywróceniu:**
- `src/index.css` — tokeny CSS, glassmorphism utility, .gradient-divider
- `src/pages/Home.jsx` — gateway cards (overlay h-48 md:h-52, flex justify-between)
- `src/i18n/{pl,en,de}.js` — brak em-daszów w wartościach widocznych dla użytkownika
- `.npmrc` — `optional=true`
- `src/components/Navbar.jsx` — h-16, scrolled state, dropdown logic
- `src/components/Footer.jsx` — MarketRatesBar, socials, NewsletterForm

---

## 20. Zmiany od stanu bazowego do v1.0

| # | Zmiana | Pliki |
|---|--------|-------|
| 1 | Kompaktowy hero — zastąpiono pełnoekranowe hero obrazem fade-to-page | `Home.jsx`, `Jewelry.jsx`, `Studio.jsx` |
| 2 | Gateway cards: vignette radial-gradient + premium glow buttons | `Home.jsx` |
| 3 | Gateway cards: wyrównanie eyebrow + opis (flex justify-between trick) | `Home.jsx` |
| 4 | Gateway cards: zmniejszony overlay (h-48/h-52), mniejsza przerwa desc→button | `Home.jsx` |
| 5 | Zmniejszone odstępy sekcji (py-12 zamiast py-20, pb-3 zamiast pb-10) | `Home.jsx` |
| 6 | Usunięcie em-daszów (` — ` → `, `) w całym serwisie | 19 plików i18n + stron |
| 7 | CSS Design Tokens dodane do `:root` | `src/index.css` |
| 8 | Glassmorphism utility classes | `src/index.css` |
| 9 | Gradient divider `.gradient-divider` | `src/index.css` |
| 10 | Fix Cloudflare Pages build (lightningcss optional) | `.npmrc` |
| 11 | Brand name `AEJaCA sTuDiO` (intercap) — audit i poprawki | i18n, Navbar, Footer, Studio.jsx |
| 12 | Process steps zero-padded (`01`..`06`) | `Jewelry.jsx`, `Studio.jsx` |
| 13 | Eyebrow typography standaryzacja | `Home.jsx`, `Jewelry.jsx`, `Studio.jsx` |

---

*Dokument wygenerowany: 2026-05-20 | AEJaCA Design System v1.0*
