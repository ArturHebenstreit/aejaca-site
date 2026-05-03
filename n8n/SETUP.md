# AEJaCA Quote Follow-up — n8n + Gmail Setup

## Architecture

```
User calculates price on aejaca.com
  → enters email, clicks "Wyślij"
    → POST to n8n webhook
      → n8n sends confirmation email (Gmail SMTP)
      → saves lead to Google Sheets
      → notifies owner (contact@aejaca.com)
      → 48h later: follow-up email
      → 7 days later: 5% discount email
```

**Cost: 0 PLN** — uses n8n (already have) + Gmail (already have).

---

## Step 1: Gmail — Create App Password

Since you use `AEJaCA@gmail.com` to send as `contact@aejaca.com`:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already)
3. Go to https://myaccount.google.com/apppasswords
4. Name: `n8n AEJaCA`
5. Copy the 16-character app password (e.g., `abcd efgh ijkl mnop`)

**Alternative (recommended):** Use Gmail OAuth2 in n8n — no app password needed.
In n8n: Settings → Credentials → New → Gmail OAuth2 → sign in with AEJaCA@gmail.com.

---

## Step 2: n8n — Import Workflow

1. Open your n8n instance
2. Go to **Workflows → Import from File**
3. Select `n8n/quote-followup-workflow.json`
4. The workflow will appear with all nodes pre-configured

---

## Step 3: n8n — Configure Gmail Credential

### Option A: OAuth2 (recommended)
1. In n8n: **Settings → Credentials → Add New → Gmail OAuth2**
2. Follow the OAuth flow to authorize AEJaCA@gmail.com
3. In each Gmail node in the workflow, select this credential

### Option B: SMTP (if OAuth2 is complex)
1. In each Gmail node, switch to **SMTP** type
2. Configure:
   - **SMTP Host:** `smtp.gmail.com`
   - **SMTP Port:** `587`
   - **SMTP User:** `AEJaCA@gmail.com`
   - **SMTP Password:** App Password from Step 1
   - **From Email:** `contact@aejaca.com` (must be configured as "Send as" in Gmail)

### "Send as" contact@aejaca.com
If not already set up in Gmail:
1. Gmail → Settings → Accounts → **Send mail as → Add another email address**
2. Enter `contact@aejaca.com`
3. Gmail will send a verification email to that address
4. Confirm → now you can send as contact@aejaca.com

---

## Step 4: n8n — Configure Email Templates

Each Gmail node has a `message` field. Paste the HTML from:
- **Send Quote Email** → `n8n/emails/quote-immediate.html`
- **Follow-up 48h** → `n8n/emails/followup-48h.html`
- **Discount offer (7d)** → `n8n/emails/discount-7d.html`
- **Notify Owner** → already has inline HTML (edit as needed)

In n8n's Gmail node: toggle to **HTML** mode, then paste the template content.

---

## Step 5: Google Sheets (optional but recommended)

Stores all leads for analytics:

1. Create a Google Sheet named `AEJaCA Leads`
2. First row headers: `timestamp | email | lang | calculator | params | price_min_pln | price_max_pln | price_min_eur | price_max_eur | qty | discount | status`
3. In n8n: **Settings → Credentials → Add New → Google Sheets OAuth2**
4. In the "Save to Google Sheets" node: select the sheet + configure credential
5. If you don't want Sheets: just delete the "Save to Google Sheets" node

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
Create `.env` in project root:
```
VITE_QUOTE_API_URL=https://primary-production-634f2.up.railway.app/webhook/quote-capture
```

---

## Step 8: Test

1. Go to any calculator on the site
2. Configure parameters → get a price estimate
3. Enter email → check consent → click "Wyślij"
4. Verify:
   - [ ] You receive the quote email
   - [ ] The lead appears in Google Sheets
   - [ ] You (owner) get a notification at contact@aejaca.com

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
- **Disable Sheets**: Delete the "Save to Google Sheets" node
- **A/B test subjects**: Duplicate email nodes with different subjects, use n8n's Switch node
