# AEJaCA — Pełny przegląd projektu

Dokument opisuje **całość projektu aejaca.com** — aktualny stan techniczny, treściowy i biznesowy oraz plan rozwoju. Służy jako:

- **onboarding** dla nowego dewelopera lub agenta AI wchodzącego w projekt,
- **strategic overview** dla właściciela marki,
- **referencja** dla decyzji architektonicznych (SEO, e-commerce, automatyzacja).

---

## 1. Misja i marka

**AEJaCA** = **A**rtisan **E**legance **J**ewelry **a**nd **C**rafted **A**rt.

Polskie studio łączące dwie komplementarne marki:

| Marka | Specjalizacja | Paleta wizualna |
|---|---|---|
| **AEJaCA Jewelry** | Ręcznie robiona biżuteria ze srebra 925 i złota 14k/18k z kamieniami naturalnymi (pierścionki zaręczynowe, kolczyki, wisiorki, bransoletki, biżuteria na zamówienie, renowacje, naprawy) | amber / rose |
| **AEJaCA sTuDiO** | Digital fabrication — druk 3D (FDM/SLA, Bambu Lab H2D), grawerowanie laserowe (CO2 xTool P2, Fiber Raycus), odlewy żywiczne UV/2K, prototypowanie | blue / emerald |

**Pozycjonowanie**: premium, rzemiosło + technologia, dwujęzyczność (PL/EN/DE), online-first (kalkulatory + STL/SVG upload + AI assistant).

**Założyciel**: Artur Hebenstreit (od 2023, 150+ projektów, ocena 5.0 na Google).

**Wdrożenie**: [https://www.aejaca.com](https://www.aejaca.com) (Cloudflare Pages, auto-deploy z `main`).

**Kluczowy wyróżnik**: bezpośrednia wycena online z STL/SVG → kalkulator → quote email → automatyczny follow-up. Klient otrzymuje cenę zanim nas zna.

---

## 2. Stack technologiczny

### Frontend

| Warstwa | Technologia |
|---|---|
| Framework UI | **React 19** (faktycznie `react@^18.2.0` w `package.json`, dryfuje w stronę 19) |
| Build / dev | **Vite 6** |
| Stylowanie | **Tailwind CSS v4** (theme variables, no `tailwind.config.js`) |
| Routing | **react-router-dom v7** (SPA) |
| Ikony | **lucide-react** |
| 3D / STL | **three.js** (`STLViewer.jsx`) |
| SEO meta | **react-helmet-async** |
| SSR / prerender | `vite-plugin-ssr` + `scripts/prerender.mjs` (build dwustopniowy: client + SSR + prerender HTML) |
| Obróbka obrazów | **sharp** (build-time WebP) |

### Backend (Railway, Node + Express)

| Usługa | Folder | Stack |
|---|---|---|
| **Chat API** | `/chat-api/` | Express + OpenAI SDK (GPT-4o-mini) + `pg` (PostgreSQL), SSE streaming, rate limiting |
| **Admin Panel** | `/admin/` | Express + Passport.js (Google OAuth) + EJS + `pg` |
| **n8n** | `/n8n/` (definicje workflow) | hostowany jako osobna usługa Railway |

### Dane

| System | Zawartość |
|---|---|
| **PostgreSQL** (Railway) | `leads`, `subscribers`, `conversations`, `analytics_events` |
| **Google Drive** | Załączniki kontaktów (folder Kontakty) i wycen (folder Wyceny) |
| **i18n** w repo | `src/i18n/{pl,en,de}.js` — pełna treść użytkownicka |
| `src/blog/posts.js` | Rejestr postów blogowych |
| `src/data/googleReviews.js` | Recenzje Google (do `aggregateRating` i UI) |

### Hosting

| Co | Gdzie |
|---|---|
| Frontend (statyczny) | **Cloudflare Pages** — `public/_headers`, `public/_redirects`, build = `npm run build`, deploy z `main` |
| Chat API | **Railway** — `aejacachatapi-production.up.railway.app` |
| Admin Panel | **Railway** — `aejacaadmin-production.up.railway.app` |
| n8n | **Railway** — `primary-fhhi-production.up.railway.app` |
| PostgreSQL | **Railway** (Postgres-AEJaCA) |

### Zmienne środowiskowe (frontend, baked-in)

```
VITE_QUOTE_API_URL       → https://primary-fhhi-production.up.railway.app/webhook/quote-capture
VITE_NEWSLETTER_API_URL  → https://primary-fhhi-production.up.railway.app/webhook/newsletter-signup
VITE_CHAT_API_URL        → https://aejacachatapi-production.up.railway.app
```

Po zmianie wymagany rebuild Cloudflare Pages.

---

## 3. Struktura stron i nawigacja

### Routing (`src/App.jsx`)

```
/                       Home              — hero dwustronny (Jewelry / Studio), tipy, CTA
/jewelry/               Jewelry           — sekcje, kalkulator JewelryCalc, FAQ
/studio/                Studio            — sekcje, kalkulatory studyjne, FAQ
/about/                 About             — historia, sprzęt, certyfikaty, recenzje Google
/gallery/               Gallery           — realizacje (planowane lub w trakcie)
/contact/               Contact           — formularz → n8n → Drive → email
/blog/                  BlogIndex         — lista postów (PL/EN/DE)
/blog/:slug/            BlogPost          — pojedynczy artykuł, Article schema
/glossary/              Glossary          — słownik pojęć (jubilerstwo, druk 3D, laser)
/glossary/:term/        GlossaryTerm
/privacy/               Privacy           — RODO, cookies
/warranty/              Warranty          — gwarancja 24m
/returns/               Returns           — 14-dniowe odstąpienie
/shipping/              Shipping          — InPost, paczkomat, darmowa od 400 PLN
*                       NotFound          — 404 z linkami nawigacyjnymi
```

### Navbar (`src/components/Navbar.jsx`)

Pasek górny zawiera następujące pozycje (z dropdown sections):

| Pozycja | Sekcje (drilldown) |
|---|---|
| Home | — |
| Jewelry | sekcje strony jewelry (anchor scroll) |
| Studio | sekcje strony studio (anchor scroll) |
| Gallery | sub-linki (placeholder, route preventDefault) |
| About | sekcje about |
| **Resources** | **Blog**, **Glossary** (planowane: **Tools**) |
| Contact | — |

Po prawej: język (PL/EN/DE) z flagami, mobilny hamburger.

### Strony — cele i CTA

| Strona | Cel | Główne CTA |
|---|---|---|
| Home | First impression, podział marek, prowadzi do Jewelry / Studio / Calc | "Wyceń online", "Zobacz biżuterię", "Zobacz studio" |
| Jewelry | Konwersja na zamówienie biżuterii | `JewelryCalc` + InquiryForm |
| Studio | Konwersja na druk 3D / laser / odlewy | `StudioCalc` (STL/SVG upload) + InquiryForm |
| About | Trust signals — założyciel, sprzęt, recenzje | "Skontaktuj się", "Sprawdź wycenę" |
| Blog / Glossary | SEO (long-tail keywords, AI Overviews) | Subskrypcja newslettera, link do kalkulatorów |
| Contact | Ostatnia bramka konwersji | Formularz + email + chat |

---

## 4. Komponenty kalkulatorów (`src/components/calculators/`)

| Plik | Rola |
|---|---|
| `JewelryCalc.jsx` | Pełny kalkulator biżuterii — wybór typu (pierścionek/kolczyki/wisiorek/bransoletka), materiał (Ag925, 14k/18k yellow/white/rose), kamień, rozmiar, grawer |
| `SimpleJewelryCalc.jsx` | Wersja uproszczona (osadzona na Home / cards) |
| `Print3DCalc.jsx` | Druk 3D — STL upload (objętość, czas), materiał (PLA/PETG/ABS/ASA/TPU/żywica), infill, post-processing |
| `CO2LaserCalc.jsx` | Laser CO2 — SVG/AI/PDF upload, materiał (drewno/akryl/skóra/MDF), długość cięć + powierzchnia grawerunku |
| `FiberLaserCalc.jsx` | Laser Fiber — grawerowanie metali, oznaczenia anodowane, plotter |
| `EpoxyCastCalc.jsx` | Odlewy żywiczne — geometria formy, objętość żywicy, pigmenty |
| `SimpleStudioCalc.jsx` | Wersja uproszczona kalkulatorów studyjnych (na Home) |
| `STLViewer.jsx` | Three.js viewer — drag & drop STL, obrót, statystyki (objętość, BB) |
| `SVGUploadCard.jsx` | Upload SVG/PDF/AI z parsowaniem długości ścieżek (cięcie laserem) |
| `calcShared.jsx` | **Wspólne primitivy**: `MaterialCards`, `HeroCards`, `ResultDisplay`, `InquiryForm`, `QuoteEmailCapture`, `CalcCard`, helper `t()` |
| `jewelryConfig.js` | Współczynniki cenowe — gęstości metali, ceny rynkowe, narzuty robocizny |

### Przepływ wyceny

```
Klient otwiera kalkulator
  ↓
Wybiera parametry / uploaduje plik (STL/SVG)
  ↓
ResultDisplay pokazuje cenę (PLN min–max + EUR min–max)
  ↓
QuoteEmailCapture: klient wpisuje email
  ↓
POST → VITE_QUOTE_API_URL (n8n webhook /quote-capture)
  ↓
n8n: zapis do Drive + DB + email do klienta + notyfikacja właściciela
  ↓
Wait 48h → follow-up email
  ↓
Wait 5 dni → email z rabatem -5% (kod AEJACA5)
```

---

## 5. System SEO

### Komponent `SEOHead` (`src/seo/SEOHead.jsx`)

Każda strona deklaruje:

```jsx
<SEOHead
  pageKey="jewelry"
  path="/jewelry/"
  schemas={[orgSchema, serviceSchema, faqSchema, breadcrumbSchema]}
/>
```

Renderuje przez `react-helmet-async`:

- `<title>` ≤ 60 znaków, `<meta name="description">` ≤ 155 znaków,
- Open Graph (og:title, og:description, og:image, og:locale),
- Twitter Cards,
- `<link rel="canonical">`,
- **hreflang** dla pl/en/de + `x-default`,
- JSON-LD `<script type="application/ld+json">` per schemat.

### Schematy JSON-LD (`src/seo/schemas.js`)

| Schemat | Funkcja | Gdzie używany |
|---|---|---|
| `buildOrganizationSchema` | Tożsamość firmy (logo, sameAs, founder) | Każda strona |
| `buildLocalBusinessSchema` | Geo, godziny otwarcia, zakres usług, oferta — local pack | Home, Contact |
| `buildWebPageSchema` | Per-page wrapper, lang, canonical | Każda strona |
| `buildBreadcrumbSchema` | Hierarchia stron | Sub-strony |
| `buildServiceSchema` | Usługa + cena (min/max) — SERP "service" | Jewelry, Studio |
| `buildArticleSchema` | Artykuł blog (headline, dates, author) | Blog posts |
| `buildProductSchema` | Produkt + offer + aggregateRating | (planowane: shop) |
| `buildHowToSchema` | Krok-po-kroku procesu | Strony procesowe |
| `buildFAQSchema` | Para pytań + odpowiedzi — AI Overviews | Jewelry, Studio, blog |
| `buildItemListSchema` | Karuzele produktów | Listy |
| `buildReviewsAugmentedOrganization` | Org + aggregateRating + Review[] z Google | Home, About |

### Pliki publiczne SEO

| Plik | Funkcja |
|---|---|
| `public/sitemap.xml` | Sitemap (wszystkie URL × 3 języki) |
| `public/robots.txt` | Allow all, link do sitemap |
| `public/llms.txt` | Opis dla AI crawlerów (ChatGPT, Perplexity, Gemini) |
| `public/og-*.jpg` | OG images per sekcja |
| `public/_headers` | Security + cache headers (Cloudflare) |
| `public/_redirects` | Redirecty (np. trailing slash) |

### Strategia słów kluczowych

**PL** — biżuteria na zamówienie, pierścionek zaręczynowy, kalkulator biżuterii online, druk 3D na zamówienie, kalkulator wyceny druku 3D online, wycena STL online, grawerowanie laserowe cena, kalkulator stopu złota, ring blank calculator pl.

**EN** — engagement rings online, custom jewelry calculator, 3D printing cost calculator online, STL upload instant quote, laser engraving price calculator, ring blank calculator, alloy calculator jewelry.

**DE** — Verlobungsring auf Bestellung, Schmuck-Preisrechner, 3D-Druck Preisrechner online, STL Sofort-Angebot, Lasergravur Preis Rechner.

---

## 6. System i18n

```
src/i18n/
├── LanguageContext.jsx   # useLanguage() hook + LANGUAGES const + provider
├── pl.js                 # baza (autor pisze tu pierwsze)
├── en.js                 # tłumaczenie
└── de.js                 # tłumaczenie
```

**Reguła**: każdy string user-facing siedzi w `src/i18n/{pl,en,de}.js`. Trzy pliki **muszą być w sync** — dodanie klucza wymaga uzupełnienia wszystkich trzech.

Hook `useLanguage()`:

```js
const { lang, setLang, t } = useLanguage();
// lang = "pl" | "en" | "de"
// t = obiekt całego słownika dla aktywnego języka
```

Wybrany język trzymany w `localStorage` + sync z `<html lang>`. Hreflang w `<head>` zawsze pokazuje wszystkie 3 wersje.

---

## 7. Asystent AI — `ChatWidget`

Komponent: `src/components/ChatWidget.jsx`. Floating button w prawym dolnym rogu z efektem `animate-ping` (puls amber).

| Cecha | Implementacja |
|---|---|
| Backend | Express (`chat-api/server.js`) na Railway |
| Model | OpenAI **GPT-4o-mini** (planowane: Claude przez Anthropic API jako tańszy/lepszy fallback) |
| Streaming | **SSE** (Server-Sent Events) — `text/event-stream`, format `data: {"content": "..."}\n\n` |
| Konfiguracja | `VITE_CHAT_API_URL` → `${API_URL}/api/chat` |
| Multilang | Headery + system prompt zależne od `lang` (pl/en/de) |
| Kontekst | `chat-api/context.js` — system prompt z wiedzą o AEJaCA, kalkulatorach, cenach + hot lead detection |
| Persystencja | Zapis pełnych konwersacji do `conversations` w PostgreSQL |
| UX | Quick chips (4 propozycje pytań), markdown links → React Router (internal), zewnętrzne `target="_blank"` |
| Sesja | `sessionId = chat_<ts>_<rand>` per otwarcie |

---

## 8. Automatyzacja n8n

Hostowany na Railway: `https://primary-fhhi-production.up.railway.app`. Workflow definiowane w `/n8n/*.json` (eksportowalne, wersjonowane w repo).

### 8a. Workflow: AEJaCA — Contact Form

```
Webhook (POST /webhook/contact) → Validate
   → Google Drive upload (folder: Kontakty)
       Drive ID = 14soVEHLGlKeD-3PDRwaUTTSFQZcyNZLe
   → Email notify owner z linkiem do Drive
```

### 8b. Workflow: AEJaCA — Quote Email Follow-up

```
Webhook (POST /webhook/quote-capture)
   ↓
Respond OK (zwrot 200 do frontu)
   ↓
Prepare Attachment
   ↓
[Has File?]  ─── true ──► Drive upload (folder: Wyceny, ID 1KU4O3P2YGSpKLuPo5d_Wjdt8Nc6oV-y9)
                              → Strip Binary
                              → Email owner (z linkiem Drive)
              ─── false ─► Email owner (bez pliku)

Równolegle (zawsze):
   ↓
Email do klienta (potwierdzenie wyceny)
   ↓
Wait 48h → Follow-up email
   ↓
Wait 5 dni → Discount offer email (kod AEJACA5, -5%)
```

### 8c. Workflow: Newsletter signup

```
Webhook (POST /webhook/newsletter-signup)
   → Zapis do tabeli `subscribers`
   → Email powitalny (kod AEJACA10, -10%)
   → Notify owner
```

### Struktura webhooków

```jsonc
// /webhook/quote-capture
{
  "email": "user@example.com",
  "lang": "pl",
  "calculator": "3D Print (FDM)",
  "params": "Material: PLA, Infill: 20%, Size: 10x10x5cm",
  "price": {
    "perPcPLN": { "min": 25, "max": 45 },
    "perPcEUR": { "min": 6, "max": 11 },
    "qty": 1, "discount": 0
  },
  "ts": "2026-05-04T10:02:33.549Z"
}
```

---

## 9. Panel administracyjny (`/admin`)

Hostowany na Railway: `https://aejacaadmin-production.up.railway.app`.

| Aspekt | Wartość |
|---|---|
| Auth | **Google OAuth** (Passport.js) — dostęp tylko `contact@aejaca.com` (`ALLOWED_EMAIL`) |
| Templating | EJS |
| Sesja | Express-session + `trust proxy: 1`, `secure: true`, `sameSite: lax` |

### Widoki

| Widok | Funkcja |
|---|---|
| `/login` | Google Sign-In button |
| `/dashboard` | KPI: liczba leadów, subskrybentów, konwersacji, hot leads (z ostatnich 7 dni) |
| `/leads` | Lista wszystkich wycen z kalkulatorów (filter, sort, export CSV) |
| `/subscribers` | Lista zapisów do newslettera |
| `/conversations` | Pełne logi rozmów z chatem AI (per session) |
| `/analytics` | Eventy custom (planowane: heatmapa CTA, conversion funnel) |
| `/export/*.csv` | Eksport CSV każdej tabeli |

### Schema PostgreSQL (`/n8n/db/init.sql`)

```sql
leads (id, email, lang, calculator, params, price_json, file_url, created_at)
subscribers (id, email, lang, source, created_at, unsub_at)
conversations (id, session_id, role, content, lang, hot_lead, created_at)
analytics_events (id, event_name, data_json, created_at)
```

---

## 10. Planowane: `/tools/` — narzędzia dla jubilerów

### Myśl przewodnia

> Gdy zaczynałem jako samouk jubilerski, napotykałem brak wiedzy, narzędzi i kalkulatorów. Przez lata zbierałem wiedzę od mistrzów. Teraz przyszedł czas, by się nią podzielić — część bezpłatnie, bo wiem jak to jest zaczynać. Perełki zostawiam dla tych, którzy cenią trud ich zebrania.

### Struktura

```
/tools/
├── DARMOWE — bez logowania:
│   ├── Ring Blank Calculator     (długość paska metalu → rozmiar pierścionka)
│   ├── Alloy Calculator          (skład stopu: 14k yellow / white / rose)
│   ├── Gemstone Weight Calculator (waga z wymiarów × gęstość)
│   └── Casting Shrinkage Calc    (kompensacja skurczu odlewu)
│
├── PREMIUM — jednorazowy zakup (Stripe Checkout):
│   ├── eBooki jubilerskie (PDF)
│   ├── Pliki SVG do laserów
│   └── Modele 3D (STL/STEP)
│
└── SUBSKRYPCJA — Stripe Billing (miesięczna / roczna):
    ├── Wszystkie kalkulatory pro
    ├── Cała biblioteka eBooków
    └── Nowe materiały co miesiąc
```

### SEO target

`ring blank calculator`, `alloy calculator jewelry`, `kalkulator jubilerski`, `kalkulator stopu złota`, `gemstone weight calculator`, `casting shrinkage`, `kalkulator wagi kamienia`.

### Dostęp w nawigacji

Rozszerzenie sekcji **Resources**: `Blog · Glossary` → `Blog · Glossary · Tools`. CTA z `Jewelry` i `Studio`: "Sprawdź narzędzia jubilerskie".

---

## 11. Planowane: `/shop/` — szybki sklep fizyczny

Produkty: **szkatułki z grawerem**, **bransoletki z kamieni**, **standy NFC**, **breloki NFC**, **gotowa biżuteria** (mała seria).

| Aspekt | Wartość |
|---|---|
| Płatności | **Stripe** (karty), **BLIK** (Polska), **Apple Pay / Google Pay** |
| Waluty | PLN (PL), EUR (EU) |
| Wysyłka | InPost paczkomat / kurier; darmowa od 400 PLN |
| Zwroty | 14 dni (prawo konsumenckie EU); spersonalizowane wyłączone |

---

## 12. Architektura Stripe (plan)

Stripe jako **jedna platforma** dla wszystkich płatności (cyfrowe + fizyczne + subskrypcje).

```
┌──────────────────────────────────────────────────────────┐
│  STRIPE                                                   │
│                                                            │
│  Cyfrowe (/tools/):                                        │
│   • Stripe Billing  → subskrypcje                         │
│   • Stripe Checkout → jednorazowe (eBooks, SVG)           │
│   • Stripe Tax      → VAT EU automatyczny                 │
│                                                            │
│  Fizyczne (/shop/):                                        │
│   • Stripe Elements → embedded checkout                   │
│   • BLIK            → Polska                              │
│   • Apple Pay / Google Pay                                │
└────────────────────────┬─────────────────────────────────┘
                         │ webhooks
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Railway backend (Express endpoint /api/stripe/webhook)  │
│                                                            │
│   payment_intent.succeeded     → zapisz purchase          │
│   invoice.payment_succeeded    → aktywuj subscription     │
│   customer.subscription.updated→ aktualizuj dostęp        │
│   charge.refunded              → anuluj dostęp            │
└──────────────────────────────────────────────────────────┘
```

### Tabele DB do dodania

```sql
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  google_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP
);

purchases (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  stripe_payment_id VARCHAR(255),
  product_id VARCHAR(100),
  amount_eur DECIMAL(10,2),
  paid_at TIMESTAMP
);

subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50),
  status VARCHAR(50),
  current_period_end TIMESTAMP
);

orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  stripe_payment_id VARCHAR(255),
  items JSONB,
  shipping_address JSONB,
  status VARCHAR(50),
  amount_pln DECIMAL(10,2)
);
```

### Logika użytkowników

- **Google Sign-In** na publicznej stronie (osobno od admin OAuth) → JWT do API.
- `stripe_customer_id` powiązany z `users.email`.
- Tokeny JWT w `httpOnly` cookie + refresh.

### Faktury i KSeF

| Scenariusz | Faktura |
|---|---|
| B2C bez NIP (PL) | Paragon |
| B2B z NIP PL | Faktura **KSeF** (Fakturownia API) |
| EU bez NIP PL | Faktura VAT (nie KSeF) |
| Klient spoza EU | Faktura VAT 0% (eksport) |

Stripe Tax oblicza VAT per kraj; **Fakturownia API** generuje faktury KSeF-kompatybilne i wysyła klientowi PDF.

### Zwroty

- **Cyfrowe** — 14 dni, **jeśli nie pobrano** (prawo EU + flag `downloaded_at`).
- **Fizyczne** — 14 dni prawo konsumenckie (oprócz personalizowanych).
- Mechanizm: `stripe.refunds.create()` → webhook `charge.refunded` → DB update + email klientowi.

---

## 13. Strategia CTA (konwersja)

| Warstwa | Element | Cel |
|---|---|---|
| Above the fold | "Wyceń online" / "Wyceń STL/SVG" | Mobile-first, widoczny < 1s od LCP |
| Floating | **ChatWidget** | Zawsze dostępna pomoc + qualified leads |
| Sub-strona usługowa | Kalkulator inline | Konwersja bez kontaktu z człowiekiem |
| Resources | "Sprawdź narzędzia" (gdy `/tools/` ready) | Cross-sell społeczność jubilerów |
| Footer | Newsletter `-10%` (AEJACA10) | Lead magnet |
| Blog post | CTA do kalkulatora związanego z tematem | Long-tail → konwersja |
| Quote follow-up | 48h email + 5d discount | Domknięcie cyklu sprzedaży |

---

## 14. Roadmap implementacji

### Faza 1 — gotowe

- [x] Strona główna + podstrony (PL/EN/DE)
- [x] Kalkulatory wyceny (Jewelry: full + simple; Studio: 3D Print, CO2 Laser, Fiber Laser, Epoxy Cast + simple)
- [x] STLViewer (three.js) + SVGUploadCard
- [x] Blog + Glossary (3 języki)
- [x] Asystent AI (ChatWidget + chat-api Railway)
- [x] Formularze kontaktowe → n8n → Drive → email
- [x] Quote follow-up automation (immediate + 48h + 5d/7d)
- [x] Newsletter signup (kod AEJACA10)
- [x] Panel administracyjny (Google OAuth, dashboard, eksport CSV)
- [x] SEO (schematy JSON-LD: Org, LocalBusiness, Service, FAQ, Article, HowTo, Breadcrumb, Product, ItemList, Review)
- [x] Sitemap, hreflang, llms.txt
- [x] Cloudflare Pages deployment z prerenderem

### Faza 2 — w toku / zaplanowane

- [ ] `/tools/` — darmowe kalkulatory jubilerskie (Ring Blank, Alloy, Gemstone Weight, Casting Shrinkage)
- [ ] Google Sign-In na stronie publicznej (poza admin)
- [ ] Tabele `users`, `purchases`, `subscriptions`, `orders`
- [ ] Stripe integracja — Checkout + Billing + Elements + Tax
- [ ] `/shop/` — sklep fizyczny z BLIK
- [ ] Fakturownia API + KSeF
- [ ] Webhook endpoint `/api/stripe/webhook` (Railway)
- [ ] Pełne `/gallery/` z realizacjami (zdjęcia + opis)

### Faza 3 — przyszłość

- [ ] eBooki jubilerskie — pierwsze produkty premium
- [ ] Pliki SVG / Modele 3D do sprzedaży (zaczynając od najpopularniejszych)
- [ ] Subskrypcja jubilerska (miesięczna / roczna)
- [ ] **Gemini AI w n8n** — analiza projektów klienta (zdjęcie referencyjne → wycena AI)
- [ ] Etsy integration (auto-sync SVG bundles)
- [ ] AI Overviews monitoring (czy ChatGPT/Perplexity cytują aejaca.com)
- [ ] A/B testing CTA via Cloudflare Workers

---

## 15. Konwencje pracy

### Workflow

- Branch roboczy: `claude/<topic>-<short-id>`
- Commit message: 1–2 zdania **dlaczego**, nie co
- Footer commitów: `https://claude.ai/code/session_...`
- Push: `git push -u origin <branch>` — branch musi zaczynać się od `claude/`
- Merge do `main` → auto-deploy Cloudflare Pages
- Po zmianie `VITE_*` env → manual rebuild w Cloudflare

### Routing modeli (zgodnie z `CLAUDE.md`)

| Zadanie | Model |
|---|---|
| Lookup / search / read | Haiku (`@quick`, `@researcher`) |
| Single-file feature / fix | Opus (main) |
| Multi-file (3+) plan + impl. | Sonnet (`@dev`) |
| Architektura / SEO / refaktor | Opus (`@architect`) |
| Generowanie obrazów | Haiku (`@image-gen`, Gemini MCP) |

### Konwencje kodu

- **i18n**: każda nowa string-key w trzech językach (pl/en/de) jednocześnie.
- **SEO**: każda strona ma `<SEOHead pageKey="..." path="..." schemas={[...]} />`.
- **Tailwind**: theme przez vars, brand-colors: jewelry = amber/rose, studio = blue/emerald, tips = amber.
- **Obrazy**: `/public/img/calc/<category>/<id>.png`. Styl produktowy: czarne tło, key-light upper-left. Generuje Gemini MCP.
- **Reveal**: `useScrollReveal()` + klasa `.reveal` / `.reveal-scale` / `.reveal-left` / `.reveal-right`.
- **Build sprawdzający**: `npm run build` po strukturalnych zmianach (vite client + ssr + prerender).

---

## 16. Kontakt

- **Email**: contact@aejaca.com
- **Telefon**: +48 780 737 786
- **Założyciel**: Artur Hebenstreit
- **Marketplaces**: [Etsy Jewelry](https://aejacashop.etsy.com), [Etsy Studio](https://aejaca2studio.etsy.com)
- **Social**: [Instagram](https://www.instagram.com/aejaca_), [TikTok](https://www.tiktok.com/@aejaca_), [Facebook](https://www.facebook.com/people/Artisan-Elegance-Jewelry-and-Crafted-Art/61570057929428/), [YouTube](https://www.youtube.com/@aejaca)

---

*Ostatnia aktualizacja: 2026-05-07. Dokument utrzymywany przez zespół AEJaCA + Claude Code.*
