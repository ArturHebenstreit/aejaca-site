# AEJaCA Chat API — Setup

## Architecture

```
Browser (ChatWidget) → Railway (Express proxy) → OpenAI GPT-4o-mini (streaming)
                                ↓
                         PostgreSQL (conversation logs)
```

Streaming AI chat assistant embedded in aejaca.com. Knows AEJaCA's full offer, pricing, and services.

---

## Step 1: Railway — Deploy Chat API Service

1. In Railway project, click **+ New → GitHub Repo** or **Empty Service**
2. Set **Root Directory** to `chat-api`
3. Set **Start Command**: `npm start`

### Environment Variables:

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `DATABASE_URL` | *(link from PostgreSQL service)* |
| `NODE_ENV` | `production` |

### Link PostgreSQL

Same as admin panel: **Variables** → **Add Reference** → select PostgreSQL → `DATABASE_URL`.

---

## Step 2: Create conversations table

Run in Railway PostgreSQL (or add to `n8n/db/init.sql`):

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id                SERIAL PRIMARY KEY,
  session_id        VARCHAR(100),
  lang              VARCHAR(5)    DEFAULT 'pl',
  messages_count    INTEGER       DEFAULT 1,
  last_user_message TEXT,
  assistant_response TEXT,
  hot_lead          BOOLEAN       DEFAULT FALSE,
  ip_hash           VARCHAR(30),
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_conv_hot ON conversations (hot_lead) WHERE hot_lead = TRUE;
CREATE INDEX IF NOT EXISTS idx_conv_date ON conversations (created_at DESC);
```

---

## Step 3: Cloudflare Pages — Set env var

In Cloudflare Pages → Settings → Environment variables:

| Variable | Value |
|----------|-------|
| `VITE_CHAT_API_URL` | `https://YOUR-CHAT-API.up.railway.app` |

Trigger a new deployment after adding the variable.

---

## Step 4: OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Set it as `OPENAI_API_KEY` in Railway
4. GPT-4o-mini costs ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens — very affordable

---

## Step 5: Test

1. Deploy chat-api on Railway
2. Set `VITE_CHAT_API_URL` in Cloudflare Pages (or `.env` locally)
3. Rebuild & deploy the frontend
4. The chat bubble appears bottom-right on every page
5. Click it, send a message, and verify streaming response

---

## Features

- **GPT-4o-mini streaming**: fast, cost-effective responses
- **Full AEJaCA knowledge**: services, pricing, calculators, process
- **Trilingual**: responds in PL/EN/DE based on user's language
- **Hot lead detection**: flags conversations about specific projects
- **Rate limiting**: 20 requests/minute per IP
- **Conversation logging**: all exchanges saved in PostgreSQL
- **Progressive enhancement**: widget only renders when API URL is set

---

## Cost Estimate

GPT-4o-mini pricing (as of 2024):
- Input: ~$0.15 / 1M tokens
- Output: ~$0.60 / 1M tokens
- Average conversation (~5 messages): ~$0.002
- 1000 conversations/month: ~$2

Railway: included in existing plan (shared PostgreSQL).
