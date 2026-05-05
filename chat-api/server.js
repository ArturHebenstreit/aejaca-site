import express from "express";
import cors from "cors";
import OpenAI from "openai";
import pg from "pg";
import multer from "multer";
import { getSystemPrompt, detectHotLead } from "./context.js";

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  "https://www.aejaca.com",
  "https://aejaca.com",
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:4173"] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "16kb" }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

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

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
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
      pool.query(
        `INSERT INTO conversations (session_id, lang, messages_count, last_user_message, assistant_response, hot_lead, ip_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionId || null,
          lang,
          messages.length,
          messages[messages.length - 1]?.content?.slice(0, 500) || "",
          fullResponse.slice(0, 2000),
          isHotLead,
          ip ? Buffer.from(ip).toString("base64").slice(0, 20) : null,
        ]
      ).catch(() => {});

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
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    ALLOWED_EXT.test(file.originalname) ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECT_MAP = { jewelry: "Jewelry Inquiry", studio: "Studio Inquiry", both: "Jewelry & Studio Inquiry", other: "General Inquiry" };

app.post("/api/contact", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "File too large (max 8 MB)" : (err.message || "File upload error") });
    }
    next();
  });
}, async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
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

  if (CONTACT_N8N_URL) {
    fetch(CONTACT_N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(r => {
      if (!r.ok) console.error(`Contact webhook n8n ${r.status}`);
    }).catch(err => {
      console.error("Contact webhook error:", err.message);
    });
  }

  // Save lead to DB (best-effort, non-blocking)
  if (pool) {
    pool.query(
      `INSERT INTO leads (email, lang, calculator, params, status) VALUES ($1, $2, $3, $4, $5)`,
      [payload.email, payload.lang, payload.source, `${payload.subject}\n${payload.message.slice(0, 400)}`, "new"]
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

app.post("/api/quote", express.json({ limit: "12mb" }), async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
  if (!checkQuoteRate(ip)) return res.status(429).json({ error: "Too many requests" });

  const { email, lang, calculator, params, price, file, ts } = req.body || {};
  if (!email || !CONTACT_EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (!calculator || !params || !price) return res.status(400).json({ error: "Missing fields" });

  const payload = {
    email: email.trim().toLowerCase(),
    lang: ["pl", "en", "de"].includes(lang) ? lang : "pl",
    calculator: String(calculator).slice(0, 200),
    params: String(params).slice(0, 1000),
    price,
    ts: ts || new Date().toISOString(),
    ...(file?.data ? { file: { name: String(file.name || "attachment").slice(0, 255), type: String(file.type || "application/octet-stream"), data: file.data } } : {}),
  };

  if (QUOTE_N8N_URL) {
    fetch(QUOTE_N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: payload }),
    }).then(r => {
      if (!r.ok) console.error(`Quote webhook n8n ${r.status}`);
    }).catch(err => {
      console.error("Quote webhook error:", err.message);
    });
  }

  if (pool) {
    pool.query(
      `INSERT INTO leads (email, lang, calculator, params, price_min_pln, price_max_pln, price_min_eur, price_max_eur, qty, discount, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [payload.email, payload.lang, payload.calculator, payload.params,
       price?.perPcPLN?.min ?? null, price?.perPcPLN?.max ?? null,
       price?.perPcEUR?.min ?? null, price?.perPcEUR?.max ?? null,
       price?.qty ?? null, price?.discount ?? null, "new"]
    ).catch(() => {});
  }

  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`AEJaCA Chat API running on :${PORT}`));
