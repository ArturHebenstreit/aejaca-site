# AEJaCA Quote Follow-up — n8n + Gmail + PostgreSQL

## Architecture

```
User calculates price on aejaca.com
  → enters email, clicks "Wyślij"
    → POST to n8n webhook
      → n8n saves lead to PostgreSQL (Railway)
      → n8n sends confirmation email (Gmail)
      → notifies owner (contact@aejaca.com)
      → 48h later: follow-up email
      → 7 days later: 5% discount email
```

**Cost: ~0 PLN** — n8n (Railway) + Gmail (free) + PostgreSQL (Railway free tier: 1 GB).

---

## Step 1: Railway — Add PostgreSQL

1. Open Railway dashboard → your project
2. Click **+ New** → **Database** → **PostgreSQL**
3. Wait for provisioning (~30 seconds)
4. Go to the PostgreSQL service → **Variables** tab
5. Copy `DATABASE_URL` (looks like: `postgresql://postgres:xxx@xxx.railway.app:5432/railway`)

### Create the leads table

In Railway's PostgreSQL service → **Data** tab → **Query**, paste and run:

```sql
-- File: n8n/db/init.sql
CREATE TABLE IF NOT EXISTS leads (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  lang          VARCHAR(5)   NOT NULL DEFAULT 'pl',
  calculator    VARCHAR(255) NOT NULL,
  params        TEXT,
  price_min_pln INTEGER,
  price_max_pln INTEGER,
  price_min_eur INTEGER,
  price_max_eur INTEGER,
  qty           INTEGER      DEFAULT 1,
  discount      NUMERIC(4,2) DEFAULT 0,
  status        VARCHAR(50)  DEFAULT 'new',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  followup_48h  BOOLEAN      DEFAULT FALSE,
  discount_7d   BOOLEAN      DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
```

---

## Step 2: n8n — Import Workflow

1. Open n8n: `https://primary-production-634f2.up.railway.app`
2. Go to **Workflows → Import from File**
3. Select `n8n/quote-followup-workflow.json`
4. The workflow will appear with all nodes pre-configured

---

## Step 3: n8n — Configure PostgreSQL Credential

1. In n8n: **Settings → Credentials → Add New → Postgres**
2. Fill in from Railway's `DATABASE_URL`:
   - **Host:** `xxx.railway.app`
   - **Port:** `5432`
   - **Database:** `railway`
   - **User:** `postgres`
   - **Password:** (from the connection string)
   - **SSL:** `Allow`
3. Test connection → Save
4. In the "Save to PostgreSQL" node: select this credential

---

## Step 4: n8n — Configure Gmail Credential

### Option A: OAuth2 (recommended)
1. In n8n: **Settings → Credentials → Add New → Gmail OAuth2**
2. Follow the OAuth flow to authorize AEJaCA@gmail.com
3. In each Gmail node in the workflow, select this credential

### Option B: SMTP (simpler)
1. In n8n: **Settings → Credentials → Add New → SMTP**
2. Configure:
   - **SMTP Host:** `smtp.gmail.com`
   - **SMTP Port:** `587`
   - **SMTP User:** `AEJaCA@gmail.com`
   - **SMTP Password:** App Password (see below)
   - **From Email:** `contact@aejaca.com`

### Gmail App Password (for Option B)
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already)
3. Go to https://myaccount.google.com/apppasswords
4. Name: `n8n AEJaCA` → copy the 16-character password

### "Send as" contact@aejaca.com
If not already set up in Gmail:
1. Gmail → Settings → Accounts → **Send mail as → Add another email address**
2. Enter `contact@aejaca.com`
3. Confirm verification email

---

## Step 5: n8n — Configure Email Templates

Each Gmail node has a `message` field. Paste the HTML from:
- **Send Quote Email** → `n8n/emails/quote-immediate.html`
- **Follow-up 48h** → `n8n/emails/followup-48h.html`
- **Discount offer (7d)** → `n8n/emails/discount-7d.html`
- **Notify Owner** → already has inline HTML (edit as needed)

In n8n's Gmail node: toggle to **HTML** mode, then paste the template content.

---

## Step 6: Activate Webhook & Get URL

1. In the workflow, click the **Webhook node**
2. Copy the **Production URL**: `https://primary-production-634f2.up.railway.app/webhook/quote-capture`
3. **Activate the workflow** (toggle in top-right)

---

## Step 7: Frontend — Set Environment Variable

Add to your Cloudflare Pages environment variables:

```
VITE_QUOTE_API_URL = https://primary-production-634f2.up.railway.app/webhook/quote-capture
```

**For Cloudflare Pages:**
1. Dashboard → Pages → aejaca-site → Settings → Environment variables
2. Add `VITE_QUOTE_API_URL` with the webhook URL
3. Trigger a new deployment (the variable is baked into the build)

**For local development:**
`.env` in project root is already configured.

---

## Step 8: Test

1. Go to any calculator on the site
2. Configure parameters → get a price estimate
3. Enter email → check consent → click "Wyślij"
4. Verify:
   - [ ] You receive the quote email
   - [ ] The lead appears in PostgreSQL (`SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;`)
   - [ ] You (owner) get a notification at contact@aejaca.com

---

## Useful PostgreSQL Queries

```sql
-- All leads from today
SELECT * FROM leads WHERE created_at >= CURRENT_DATE ORDER BY created_at DESC;

-- Lead count by calculator
SELECT calculator, COUNT(*) as count FROM leads GROUP BY calculator ORDER BY count DESC;

-- Leads that haven't been followed up
SELECT * FROM leads WHERE status = 'new' AND created_at < NOW() - INTERVAL '2 days';

-- Conversion funnel stats
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*)::numeric * 100, 1) as conversion_pct
FROM leads;

-- Update lead status manually
UPDATE leads SET status = 'converted' WHERE email = 'client@example.com';
```

---

## CORS Note

The webhook is configured with `allowedOrigins: https://www.aejaca.com`.
For local testing, temporarily add `http://localhost:5173` to the webhook's allowed origins in n8n.

---

## Email sequence timeline

| When | Email | Purpose |
|------|-------|---------|
| Immediately | Quote summary | Deliver value, build trust |
| +48 hours | "Masz pytania?" | Gentle nudge, invite dialogue |
| +7 days | "5% rabatu" (code: AEJACA5) | Convert hesitant leads |

---

## Customization

- **Change timing**: Edit Wait nodes (48h, 5d) in the workflow
- **Change discount**: Edit `discount-7d.html` template + code
- **Add WhatsApp**: Add n8n WhatsApp node after "Notify Owner"
- **A/B test subjects**: Duplicate email nodes with different subjects, use n8n's Switch node
- **Lead scoring**: Add a Function node after validation to assign score based on price range
