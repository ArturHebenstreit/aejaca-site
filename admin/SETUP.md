# AEJaCA Admin Panel — Setup

## Architecture

```
Browser → Railway (Express app) → PostgreSQL (Railway)
         ↓
  Google OAuth2 → only AEJaCA@gmail.com allowed
```

Dark-themed dashboard to view leads + subscribers from calculators and newsletter.

---

## Step 1: Google Cloud — Create OAuth2 Credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Create project "AEJaCA Admin" (or use existing)
3. **OAuth consent screen** → External → App name: "AEJaCA Admin" → save
4. **Create Credentials → OAuth 2.0 Client ID**
   - Type: **Web application**
   - Name: `AEJaCA Admin`
   - Authorized redirect URIs: `https://YOUR_RAILWAY_URL/auth/google/callback`
5. Copy **Client ID** and **Client Secret**

---

## Step 2: Railway — Deploy Admin Service

1. In your Railway project, click **+ New → GitHub Repo** (or Empty Service)
2. If GitHub: point to the `admin/` directory in the repo
3. If Empty: set **Root Directory** to `admin`
4. Set **Start Command**: `npm start`

### Environment Variables (in Railway service settings):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | *(auto-linked from PostgreSQL service)* |
| `GOOGLE_CLIENT_ID` | From Step 1 |
| `GOOGLE_CLIENT_SECRET` | From Step 1 |
| `CALLBACK_URL` | `https://YOUR_RAILWAY_URL/auth/google/callback` |
| `ALLOWED_EMAIL` | `aejaca@gmail.com` |
| `SESSION_SECRET` | *(generate random: `openssl rand -hex 32`)* |
| `NODE_ENV` | `production` |

### Link PostgreSQL

In Railway: click the admin service → **Variables** → **Add Reference** → select your PostgreSQL service → `DATABASE_URL`.

---

## Step 3: Update Google OAuth Redirect URI

After Railway assigns a URL (e.g., `aejaca-admin-xxx.up.railway.app`):

1. Go back to Google Cloud Console → Credentials
2. Edit the OAuth client
3. Add authorized redirect URI: `https://aejaca-admin-xxx.up.railway.app/auth/google/callback`
4. Save

---

## Step 4: Test

1. Open `https://aejaca-admin-xxx.up.railway.app`
2. Click "Sign in with Google"
3. Log in with AEJaCA@gmail.com
4. You should see the dashboard with leads + subscribers

---

## Features

- **Dashboard**: Stats overview + recent leads/subscribers
- **Leads**: Full table with pagination, filter by calculator
- **Subscribers**: Full table with language breakdown
- **CSV Export**: Download leads or subscribers as CSV
- **Google OAuth**: Only `AEJaCA@gmail.com` can log in
- **Dark theme**: Matches AEJaCA brand

---

## Security

- URL is not linked anywhere (security through obscurity + OAuth)
- Only the specified Google email can authenticate
- Session cookie: 7-day expiry, secure flag in production
- PostgreSQL queries use parameterized queries for pagination
- No admin write operations (read-only dashboard)
