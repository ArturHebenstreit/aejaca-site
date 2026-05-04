# AEJaCA — Pełne podsumowanie projektu (Handoff)

Dokument dla nowej sesji Claude Code z dostępem do n8n MCP.

---

## 1. Architektura systemu

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                              │
│  React 19 + Vite 6 + Tailwind CSS v4                           │
│  https://www.aejaca.com                                         │
│  Branch: main → auto-deploy                                     │
│  Env vars (VITE_*) baked at build time                          │
└──────────┬──────────────┬──────────────┬────────────────────────┘
           │              │              │
     POST /api/chat  POST /webhook/   POST /webhook/
     (SSE stream)    quote-capture    newsletter-signup
           │              │              │
           ▼              ▼              ▼
┌──────────────┐  ┌──────────────────────────────┐
│ RAILWAY:     │  │ RAILWAY: n8n                  │
│ Chat API     │  │ https://primary-fhhi-         │
│ Express +    │  │ production.up.railway.app     │
│ OpenAI       │  │                               │
│ GPT-4o-mini  │  │ Workflows:                    │
│              │  │ • Newsletter signup → DB+Email│
│ aejacachat   │  │ • Quote follow-up → DB+Email  │
│ api-prod..   │  │   (immediate + 48h + 7d)      │
└──────┬───────┘  └──────────────┬────────────────┘
       │                         │
       │    ┌────────────────────┘
       ▼    ▼
┌──────────────────┐    ┌──────────────────────────┐
│ RAILWAY:         │    │ RAILWAY: Admin Panel      │
│ PostgreSQL       │    │ Express + EJS + Passport  │
│ (Postgres-AEJaCA)│    │ Google OAuth              │
│                  │◄───│ aejacaadmin-production.   │
│ Tables:          │    │ up.railway.app            │
│ • leads          │    └──────────────────────────┘
│ • subscribers    │
│ • conversations  │
└──────────────────┘
```

---

## 2. Usługi Railway — adresy i konfiguracja

### 2a. n8n (workflow automation)
- **URL**: `https://primary-fhhi-production.up.railway.app`
- **MCP endpoint**: `https://primary-fhhi-production.up.railway.app/mcp-server/http`
- **MCP Auth**: Bearer token (JWT) — patrz `.mcp.json` w repo
- **Webhook URLs** (produkcja, po aktywacji workflow):
  - Newsletter: `/webhook/newsletter-signup`
  - Quote: `/webhook/quote-capture`
- **Uwaga**: Webhook URL w trybie testowym ma prefix `/webhook-test/` zamiast `/webhook/`

### 2b. Chat API
- **URL**: `https://aejacachatapi-production.up.railway.app`
- **Root Directory**: `chat-api`
- **Env vars wymagane**:
  - `OPENAI_API_KEY` — klucz OpenAI
  - `DATABASE_URL` — connection string do Postgres-AEJaCA (musi kończyć się na `/railway`)
  - `NODE_ENV=production`

### 2c. Admin Panel
- **URL**: `https://aejacaadmin-production.up.railway.app`
- **Root Directory**: `admin`
- **Env vars wymagane**:
  - `DATABASE_URL` — connection string do Postgres-AEJaCA (musi kończyć się na `/railway`)
  - `GOOGLE_CLIENT_ID` — Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
  - `CALLBACK_URL` — `https://aejacaadmin-production.up.railway.app/auth/google/callback`
  - `SESSION_SECRET` — losowy string
  - `ALLOWED_EMAIL` — `aejaca@gmail.com`
  - `NODE_ENV=production`
- **Google Console**: Redirect URI musi pasować do CALLBACK_URL
- **Uwaga**: `trust proxy` + `secure: true` + `sameSite: "lax"` — już naprawione w kodzie

### 2d. PostgreSQL (Postgres-AEJaCA)
- Tabele: `leads`, `subscribers`, `conversations`
- Schema: `/home/user/aejaca-site/n8n/db/init.sql`
- **WAŻNE**: DATABASE_URL z Railway reference variable czasem nie ma nazwy bazy — trzeba ręcznie dodać `/railway` na końcu

---

## 3. Zmienne środowiskowe frontend (Cloudflare Pages)

Plik `.env` (lokalne dev):
```
VITE_QUOTE_API_URL=https://primary-fhhi-production.up.railway.app/webhook/quote-capture
VITE_NEWSLETTER_API_URL=https://primary-fhhi-production.up.railway.app/webhook/newsletter-signup
VITE_CHAT_API_URL=https://aejacachatapi-production.up.railway.app
```

**UWAGA**: URL-e w `.env` mogą być nieaktualne (`primary-production-634f2` vs `primary-fhhi-production`). Sprawdź aktualny URL n8n na Railway i zaktualizuj. Te zmienne muszą być też ustawione w Cloudflare Pages → Settings → Environment Variables, bo Vite bake'uje je w build.

---

## 4. Pliki kluczowe — mapa

### Frontend (Cloudflare Pages)
```
src/
  components/
    NewsletterForm.jsx      # Newsletter signup → VITE_NEWSLETTER_API_URL
    ChatWidget.jsx           # AI chat widget → VITE_CHAT_API_URL/api/chat (SSE)
    calculators/
      calcShared.jsx         # QuoteEmailCapture → VITE_QUOTE_API_URL
                             # InquiryForm → mailto:contact@aejaca.com
  i18n/
    pl.js, en.js, de.js      # Tłumaczenia (3 języki, muszą być zsync)
  seo/
    SEOHead.jsx, schemas.js  # SEO + structured data
```

### Backend (Railway)
```
chat-api/
  server.js                  # Express + OpenAI streaming + rate limiting
  context.js                 # System prompt + hot lead detection
  package.json               # express, cors, openai, pg

admin/
  server.js                  # Express + Google OAuth + EJS dashboard
  views/                     # login, dashboard, leads, subscribers, conversations, error
  package.json               # express, passport, pg, ejs
```

### n8n workflows + szablony
```
n8n/
  newsletter-workflow.json   # Workflow: signup → validate → DB + email + notify
  quote-followup-workflow.json # Workflow: quote → DB + email + 48h followup + 7d discount
  db/
    init.sql                 # Schema 3 tabel (leads, subscribers, conversations)
  emails/
    newsletter-welcome.html  # Email: kod AEJACA10 (-10%)
    quote-immediate.html     # Email: potwierdzenie wyceny
    followup-48h.html        # Email: follow-up po 48h
    discount-7d.html         # Email: kod AEJACA5 (-5%) po 7 dniach
```

---

## 5. n8n MCP — konfiguracja połączenia

Plik `.mcp.json` w repozytorium zawiera konfigurację n8n MCP:
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "type": "http",
      "url": "https://primary-fhhi-production.up.railway.app/mcp-server/http",
      "headers": {
        "Authorization": "Bearer <JWT_TOKEN>"
      }
    }
  }
}
```

Token JWT jest w pliku `.mcp.json`. Nowa sesja powinna automatycznie go pobrać jeśli pracuje na tym samym repo.

---

## 6. AKTUALNY STATUS — co działa, co nie

### ✅ Działa
- **Admin panel** — logowanie Google OAuth, dashboard, listy leads/subscribers/conversations, eksport CSV
- **Chat widget** — streaming GPT-4o-mini, zapis do PostgreSQL, hot lead detection
- **Strona frontendowa** — kalkulatory, blog, SEO, i18n (pl/en/de)
- **n8n webhooks** — odbierają requesty, zwracają 200 OK (po naprawie "Respond OK" → "No Data")

### ❌ Wymaga naprawy w n8n

#### Problem 1: Newsletter workflow — Validate Email node
**Objaw**: Dane przechodzą webhook → Respond OK → Validate Email, ale ZAWSZE idą do False Branch. Downstream node'y (PostgreSQL, Gmail x2) się nie wykonują.

**Przyczyna**: Node "Validate Email" (IF) miał pustą konfigurację warunków po imporcie. Dodaliśmy warunek `{{ $json.body.email }}` is not empty, ale nadal nie działa — prawdopodobnie pole nie jest w trybie Expression (n8n traktuje wyrażenie jako tekst).

**Rozwiązanie**: **Usunąć node "Validate Email"** i połączyć "Respond OK" bezpośrednio z 3 downstream node'ami:
- Respond OK → Save to PostgreSQL
- Respond OK → Send Welcome + Discount
- Respond OK → Notify Owner

Frontend już waliduje email (regex + `required`), więc walidacja w n8n jest zbędna.

#### Problem 2: Quote workflow — Validate Data node
**Prawdopodobnie ten sam problem** co w Newsletter. Warunek IF może nie działać po imporcie. Trzeba sprawdzić i ewentualnie też usunąć.

#### Problem 3: Gmail OAuth2 credentials
Nie wiadomo czy Gmail OAuth2 jest poprawnie skonfigurowany w n8n. Node'y "Send Welcome + Discount", "Notify Owner", "Send Quote Email", "Follow-up 48h", "Discount offer (7d)" wymagają działających Gmail credentials.

**Do zrobienia**:
1. W n8n sprawdzić/skonfigurować Gmail OAuth2 credentials
2. Przetestować wysyłkę emaili

#### Problem 4: PostgreSQL credentials w n8n
Node'y "Save to PostgreSQL" w obu workflow wymagają Railway PostgreSQL credentials. Sprawdzić czy są podpięte (host, port, database=railway, user, password z Railway).

---

## 7. CO TRZEBA ZROBIĆ (kolejność)

### Priorytet 1: Naprawić Newsletter workflow
1. Usunąć node "Validate Email" (lub naprawić wyrażenie)
2. Połączyć Respond OK → 3 downstream node'y
3. Sprawdzić credentials PostgreSQL w node "Save to PostgreSQL"
4. Sprawdzić credentials Gmail w "Send Welcome + Discount" i "Notify Owner"
5. Aktywować workflow (WAŻNE — bez aktywacji webhook jest nieaktywny!)
6. Przetestować: newsletter signup na stronie → sprawdzić czy:
   - Subscriber pojawia się w tabeli `subscribers`
   - Email z kodem AEJACA10 dochodzi do subskrybenta
   - Owner dostaje notyfikację

### Priorytet 2: Naprawić Quote workflow
1. Sprawdzić node "Validate Data" — ten sam problem co Validate Email?
2. Jeśli tak — usunąć i połączyć bezpośrednio
3. Sprawdzić credentials PostgreSQL i Gmail
4. Przetestować: kalkulator → podanie emaila → sprawdzić czy:
   - Lead pojawia się w tabeli `leads`
   - Email z wyceną dochodzi
   - Owner dostaje notyfikację
   - Po 48h wysyła się follow-up (nie trzeba czekać — można skrócić wait dla testu)

### Priorytet 3: Sprawdzić VITE_* URL-e
- Porównać URL-e w `.env` z aktualnymi URL-ami na Railway
- Jeśli się różnią — zaktualizować `.env` i przebudować na Cloudflare Pages
- `VITE_CHAT_API_URL` nie jest w `.env` — dodać!

### Priorytet 4: Merge do main
- Branch `claude/review-repository-ZAITI` ma wszystkie zmiany
- Merge do `main` → auto-deploy na Cloudflare Pages
- Po merge sprawdzić czy VITE_* vars są ustawione w Cloudflare Dashboard

---

## 8. Struktura danych webhooków

### Newsletter signup (POST /webhook/newsletter-signup)
```json
{
  "email": "user@example.com",
  "lang": "pl",
  "source": "footer",
  "ts": "2026-05-04T10:02:33.549Z"
}
```
Frontend: `NewsletterForm.jsx` linia 70

### Quote capture (POST /webhook/quote-capture)
```json
{
  "email": "user@example.com",
  "lang": "pl",
  "calculator": "3D Print (FDM)",
  "params": "Material: PLA, Infill: 20%, Size: 10x10x5cm",
  "price": {
    "perPcPLN": { "min": 25, "max": 45 },
    "perPcEUR": { "min": 6, "max": 11 },
    "qty": 1,
    "discount": 0
  },
  "ts": "2026-05-04T10:02:33.549Z"
}
```
Frontend: `calcShared.jsx` → `QuoteEmailCapture` komponent

### Chat API (POST /api/chat)
```json
{
  "messages": [
    { "role": "user", "content": "Ile kosztuje pierścionek z szafirem?" }
  ],
  "lang": "pl",
  "sessionId": "chat_1714820553549_abc123"
}
```
Response: SSE stream (`text/event-stream`), format: `data: {"choices":[{"delta":{"content":"..."}}]}\n\n`
Frontend: `ChatWidget.jsx`

---

## 9. Szablony emaili — zmienne n8n

### newsletter-welcome.html
Zmienne: `{{ $json.body.email }}`, `{{ $json.body.lang }}`
Kod rabatowy: **AEJACA10** (stały, -10%, bez daty ważności)

### quote-immediate.html
Zmienne: `$json.body.email`, `.lang`, `.calculator`, `.params`, `.price.perPcPLN.min/max`, `.price.perPcEUR.min/max`, `.price.qty`

### followup-48h.html / discount-7d.html
Zmienne przez referencję do webhook node'a: `$('Webhook — Quote Received').item.json.body.*`
Kod rabatowy (7d): **AEJACA5** (stały, -5%)

---

## 10. Git — stan

- **Branch roboczy**: `claude/review-repository-ZAITI`
- **Ostatni commit**: `Add founder info to chat assistant knowledge base`
- **Branch produkcyjny**: `main` (Cloudflare Pages auto-deploy)
- **Status**: Working tree clean, wszystko commitnięte
- **Railway deploy**: z brancha wskazanego w Railway settings (prawdopodobnie `main` — trzeba zmerge'ować)

---

## 11. Znane pułapki

1. **Railway DATABASE_URL** — reference variable z Railway czasem nie zawiera nazwy bazy. Trzeba ręcznie dodać `/railway` na końcu.
2. **n8n expression mode** — wpisanie `{{ $json.body.email }}` w polu IF node nie działa jeśli pole jest w trybie "Fixed" zamiast "Expression". Import workflow JSON nie zawsze prawidłowo ustawia typ pola.
3. **n8n "Respond to Webhook" + JSON** — `responseBody: "={ ... }"` powoduje "Invalid JSON in Response Body". Rozwiązanie: "Respond With" = "No Data" (frontend sprawdza tylko `res.ok`, nie parsuje body).
4. **n8n workflow activation** — po każdej zmianie workflow MUSI być aktywowany (toggle w prawym górnym rogu). Bez tego webhoki nie działają (zwracają 404).
5. **Cloudflare Pages VITE_*** — zmienne są bake'owane w build. Po zmianie trzeba przebudować (redeploy).
6. **Google OAuth consent screen** — jeśli w trybie "Testing", tylko dodane test users mogą się logować. Dodać `aejaca@gmail.com` jako test user.
7. **Railway reverse proxy** — wymaga `trust proxy: 1` + `secure: true` + `sameSite: "lax"` dla cookies sesji (już naprawione w kodzie admin).
