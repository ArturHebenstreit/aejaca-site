import express from "express";
import cors from "cors";
import OpenAI from "openai";
import pg from "pg";
import multer from "multer";
import cron from "node-cron";
import { createHash } from "crypto";
import { rateLimit } from "express-rate-limit";
import { getSystemPrompt, detectHotLead } from "./context.js";
import { createGmailClient, processHistory, setupGmailWatch, pollRecentMessages } from "./gmail.js";
import { CALCULATORS, PricingError, geometryFromFile, priceItem, checkQuarterlyLimit , generateOrderRef, generateToken } from "./orders.js";
import { createQuote, priceQuote, getQuoteByRef, convertQuoteToOrder, availableDesignCredit, QuoteError } from "./quotes.js";
import { extraRevisionGrosze, CAD_CONFIG } from "./pricing/cadDesign.js";
import {
  autopayConfigured, buildStartTransaction, formatValidityTime,
  verifyReturn, parseITN, buildITNConfirmation, fetchGatewayList,
} from "./autopay.js";
import { packagingGrosze, sanitizePersonalization } from "./pricing/packaging.js";
import { eurCentsFromGrosze } from "./pricing/currency.js";
import { shippingGrosze as shippingCost, needsCustoms, zoneForCountry } from "./pricing/shipping.js";
import { addBusinessDays, TRANSFER_HOLD_BUSINESS_DAYS } from "./pricing/businessDays.js";
import {
  listProducts, getProduct, reserveProduct, consumeReservations,
  releaseExpiredReservations, releaseOrderReservations, ProductError,
} from "./products.js";
import { sendOrderPaidEmails, sendTransferInstructions } from "./orderMail.js";

const app = express();
app.set("trust proxy", true);
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  "https://www.aejaca.com",
  "https://aejaca.com",
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:4173"] : []),
];
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.aejaca-site\.pages\.dev$/,
];

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || isAllowedOrigin(origin)) return cb(null, true);
    cb(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
// Body parsers are applied per-route to avoid global limit conflicts.

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

if (pool) {
  pool.query(`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS country VARCHAR(10)`).catch(() => {});
  pool.query(`CREATE TABLE IF NOT EXISTS events (id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ NOT NULL DEFAULT NOW(), session VARCHAR(50) NOT NULL, path VARCHAR(500), category VARCHAR(50), action VARCHAR(200), label VARCHAR(500), value NUMERIC, country VARCHAR(10), device VARCHAR(20))`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id VARCHAR(50)`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_note TEXT`).catch(() => {});
  // Zapytanie o wycene to zobowiazanie tak samo jak zamowienie, wiec musi dac
  // sie odtworzyc w calosci. Pelny opis, parametry jako struktura, plik i numer
  // do cytowania w korespondencji. Schemat w scripts/leads-schema.sql.
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS params_json JSONB`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS upload_id BIGINT`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS quote_ref VARCHAR(32)`).catch(() => {});
  pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(30)`).catch(() => {});
  // Projekt 3D ma limit poprawek w cenie. Kolejne sa platne, wiec licznik
  // musi zyc przy zamowieniu, a doplata wisiec przy nim jako dziecko.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS revisions_included INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS revisions_used INTEGER NOT NULL DEFAULT 0`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS parent_order_id BIGINT`).catch(() => {});
  // Oplata projektowa zaliczana na poczet wykonania. Slad trzymamy po obu
  // stronach: ile odliczono i ktore zamowienie skonsumowalo odliczenie.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_applied_grosze INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_consumed_by BIGINT`).catch(() => {});
  // Platnosc przelewem. Autopay obsluguje wylacznie polskie banki i BLIK, wiec
  // klient z zagranicy nie ma czym zaplacic od reki. Kwote naleznosci zamrazamy
  // w euro w chwili zamowienia, razem z kursem, zeby po tygodniu nie bylo sporu
  // o to, ile mial przelac. Rozliczenie i tak zostaje w groszach PLN.
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'autopay'`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_eur_cents INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS eur_rate NUMERIC(10,4)`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS eur_rate_locked_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_received_cents INTEGER`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_confirmed_at TIMESTAMPTZ`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_confirmed_by VARCHAR(120)`).catch(() => {});
  pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_note TEXT`).catch(() => {});
  // Status posredni: zamowienie zlozone, czekamy na wplyw na konto.
  pool.query(`
    DO $$ BEGIN
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
      ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN
        ('draft','awaiting_payment','awaiting_transfer','paid','in_production','shipped','completed','cancelled','expired','refunded'));
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
      ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('autopay','bank_transfer'));
    END $$;
  `).catch((e) => console.error("[migracja] status/payment_method:", e.message));
  pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_awaiting_transfer
              ON orders (created_at DESC) WHERE status = 'awaiting_transfer'`).catch(() => {});

  // Katalog produktow: tresc, zdjecia i stan magazynowy zyja w bazie, a nie
  // w repozytorium, zeby zmiana stanu nie wymagala wdrozenia.
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(20)`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS offer VARCHAR(20) NOT NULL DEFAULT 'ready'`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS short JSONB`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_days INTEGER NOT NULL DEFAULT 2`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS personalization JSONB`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0`).catch(() => {});
  pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT`).catch(() => {});
  pool.query(`
    DO $$ BEGIN
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_offer_check;
      ALTER TABLE products ADD CONSTRAINT products_offer_check CHECK (offer IN ('ready','personalized'));
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
      ALTER TABLE products ADD CONSTRAINT products_category_check CHECK (category IS NULL OR category IN ('jewelry','studio'));
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_check;
      ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock IS NULL OR stock >= 0);
    END $$;
  `).catch((e) => console.error("[migracja] products:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS product_reservations (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL CHECK (qty > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).catch((e) => console.error("[migracja] product_reservations:", e.message));
  pool.query(`CREATE INDEX IF NOT EXISTS idx_reservations_product ON product_reservations (product_id)
              WHERE consumed_at IS NULL AND released_at IS NULL`).catch(() => {});
  pool.query(`CREATE INDEX IF NOT EXISTS idx_reservations_order ON product_reservations (order_id)`).catch(() => {});
  pool.query(`
    CREATE OR REPLACE VIEW product_availability AS
    SELECT p.id, p.slug, p.stock,
      COALESCE(SUM(r.qty) FILTER (WHERE r.consumed_at IS NULL AND r.released_at IS NULL AND r.expires_at > NOW()), 0)::INTEGER AS reserved,
      CASE WHEN p.stock IS NULL THEN NULL
           ELSE GREATEST(p.stock - COALESCE(SUM(r.qty) FILTER (WHERE r.consumed_at IS NULL AND r.released_at IS NULL AND r.expires_at > NOW()), 0), 0)::INTEGER
      END AS available
    FROM products p
    LEFT JOIN product_reservations r ON r.product_id = p.id
    GROUP BY p.id, p.slug, p.stock
  `).catch((e) => console.error("[migracja] product_availability:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS email_threads (
    id BIGSERIAL PRIMARY KEY,
    gmail_thread_id VARCHAR(200) UNIQUE NOT NULL,
    lead_id BIGINT,
    subject VARCHAR(500),
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`).catch(() => {});
  pool.query(`ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS tag VARCHAR(20) DEFAULT 'unclassified'`).catch(() => {});
  pool.query(`ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS auto_replied_at TIMESTAMPTZ`).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS email_messages (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT,
    gmail_message_id VARCHAR(200) UNIQUE NOT NULL,
    direction VARCHAR(10) NOT NULL,
    from_addr VARCHAR(300),
    to_addr TEXT,
    cc_addr TEXT,
    subject VARCHAR(500),
    body_text TEXT,
    snippet VARCHAR(500),
    gmail_labels TEXT[],
    received_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`).catch(() => {});
  pool.query(`CREATE TABLE IF NOT EXISTS market_rates (
    id SERIAL PRIMARY KEY,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(50) NOT NULL,
    pln_per_usd NUMERIC(10,6),
    pln_per_eur NUMERIC(10,6),
    au_pln_per_g NUMERIC(12,4),
    ag_pln_per_g NUMERIC(12,4),
    pt_pln_per_g NUMERIC(12,4),
    pd_pln_per_g NUMERIC(12,4),
    au_usd_per_oz NUMERIC(12,4),
    ag_usd_per_oz NUMERIC(12,4),
    pt_usd_per_oz NUMERIC(12,4),
    pd_usd_per_oz NUMERIC(12,4)
  )`).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS gemstone_prices (
    id SERIAL PRIMARY KEY,
    gem_id VARCHAR(50) NOT NULL UNIQUE,
    name_pl VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_de VARCHAR(100) NOT NULL,
    base_eur NUMERIC(10,2),
    precious BOOLEAN DEFAULT false,
    has_grades BOOLEAN DEFAULT false,
    lab BOOLEAN DEFAULT false,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100)
  )`).then(() => {
    return pool.query(`INSERT INTO gemstone_prices (gem_id,name_pl,name_en,name_de,base_eur,precious,has_grades,lab) VALUES
      ('diamond','Diament','Diamond','Diamant',3000,true,true,false),
      ('ruby','Rubin','Ruby','Rubin',1500,true,true,false),
      ('sapphire','Szafir','Sapphire','Saphir',1000,true,true,false),
      ('emerald','Szmaragd','Emerald','Smaragd',800,true,true,false),
      ('lab_diamond','Diament lab-grown','Lab-grown diamond','Labor-Diamant',350,false,true,true),
      ('moissanite','Mosanit','Moissanite','Moissanit',95,false,false,true),
      ('cz','Cyrkonia (CZ)','Cubic zirconia (CZ)','Zirkonia (CZ)',2,false,false,true),
      ('lab_ruby','Rubin lab-grown','Lab-grown ruby','Labor-Rubin',190,false,true,true),
      ('lab_sapphire','Szafir lab-grown','Lab-grown sapphire','Labor-Saphir',140,false,true,true),
      ('lab_emerald','Szmaragd lab-grown','Lab-grown emerald','Labor-Smaragd',120,false,true,true),
      ('tanzanite','Tanzanit','Tanzanite','Tansanit',400,false,true,false),
      ('aquamarine','Akwamaryn','Aquamarine','Aquamarin',100,false,false,false),
      ('tourmaline','Turmalin','Tourmaline','Turmalin',150,false,false,false),
      ('topaz','Topaz','Topaz','Topas',30,false,false,false),
      ('amethyst','Ametyst','Amethyst','Amethyst',15,false,false,false),
      ('citrine','Cytryn','Citrine','Citrin',13,false,false,false),
      ('garnet','Granat','Garnet','Granat',20,false,false,false),
      ('peridot','Perydot','Peridot','Peridot',40,false,false,false),
      ('opal','Opal','Opal','Opal',100,false,false,false),
      ('moonstone','Kamień księżycowy','Moonstone','Mondstein',20,false,false,false),
      ('lapis','Lapis lazuli','Lapis lazuli','Lapislazuli',13,false,false,false),
      ('turquoise','Turkus','Turquoise','Türkis',20,false,false,false),
      ('onyx','Onyks','Onyx','Onyx',7,false,false,false),
      ('tiger_eye','Tygrysie oko','Tiger eye','Tigerauge',5,false,false,false)
      ON CONFLICT (gem_id) DO NOTHING`);
  }).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS filament_types (
    id BIGSERIAL PRIMARY KEY,
    type_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    nozzle_min INTEGER, nozzle_max INTEGER,
    bed_min INTEGER, bed_max INTEGER,
    temp_resistance INTEGER,
    speed_min INTEGER, speed_max INTEGER,
    layer_min NUMERIC(4,2), layer_max NUMERIC(4,2),
    retraction_min NUMERIC(4,1), retraction_max NUMERIC(4,1),
    cooling INTEGER,
    enclosure VARCHAR(20) DEFAULT 'no',
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    density NUMERIC(5,3),
    price_per_kg INTEGER,
    props TEXT[],
    uses_pl TEXT, uses_en TEXT, uses_de TEXT,
    notes_pl TEXT, notes_en TEXT, notes_de TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
  )`).catch(e => console.error("[filaments] CREATE filament_types failed:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS filament_brands (
    id BIGSERIAL PRIMARY KEY,
    filament_type_id BIGINT REFERENCES filament_types(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    product_name VARCHAR(200),
    nozzle_min INTEGER, nozzle_max INTEGER,
    bed_min INTEGER, bed_max INTEGER,
    speed_min INTEGER, speed_max INTEGER,
    notes_pl TEXT, notes_en TEXT, notes_de TEXT,
    product_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    auto_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
  )`).catch(e => console.error("[filaments] CREATE filament_brands failed:", e.message));

  pool.query(`ALTER TABLE filament_brands ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE`).catch(() => {});

  pool.query(`CREATE TABLE IF NOT EXISTS filament_contributions (
    id BIGSERIAL PRIMARY KEY,
    filament_type_id BIGINT REFERENCES filament_types(id),
    filament_brand_id BIGINT REFERENCES filament_brands(id),
    contribution_type VARCHAR(30) NOT NULL,
    brand_name VARCHAR(100), product_name VARCHAR(200),
    nozzle_min INTEGER, nozzle_max INTEGER,
    bed_min INTEGER, bed_max INTEGER,
    speed_min INTEGER, speed_max INTEGER,
    notes TEXT,
    contributor_email VARCHAR(200), contributor_name VARCHAR(100),
    gdpr_consent BOOLEAN DEFAULT FALSE,
    vote_confirm INTEGER DEFAULT 0, vote_dispute INTEGER DEFAULT 0,
    auto_approved BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ, reviewed_by VARCHAR(100)
  )`).catch(e => console.error("[filaments] CREATE filament_contributions failed:", e.message));

  pool.query(`CREATE TABLE IF NOT EXISTS filament_contribution_votes (
    id BIGSERIAL PRIMARY KEY,
    contribution_id BIGINT REFERENCES filament_contributions(id) ON DELETE CASCADE,
    voter_email VARCHAR(200),
    vote VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_hash VARCHAR(64)
  )`).catch(e => console.error("[filaments] CREATE filament_contribution_votes failed:", e.message));
}

const rateMap = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRate(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW;
  for (const [ip, entry] of rateMap) {
    if (entry.start < cutoff) rateMap.delete(ip);
  }
}, 60_000);

// --- Analytics rate limiting ---
const analyticsRateMap = new Map();
const ANALYTICS_RATE_LIMIT = 60;
const ANALYTICS_RATE_WINDOW = 60_000;

function checkAnalyticsRate(ip) {
  const now = Date.now();
  const entry = analyticsRateMap.get(ip);
  if (!entry || now - entry.start > ANALYTICS_RATE_WINDOW) {
    analyticsRateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= ANALYTICS_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function detectDevice(ua) {
  if (!ua) return 'unknown';
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

// Cache IP→country to avoid hammering ip-api.com (45 req/min free limit)
const countryCache = new Map();
setInterval(() => {
  if (countryCache.size > 2000) countryCache.clear();
}, 60 * 60_000);

function extractIP(req) {
  // x-forwarded-for first entry = original client IP (leftmost in the chain)
  // x-real-ip on Railway = last connecting proxy (may be Zscaler/CDN, not the real user)
  const raw = req.headers["cf-connecting-ip"]
    || req.headers["x-forwarded-for"]?.split(",")[0]
    || req.headers["x-real-ip"]
    || req.ip
    || "";
  return raw.trim().replace(/^::ffff:/, "");
}

function isPrivateIP(ip) {
  if (!ip) return true;
  if (ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

async function lookupCountry(ip) {
  if (!ip || isPrivateIP(ip)) return null;
  if (countryCache.has(ip)) return countryCache.get(ip);
  try {
    // ipapi.co — HTTPS, free 1k/day, plain-text country code response
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country_code/`, {
      headers: { "User-Agent": "aejaca-analytics/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const text = (await res.text()).trim();
    const country = /^[A-Z]{2}$/.test(text) ? text : null;
    countryCache.set(ip, country);
    return country;
  } catch {
    return null;
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// Diagnostic — shows which IP/headers we see (remove after confirming country works)
app.get("/api/debug-ip", async (req, res) => {
  const ip = extractIP(req);
  const country = await lookupCountry(ip);
  res.json({
    ip,
    country,
    private: isPrivateIP(ip),
    headers: {
      "cf-connecting-ip": req.headers["cf-connecting-ip"] || null,
      "x-real-ip": req.headers["x-real-ip"] || null,
      "x-forwarded-for": req.headers["x-forwarded-for"] || null,
      "req.ip": req.ip || null,
    },
  });
});

app.post("/api/chat", express.json({ limit: "16kb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkRate(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { messages, lang = "pl", sessionId } = req.body;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== "string" || m.content.length > 2000) {
      return res.status(400).json({ error: "Invalid message format" });
    }
  }

  const systemPrompt = getSystemPrompt();
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-20).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.slice(0, 2000) })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

    if (pool && fullResponse) {
      const isHotLead = detectHotLead(messages);
      lookupCountry(ip).then(country => {
        pool.query(
          `INSERT INTO conversations (session_id, lang, messages_count, last_user_message, assistant_response, hot_lead, ip_hash, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            sessionId || null,
            lang,
            messages.length,
            messages[messages.length - 1]?.content?.slice(0, 500) || "",
            fullResponse.slice(0, 2000),
            isHotLead,
            ip ? Buffer.from(ip).toString("base64").slice(0, 20) : null,
            country,
          ]
        ).catch(() => {});
      });

      // Hot lead → also save to leads table for follow-up
      if (isHotLead) {
        const lastMsg = messages[messages.length - 1]?.content || "";
        const allText = messages.map(m => m.content).join(" ");
        const emailMatch = allText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
        const userEmail = emailMatch ? emailMatch[0].toLowerCase() : null;
        pool.query(
          `INSERT INTO leads (email, lang, calculator, params, status) VALUES ($1, $2, $3, $4, $5)`,
          [userEmail, lang, "chat", lastMsg.slice(0, 400), "new"]
        ).catch(() => {});
      }
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service unavailable" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

// --- Contact form ---
const CONTACT_N8N_URL = process.env.N8N_CONTACT_WEBHOOK_URL;
const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW = 60 * 60_000;
const contactRateMap = new Map();

function checkContactRate(ip) {
  const now = Date.now();
  const entry = contactRateMap.get(ip);
  if (!entry || now - entry.start > CONTACT_RATE_WINDOW) {
    contactRateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= CONTACT_RATE_LIMIT) return false;
  entry.count++;
  return true;
}
setInterval(() => {
  const cutoff = Date.now() - CONTACT_RATE_WINDOW;
  for (const [ip, e] of contactRateMap) if (e.start < cutoff) contactRateMap.delete(ip);
}, CONTACT_RATE_WINDOW);

const ALLOWED_EXT = /\.(stl|3mf|step|stp|obj|svg|ai|dxf|jpg|jpeg|png|pdf)$/i;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    ALLOWED_EXT.test(file.originalname) ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Numer zapytania cytowany w korespondencji, odpowiednik numeru zamowienia */
function generateQuoteRef() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `WY${stamp}-${generateToken().slice(0, 8).toUpperCase()}`;
}

/**
 * Zapisuje plik przyslany do wyceny tak samo, jak plik z zamowienia:
 * wiersz w uploads (suma kontrolna, nazwa) i wyslanie na Dysk przez n8n.
 *
 * Dotad plik z formularza wyceny szedl wylacznie mailem, wiec po pol roku
 * nie dalo sie ustalic, co dokladnie klient przyslal. Zwraca id wiersza
 * albo null, bo brak Dysku nie moze zablokowac przyjecia zapytania.
 *
 * @param {{name:string, mimeType:string, buffer:Buffer}} file
 */
async function storeQuoteAttachment(file, lang, ip) {
  if (!pool || !file?.buffer?.length) return null;
  try {
    const token = generateToken();
    const { rows } = await pool.query(
      `INSERT INTO uploads (token, file_name, file_size_bytes, file_sha256, mime_type, lang, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [token, String(file.name || "zalacznik").slice(0, 255), file.buffer.length,
       createHash("sha256").update(file.buffer).digest("hex"),
       file.mimeType || "application/octet-stream", lang,
       createHash("sha256").update(ip).digest("hex").slice(0, 30)]
    );

    if (UPLOAD_N8N_URL) {
      fetch(UPLOAD_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fileName: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.buffer.length,
          lang,
          data: file.buffer.toString("base64"),
          source: "quote_file",
        }),
      }).then((r) => {
        if (!r.ok) console.error(`[wycena] webhook n8n ${r.status} dla ${token}`);
      }).catch((e) => console.error("[wycena] webhook blad:", e.message));
    }

    return rows[0].id;
  } catch (e) {
    console.error("[wycena] zapis zalacznika nie powiodl sie:", e.message);
    return null;
  }
}
const SUBJECT_MAP = { jewelry: "Jewelry Inquiry", studio: "Studio Inquiry", both: "Jewelry & Studio Inquiry", other: "General Inquiry" };

app.post("/api/contact", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "File too large (max 8 MB)" : (err.message || "File upload error") });
    }
    next();
  });
}, async (req, res) => {
  const ip = extractIP(req);
  if (!checkContactRate(ip)) return res.status(429).json({ error: "Too many requests" });

  const { name, email, subject, message, lang, source, website } = req.body;
  if (website) return res.status(400).json({ error: "Invalid request" });
  if (!email?.trim() || !message?.trim()) return res.status(400).json({ error: "Missing required fields" });
  if (!CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if ((name?.length ?? 0) > 100 || message.length > 5000) return res.status(400).json({ error: "Input too long" });

  const payload = {
    name: (name || "").trim().slice(0, 100) || "—",
    email: email.trim().toLowerCase(),
    subject: SUBJECT_MAP[subject] || (subject || "General Inquiry").slice(0, 100),
    message: message.trim().slice(0, 5000),
    lang: ["pl", "en", "de"].includes(lang) ? lang : "pl",
    source: (source || "contact").slice(0, 50),
  };
  if (req.file) {
    payload.file = { name: req.file.originalname, type: req.file.mimetype, data: req.file.buffer.toString("base64") };
  }

  // Check if this email was already contacted — pass flag to n8n so it skips follow-up
  const alreadyContacted = pool
    ? pool.query("SELECT contacted_at FROM leads WHERE email = $1 AND contacted_at IS NOT NULL LIMIT 1", [payload.email])
        .then(r => r.rows.length > 0)
        .catch(() => false)
    : Promise.resolve(false);

  alreadyContacted.then(skipFollowup => {
    if (CONTACT_N8N_URL) {
      fetch(CONTACT_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, skip_followup: skipFollowup }),
      }).then(r => {
        if (!r.ok) console.error(`Contact webhook n8n ${r.status}`);
      }).catch(err => {
        console.error("Contact webhook error:", err.message);
      });
    }
  });

  // Zapis zapytania. Pelna tresc, bez obcinania: to ona jest podstawa
  // pozniejszej realizacji i jedynym zapisem tego, co obiecalismy.
  if (pool) {
    const quoteRef = generateQuoteRef();
    storeQuoteAttachment(
      req.file ? { name: req.file.originalname, mimeType: req.file.mimetype, buffer: req.file.buffer } : null,
      payload.lang,
      ip
    ).then((uploadId) =>
      pool.query(
        `INSERT INTO leads (email, lang, calculator, source, params, description, params_json, upload_id, quote_ref, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [payload.email, payload.lang, payload.source, "contact",
         `${payload.subject}\n${payload.message.slice(0, 400)}`,
         payload.message,
         JSON.stringify({ name: payload.name || null, subject: payload.subject || null }),
         uploadId, quoteRef, "new"]
      )
    ).catch(err => console.error("Lead save error:", err.message));
  }

  res.json({ ok: true });
});

// --- Quote email capture ---
const QUOTE_N8N_URL = process.env.N8N_QUOTE_WEBHOOK_URL;
const quoteRateMap = new Map();
const QUOTE_RATE_LIMIT = 10;
const QUOTE_RATE_WINDOW = 60 * 60_000;

function checkQuoteRate(ip) {
  const now = Date.now();
  const entry = quoteRateMap.get(ip);
  if (!entry || now - entry.start > QUOTE_RATE_WINDOW) {
    quoteRateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= QUOTE_RATE_LIMIT) return false;
  entry.count++;
  return true;
}
setInterval(() => {
  const cutoff = Date.now() - QUOTE_RATE_WINDOW;
  for (const [ip, e] of quoteRateMap) if (e.start < cutoff) quoteRateMap.delete(ip);
}, QUOTE_RATE_WINDOW);

app.post("/api/quote", express.json({ limit: "50mb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkQuoteRate(ip)) return res.status(429).json({ error: "Too many requests" });

  const { email, lang, calculator, params, price, file, ts } = req.body || {};
  if (!email || !CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (!calculator || !params || !price) return res.status(400).json({ error: "Missing fields" });

  // Numer nadajemy przed wysylka, zeby ten sam trafil do maila i do bazy.
  const quoteRef = generateQuoteRef();

  const payload = {
    email: email.trim().toLowerCase(),
    lang: ["pl", "en", "de"].includes(lang) ? lang : "pl",
    calculator: String(calculator).slice(0, 200),
    params: String(params).slice(0, 1000),
    quoteRef,
    price,
    ts: ts || new Date().toISOString(),
    ...(file?.data ? { file: { name: String(file.name || "attachment").slice(0, 255), type: String(file.type || "application/octet-stream"), data: file.data } } : {}),
  };

  // Check if this email was already contacted — pass flag to n8n so it skips follow-up
  const alreadyContactedQuote = pool
    ? pool.query("SELECT contacted_at FROM leads WHERE email = $1 AND contacted_at IS NOT NULL LIMIT 1", [payload.email])
        .then(r => r.rows.length > 0)
        .catch(() => false)
    : Promise.resolve(false);

  alreadyContactedQuote.then(skipFollowup => {
    if (QUOTE_N8N_URL) {
      fetch(QUOTE_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, skip_followup: skipFollowup }),
      }).then(r => {
        if (!r.ok) console.error(`Quote webhook n8n ${r.status}`);
      }).catch(err => {
        console.error("Quote webhook error:", err.message);
      });
    }
  });

  if (pool) {
    const quoteSessionId = req.body?.sessionId || null;
    // Plik przychodzi w JSON jako base64. Rozpakowujemy go tutaj, zeby
    // zapytanie mialo taki sam slad w bazie jak zamowienie.
    const attachment = file?.data
      ? { name: file.name, mimeType: file.type, buffer: Buffer.from(String(file.data).split(",").pop(), "base64") }
      : null;

    storeQuoteAttachment(attachment, payload.lang, ip)
      .then((uploadId) =>
        pool.query(
          `INSERT INTO leads (email, lang, calculator, source, params, description, params_json,
             price_min_pln, price_max_pln, price_min_eur, price_max_eur, qty, discount,
             upload_id, quote_ref, status, session_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [payload.email, payload.lang, payload.calculator, "quote",
           payload.params,
           // Pelny opis od klienta, bez limitu 1000 znakow z podsumowania.
           String(req.body?.description || req.body?.message || params || ""),
           JSON.stringify({ params: req.body?.params ?? null, price: price ?? null }),
           price?.perPcPLN?.min ?? null, price?.perPcPLN?.max ?? null,
           price?.perPcEUR?.min ?? null, price?.perPcEUR?.max ?? null,
           price?.qty ?? null, price?.discount ?? null,
           uploadId, quoteRef, "new", quoteSessionId]
        )
      )
      .catch((err) => console.error("Quote save error:", err.message));
  }

  res.json({ ok: true });
});

// --- Wiazaca wycena, liczona po stronie serwera ---
// Przegladarka przysyla parametry i ewentualnie plik. Nigdy nie przysyla ceny.
const priceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 1 },
});

const priceRateMap = new Map();
const PRICE_RATE_LIMIT = 60;
const PRICE_RATE_WINDOW = 10 * 60_000;

function checkPriceRate(ip) {
  const now = Date.now();
  const e = priceRateMap.get(ip);
  if (!e || now - e.start > PRICE_RATE_WINDOW) {
    priceRateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (e.count >= PRICE_RATE_LIMIT) return false;
  e.count++;
  return true;
}
setInterval(() => {
  const cutoff = Date.now() - PRICE_RATE_WINDOW;
  for (const [ip, e] of priceRateMap) if (e.start < cutoff) priceRateMap.delete(ip);
}, PRICE_RATE_WINDOW);

/** Kursy kruszcow z wlasnej bazy, ten sam zestaw pol, ktory dostaje frontend */
async function currentMetalRates() {
  if (!pool) return null;
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (field) field, value FROM (
        SELECT 'au_pln_per_g' AS field, au_pln_per_g::float AS value, fetched_at FROM market_rates WHERE au_pln_per_g IS NOT NULL
        UNION ALL SELECT 'ag_pln_per_g', ag_pln_per_g::float, fetched_at FROM market_rates WHERE ag_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pt_pln_per_g', pt_pln_per_g::float, fetched_at FROM market_rates WHERE pt_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pd_pln_per_g', pd_pln_per_g::float, fetched_at FROM market_rates WHERE pd_pln_per_g IS NOT NULL
      ) sub ORDER BY field, fetched_at DESC
    `);
    const rates = {};
    for (const r of rows) rates[r.field] = r.value;
    return Object.keys(rates).length ? rates : null;
  } catch (e) {
    console.error("[price] rates query failed:", e.message);
    return null;
  }
}

app.get("/api/price/calculators", (_req, res) => {
  res.json({
    calculators: Object.entries(CALCULATORS).map(([id, c]) => ({ id, label: c.label })),
  });
});

app.post("/api/price", (req, res, next) => {
  priceUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.code === "LIMIT_FILE_SIZE" ? "Plik przekracza 60 MB" : (err.message || "Blad wysylki pliku"),
      });
    }
    next();
  });
}, async (req, res) => {
  const ip = extractIP(req);
  if (!checkPriceRate(ip)) return res.status(429).json({ error: "Za duzo zapytan, sprobuj za chwile" });

  try {
    const calculator = String(req.body?.calculator || "");
    const lang = String(req.body?.lang || "pl");
    const scale = req.body?.scale ? Number(req.body.scale) : 1;
    let params = req.body?.params;
    if (typeof params === "string") {
      try { params = JSON.parse(params); }
      catch { return res.status(400).json({ error: "Nieprawidlowy format parametrow" }); }
    }

    let geometry = null;
    if (req.file?.buffer) {
      geometry = await geometryFromFile(req.file.buffer, req.file.originalname || "");
    } else if (req.body?.uploadToken && pool) {
      // Plik zostal wgrany wczesniej przez /api/uploads. Geometrie czytamy
      // z bazy, wiec przesuwanie suwaka nie wysyla modelu za kazdym razem.
      const { rows } = await pool.query("SELECT geometry FROM uploads WHERE token = $1", [String(req.body.uploadToken)]);
      if (!rows[0]) return res.status(404).json({ error: "Nieznany plik", code: "unknown_upload" });
      // Zalacznik nie ma geometrii i nigdy nie moze wplynac na cene.
      geometry = rows[0].geometry || null;
    }

    const rates = calculator.startsWith("jewelry_") ? await currentMetalRates() : null;
    const item = priceItem({ calculator, params, lang, geometry, scale, rates });

    // Informacyjnie: ile jeszcze zmiesci sie w limicie kwartalnym.
    const limit = pool ? await checkQuarterlyLimit(pool, item.lineGrosze) : null;

    res.json({
      ok: true,
      item,
      geometry: geometry && {
        volumeCm3: Number(geometry.volumeCm3.toFixed(3)),
        bbox: geometry.bbox,
        triangleCount: geometry.triangleCount,
        sha256: geometry.sha256,
      },
      capacity: limit && { ok: limit.ok, remainingPLN: Math.round(limit.remainingGrosze / 100) },
    });
  } catch (e) {
    if (e instanceof PricingError) {
      const status = e.code === "needs_quote" ? 409 : 400;
      return res.status(status).json({ error: e.message, code: e.code });
    }
    console.error("[price] unexpected:", e);
    res.status(500).json({ error: "Wycena chwilowo niedostepna" });
  }
});

// ============================================================
// DOPLATY ZA DODATKOWE POPRAWKI
// ============================================================
// Trzecia runda poprawek jest platna ZANIM ja zaczniemy, nigdy po. Przy
// dzialalnosci nierejestrowanej, bez umow i faktur, sciganie kogos o 90 zl
// kosztuje wiecej niz te 90 zl. Jedyny moment z realna dzwignia to moment,
// w ktorym klient czegos chce.
//
// Doplata jest zwyklym zamowieniem: przechodzi ta sama droga co zakup ze
// sklepu, razem z Autopay, ITN i mailami, wiec nic nie trzeba dublowac.

app.post("/api/orders/:ref/revision", express.json({ limit: "16kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  try {
    const { rows } = await pool.query(
      `SELECT o.*, i.calculator, i.params
         FROM orders o
         LEFT JOIN order_items i ON i.order_id = o.id AND i.calculator = 'cad_design'
        WHERE o.order_ref = $1`,
      [String(req.params.ref || "")]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "Nie ma takiego zamowienia" });
    if (order.calculator !== "cad_design") {
      return res.status(400).json({ error: "To zamowienie nie jest projektem", code: "not_a_design" });
    }

    const amount = extraRevisionGrosze(order.params?.complexityId);
    if (!amount) return res.status(400).json({ error: "Nie znam progu zlozonosci tego projektu", code: "no_rate" });

    const limit = await checkQuarterlyLimit(pool, amount);
    if (!limit.ok) {
      return res.status(409).json({
        error: "Ta kwota nie zmiesci sie w limicie kwartalnym",
        code: "quarterly_limit",
        remainingPLN: Math.round(limit.remainingGrosze / 100),
      });
    }

    const childRef = generateOrderRef();
    const childToken = generateToken();
    const round = (order.revisions_included ?? 0) + 1 + (order.revisions_used ?? 0);

    const { rows: created } = await pool.query(
      `INSERT INTO orders (order_ref, status, kind, lang, items_total_grosze, shipping_grosze, total_grosze,
         customer_email, customer_name, customer_phone, delivery_method,
         access_token, ip_hash, expires_at, parent_order_id)
       VALUES ($1,'awaiting_payment','quoted',$2,$3,0,$3,$4,$5,$6,'pickup',$7,$8,$9,$10)
       RETURNING id`,
      [childRef, order.lang, amount,
       order.customer_email, order.customer_name, order.customer_phone,
       childToken, order.ip_hash, new Date(Date.now() + 7 * 86400_000), order.id]
    );

    await pool.query(
      `INSERT INTO order_items (order_id, item_type, calculator, title, qty, unit_grosze, line_grosze, params)
       VALUES ($1,'service','cad_design',$2,1,$3,$3,$4)`,
      [created[0].id,
       `Dodatkowa runda poprawek (${round}) do ${order.order_ref}`,
       amount,
       JSON.stringify({ parentOrderRef: order.order_ref, round, complexityId: order.params?.complexityId })]
    );

    console.log(`[poprawki] ${order.order_ref}: doplata ${childRef} na ${(amount / 100).toFixed(2)} PLN`);
    res.json({
      ok: true,
      orderRef: childRef,
      amountGrosze: amount,
      round,
      payUrl: `${SITE_URL}/order/status/?ref=${childRef}&token=${childToken}`,
    });
  } catch (e) {
    console.error("[poprawki] doplata nie powiodla sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie utworzyc doplaty" });
  }
});

// ============================================================
// WYCENY INDYWIDUALNE
// ============================================================
// Sciezka dla tego, czego nie umiemy wycenic automatem: kamienie, sploty,
// projekty CAD, dlugie grawery. Klient zostawia komplet danych, czlowiek
// wpisuje kwote, a wycena zamienia sie w zwykle zamowienie do zaplaty.
//
// Tresc i pliki zapisujemy strukturalnie, a nie tylko w mailu, bo po pol
// roku mail nie wystarczy do ustalenia, co obiecalismy.

/** Wpisywanie kwot i konwersja to czynnosci wlascicielskie, nie klienckie */
function requireAdmin(req, res) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

app.post("/api/quotes", express.json({ limit: "1mb" }), async (req, res) => {
  const ip = extractIP(req);
  if (!checkQuoteRate(ip)) return res.status(429).json({ error: "Za duzo zapytan, sprobuj za chwile" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const { email, name, phone, lang, source, message, items } = req.body || {};
  if (!email || !CONTACT_EMAIL_RE.test(String(email))) return res.status(400).json({ error: "Nieprawidlowy adres e-mail" });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Zapytanie bez pozycji" });
  if (items.length > 20) return res.status(400).json({ error: "Za duzo pozycji w jednym zapytaniu" });

  try {
    const created = await createQuote(pool, {
      email, name, phone, lang, source: source || "configurator",
      message: String(message || "").slice(0, 8000),
      items: items.slice(0, 20),
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 30),
    });
    console.log(`[wycena] przyjeto ${created.quoteRef} od ${String(email).toLowerCase()}`);
    res.json({ ok: true, quoteRef: created.quoteRef });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] zapis nie powiodl sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie przyjac zapytania" });
  }
});

/** Podglad wyceny dla klienta. Bez logowania, wiec adres musi znac token. */
app.get("/api/quotes/:ref", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const quote = await getQuoteByRef(pool, req.params.ref);
  if (!quote || !quote.access_token || quote.access_token !== req.query.token) {
    return res.status(404).json({ error: "Nie ma takiej wyceny" });
  }
  res.json({
    ok: true,
    quoteRef: quote.quote_ref,
    status: quote.status,
    lang: quote.lang,
    totalGrosze: quote.total_grosze,
    priceNote: quote.price_note,
    validUntil: quote.valid_until,
    items: quote.items.map((i) => ({
      id: i.id, title: i.title, qty: i.qty,
      unitGrosze: i.unit_grosze, lineGrosze: i.line_grosze,
      description: i.description, fileName: i.file_name,
    })),
  });
});

/** Wpisanie kwot: dopiero to czyni z zapytania oferte */
app.post("/api/quotes/:ref/price", express.json({ limit: "64kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  try {
    const result = await priceQuote(pool, req.params.ref, req.body?.lines, req.body?.note ?? null, req.body?.validDays);
    console.log(`[wycena] ${result.quoteRef} wyceniona na ${(result.totalGrosze / 100).toFixed(2)} PLN`);
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] wycenianie nie powiodlo sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac kwot" });
  }
});

/** Zamiana wyceny w zamowienie do zaplaty, z limitem kwartalnym jak w sklepie */
app.post("/api/quotes/:ref/convert", express.json({ limit: "16kb" }), async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  try {
    const quote = await getQuoteByRef(pool, req.params.ref);
    if (!quote) return res.status(404).json({ error: "Nie ma takiej wyceny" });
    if (!quote.total_grosze) return res.status(400).json({ error: "Najpierw wpisz kwoty", code: "not_priced" });

    const shipping = Number.isInteger(req.body?.delivery?.shippingGrosze) ? req.body.delivery.shippingGrosze : 0;
    // Limit kwartalny liczy sie od kwoty, ktora realnie wplynie, a wiec
    // po odliczeniu oplaty projektowej.
    const credit = await availableDesignCredit(pool, quote.customer_email);
    const creditGrosze = credit ? Math.min(credit.grosze, quote.total_grosze) : 0;
    const limit = await checkQuarterlyLimit(pool, quote.total_grosze - creditGrosze + shipping);
    if (!limit.ok) {
      return res.status(409).json({
        error: "Ta kwota nie zmiesci sie w limicie kwartalnym",
        code: "quarterly_limit",
        remainingPLN: Math.round(limit.remainingGrosze / 100),
      });
    }

    const order = await convertQuoteToOrder(pool, req.params.ref, {
      orderRef: generateOrderRef(),
      delivery: req.body?.delivery || {},
    });
    console.log(
      `[wycena] ${req.params.ref} stala sie zamowieniem ${order.orderRef}` +
      (order.creditGrosze ? `, odliczono ${(order.creditGrosze / 100).toFixed(2)} PLN z projektu ${order.creditFrom}` : "")
    );
    res.json({
      ok: true,
      orderRef: order.orderRef,
      totalGrosze: order.totalGrosze,
      creditGrosze: order.creditGrosze || 0,
      creditFrom: order.creditFrom,
      // Adres do wyslania klientowi. Dalej idzie ta sama sciezka co w sklepie.
      payUrl: `${SITE_URL}/order/status/?ref=${order.orderRef}&token=${order.accessToken}`,
    });
  } catch (e) {
    if (e instanceof QuoteError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[wycena] konwersja nie powiodla sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie utworzyc zamowienia" });
  }
});

// ============================================================
// PLIKI KLIENTOW
// ============================================================
// Plik wgrywany jest raz, na karcie uslugi, i od razu trafia na Dysk przez
// n8n. Przegladarka dostaje sam identyfikator, wiec pozycja w koszyku
// przezywa odswiezenie strony i powrot po kilku dniach.
//
// n8n nie zwraca linku w odpowiedzi HTTP, tylko wysyla go mailem, dlatego
// po zapisaniu pliku oddzwania do nas na /api/uploads/:token/stored.

const UPLOAD_N8N_URL = process.env.N8N_ORDER_FILE_WEBHOOK_URL;
const UPLOAD_CALLBACK_TOKEN = process.env.UPLOAD_CALLBACK_TOKEN;
const ABANDON_AFTER_DAYS = Number(process.env.UPLOAD_ABANDON_DAYS || 14);

/** Rysunki techniczne przyjmowane jako zalacznik do zlecenia */
const ATTACHMENT_EXT = /\.(svg|dxf|pdf)$/i;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const uploadStore = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024, files: 1 },
});

app.post("/api/uploads", (req, res, next) => {
  uploadStore.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.code === "LIMIT_FILE_SIZE" ? "Plik przekracza 60 MB" : (err.message || "Blad wysylki pliku"),
      });
    }
    next();
  });
}, async (req, res) => {
  const ip = extractIP(req);
  if (!checkPriceRate(ip)) return res.status(429).json({ error: "Za duzo zapytan, sprobuj za chwile" });
  if (!req.file?.buffer) return res.status(400).json({ error: "Brak pliku" });

  try {
    // Zalacznik to projekt do wykonania, nie podstawa wyceny. Grawer i ciecie
    // licza sie z pola albo dlugosci sciezki wybranej przez klienta, a rysunek
    // mowi warsztatowi, co ma wyciac. Dlatego nie liczymy z niego geometrii
    // i nie wpuszczamy go nigdy do wyceny.
    const isAttachment = req.body?.kind === "attachment";
    const name = (req.file.originalname || "plik").slice(0, 255);

    if (isAttachment && !ATTACHMENT_EXT.test(name)) {
      return res.status(400).json({ error: "Załącznik przyjmujemy jako SVG, DXF lub PDF", code: "unsupported_format" });
    }
    if (isAttachment && req.file.size > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ error: "Załącznik przekracza 15 MB", code: "file_too_large" });
    }

    const geometry = isAttachment ? null : await geometryFromFile(req.file.buffer, name);
    const token = generateToken();
    const lang = ["pl", "en", "de"].includes(req.body?.lang) ? req.body.lang : "pl";

    if (pool) {
      await pool.query(
        `INSERT INTO uploads (token, file_name, file_size_bytes, file_sha256, mime_type, geometry, lang, ip_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [token, name, req.file.size,
         geometry ? geometry.sha256 : createHash("sha256").update(req.file.buffer).digest("hex"),
         req.file.mimetype || "application/octet-stream",
         geometry ? JSON.stringify(geometry) : null, lang,
         createHash("sha256").update(ip).digest("hex").slice(0, 30)]
      );
    }

    // Wysylka na Dysk idzie obok glownego watku. Klient nie ma czekac
    // na zapis pliku, zeby zobaczyc cene, a brak Dysku nie moze zablokowac
    // wyceny. Link dojdzie do nas oddzwonieniem z n8n.
    if (UPLOAD_N8N_URL) {
      fetch(UPLOAD_N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          sha256: geometry.sha256,
          lang,
          geometry: { volumeCm3: geometry.volumeCm3, bbox: geometry.bbox, triangleCount: geometry.triangleCount },
          data: req.file.buffer.toString("base64"),
          source: "order_file",
        }),
      }).then((r) => {
        if (!r.ok) console.error(`[uploads] webhook n8n ${r.status} dla ${token}`);
      }).catch((e) => console.error("[uploads] webhook blad:", e.message));
    } else {
      console.warn("[uploads] N8N_ORDER_FILE_WEBHOOK_URL nie ustawiony, plik nie trafi na Dysk");
    }

    res.json({
      ok: true,
      uploadToken: token,
      geometry: geometry && {
        volumeCm3: Number(geometry.volumeCm3.toFixed(3)),
        bbox: geometry.bbox,
        triangleCount: geometry.triangleCount,
      },
    });
  } catch (e) {
    if (e instanceof PricingError) return res.status(400).json({ error: e.message, code: e.code });
    console.error("[uploads] blad:", e);
    res.status(500).json({ error: "Nie udalo sie przyjac pliku" });
  }
});

/**
 * Miniatura modelu, zrzucona z podgladu w przegladarce.
 *
 * Bez uwierzytelnienia, bo w tym momencie klient nie ma jeszcze zadnego
 * konta. Chroni nas to, ze token uploadu ma 48 znakow losowych, a zdjecie
 * da sie ustawic tylko raz i tylko dla pliku, ktory jeszcze nie zostal
 * zamowiony. Podmiana cudzego podgladu wymagalaby zgadniecia tokenu.
 */
const THUMB_PREFIX = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const MAX_THUMB_CHARS = 300_000; // okolo 220 kB obrazu

app.post("/api/uploads/:token/thumb", express.json({ limit: "400kb" }), async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const dataUrl = String(req.body?.dataUrl || "");
  if (dataUrl.length > MAX_THUMB_CHARS || !THUMB_PREFIX.test(dataUrl)) {
    return res.status(400).json({ error: "Nieprawidlowy obraz" });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE uploads SET thumbnail = $2
        WHERE token = $1 AND thumbnail IS NULL AND status = 'pending'`,
      [String(req.params.token || ""), dataUrl]
    );
    if (!rowCount) return res.status(404).json({ error: "Nieznany plik" });
    res.json({ ok: true });
  } catch (e) {
    // Najczestszy powod to brak kolumny thumbnail w bazie. Bez tego logu
    // objaw jest niemy: koszyk po prostu pokazuje zdjecie katalogowe.
    console.error("[uploads] zapis miniatury nie powiodl sie:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac podgladu" });
  }
});

app.get("/api/uploads/:token/thumb", async (req, res) => {
  if (!pool) return res.status(503).end();
  const { rows } = await pool.query(`SELECT thumbnail FROM uploads WHERE token = $1`, [
    String(req.params.token || ""),
  ]);
  const dataUrl = rows[0]?.thumbnail;
  if (!dataUrl) return res.status(404).end();

  const [, mime, b64] = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl) || [];
  if (!b64) return res.status(404).end();

  res.set("Content-Type", mime);
  // Miniatura nigdy sie nie zmienia, wiec moze lezec w cache do konca zycia tokenu.
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(Buffer.from(b64, "base64"));
});

/**
 * Oddzwonienie z n8n po zapisaniu pliku na Dysku.
 * Chronione wspoldzielonym tokenem, bo inaczej ktokolwiek moglby podmienic
 * link do pliku w zamowieniu.
 */
app.post("/api/uploads/:token/stored", express.json({ limit: "8kb" }), async (req, res) => {
  const sent = req.headers["x-upload-token"];
  if (!UPLOAD_CALLBACK_TOKEN || sent !== UPLOAD_CALLBACK_TOKEN) {
    // Odcisk zamiast wartosci: tyle wystarczy, zeby porownac obie strony,
    // a sam sekret nie trafia do logow.
    const fp = (v) => (v ? `${v.length}/${createHash("sha256").update(v).digest("hex").slice(0, 8)}` : "BRAK");
    console.error(`[uploads] 401 stored: serwer=${fp(UPLOAD_CALLBACK_TOKEN)} n8n=${fp(sent)}`);
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const { driveUrl, driveFileId } = req.body || {};
  const { rowCount } = await pool.query(
    `UPDATE uploads SET drive_url = $2, drive_file_id = $3, stored_at = NOW() WHERE token = $1`,
    [String(req.params.token || ""), driveUrl || null, driveFileId || null]
  );
  if (!rowCount) return res.status(404).json({ error: "Nieznany plik" });
  console.log(`[uploads] plik ${req.params.token} zapisany na Dysku`);
  res.json({ ok: true });
});

const FILES_READY_N8N_URL = process.env.N8N_ORDER_FILES_READY_WEBHOOK_URL;

/**
 * Prosi n8n o przeniesienie plikow zamowienia do folderu Zamowienia.
 *
 * Plik trafia na Dysk juz w chwili wgrania, bo wtedy liczymy geometrie
 * i klient nie ma czekac. W tym momencie to jednak tylko proba wyceny:
 * wiekszosc takich plikow nigdy nie stanie sie zamowieniem. Dlatego
 * ladaja w folderze roboczym, a tutaj, po zaplacie, wedruja tam, gdzie
 * naprawde jest robota do wykonania.
 *
 * Nie rzuca wyjatkiem. Nieudane przeniesienie zostawia plik w folderze
 * roboczym, co jest niewygodne, ale nie moze wywrocic obslugi platnosci.
 */
async function moveOrderFilesToOrders(pool, orderId, orderRef) {
  if (!FILES_READY_N8N_URL) {
    console.warn("[dysk] N8N_ORDER_FILES_READY_WEBHOOK_URL nie ustawiony, pliki zostaja w folderze roboczym");
    return;
  }

  const { rows } = await pool.query(
    `SELECT token, file_name, drive_file_id, geometry IS NOT NULL AS is_model
       FROM uploads
      WHERE order_id = $1 AND drive_file_id IS NOT NULL
      ORDER BY id`,
    [orderId]
  );
  if (!rows.length) return;

  const resp = await fetch(FILES_READY_N8N_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderRef,
      files: rows.map((r) => ({
        driveFileId: r.drive_file_id,
        fileName: r.file_name,
        kind: r.is_model ? "model" : "attachment",
      })),
    }),
  });
  if (!resp.ok) {
    console.error(`[dysk] webhook przenoszenia zwrocil ${resp.status} dla ${orderRef}`);
    return;
  }
  console.log(`[dysk] zlecono przeniesienie ${rows.length} plikow zamowienia ${orderRef}`);
}

/** Pliki wgrane i nigdy niezamowione oznaczamy jako porzucone */
async function markAbandonedUploads() {
  if (!pool) return;
  try {
    const { rowCount } = await pool.query(
      `UPDATE uploads SET status = 'abandoned', abandoned_at = NOW()
        WHERE status = 'pending' AND created_at < NOW() - ($1 || ' days')::interval`,
      [String(ABANDON_AFTER_DAYS)]
    );
    if (rowCount) console.log(`[uploads] oznaczono jako porzucone: ${rowCount}`);
  } catch (e) {
    console.error("[uploads] oznaczanie porzuconych nie powiodlo sie:", e.message);
  }
}
if (pool) cron.schedule("30 3 * * *", markAbandonedUploads);
// Rezerwacje wygasaja co kwadrans, bo przy platnosci natychmiastowej trzymamy
// towar tylko 20 minut i nie ma sensu czekac z tym do nocy.
if (pool) cron.schedule("*/15 * * * *", () => releaseExpiredReservations(pool).catch(() => {}));

/** Zamowienie nieoplacone po terminie zamykamy i oddajemy jego towar do sprzedazy. */
async function expireStaleOrders() {
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = 'expired'
        WHERE status IN ('awaiting_payment','awaiting_transfer')
          AND paid_at IS NULL AND expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING id, order_ref`
    );
    for (const o of rows) await releaseOrderReservations(pool, o.id);
    if (rows.length) console.log(`[zamowienia] wygaslo ${rows.length}: ${rows.map((r) => r.order_ref).join(", ")}`);
  } catch (e) {
    console.error("[zamowienia] wygaszanie nie powiodlo sie:", e.message);
  }
}
if (pool) cron.schedule("0 * * * *", expireStaleOrders);

// ============================================================
// ZAMOWIENIA I PLATNOSCI
// ============================================================

const SITE_URL = process.env.SITE_URL || "https://www.aejaca.com";
const ORDER_VALIDITY_DAYS = 7;

// ------------------------------------------------------------
// Przelew w euro
// ------------------------------------------------------------
// Autopay obsluguje wylacznie BLIK i polskie banki, wiec klient spoza Polski
// nie ma czym zaplacic od reki. Dane rachunku trzymamy w zmiennych srodowiskowych,
// bo zmieniaja sie niezaleznie od kodu i nie maja czego szukac w repozytorium.
const TRANSFER = {
  iban: process.env.TRANSFER_IBAN_EUR || null,
  bic: process.env.TRANSFER_BIC || null,
  holder: process.env.TRANSFER_ACCOUNT_HOLDER || null,
  bank: process.env.TRANSFER_BANK_NAME || null,
};
const transferConfigured = () => Boolean(TRANSFER.iban);

/** Kurs NBP z bazy, ten sam, ktory widzi strona */
async function currentEurRate() {
  if (!pool) return null;
  try {
    const { rows } = await pool.query(
      `SELECT pln_per_eur::float AS rate FROM market_rates
        WHERE pln_per_eur IS NOT NULL ORDER BY fetched_at DESC LIMIT 1`
    );
    return rows[0]?.rate ?? null;
  } catch {
    return null;
  }
}

/** Kanaly platnosci dostepne na serwisie, prosto z Autopay */
app.get("/api/payment-methods", async (_req, res) => {
  const list = await fetchGatewayList();
  if (!list) return res.json({ available: false, gateways: [] });
  res.json({
    available: true,
    gateways: (list.gatewayList || [])
      .filter((g) => g.state === "OK")
      .map((g) => ({
        id: g.gatewayID, name: g.name, group: g.groupType,
        icon: g.iconURL || g.iconUrl || null, order: g.order ?? 99,
      }))
      .sort((a, b) => a.order - b.order),
  });
});

/**
 * Utworzenie zamowienia.
 * Cena liczona jest tutaj od nowa, z parametrow i geometrii pliku.
 * Kwota przyslana przez przegladarke jest ignorowana.
 */
app.post("/api/orders", express.json({ limit: "1mb" }), async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  try {
    const { items, customer, delivery, consents, lang, paymentMethod } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Zamowienie bez pozycji" });
    if (items.length > 20) return res.status(400).json({ error: "Za duzo pozycji" });
    if (!customer?.email || !CONTACT_EMAIL_RE.test(customer.email)) return res.status(400).json({ error: "Nieprawidlowy adres email" });
    if (!consents?.terms) return res.status(400).json({ error: "Akceptacja regulaminu jest wymagana" });

    const safeLang = ["pl", "en", "de"].includes(lang) ? lang : "pl";
    const rates = items.some((i) => String(i.calculator || "").startsWith("jewelry_")) ? await currentMetalRates() : null;

    // Pozycje produktowe wyceniamy z bazy, nie z przegladarki: cena i stan
    // moga sie zmienic miedzy dodaniem do koszyka a zaplata.
    const productItems = [];
    for (const raw of items.filter((i) => i.productSlug)) {
      const product = await getProduct(pool, raw.productSlug);
      if (!product) return res.status(400).json({ error: `Produkt ${raw.productSlug} nie istnieje`, code: "product_not_found" });
      const qty = Number.isInteger(raw.qty) && raw.qty > 0 ? Math.min(99, raw.qty) : 1;
      if (product.available !== null && product.available < qty) {
        return res.status(409).json({
          error: "Nie mamy tylu sztuk", code: "out_of_stock",
          slug: product.slug, available: product.available,
        });
      }
      productItems.push({
        slug: product.slug,
        title: product.title?.[safeLang] || product.title?.pl || product.slug,
        qty,
        unitGrosze: product.priceGrosze,
        lineGrosze: product.priceGrosze * qty,
        weightG: product.weightG,
        personalization: sanitizePersonalization(raw.personalization),
        kind: product.kind,
      });
    }

    const priced = [];
    for (const raw of items.filter((i) => !i.productSlug)) {
      // Geometria pochodzi z wczesniejszego wywolania /api/price, gdzie zostala
      // policzona z pliku po stronie serwera. Cene liczymy tu jeszcze raz tym
      // samym kodem, wiec zmiana czegokolwiek po drodze nic nie daje.
      // Geometrie bierzemy z bazy, nie z przegladarki, gdy pozycja ma plik.
      let itemGeometry = raw.geometry || null;
      if (raw.uploadToken) {
        const { rows } = await pool.query("SELECT geometry FROM uploads WHERE token = $1", [String(raw.uploadToken)]);
        if (rows[0]?.geometry) itemGeometry = rows[0].geometry;
      }

      const item = priceItem({
        calculator: raw.calculator,
        params: raw.params,
        lang: safeLang,
        geometry: itemGeometry,
        scale: raw.scale || 1,
        rates,
      });
      // Opakowanie i personalizacja licza sie tutaj, nie w przegladarce.
      // Bez tego klient widzialby cene z doplata, a placil bez niej.
      const packGrosze = packagingGrosze(raw.packagingId);
      const personalization = sanitizePersonalization(raw.personalization);
      // Trzy niezalezne teksty: wyrob, wieko, wnetrze wieka.
      const packagingText = sanitizePersonalization(raw.packagingText);
      const packagingTextBack = sanitizePersonalization(raw.packagingTextBack);
      // Opis zlecenia to tresc od klienta, nie parametr wyceny, wiec przycinamy
      // go do rozsadnej dlugosci i zapisujemy razem z parametrami pozycji.
      const description = String(raw.description || "").slice(0, 2000).trim() || null;
      const qty = Number.isInteger(raw.qty) && raw.qty > 0 ? Math.min(999, raw.qty) : item.qty;
      const unitGrosze = item.unitGrosze + packGrosze;

      priced.push({
        ...item,
        qty,
        unitGrosze,
        lineGrosze: unitGrosze * qty,
        packagingId: raw.packagingId || null,
        packagingGrosze: packGrosze,
        personalization,
        packagingText,
        packagingTextBack,
        description,
        params: raw.params,
        geometry: raw.geometry || null,
        fileName: raw.fileName || null,
        uploadToken: raw.uploadToken || null,
        attachmentToken: raw.attachmentToken || null,
      });
    }

    const itemsTotal =
      priced.reduce((sum, i) => sum + i.lineGrosze, 0) +
      productItems.reduce((sum, i) => sum + i.lineGrosze, 0);

    // Koszt wysylki liczymy tutaj, z kraju i metody. Przyjecie kwoty od
    // przegladarki pozwalaloby zamowic paczke do Australii za cene paczkomatu.
    const country = String(delivery?.country || "PL").toUpperCase();
    const method = delivery?.method || "pickup";
    const shipping = shippingCost(method, country, itemsTotal);
    if (shipping === null) {
      return res.status(400).json({
        error: "Ta metoda dostawy nie jest dostepna dla wybranego kraju",
        code: "delivery_unavailable",
      });
    }
    const total = itemsTotal + shipping;

    const limit = await checkQuarterlyLimit(pool, total);
    if (!limit.ok) {
      return res.status(409).json({
        error: "Nie mozemy teraz przyjac tej platnosci",
        code: "quarterly_limit",
        remainingPLN: Math.round(limit.remainingGrosze / 100),
      });
    }

    const orderRef = generateOrderRef();
    const token = generateToken();

    // Przelew w euro: kwote zamrazamy tu i teraz razem z kursem. Gdybysmy
    // przeliczali ja dopiero przy ksiegowaniu, klient przelalby jedna kwote,
    // a my oczekiwalibysmy innej.
    const wantsTransfer = paymentMethod === "bank_transfer";
    if (wantsTransfer && !transferConfigured()) {
      return res.status(503).json({ error: "Platnosc przelewem nie jest skonfigurowana" });
    }
    // Przelew z recznym potwierdzeniem obsluguje wylacznie sprzedaz w euro.
    // Klient placacy w zlotowkach ma BLIK i pay-by-link, wiec reczne
    // ksiegowanie byloby dla niego wylacznie opoznieniem.
    if (wantsTransfer && !["en", "de"].includes(safeLang)) {
      return res.status(400).json({ error: "Przelew jest dostepny wylacznie przy cenach w euro" });
    }
    const eurRate = wantsTransfer ? await currentEurRate() : null;
    const amountEurCents = wantsTransfer ? eurCentsFromGrosze(total, eurRate) : null;

    // Przy przelewie ta sama data konczy rezerwacje towaru i waznosc kwoty.
    // Dwie rozne daty oznaczalyby dwie obietnice, z ktorych klient zapamieta
    // korzystniejsza.
    const expiresAt = wantsTransfer
      ? addBusinessDays(new Date(), TRANSFER_HOLD_BUSINESS_DAYS)
      : new Date(Date.now() + ORDER_VALIDITY_DAYS * 86400_000);

    const { rows } = await pool.query(
      `INSERT INTO orders (order_ref, status, kind, lang, items_total_grosze, shipping_grosze, total_grosze,
         customer_email, customer_name, customer_phone,
         delivery_method, delivery_point, address_line1, address_line2, postal_code, city, country,
         accepted_terms_at, waived_withdrawal_at, digital_immediate_at,
         access_token, ip_hash, expires_at, revisions_included,
         payment_method, amount_eur_cents, eur_rate, eur_rate_locked_at)
       VALUES ($1,$22,'instant',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
         NOW(), $16, $17, $18, $19, $20, $21,
         $23, $24, $25, CASE WHEN $24::INTEGER IS NULL THEN NULL ELSE NOW() END)
       RETURNING id`,
      [orderRef, safeLang, itemsTotal, shipping, total,
       customer.email.trim().toLowerCase(), customer.name || null, customer.phone || null,
       delivery?.method || null, delivery?.point || null, delivery?.addressLine1 || null,
       delivery?.addressLine2 || null, delivery?.postalCode || null, delivery?.city || null,
       country,
       consents?.waiveWithdrawal ? new Date() : null,
       consents?.digitalImmediate ? new Date() : null,
       token, createHash("sha256").update(extractIP(req)).digest("hex").slice(0, 30), expiresAt,
       // Limit bierzemy z pozycji projektowej, jesli taka jest w koszyku.
       priced.find((i) => i.revisionsIncluded)?.revisionsIncluded ?? null,
       wantsTransfer ? "awaiting_transfer" : "awaiting_payment",
       wantsTransfer ? "bank_transfer" : "autopay",
       amountEurCents, eurRate]
    );
    const orderId = rows[0].id;

    // Rezerwacja idzie w osobnej transakcji z blokada wiersza produktu, wiec
    // dwa rownolegle zamowienia na ostatnia sztuke ustawiaja sie w kolejce.
    // Gdy towaru zabraknie, kasujemy swieze zamowienie zamiast zostawiac
    // klienta z linkiem do zaplaty za cos, czego nie wyslemy.
    if (productItems.length) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const it of productItems) {
          await reserveProduct(client, {
            slug: it.slug, qty: it.qty, orderId,
            paymentMethod: wantsTransfer ? "bank_transfer" : "autopay",
          });
          await client.query(
            `INSERT INTO order_items (order_id, item_type, product_id, title, qty, unit_grosze, line_grosze, params)
             SELECT $1, 'product', id, $2, $3, $4, $5, $6 FROM products WHERE slug = $7`,
            [orderId, it.title, it.qty, it.unitGrosze, it.lineGrosze,
             JSON.stringify({ slug: it.slug, personalization: it.personalization }), it.slug]
          );
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        await pool.query("DELETE FROM orders WHERE id = $1", [orderId]).catch(() => {});
        if (e instanceof ProductError) {
          return res.status(409).json({ error: e.message, code: e.code, slug: e.slug, available: e.available });
        }
        throw e;
      } finally {
        client.release();
      }
    }

    for (const i of priced) {
      let uploadRow = null;
      if (i.uploadToken) {
        const { rows } = await pool.query(
          `UPDATE uploads SET status = 'ordered', order_id = $2 WHERE token = $1
           RETURNING id, drive_url, file_name, file_sha256, geometry`,
          [i.uploadToken, orderId]
        );
        uploadRow = rows[0] || null;
      }

      // Rysunek techniczny nie jest pozycja zamowienia, tylko materialem do
      // wykonania, wiec wiazemy go z zamowieniem, a nie z linia.
      if (i.attachmentToken) {
        await pool.query(
          `UPDATE uploads SET status = 'ordered', order_id = $2 WHERE token = $1`,
          [i.attachmentToken, orderId]
        );
      }

      await pool.query(
        `INSERT INTO order_items (order_id, item_type, calculator, title, qty, unit_grosze, line_grosze,
           params, price_breakdown, file_name, file_sha256, file_url, geometry, upload_id)
         VALUES ($1,'service',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [orderId, i.calculator, i.title, i.qty, i.unitGrosze, i.lineGrosze,
         JSON.stringify({ ...(i.params ?? {}), packagingId: i.packagingId, personalization: i.personalization, packagingText: i.packagingText, packagingTextBack: i.packagingTextBack, description: i.description }),
         JSON.stringify(i.breakdown ?? []),
         i.fileName || uploadRow?.file_name || null,
         i.geometry?.sha256 ?? uploadRow?.file_sha256 ?? null,
         uploadRow?.drive_url ?? null,
         i.geometry ? JSON.stringify(i.geometry) : (uploadRow?.geometry ? JSON.stringify(uploadRow.geometry) : null),
         uploadRow?.id ?? null]
      );
    }

    // Dane do przelewu wysylamy od razu: klient zamknie strone, a przelew
    // zrobi wieczorem z telefonu.
    if (wantsTransfer) {
      sendTransferInstructions(pool, orderId, {
        ...TRANSFER,
        amountEur: (amountEurCents / 100).toFixed(2),
        reference: orderRef,
        dueAt: expiresAt,
      }).catch((e) => console.error("[przelew] wysylka danych do przelewu nie powiodla sie:", e.message));
    }

    res.json({
      ok: true,
      orderRef,
      token,
      totalGrosze: total,
      totalPLN: (total / 100).toFixed(2),
      expiresAt,
      paymentMethod: wantsTransfer ? "bank_transfer" : "autopay",
      // Numer rachunku wydajemy dopiero razem z zamowieniem, czyli wtedy, gdy
      // klient potwierdzil chec zaplaty. Wczesniej nie ma po co go pokazywac.
      transfer: wantsTransfer
        ? { ...TRANSFER, amountEurCents, amountEur: (amountEurCents / 100).toFixed(2), reference: orderRef, dueAt: expiresAt }
        : null,
      items: priced.map((i) => ({
        title: i.title, qty: i.qty,
        unitPLN: (i.unitGrosze / 100).toFixed(2),
        linePLN: (i.lineGrosze / 100).toFixed(2),
      })),
    });
  } catch (e) {
    if (e instanceof PricingError) return res.status(400).json({ error: e.message, code: e.code });
    // Pelny blad do logow, skrocony do odpowiedzi. Komunikaty Postgresa
    // mowia o kolumnach i ograniczeniach, nie o poswiadczeniach, wiec
    // ich pokazanie przyspiesza diagnoze bez ryzyka wycieku sekretow.
    console.error("[orders] create failed:", e?.code, e?.message, e?.detail, e?.stack);
    res.status(500).json({
      error: "Nie udalo sie utworzyc zamowienia",
      detail: [e?.code, e?.message, e?.detail].filter(Boolean).join(" | ").slice(0, 300),
    });
  }
});

// ------------------------------------------------------------
// Katalog produktow
// ------------------------------------------------------------
// Czytane przez sklep przy budowaniu stron oraz na zywo, gdy klient oglada
// karte: stan magazynowy zmienia sie bez wdrozenia, wiec statyczna strona
// nie moze byc jedynym zrodlem informacji o dostepnosci.
app.get("/api/products", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  try {
    const products = await listProducts(pool, {
      category: ["jewelry", "studio"].includes(req.query.category) ? req.query.category : null,
      offer: ["ready", "personalized"].includes(req.query.offer) ? req.query.offer : null,
    });
    res.json({ products });
  } catch (e) {
    console.error("[produkty] lista:", e.message);
    res.status(500).json({ error: "Nie udalo sie pobrac katalogu" });
  }
});

app.get("/api/products/:slug", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const product = await getProduct(pool, req.params.slug).catch(() => null);
  if (!product) return res.status(404).json({ error: "Produkt nie istnieje" });
  res.json({ product });
});

/** Dodanie albo aktualizacja produktu. Slug jest kluczem, wiec ten sam wpis
 *  mozna poprawiac wielokrotnie bez tworzenia duplikatow. */
app.put("/api/products/:slug", express.json({ limit: "256kb" }), async (req, res) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) return res.status(400).json({ error: "Nieprawidlowy slug" });

  const b = req.body || {};
  if (!b.title?.pl || !b.title?.en || !b.title?.de) {
    return res.status(400).json({ error: "Tytul musi byc w trzech jezykach" });
  }
  if (!Number.isInteger(b.priceGrosze) || b.priceGrosze < 0) {
    return res.status(400).json({ error: "Cena musi byc liczba calkowita w groszach" });
  }
  const kind = b.kind === "digital" ? "digital" : "physical";
  // Produkt cyfrowy nie ma stanu magazynowego, fizyczny musi go miec.
  const stock = kind === "digital" ? null : (Number.isInteger(b.stock) ? Math.max(0, b.stock) : 0);

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (slug, kind, category, offer, title, short, description, specs, images,
         price_grosze, weight_g, stock, lead_time_days, personalization, sort_order, active, license, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (slug) DO UPDATE SET
         kind = EXCLUDED.kind, category = EXCLUDED.category, offer = EXCLUDED.offer,
         title = EXCLUDED.title, short = EXCLUDED.short, description = EXCLUDED.description,
         specs = EXCLUDED.specs, images = EXCLUDED.images, price_grosze = EXCLUDED.price_grosze,
         weight_g = EXCLUDED.weight_g, stock = EXCLUDED.stock, lead_time_days = EXCLUDED.lead_time_days,
         personalization = EXCLUDED.personalization, sort_order = EXCLUDED.sort_order,
         active = EXCLUDED.active, license = EXCLUDED.license, notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING id, slug`,
      [slug, kind, b.category || null, b.offer === "personalized" ? "personalized" : "ready",
       JSON.stringify(b.title), b.short ? JSON.stringify(b.short) : null,
       b.description ? JSON.stringify(b.description) : null, b.specs ? JSON.stringify(b.specs) : null,
       JSON.stringify(Array.isArray(b.images) ? b.images : []),
       b.priceGrosze, Number.isInteger(b.weightG) ? b.weightG : null, stock,
       Number.isInteger(b.leadTimeDays) ? b.leadTimeDays : 2,
       b.personalization ? JSON.stringify(b.personalization) : null,
       Number.isInteger(b.sortOrder) ? b.sortOrder : 100,
       b.active !== false, b.license || null, b.notes || null]
    );
    res.json({ ok: true, product: rows[0] });
  } catch (e) {
    console.error("[produkty] zapis:", e.message);
    res.status(500).json({ error: "Nie udalo sie zapisac produktu", detail: e.message.slice(0, 200) });
  }
});

/** Korekta samego stanu magazynowego, bez przepisywania calego produktu. */
app.patch("/api/products/:slug/stock", express.json({ limit: "4kb" }), async (req, res) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const { stock } = req.body || {};
  if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ error: "Stan musi byc liczba nieujemna" });
  const { rows } = await pool.query(
    `UPDATE products SET stock = $2, updated_at = NOW()
      WHERE slug = $1 AND stock IS NOT NULL RETURNING slug, stock`,
    [String(req.params.slug || ""), stock]
  );
  if (!rows[0]) return res.status(404).json({ error: "Produkt nie istnieje albo jest cyfrowy" });
  res.json({ ok: true, ...rows[0] });
});

/** Lista dla panelu: takze pozycje wylaczone, razem z rezerwacjami. */
app.get("/api/admin/products", async (req, res) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const { rows } = await pool.query(
    `SELECT p.slug, p.kind, p.category, p.offer, p.title, p.price_grosze, p.stock, p.active,
            p.sold_count, p.sort_order, a.reserved, a.available
       FROM products p LEFT JOIN product_availability a ON a.id = p.id
      ORDER BY p.active DESC, p.sort_order, p.slug`
  );
  res.json({ products: rows });
});

// ------------------------------------------------------------
// Reczne potwierdzenie wplaty
// ------------------------------------------------------------
// Przelew nie ma ITN, wiec jedynym dowodem wplywu jest wyciag bankowy, ktory
// oglada czlowiek. Ten endpoint jest odpowiednikiem SUCCESS z bramki: ustawia
// oplacenie, wysyla te same maile i przenosi pliki do Zamowien. Wolno go
// wykonac raz, bo pilnuje tego fulfilled_at.
const TRANSFER_TOLERANCE = 0.98;

app.get("/api/orders/awaiting-transfer", async (req, res) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const { rows } = await pool.query(
    `SELECT order_ref, customer_email, customer_name, lang, total_grosze,
            amount_eur_cents, eur_rate, created_at, expires_at
       FROM orders WHERE status = 'awaiting_transfer' ORDER BY created_at DESC LIMIT 100`
  );
  res.json({
    orders: rows.map((o) => ({
      orderRef: o.order_ref,
      email: o.customer_email,
      name: o.customer_name,
      lang: o.lang,
      totalPLN: (o.total_grosze / 100).toFixed(2),
      amountEur: o.amount_eur_cents != null ? (o.amount_eur_cents / 100).toFixed(2) : null,
      eurRate: o.eur_rate,
      createdAt: o.created_at,
      expiresAt: o.expires_at,
    })),
  });
});

app.post("/api/orders/:ref/confirm-transfer", express.json({ limit: "8kb" }), async (req, res) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });

  const ref = String(req.params.ref || "");
  const { receivedEur, note, by, force } = req.body || {};

  const { rows } = await pool.query(
    `SELECT id, status, amount_eur_cents, fulfilled_at FROM orders WHERE order_ref = $1`,
    [ref]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Zamowienie nie istnieje" });
  if (order.fulfilled_at) return res.status(409).json({ error: "Zamowienie juz zostalo rozliczone" });
  if (order.status !== "awaiting_transfer") {
    return res.status(409).json({ error: `Zamowienie ma status ${order.status}, nie czeka na przelew` });
  }

  // Kwota otrzymana bywa mniejsza od naleznej o oplaty banku posredniczacego.
  // Drobna roznice przyjmujemy, wieksza wymaga swiadomej decyzji.
  const expected = order.amount_eur_cents ?? 0;
  const received = Number.isFinite(Number(receivedEur)) ? Math.round(Number(receivedEur) * 100) : expected;
  if (!force && expected > 0 && received < Math.round(expected * TRANSFER_TOLERANCE)) {
    return res.status(409).json({
      error: "Kwota nizsza od naleznej",
      code: "underpaid",
      expectedEur: (expected / 100).toFixed(2),
      receivedEur: (received / 100).toFixed(2),
      shortfallEur: ((expected - received) / 100).toFixed(2),
    });
  }

  await pool.query(
    `UPDATE orders SET status = 'paid', paid_at = NOW(), fulfilled_at = NOW(),
       payment_status = 'SUCCESS', payment_status_details = 'manual_transfer',
       transfer_received_cents = $2, transfer_confirmed_at = NOW(),
       transfer_confirmed_by = $3, transfer_note = $4
     WHERE id = $1`,
    [order.id, received, String(by || "admin").slice(0, 120), note ? String(note).slice(0, 2000) : null]
  );
  console.log(`[przelew] ${ref} potwierdzony recznie, ${(received / 100).toFixed(2)} EUR`);

  // Dalej dokladnie to samo, co po SUCCESS z bramki.
  sendOrderPaidEmails(pool, order.id).catch((e) =>
    console.error("[przelew] wysylka maili nie powiodla sie:", e.message)
  );
  consumeReservations(pool, order.id).catch((e) =>
    console.error("[produkty] zdjecie ze stanu nie powiodlo sie:", e.message)
  );
  moveOrderFilesToOrders(pool, order.id, ref).catch((e) =>
    console.error("[dysk] przeniesienie plikow nie powiodlo sie:", e.message)
  );

  res.json({ ok: true, orderRef: ref, receivedEur: (received / 100).toFixed(2) });
});

/** Parametry startu transakcji, podpisane po stronie serwera */
app.post("/api/orders/:ref/pay", express.json({ limit: "8kb" }), async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  if (!autopayConfigured()) return res.status(503).json({ error: "Platnosci nie sa skonfigurowane" });

  const ref = String(req.params.ref || "");
  const token = String(req.body?.token || "");
  const gatewayId = req.body?.gatewayId ?? 0;

  const { rows } = await pool.query(
    "SELECT id, order_ref, access_token, status, total_grosze, customer_email, expires_at FROM orders WHERE order_ref = $1",
    [ref]
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: "Zamowienie nie istnieje" });
  if (order.access_token !== token) return res.status(403).json({ error: "Brak dostepu" });
  if (order.status === "paid") return res.status(409).json({ error: "Zamowienie jest juz oplacone", code: "already_paid" });
  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    return res.status(410).json({ error: "Wycena wygasla", code: "expired" });
  }

  const limit = await checkQuarterlyLimit(pool, order.total_grosze);
  if (!limit.ok) return res.status(409).json({ error: "Nie mozemy teraz przyjac tej platnosci", code: "quarterly_limit" });

  const validity = new Date(Math.min(new Date(order.expires_at).getTime(), Date.now() + 30 * 86400_000));
  const start = buildStartTransaction({
    orderId: order.order_ref,
    amountGrosze: order.total_grosze,
    description: `AEJaCA ${order.order_ref}`,
    gatewayId,
    customerEmail: order.customer_email,
    validityTime: formatValidityTime(validity),
  });

  await pool.query("UPDATE orders SET payment_gateway_id = $2 WHERE id = $1", [order.id, Number(gatewayId) || null]);

  // Zwracamy gotowe parametry, formularz wysyla przegladarka.
  // Klucz wspoldzielony nigdy nie opuszcza serwera.
  res.json({ ok: true, ...start });
});

/**
 * Powrot klienta z bramki.
 * Weryfikacja podpisu jest obowiazkowa, a status zamowienia zmienia
 * WYLACZNIE komunikat ITN. Ta strona pokazuje tylko to, co juz wiadomo.
 */
app.get("/api/autopay/return", async (req, res) => {
  const { ServiceID, OrderID, Hash } = req.query || {};
  const target = new URL("/order/status/", SITE_URL);

  if (!verifyReturn({ ServiceID, OrderID, Hash })) {
    console.warn("[autopay] powrot z niepoprawnym podpisem", { OrderID });
    target.searchParams.set("error", "invalid_signature");
    return res.redirect(302, target.toString());
  }

  target.searchParams.set("ref", String(OrderID));
  res.redirect(302, target.toString());
});

/**
 * Powiadomienie natychmiastowe o statusie platnosci (ITN).
 *
 * Reguly z dokumentacji, str. 26 do 27:
 *  - kazdy komunikat o poprawnym podpisie potwierdzamy struktura CONFIRMED,
 *  - logike biznesowa wykonujemy tylko przy PIERWSZYM SUCCESS,
 *  - FAILURE po SUCCESS potwierdzamy, ale nie cofamy statusu zamowienia.
 */
app.post("/api/autopay/itn", express.urlencoded({ extended: false, limit: "256kb" }), async (req, res) => {
  const parsed = parseITN(req.body?.transactions);

  if (pool) {
    await pool.query(
      `INSERT INTO payment_notifications (order_ref, remote_id, payment_status, status_details,
         amount_grosze, currency, gateway_id, payment_date, hash_valid, raw_xml)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [parsed.orderID ?? null, parsed.remoteID ?? null, parsed.paymentStatus ?? null,
       parsed.paymentStatusDetails ?? null,
       parsed.amount ? Math.round(Number(parsed.amount) * 100) : null,
       parsed.currency ?? null, parsed.gatewayID ? Number(parsed.gatewayID) : null,
       parsed.paymentDate ?? null, Boolean(parsed.hashValid), parsed.xml ?? null]
    ).catch((e) => console.error("[itn] log failed:", e.message));
  }

  if (!parsed.ok || !parsed.hashValid) {
    console.warn("[autopay] ITN odrzucony:", parsed.error || "bledny podpis", parsed.orderID);
    return res.status(400).type("text/plain").send("hash mismatch");
  }

  try {
    if (pool) {
      const { rows } = await pool.query(
        "SELECT id, status, total_grosze, fulfilled_at FROM orders WHERE order_ref = $1",
        [parsed.orderID]
      );
      const order = rows[0];

      if (!order) {
        console.warn("[autopay] ITN dla nieznanego zamowienia", parsed.orderID);
      } else {
        const amountGrosze = Math.round(Number(parsed.amount) * 100);
        const amountOk = amountGrosze === order.total_grosze;
        if (!amountOk) {
          console.error("[autopay] kwota z ITN nie zgadza sie z zamowieniem", {
            ref: parsed.orderID, itn: amountGrosze, zamowienie: order.total_grosze,
          });
        }

        if (parsed.paymentStatus === "SUCCESS" && amountOk && !order.fulfilled_at) {
          await pool.query(
            `UPDATE orders SET status = 'paid', paid_at = NOW(), fulfilled_at = NOW(),
               payment_status = $2, payment_status_details = $3, payment_remote_id = $4
             WHERE id = $1`,
            [order.id, parsed.paymentStatus, parsed.paymentStatusDetails, parsed.remoteID]
          );
          console.log(`[autopay] zamowienie ${parsed.orderID} oplacone, ${(amountGrosze / 100).toFixed(2)} PLN`);

          // Maile wysylamy po ustawieniu fulfilled_at, wiec kolejny SUCCESS
          // tego zamowienia juz tu nie wejdzie. Nie czekamy na wynik: ITN
          // trzeba potwierdzic niezaleznie od tego, czy poczta zadziala.
          sendOrderPaidEmails(pool, order.id).catch((e) =>
            console.error("[autopay] wysylka maili nie powiodla sie:", e.message)
          );
          // Stan magazynowy schodzi dopiero teraz. Do tej pory towar byl
          // wylacznie zarezerwowany, wiec porzucone zamowienie niczego nie kasowalo.
          consumeReservations(pool, order.id).catch((e) =>
            console.error("[produkty] zdjecie ze stanu nie powiodlo sie:", e.message)
          );
          // Pliki lezaly dotad w folderze roboczym, bo w chwili wgrania nikt
          // jeszcze niczego nie zamowil. Dopiero zaplata robi z nich zlecenie.
          moveOrderFilesToOrders(pool, order.id, parsed.orderID).catch((e) =>
            console.error("[dysk] przeniesienie plikow nie powiodlo sie:", e.message)
          );
          // TODO: wydanie plikow cyfrowych po dodaniu produktow do katalogu
        } else {
          await pool.query(
            `UPDATE orders SET payment_status = COALESCE($2, payment_status),
               payment_status_details = COALESCE($3, payment_status_details)
             WHERE id = $1 AND status <> 'paid'`,
            [order.id, parsed.paymentStatus, parsed.paymentStatusDetails]
          );
        }
      }
    }
  } catch (e) {
    console.error("[autopay] przetwarzanie ITN nie powiodlo sie:", e.message);
  }

  // Potwierdzamy zawsze, takze komunikat, ktory niczego nie zmienil.
  res.type("application/xml").send(buildITNConfirmation(parsed.orderID));
});

/** Status zamowienia dla strony powrotu */
app.get("/api/orders/:ref", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Baza niedostepna" });
  const { rows } = await pool.query(
    `SELECT order_ref, status, total_grosze, lang, paid_at, expires_at, delivery_method,
            revisions_included, revisions_used,
            payment_method, amount_eur_cents, transfer_confirmed_at
       FROM orders WHERE order_ref = $1`,
    [String(req.params.ref || "")]
  );
  const o = rows[0];
  if (!o) return res.status(404).json({ error: "Zamowienie nie istnieje" });
  res.json({
    orderRef: o.order_ref,
    status: o.status,
    totalPLN: (o.total_grosze / 100).toFixed(2),
    paidAt: o.paid_at,
    expiresAt: o.expires_at,
    deliveryMethod: o.delivery_method,
    // Licznik poprawek pokazujemy od poczatku. Klient, ktory dowiaduje sie
    // o wyczerpaniu limitu dopiero przy rachunku, czuje sie naciagniety.
    revisions: o.revisions_included
      ? { included: o.revisions_included, used: o.revisions_used ?? 0 }
      : null,
    paymentMethod: o.payment_method || "autopay",
    transfer:
      o.payment_method === "bank_transfer" && o.amount_eur_cents != null
        ? {
            ...TRANSFER,
            amountEur: (o.amount_eur_cents / 100).toFixed(2),
            reference: o.order_ref,
            dueAt: o.expires_at,
            confirmedAt: o.transfer_confirmed_at,
          }
        : null,
  });
});

// --- Lead contact status (for n8n BCC automation) ---
// Token-authenticated: requires X-Admin-Token header matching ADMIN_API_TOKEN env var
app.get("/api/leads/contact-status", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  const email = (req.query.email || "").trim().toLowerCase();
  if (!email || !CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (!pool) return res.json({ contacted: false });
  const { rows } = await pool.query(
    "SELECT contacted_at, contact_note FROM leads WHERE email = $1 AND contacted_at IS NOT NULL ORDER BY contacted_at DESC LIMIT 1",
    [email]
  ).catch(() => ({ rows: [] }));
  res.json({ contacted: rows.length > 0, contacted_at: rows[0]?.contacted_at || null, note: rows[0]?.contact_note || null });
});

// Mark lead as contacted via API (for n8n BCC automation)
app.post("/api/leads/mark-contacted", express.json(), async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  const { email, note } = req.body || {};
  if (!email || !CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (!pool) return res.json({ ok: true, updated: 0 });
  const { rowCount } = await pool.query(
    `UPDATE leads SET contacted_at = NOW(), status = 'contacted', contact_note = COALESCE($2, contact_note)
     WHERE email = $1 AND contacted_at IS NULL`,
    [email.trim().toLowerCase(), note || null]
  ).catch(() => ({ rowCount: 0 }));
  res.json({ ok: true, updated: rowCount });
});

// --- Analytics event ingestion ---
app.post("/api/events", express.text({ type: "*/*", limit: "64kb" }), async (req, res) => {
  if (!pool) return res.status(200).json({ ok: true });

  const ip = extractIP(req);
  if (!checkAnalyticsRate(ip)) return res.status(429).json({ error: "Too many requests" });

  let body;
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const events = Array.isArray(body.events) ? body.events.slice(0, 50) : [];
  if (events.length === 0) return res.json({ ok: true });

  const country = req.headers["cf-ipcountry"] || await lookupCountry(ip).catch(() => null);
  const device = detectDevice(req.headers["user-agent"]);

  const values = [];
  const params = [];
  let idx = 1;
  for (const e of events) {
    if (!e.s || !e.c) continue;
    const ts = e.t ? new Date(e.t).toISOString() : new Date().toISOString();
    values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(ts, String(e.s).slice(0, 50), String(e.p || "/").slice(0, 500), String(e.c).slice(0, 50), String(e.a || "").slice(0, 200), String(e.l || "").slice(0, 500), e.v ?? null, country, device);
  }

  if (values.length === 0) return res.json({ ok: true });

  pool.query(
    `INSERT INTO events (ts, session, path, category, action, label, value, country, device) VALUES ${values.join(",")}`,
    params
  ).catch(() => {});

  res.json({ ok: true });
});

// --- Laser Matrix public API ---
let _matrixCache = { ts: 0, rows: null };

async function ensureMatrixCache() {
  if (!pool) return;
  const now = Date.now();
  if (!_matrixCache.rows || now - _matrixCache.ts > 5 * 60_000) {
    const { rows } = await pool.query(
      "SELECT * FROM laser_matrix ORDER BY laser_type, action_type, material, watts"
    );
    _matrixCache = { ts: now, rows };
  }
}

// GET /api/laser-matrix — all rows, optional ?laser=CO2&action=Grawerowanie&material=Akryl
app.get("/api/laser-matrix", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DB unavailable" });
  try {
    await ensureMatrixCache();
    let rows = _matrixCache.rows;
    const { laser, action, material } = req.query;
    if (laser)    rows = rows.filter(r => r.laser_type === laser);
    if (action)   rows = rows.filter(r => r.action_type === action);
    if (material) rows = rows.filter(r => r.material.toLowerCase().includes(material.toLowerCase()));
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ rows, count: rows.length, cachedAt: new Date(_matrixCache.ts).toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/laser-matrix/options — unique filter values for wizard dropdowns
app.get("/api/laser-matrix/options", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DB unavailable" });
  try {
    await ensureMatrixCache();
    const rows = _matrixCache.rows || [];
    const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
    const lasers    = uniq(rows.map(r => r.laser_type));
    const actions   = uniq(rows.map(r => r.action_type));
    const materials = uniq(rows.map(r => r.material));
    const watts     = uniq(rows.map(r => r.watts));
    const lenses    = uniq(rows.map(r => r.optics_lens));
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ lasers, actions, materials, watts, lenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/laser-matrix/invalidate — clears cache (called by admin after edit)
app.post("/api/laser-matrix/invalidate", express.json({ limit: "1kb" }), (req, res) => {
  const token = req.headers["x-invalidate-token"];
  if (!process.env.MATRIX_INVALIDATE_TOKEN || token !== process.env.MATRIX_INVALIDATE_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  _matrixCache = { ts: 0, rows: null };
  res.json({ ok: true, message: "Cache invalidated" });
});

// ─── Market Rates: fetch functions ────────────────────────────────────────

const TROY_OZ_TO_GRAM = 31.1035;

async function fetchNBP() {
  if (!pool) return;
  try {
    const [goldRes, usdRes, eurRes] = await Promise.all([
      fetch("https://api.nbp.pl/api/cenyzlota/last/1/?format=json"),
      fetch("https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json"),
      fetch("https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json"),
    ]);
    const [goldData, usdData, eurData] = await Promise.all([
      goldRes.json(), usdRes.json(), eurRes.json(),
    ]);
    const au_pln_per_g = goldData[0]?.cena ?? null;
    const pln_per_usd = usdData?.rates?.[0]?.mid ?? null;
    const pln_per_eur = eurData?.rates?.[0]?.mid ?? null;
    const au_usd_per_oz = (au_pln_per_g && pln_per_usd)
      ? (au_pln_per_g / pln_per_usd) * TROY_OZ_TO_GRAM : null;
    await pool.query(
      `INSERT INTO market_rates (source, pln_per_usd, pln_per_eur, au_pln_per_g, au_usd_per_oz)
       VALUES ($1,$2,$3,$4,$5)`,
      ["nbp", pln_per_usd, pln_per_eur, au_pln_per_g, au_usd_per_oz]
    );
    console.log(`[rates] NBP: Au=${au_pln_per_g} PLN/g, USD=${pln_per_usd}, EUR=${pln_per_eur}`);
  } catch (e) {
    console.error("[rates] NBP fetch failed:", e.message);
  }
}


async function fetchPlatinumPalladiumSilver() {
  if (!pool) return;
  const apiKey = process.env.METAL_PRICE_API_KEY;
  if (!apiKey) {
    console.warn("[rates] METAL_PRICE_API_KEY not set — skipping Pt/Pd/Ag fetch");
    return;
  }
  try {
    const resp = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XPT,XPD,XAG`
    );
    const json = await resp.json();
    if (!json.success) throw new Error(json.error?.info || "API error");
    const pt_usd_per_oz = json.rates?.XPT ? 1 / json.rates.XPT : null;
    const pd_usd_per_oz = json.rates?.XPD ? 1 / json.rates.XPD : null;
    const ag_usd_per_oz = json.rates?.XAG ? 1 / json.rates.XAG : null;
    const rateRow = await pool.query(
      "SELECT pln_per_usd FROM market_rates WHERE pln_per_usd IS NOT NULL ORDER BY fetched_at DESC LIMIT 1"
    );
    const pln_per_usd = rateRow.rows[0]?.pln_per_usd ?? null;
    const pt_pln_per_g = (pt_usd_per_oz && pln_per_usd) ? (pt_usd_per_oz * pln_per_usd) / TROY_OZ_TO_GRAM : null;
    const pd_pln_per_g = (pd_usd_per_oz && pln_per_usd) ? (pd_usd_per_oz * pln_per_usd) / TROY_OZ_TO_GRAM : null;
    const ag_pln_per_g = (ag_usd_per_oz && pln_per_usd) ? (ag_usd_per_oz * pln_per_usd) / TROY_OZ_TO_GRAM : null;
    await pool.query(
      `INSERT INTO market_rates (source, pt_pln_per_g, pd_pln_per_g, pt_usd_per_oz, pd_usd_per_oz, ag_pln_per_g, ag_usd_per_oz)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      ["metalpriceapi", pt_pln_per_g, pd_pln_per_g, pt_usd_per_oz, pd_usd_per_oz, ag_pln_per_g, ag_usd_per_oz]
    );
    console.log(`[rates] metalpriceapi: Pt=${pt_pln_per_g?.toFixed(2)}, Pd=${pd_pln_per_g?.toFixed(2)}, Ag=${ag_pln_per_g?.toFixed(2)} PLN/g`);
  } catch (e) {
    console.error("[rates] metalpriceapi fetch failed:", e.message);
  }
}

// NBP: hourly (gold PLN/g + currencies). metalpriceapi: twice daily (Pt/Pd/Ag, 60 req/month)
if (pool) {
  fetchNBP();
  fetchPlatinumPalladiumSilver();

  cron.schedule("5 * * * *", fetchNBP);
  // Weekdays: 3× (London market open / mid / close) = 66 req/month
  cron.schedule("0 8 * * 1-5", fetchPlatinumPalladiumSilver);   // 08:00 UTC = ~09:00 Warsaw (open)
  cron.schedule("0 12 * * 1-5", fetchPlatinumPalladiumSilver);  // 12:00 UTC = ~13:00 Warsaw (mid)
  cron.schedule("0 16 * * 1-5", fetchPlatinumPalladiumSilver);  // 16:00 UTC = ~17:00 Warsaw (close)
  // Weekends: 2× (market closed but reference prices) = 16 req/month → total ~82/month < 100 limit
  cron.schedule("0 7 * * 0,6", fetchPlatinumPalladiumSilver);   // 07:00 UTC Sat/Sun
  cron.schedule("0 15 * * 0,6", fetchPlatinumPalladiumSilver);  // 15:00 UTC Sat/Sun

  // Gmail polling every 5 minutes (fallback when Pub/Sub unavailable)
  cron.schedule("*/5 * * * *", async () => {
    const gmail = createGmailClient();
    if (!gmail) return;
    const count = await pollRecentMessages(gmail, pool);
    if (count > 0) console.log(`[gmail] poll: ${count} new messages processed`);
  });
}

app.get("/api/market-rates", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "Database not available" });
  }
  try {
    // Get latest non-null value for each field, with its source and timestamp
    const q = await pool.query(`
      SELECT DISTINCT ON (field) field, value, source, fetched_at FROM (
        SELECT 'pln_per_usd' AS field, pln_per_usd::float AS value, source, fetched_at FROM market_rates WHERE pln_per_usd IS NOT NULL
        UNION ALL SELECT 'pln_per_eur', pln_per_eur::float, source, fetched_at FROM market_rates WHERE pln_per_eur IS NOT NULL
        UNION ALL SELECT 'au_pln_per_g', au_pln_per_g::float, source, fetched_at FROM market_rates WHERE au_pln_per_g IS NOT NULL
        UNION ALL SELECT 'ag_pln_per_g', ag_pln_per_g::float, source, fetched_at FROM market_rates WHERE ag_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pt_pln_per_g', pt_pln_per_g::float, source, fetched_at FROM market_rates WHERE pt_pln_per_g IS NOT NULL
        UNION ALL SELECT 'pd_pln_per_g', pd_pln_per_g::float, source, fetched_at FROM market_rates WHERE pd_pln_per_g IS NOT NULL
      ) sub
      ORDER BY field, fetched_at DESC
    `);

    const rates = {};
    const sources = {};
    for (const row of q.rows) {
      rates[row.field] = row.value;
      sources[row.field] = { source: row.source, fetched_at: row.fetched_at };
    }

    // Derive EUR/USD from PLN rates
    if (rates.pln_per_usd && rates.pln_per_eur) {
      rates.eur_per_usd = rates.pln_per_usd / rates.pln_per_eur;
    }

    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ ...rates, sources });
  } catch (e) {
    console.error("[market-rates] query error:", e.message);
    res.status(500).json({ error: "Failed to fetch market rates" });
  }
});

app.get("/api/metal-prices", (req, res) => res.redirect("/api/market-rates"));

// --- Gemstone Prices ---
let _gemCache = { ts: 0, data: null };

app.get("/api/gemstone-prices", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DB unavailable" });
  const now = Date.now();
  if (_gemCache.data && now - _gemCache.ts < 24 * 60 * 60 * 1000) {
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.json(_gemCache.data);
  }
  try {
    const { rows } = await pool.query("SELECT * FROM gemstone_prices ORDER BY precious DESC, lab, name_pl");
    const data = { gems: rows, updatedAt: new Date().toISOString() };
    _gemCache = { ts: now, data };
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch gemstone prices" });
  }
});

app.post("/api/gemstone-prices/invalidate", express.json(), (req, res) => {
  if (req.headers["x-invalidate-token"] !== process.env.MATRIX_INVALIDATE_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });
  _gemCache = { ts: 0, data: null };
  res.json({ ok: true });
});

// ── FILAMENT TYPES API ────────────────────────────────────────────────────────

let _filamentCache = { ts: 0, data: null };
const FILAMENT_TTL = 5 * 60_000;

async function getFilamentData() {
  const now = Date.now();
  if (_filamentCache.data && now - _filamentCache.ts < FILAMENT_TTL) return _filamentCache.data;
  if (!pool) return null;

  const { rows: types } = await pool.query(
    `SELECT * FROM filament_types WHERE is_active=TRUE ORDER BY sort_order, category, name`
  );
  const { rows: brands } = await pool.query(
    `SELECT * FROM filament_brands WHERE is_active=TRUE AND (is_verified=TRUE OR auto_approved=TRUE) ORDER BY is_verified DESC, brand`
  );

  // Nest brands into types
  const brandsByType = {};
  for (const b of brands) {
    if (!brandsByType[b.filament_type_id]) brandsByType[b.filament_type_id] = [];
    brandsByType[b.filament_type_id].push(b);
  }
  for (const t of types) t.brands = brandsByType[t.id] || [];

  _filamentCache = { ts: now, data: { types, count: types.length } };
  return _filamentCache.data;
}

// GET /api/filaments — public
app.get("/api/filaments", async (req, res) => {
  try {
    const data = await getFilamentData();
    if (!data) return res.status(503).json({ error: "DB unavailable" });

    let types = data.types;
    const { category } = req.query;
    if (category) types = types.filter(t => t.category === category);

    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ types, count: types.length, cachedAt: new Date(_filamentCache.ts).toISOString() });
  } catch (e) {
    console.error("[filaments] GET /api/filaments error:", e.message);
    res.status(500).json({ error: "Failed to fetch filaments", detail: e.message });
  }
});

// GET /api/filaments/options — unique values for wizard
app.get("/api/filaments/options", async (req, res) => {
  try {
    const data = await getFilamentData();
    if (!data) return res.status(503).json({ error: "DB unavailable" });

    const categories = [...new Set(data.types.map(t => t.category))].sort();
    const difficulties = [...new Set(data.types.map(t => t.difficulty))].sort((a, b) => a - b);

    res.json({ categories, difficulties, count: data.count });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch options" });
  }
});

// GET /api/filaments/contributions?type_id=X — pending contributions (public)
app.get("/api/filaments/contributions", async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: "DB unavailable" });
    const { type_id } = req.query;
    const conditions = ["status='pending'", "vote_confirm >= 1"];
    const params = [];
    if (type_id) { params.push(type_id); conditions.push(`filament_type_id=$${params.length}`); }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const { rows } = await pool.query(
      `SELECT id, filament_type_id, brand_name, product_name, nozzle_min, nozzle_max,
              bed_min, bed_max, speed_min, speed_max, notes, vote_confirm, vote_dispute,
              auto_approved, created_at
       FROM filament_contributions ${where}
       ORDER BY vote_confirm DESC, created_at DESC LIMIT 50`,
      params
    );
    res.json({ contributions: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// POST /api/filaments/contribute — user submission
const contributeLimit = rateLimit({ windowMs: 60 * 60_000, max: 3, keyGenerator: extractIP, standardHeaders: true, legacyHeaders: false });
app.post("/api/filaments/contribute", express.json({ limit: "16kb" }), contributeLimit, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: "DB unavailable" });
    const { filament_type_id, brand_name, product_name, nozzle_min, nozzle_max,
            bed_min, bed_max, speed_min, speed_max, notes,
            contributor_email, contributor_name, gdpr_consent } = req.body;

    if (!filament_type_id || !brand_name || !contributor_email || !gdpr_consent)
      return res.status(400).json({ error: "Missing required fields" });

    const { rows } = await pool.query(
      `INSERT INTO filament_contributions
        (filament_type_id, brand_name, product_name, nozzle_min, nozzle_max,
         bed_min, bed_max, speed_min, speed_max, notes,
         contributor_email, contributor_name, gdpr_consent, contribution_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new_brand')
       RETURNING id`,
      [filament_type_id, brand_name, product_name || null,
       nozzle_min || null, nozzle_max || null, bed_min || null, bed_max || null,
       speed_min || null, speed_max || null, notes || null,
       contributor_email, contributor_name || null, !!gdpr_consent]
    );
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) {
    res.status(500).json({ error: "Failed to save contribution" });
  }
});

// POST /api/filaments/vote — community voting on contributions
const voteLimit = rateLimit({ windowMs: 60 * 60_000, max: 20, keyGenerator: extractIP, standardHeaders: true, legacyHeaders: false });
app.post("/api/filaments/vote", express.json({ limit: "4kb" }), voteLimit, async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ error: "DB unavailable" });
    const { contribution_id, vote, voter_email } = req.body;
    if (!contribution_id || !["confirm", "dispute"].includes(vote))
      return res.status(400).json({ error: "Invalid request" });

    const ip = extractIP(req);
    const ipHash = createHash("sha256").update(ip + contribution_id).digest("hex");

    // Deduplication check
    const { rows: existing } = await pool.query(
      "SELECT id FROM filament_contribution_votes WHERE contribution_id=$1 AND ip_hash=$2",
      [contribution_id, ipHash]
    );
    if (existing.length > 0) return res.status(409).json({ error: "Already voted" });

    await pool.query(
      "INSERT INTO filament_contribution_votes (contribution_id, voter_email, vote, ip_hash) VALUES ($1,$2,$3,$4)",
      [contribution_id, voter_email || null, vote, ipHash]
    );

    // Update vote counts
    const field = vote === "confirm" ? "vote_confirm" : "vote_dispute";
    const { rows: updated } = await pool.query(
      `UPDATE filament_contributions SET ${field}=${field}+1
       WHERE id=$1 RETURNING vote_confirm, vote_dispute`,
      [contribution_id]
    );

    // Auto-approve if 5+ confirms
    if (updated[0]?.vote_confirm >= 5) {
      await pool.query(
        `UPDATE filament_contributions SET auto_approved=TRUE WHERE id=$1 AND auto_approved=FALSE`,
        [contribution_id]
      );
      // Insert as brand if not already
      const { rows: contrib } = await pool.query(
        "SELECT * FROM filament_contributions WHERE id=$1", [contribution_id]
      );
      if (contrib[0] && !contrib[0].filament_brand_id) {
        await pool.query(
          `INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, speed_min, speed_max, notes_en, is_verified, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,TRUE)`,
          [contrib[0].filament_type_id, contrib[0].brand_name, contrib[0].product_name,
           contrib[0].nozzle_min, contrib[0].nozzle_max, contrib[0].bed_min, contrib[0].bed_max,
           contrib[0].speed_min, contrib[0].speed_max, contrib[0].notes]
        );
        _filamentCache = { ts: 0, data: null }; // invalidate
      }
    }

    res.json({ ok: true, votes: updated[0] });
  } catch (e) {
    res.status(500).json({ error: "Failed to record vote" });
  }
});

// POST /api/filaments/invalidate — admin cache invalidation
app.post("/api/filaments/invalidate", express.json(), (req, res) => {
  if (req.headers["x-invalidate-token"] !== process.env.MATRIX_INVALIDATE_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });
  _filamentCache = { ts: 0, data: null };
  res.json({ ok: true });
});

// --- Gmail Push Notifications (Google Cloud Pub/Sub) ---
let _lastHistoryId = null;

app.post("/api/gmail/push", express.json(), async (req, res) => {
  // Verify Pub/Sub push token
  const token = req.query.token;
  if (!token || token !== process.env.GMAIL_PUBSUB_SECRET) {
    return res.status(401).end();
  }

  // Acknowledge immediately (Pub/Sub requires fast 200)
  res.status(200).end();

  if (!pool) return;

  try {
    const msgData = req.body?.message?.data;
    if (!msgData) return;
    const decoded = JSON.parse(Buffer.from(msgData, "base64").toString("utf-8"));
    const historyId = decoded.historyId;
    if (!historyId) return;

    const gmail = createGmailClient();
    if (!gmail) return;

    const startId = _lastHistoryId || String(BigInt(historyId) - 10n);
    const count = await processHistory(gmail, pool, startId);
    _lastHistoryId = historyId;
    if (count > 0) console.log(`[gmail] processed ${count} new messages from historyId ${startId}`);
  } catch (err) {
    console.error("[gmail] push error:", err.message);
  }
});

// Setup/renew Gmail watch (token-auth, call once to start and then auto-renewed by cron)
app.post("/api/gmail/setup-watch", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (!token || token !== process.env.ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  try {
    const gmail = createGmailClient();
    if (!gmail) return res.status(503).json({ error: "Gmail not configured" });
    const result = await setupGmailWatch(gmail);
    _lastHistoryId = result.historyId;
    res.json({ ok: true, historyId: result.historyId, expiration: result.expiration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (pool) {
  // Renew Gmail watch every 6 days (expires after 7)
  cron.schedule("0 6 */6 * *", async () => {
    const gmail = createGmailClient();
    if (!gmail) return;
    try {
      const result = await setupGmailWatch(gmail);
      _lastHistoryId = result.historyId;
      console.log("[gmail] watch renewed, historyId:", result.historyId);
    } catch (err) {
      console.error("[gmail] watch renewal error:", err.message);
    }
  });
}

app.listen(PORT, () => console.log(`AEJaCA Chat API running on :${PORT}`));
