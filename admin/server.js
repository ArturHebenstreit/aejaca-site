import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pg from "pg";
import { randomBytes } from "node:crypto";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "contact@aejaca.com")
  .split(",").map(e => e.trim().toLowerCase());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// --- Session ---
// Sekret podpisujacy ciasteczko sesji NIE MOZE miec wartosci zapasowej wpisanej
// w kod. Kto ja zna, podpisuje sobie ciasteczko zalogowanego administratora
// i wchodzi do panelu z pominieciem Google, a w panelu sa leady, subskrybenci,
// kody rabatowe i potwierdzanie przelewow. Gdy zmiennej brakuje, losujemy sekret
// na czas zycia procesu: panel dziala, podrobienie ciasteczka jest niemozliwe,
// a jedyna kara to wylogowanie po kazdym wdrozeniu. Ostrzezenie w logu mowi,
// co ustawic, zeby ta kara znikla.
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) {
  console.warn("[auth] SESSION_SECRET nie jest ustawiony. Uzywam sekretu losowanego przy starcie, " +
               "wiec kazde wdrozenie wyloguje wszystkich. Ustaw go w Railway: openssl rand -hex 32");
}
if (!process.env.ADMIN_API_TOKEN) {
  console.warn("[auth] ADMIN_API_TOKEN nie jest ustawiony. Produkty, kody i przelewy nie beda dzialac.");
}

app.set("trust proxy", 1);
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // `lax`, a nie `strict`, i to swiadomie. `strict` nie wysyla ciasteczka przy
  // wejsciu z obcej strony, a powrot z logowania Google jest wlasnie takim
  // wejsciem, wiec grozi zamknieciem sie na zewnatrz wlasnego panelu.
  // Zysk bylby zreszta zaden: `lax` juz teraz nie przepuszcza zadania POST
  // z cudzej strony, a kazda zmiana w panelu idzie przez POST.
  // `httpOnly` odcina ciasteczko od skryptow w przegladarce.
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
  },
}));

// --- Passport Google OAuth ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || "/auth/google/callback",
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (ALLOWED_EMAILS.includes(email)) {
      return done(null, { name: profile.displayName, email, photo: profile.photos?.[0]?.value });
    }
    return done(null, false, { message: "Unauthorized email" });
  }));
}

app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Make fmtDate available in all EJS templates
app.use((req, res, next) => {
  res.locals.fmtDate = (d) => {
    if (!d) return ' - ';
    const dt = new Date(d);
    return dt.toLocaleDateString('pl-PL') + ' ' + dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };
  next();
});

// --- View engine ---
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

// Arkusz stylow podajemy z wlasnego katalogu. Wczesniej kazda strona ciagnela
// Tailwind ze zdalnego serwera, bez przypietej wersji i bez sumy kontrolnej,
// czyli panel z dostepem do leadow, kodow i potwierdzania przelewow wykonywal
// kod, nad ktorym nie mielismy zadnej kontroli. Plik jest zbudowany i wpisany
// do repozytorium (`npm run build:css`), wiec wdrozenie niczego nie sciaga.
app.use(express.static(join(__dirname, "public"), { maxAge: "1h" }));

// Naglowki bezpieczenstwa. Panel siega do jednego obcego serwera po zdjecie
// profilowe z Google i po miniatury produktow z naszej strony, i na tym koniec.
// Skrypty tylko wlasne, wiec wstrzykniety napis nie ma jak sie wykonac, nawet
// gdyby kiedys ominal filtrowanie szablonu.
//
// `unsafe-inline` przy skryptach zostaje, bo szesc widokow ma male wstawki
// w tresci strony. To ustepstwo, ale nadal domyka cala reszte: zaden kod
// z zewnetrznego adresu sie nie wykona.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://lh3.googleusercontent.com https://www.aejaca.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

app.use((req, res, next) => {
  res.set("Content-Security-Policy", CSP);
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Panel nie ma czego pokazywac wyszukiwarce ani asystentowi.
  res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// --- Auth middleware ---
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// --- Routes: Auth ---
app.get("/", (req, res) => {
  if (req.isAuthenticated()) return res.redirect("/dashboard");
  res.render("login", { error: req.query.error });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/?error=unauthorized" }),
  (req, res) => res.redirect("/dashboard")
);

app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

// --- Routes: Dashboard ---
app.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const [leadStats, subStats, recentLeads, recentSubs, analyticsKpi, laserMatrixCount, gemResult, filamentResult, filamentPending] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week FROM leads"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE) as today, COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '7 days') as week FROM subscribers WHERE unsubscribed = FALSE"),
      pool.query("SELECT * FROM leads ORDER BY created_at DESC LIMIT 10"),
      pool.query("SELECT * FROM subscribers ORDER BY subscribed_at DESC LIMIT 10"),
      pool.query(`
        SELECT
          COUNT(DISTINCT session) FILTER (WHERE ts >= CURRENT_DATE) AS visitors_today,
          COUNT(DISTINCT session) FILTER (WHERE ts >= CURRENT_DATE - 6) AS visitors_week,
          COUNT(*) FILTER (WHERE category = 'page' AND ts >= CURRENT_DATE) AS pageviews_today,
          COUNT(*) FILTER (WHERE category = 'page' AND ts >= NOW() - INTERVAL '7 days') AS pageviews_week,
          COUNT(DISTINCT session) FILTER (WHERE category = 'inquiry' AND ts >= NOW() - INTERVAL '7 days') AS inquiries_week,
          (SELECT path FROM events WHERE category = 'page' AND ts >= CURRENT_DATE GROUP BY path ORDER BY COUNT(*) DESC LIMIT 1) AS top_page_today
        FROM events
      `).catch(() => ({ rows: [{}] })),
      pool.query("SELECT COUNT(*) as total FROM laser_matrix").catch(() => ({ rows: [{ total: '?' }] })),
      pool.query("SELECT COUNT(*) as count FROM gemstone_prices").catch(() => ({ rows: [{ count: '0' }] })),
      pool.query("SELECT COUNT(*) FROM filament_types WHERE is_active=TRUE").catch(() => ({ rows: [{ count: '0' }] })),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'").catch(() => ({ rows: [{ count: '0' }] })),
    ]);
    res.render("dashboard", {
      user: req.user,
      leadStats: leadStats.rows[0],
      subStats: subStats.rows[0],
      recentLeads: recentLeads.rows,
      recentSubs: recentSubs.rows,
      analyticsKpi: analyticsKpi.rows[0] || {},
      laserMatrixCount: laserMatrixCount.rows[0].total,
      gemstoneCount: parseInt(gemResult.rows[0].count),
      filamentCount: parseInt(filamentResult.rows[0].count),
      pendingContributions: parseInt(filamentPending.rows[0].count),
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

app.get("/leads", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  try {
    const [rows, count, byCalc, statusCounts] = await Promise.all([
      pool.query("SELECT * FROM leads ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]),
      pool.query("SELECT COUNT(*) as total FROM leads"),
      pool.query("SELECT calculator, COUNT(*) as count FROM leads GROUP BY calculator ORDER BY count DESC"),
      pool.query("SELECT COUNT(*) FILTER (WHERE contacted_at IS NOT NULL) as contacted, COUNT(*) FILTER (WHERE status = 'new') as new_count FROM leads"),
    ]);
    res.render("leads", {
      user: req.user,
      leads: rows.rows,
      total: parseInt(count.rows[0].total),
      page,
      pages: Math.ceil(count.rows[0].total / limit),
      byCalc: byCalc.rows,
      contactedCount: parseInt(statusCounts.rows[0]?.contacted || 0),
      newCount: parseInt(statusCounts.rows[0]?.new_count || 0),
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

app.get("/subscribers", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  try {
    const [rows, count, byLang] = await Promise.all([
      pool.query("SELECT * FROM subscribers ORDER BY subscribed_at DESC LIMIT $1 OFFSET $2", [limit, offset]),
      pool.query("SELECT COUNT(*) as total FROM subscribers WHERE unsubscribed = FALSE"),
      pool.query("SELECT lang, COUNT(*) as count FROM subscribers WHERE unsubscribed = FALSE GROUP BY lang ORDER BY count DESC"),
    ]);
    res.render("subscribers", {
      user: req.user,
      subscribers: rows.rows,
      total: parseInt(count.rows[0].total),
      page,
      pages: Math.ceil(count.rows[0].total / limit),
      byLang: byLang.rows,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

app.get("/conversations", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const filter = req.query.filter || "all";
  const limit = 50;
  const offset = (page - 1) * limit;
  try {
    const whereClause = filter === "hot" ? "WHERE hot_lead = TRUE" : "";
    const [rows, count, stats] = await Promise.all([
      pool.query(`SELECT * FROM conversations ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      pool.query(`SELECT COUNT(*) as total FROM conversations ${whereClause}`),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE hot_lead = TRUE) as hot, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today FROM conversations"),
    ]);
    res.render("conversations", {
      user: req.user,
      conversations: rows.rows,
      total: parseInt(count.rows[0].total),
      page,
      pages: Math.ceil(count.rows[0].total / limit),
      stats: stats.rows[0],
      filter,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// --- Delete routes ---
app.post("/leads/:id/mark-contacted", requireAuth, async (req, res) => {
  const { note } = req.body || {};
  await pool.query(
    `UPDATE leads SET contacted_at = NOW(), status = 'contacted', contact_note = $2 WHERE id = $1`,
    [req.params.id, (note || "").trim().slice(0, 500) || null]
  ).catch(() => {});
  res.redirect("/leads");
});

app.post("/leads/:id/unmark-contacted", requireAuth, async (req, res) => {
  await pool.query(
    `UPDATE leads SET contacted_at = NULL, status = 'new', contact_note = NULL WHERE id = $1`,
    [req.params.id]
  ).catch(() => {});
  res.redirect("/leads");
});

app.post("/leads/:id/update-status", requireAuth, async (req, res) => {
  const { status } = req.body || {};
  const valid = ["new", "contacted", "closed", "spam"];
  if (!valid.includes(status)) return res.redirect("/leads");
  const extra = status === "contacted"
    ? ", contacted_at = COALESCE(contacted_at, NOW())"
    : "";
  await pool.query(
    `UPDATE leads SET status = $2${extra} WHERE id = $1`,
    [req.params.id, status]
  ).catch(() => {});
  res.redirect("/leads");
});

app.post("/leads/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM leads WHERE id = $1", [req.params.id]);
  res.redirect("/leads");
});

app.post("/subscribers/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM subscribers WHERE id = $1", [req.params.id]);
  res.redirect("/subscribers");
});

app.post("/conversations/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM conversations WHERE id = $1", [req.params.id]);
  res.redirect("/conversations");
});

app.post("/events/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM events WHERE id = $1", [req.params.id]);
  const days = req.query.days || 30;
  res.redirect(`/analytics?days=${days}`);
});

app.post("/events/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days } = req.body;
  if (older_than_days === "all") {
    await pool.query("DELETE FROM events").catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 30;
    await pool.query("DELETE FROM events WHERE ts < NOW() - INTERVAL '1 day' * $1", [days]).catch(() => {});
  }
  res.redirect(`/analytics?days=30`);
});

app.post("/leads/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days } = req.body;
  if (older_than_days === "all") {
    await pool.query("DELETE FROM leads").catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 90;
    await pool.query("DELETE FROM leads WHERE created_at < NOW() - INTERVAL '1 day' * $1", [days]).catch(() => {});
  }
  res.redirect("/leads");
});

app.post("/subscribers/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days } = req.body;
  if (older_than_days === "all") {
    await pool.query("DELETE FROM subscribers WHERE unsubscribed = TRUE").catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 365;
    await pool.query("DELETE FROM subscribers WHERE subscribed_at < NOW() - INTERVAL '1 day' * $1 AND unsubscribed = TRUE", [days]).catch(() => {});
  }
  res.redirect("/subscribers");
});

app.post("/conversations/bulk-delete", requireAuth, async (req, res) => {
  const { older_than_days, include_hot } = req.body;
  if (older_than_days === "all") {
    const sql = include_hot === "1"
      ? "DELETE FROM conversations"
      : "DELETE FROM conversations WHERE hot_lead = FALSE";
    await pool.query(sql).catch(() => {});
  } else {
    const days = parseInt(older_than_days) || 30;
    const sql = include_hot === "1"
      ? "DELETE FROM conversations WHERE created_at < NOW() - INTERVAL '1 day' * $1"
      : "DELETE FROM conversations WHERE created_at < NOW() - INTERVAL '1 day' * $1 AND hot_lead = FALSE";
    await pool.query(sql, [days]).catch(() => {});
  }
  res.redirect("/conversations");
});

// --- Export CSV ---
/**
 * Komorka arkusza, nie napis.
 *
 * Wartosci w eksporcie pochodza od obcych ludzi: imie, tresc zapytania, notatka.
 * Excel i Arkusze Google traktuja komorke zaczynajaca sie od `=`, `+`, `-` lub
 * `@` jak formule i wykonuja ja przy otwarciu pliku, na TWOIM komputerze,
 * z Twoimi uprawnieniami. Apostrof z przodu mowi arkuszowi "to jest tekst".
 */
function csvCell(value) {
  const s = String(value ?? "").replace(/"/g, '""');
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

app.get("/export/:table", requireAuth, async (req, res) => {
  const table = req.params.table === "subscribers" ? "subscribers" : "leads";
  try {
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${table === "leads" ? "created_at" : "subscribed_at"} DESC`);
    if (!rows.length) return res.status(404).send("No data");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${csvCell(r[h])}"`).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${table}_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- Analytics dashboard ---
app.get("/analytics", requireAuth, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = `NOW() - INTERVAL '${days} days'`;
  try {
    const [kpi, daily, topPages, calcFunnel, topCalc, countries, devices, recentEvents] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(DISTINCT session) FILTER (WHERE ts >= CURRENT_DATE) AS visitors_today,
          COUNT(DISTINCT session) FILTER (WHERE ts >= CURRENT_DATE - 6) AS visitors_week,
          COUNT(DISTINCT session) FILTER (WHERE ts >= NOW() - INTERVAL '30 days') AS visitors_month,
          COUNT(*) FILTER (WHERE category = 'page' AND ts >= CURRENT_DATE) AS pageviews_today,
          COUNT(*) FILTER (WHERE category = 'page' AND ts >= NOW() - INTERVAL '30 days') AS pageviews_month,
          COUNT(DISTINCT session) FILTER (WHERE category = 'inquiry') AS inquiries_total,
          COUNT(DISTINCT session) FILTER (WHERE category = 'inquiry' AND ts >= NOW() - INTERVAL '30 days') AS inquiries_month
        FROM events
      `),
      pool.query(`
        SELECT DATE(ts) AS day,
               COUNT(DISTINCT session) AS visitors,
               COUNT(*) FILTER (WHERE category = 'page') AS pageviews
        FROM events
        WHERE ts >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(ts)
        ORDER BY day
      `),
      pool.query(`
        SELECT path,
               COUNT(DISTINCT session) AS visitors,
               COUNT(*) AS views
        FROM events
        WHERE category = 'page' AND ts >= ${since}
        GROUP BY path
        ORDER BY visitors DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT
          COUNT(DISTINCT session) FILTER (WHERE category = 'page' AND (path LIKE '%/jewelry/%' OR path LIKE '%/studio/%')) AS calc_page_visits,
          COUNT(DISTINCT session) FILTER (WHERE category = 'calc') AS calc_interactions,
          COUNT(DISTINCT session) FILTER (WHERE category = 'inquiry') AS inquiry_submits,
          (SELECT COUNT(DISTINCT session_id) FROM leads WHERE session_id IS NOT NULL AND created_at >= ${since}) AS leads_with_session
        FROM events
        WHERE ts >= ${since}
      `),
      pool.query(`
        SELECT action, label, COUNT(*) AS cnt
        FROM events
        WHERE category = 'calc' AND ts >= ${since}
        GROUP BY action, label
        ORDER BY cnt DESC
        LIMIT 15
      `),
      pool.query(`
        SELECT country, COUNT(DISTINCT session) AS visitors
        FROM events
        WHERE ts >= ${since} AND country IS NOT NULL AND country != ''
        GROUP BY country
        ORDER BY visitors DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT device, COUNT(DISTINCT session) AS visitors
        FROM events
        WHERE ts >= ${since} AND device IS NOT NULL
        GROUP BY device
        ORDER BY visitors DESC
      `),
      pool.query(`
        SELECT id, ts, session, path, category, action, label, value, country, device
        FROM events
        ORDER BY ts DESC
        LIMIT 50
      `),
    ]);

    res.render("analytics", {
      user: req.user,
      days,
      kpi: kpi.rows[0],
      daily: daily.rows,
      topPages: topPages.rows,
      calcFunnel: calcFunnel.rows[0],
      topCalc: topCalc.rows,
      countries: countries.rows,
      devices: devices.rows,
      recentEvents: recentEvents.rows,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// --- Laser Matrix CRUD ---
const MATRIX_COLS = [
  "laser_type","action_type","kinematics","wavelength_nm","material","thickness_mm",
  "watts","speed","power_pct","passes",
  "dpi","hatch_mm","scan_angle_deg","wobble_mm","frequency_khz","pulse_width_ns",
  "optics_lens","defocus_mm","z_step_mm",
  "gas_type","gas_pressure","galvo_delays",
  "notes","material_en","material_de","action_en","action_de","notes_en","notes_de"
];

async function invalidateMatrixCache() {
  if (!process.env.CHAT_API_URL || !process.env.MATRIX_INVALIDATE_TOKEN) return;
  fetch(`${process.env.CHAT_API_URL}/api/laser-matrix/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": process.env.MATRIX_INVALIDATE_TOKEN, "Content-Type": "application/json" },
  }).catch(() => {});
}

async function getMatrixOptions() {
  const [lasers, actions, watts] = await Promise.all([
    pool.query("SELECT DISTINCT laser_type FROM laser_matrix ORDER BY laser_type"),
    pool.query("SELECT DISTINCT action_type FROM laser_matrix ORDER BY action_type"),
    pool.query("SELECT DISTINCT watts FROM laser_matrix ORDER BY watts"),
  ]);
  return {
    lasers: lasers.rows.map(r => r.laser_type),
    actions: actions.rows.map(r => r.action_type),
    watts: watts.rows.map(r => r.watts),
  };
}

// LIST with filters + pagination
app.get("/laser-matrix", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  const { laser, action, material, watts } = req.query;
  const conditions = [], params = [];
  if (laser)    { params.push(laser);    conditions.push(`laser_type = $${params.length}`); }
  if (action)   { params.push(action);   conditions.push(`action_type = $${params.length}`); }
  if (material) { params.push(`%${material}%`); conditions.push(`material ILIKE $${params.length}`); }
  if (watts)    { params.push(watts);    conditions.push(`watts = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const [rows, count, total, stats, options] = await Promise.all([
      pool.query(`SELECT id, laser_type, action_type, kinematics, material, watts, speed, power_pct, passes, notes FROM laser_matrix ${where} ORDER BY laser_type, action_type, material, watts LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
      pool.query(`SELECT COUNT(*) as total FROM laser_matrix ${where}`, params),
      pool.query("SELECT COUNT(*) as total FROM laser_matrix"),
      pool.query("SELECT laser_type, COUNT(*) as cnt FROM laser_matrix GROUP BY laser_type ORDER BY cnt DESC"),
      getMatrixOptions(),
    ]);
    res.render("laser-matrix", {
      user: req.user,
      rows: rows.rows,
      total: parseInt(count.rows[0].total),
      grandTotal: parseInt(total.rows[0].total),
      page,
      pages: Math.ceil(count.rows[0].total / limit),
      stats: stats.rows,
      options,
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// EXPORT CSV - must be before /:id routes
app.get("/laser-matrix/export", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM laser_matrix ORDER BY id");
    if (!rows.length) return res.status(404).send("No data");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${csvCell(r[h])}"`).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=laser-matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// NEW form
app.get("/laser-matrix/new", requireAuth, async (req, res) => {
  const options = await getMatrixOptions().catch(() => ({ lasers: [], actions: [], watts: [] }));
  res.render("laser-matrix-edit", { user: req.user, row: null, options, flash: null });
});

// CREATE
app.post("/laser-matrix/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const vals = MATRIX_COLS.map(c => req.body[c]?.trim() || null);
  const placeholders = MATRIX_COLS.map((_, i) => `$${i + 1}`).join(", ");
  try {
    const result = await pool.query(
      `INSERT INTO laser_matrix (${MATRIX_COLS.join(", ")}, updated_by) VALUES (${placeholders}, $${MATRIX_COLS.length + 1}) RETURNING id`,
      [...vals, req.user.email]
    );
    await invalidateMatrixCache();
    res.redirect(`/laser-matrix?flash=created&id=${result.rows[0].id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// EDIT form
app.get("/laser-matrix/:id/edit", requireAuth, async (req, res) => {
  try {
    const [rowRes, options] = await Promise.all([
      pool.query("SELECT * FROM laser_matrix WHERE id = $1", [req.params.id]),
      getMatrixOptions(),
    ]);
    if (!rowRes.rows[0]) return res.status(404).render("error", { message: "Row not found" });
    res.render("laser-matrix-edit", { user: req.user, row: rowRes.rows[0], options, flash: req.query.flash || null });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// UPDATE
app.post("/laser-matrix/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const sets = MATRIX_COLS.map((c, i) => `${c} = $${i + 1}`).join(", ");
  const vals = MATRIX_COLS.map(c => req.body[c]?.trim() || null);
  try {
    await pool.query(
      `UPDATE laser_matrix SET ${sets}, updated_at = NOW(), updated_by = $${MATRIX_COLS.length + 1} WHERE id = $${MATRIX_COLS.length + 2}`,
      [...vals, req.user.email, req.params.id]
    );
    await invalidateMatrixCache();
    res.redirect(`/laser-matrix?flash=updated&id=${req.params.id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// DELETE
app.post("/laser-matrix/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM laser_matrix WHERE id = $1", [req.params.id]);
  await invalidateMatrixCache();
  res.redirect("/laser-matrix?flash=deleted");
});

// --- Gemstone Prices CRUD ---
async function invalidateGemCache() {
  if (!process.env.CHAT_API_URL || !process.env.MATRIX_INVALIDATE_TOKEN) return;
  fetch(`${process.env.CHAT_API_URL}/api/gemstone-prices/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": process.env.MATRIX_INVALIDATE_TOKEN },
  }).catch(() => {});
}

app.get("/gemstone-prices", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM gemstone_prices ORDER BY precious DESC, lab, name_pl");
    res.render("gemstone-prices", { user: req.user, gems: rows, flash: req.query.flash || null });
  } catch (err) { res.status(500).render("error", { message: err.message }); }
});

app.get("/gemstone-prices/:id/edit", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM gemstone_prices WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).render("error", { message: "Not found" });
  res.render("gemstone-prices-edit", { user: req.user, gem: rows[0] });
});

app.post("/gemstone-prices/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const { base_eur, notes, name_pl, name_en, name_de } = req.body;
  await pool.query(
    `UPDATE gemstone_prices SET base_eur=$1, notes=$2, name_pl=$3, name_en=$4, name_de=$5, updated_at=NOW(), updated_by=$6 WHERE id=$7`,
    [base_eur || null, notes || null, name_pl, name_en, name_de, req.user.email, req.params.id]
  );
  await invalidateGemCache();
  res.redirect("/gemstone-prices?flash=saved");
});

// USUNIECIE POZYCJI NIE USUWA KAMIENIA Z OFERTY, i to jest cala rzecz, ktora
// trzeba o tej tabeli wiedziec. Lista kamieni, ich nazwy i to, czy sa
// szlachetne, mieszkaja w cenniku (`src/pricing/jewelryConfig.js`); tabela
// dokłada do nich WYLACZNIE cene, po `gem_id`. Skasowany wiersz znaczy wiec
// tyle, ze kalkulator wraca do ceny wpisanej w kodzie, a nie ze kamien znika.
app.post("/gemstone-prices/:id/delete", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM gemstone_prices WHERE id = $1", [req.params.id]);
  await invalidateGemCache();
  res.redirect("/gemstone-prices?flash=deleted");
});

// --- Material z magazynu: dodawanie, edycja, usuwanie ---
// Cena plyty zmienia sie razem z rynkiem, wiec musi dac sie poprawic tutaj,
// a nie wdrozeniem. Kazda zmiana czysci pamiec podreczna po stronie API,
// inaczej nowa stawka doszlaby do przegladarki od razu, a do kwoty wiazacej
// dopiero po godzinie, i przez ta godzine obie strony liczylyby inaczej.
// NARZUT NA MATERIAL, przepisany celowo, a nie zaimportowany z `src/pricing`.
// Panel jest osobna aplikacja i wdraza sie go z wlasnego katalogu, wiec
// import przez `../src/` wywrocilby uruchomienie, gdyby root wdrozenia byl
// ustawiony na `admin/`. Zamiast tego liczbe pilnuje test:
// `scripts/test-material-stock.mjs` wywala build, gdy te dwie sie rozjada.
const MATERIAL_MARKUP = 1.5;

async function invalidateMaterialCache() {
  if (!process.env.CHAT_API_URL || !process.env.MATRIX_INVALIDATE_TOKEN) return;
  fetch(`${process.env.CHAT_API_URL}/api/material-stock/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": process.env.MATRIX_INVALIDATE_TOKEN },
  }).catch(() => {});
}

app.get("/materials", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM material_stock ORDER BY name_pl");
    res.render("materials", { user: req.user, materials: rows, markup: MATERIAL_MARKUP, flash: req.query.flash || null });
  } catch (err) { res.status(500).render("error", { message: err.message }); }
});

app.get("/materials/new", requireAuth, (req, res) => {
  res.render("material-edit", { user: req.user, material: null, markup: MATERIAL_MARKUP });
});

app.get("/materials/:id/edit", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM material_stock WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).render("error", { message: "Not found" });
  res.render("material-edit", { user: req.user, material: rows[0], markup: MATERIAL_MARKUP });
});

app.post("/materials/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const { material_id, name_pl, name_en, name_de, pln_per_m2, pln_per_piece, thickness_mm, in_stock, notes } = req.body;
  if (!material_id || !name_pl) return res.status(400).render("error", { message: "Identyfikator i nazwa sa wymagane" });
  try {
    await pool.query(
      `INSERT INTO material_stock (material_id,name_pl,name_en,name_de,pln_per_m2,pln_per_piece,thickness_mm,in_stock,notes,updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [material_id.trim(), name_pl, name_en || name_pl, name_de || name_pl,
       Number(pln_per_m2) || 0, pln_per_piece ? Number(pln_per_piece) : null,
       thickness_mm ? Number(thickness_mm) : null,
       in_stock === "on", notes || null, req.user.email]
    );
  } catch (err) { return res.status(400).render("error", { message: err.message }); }
  await invalidateMaterialCache();
  res.redirect("/materials?flash=created");
});

app.post("/materials/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const { name_pl, name_en, name_de, pln_per_m2, pln_per_piece, thickness_mm, in_stock, notes } = req.body;
  await pool.query(
    `UPDATE material_stock SET name_pl=$1, name_en=$2, name_de=$3, pln_per_m2=$4, pln_per_piece=$5,
     thickness_mm=$6, in_stock=$7, notes=$8, updated_at=NOW(), updated_by=$9 WHERE id=$10`,
    [name_pl, name_en || name_pl, name_de || name_pl, Number(pln_per_m2) || 0,
     pln_per_piece ? Number(pln_per_piece) : null,
     thickness_mm ? Number(thickness_mm) : null, in_stock === "on", notes || null,
     req.user.email, req.params.id]
  );
  await invalidateMaterialCache();
  res.redirect("/materials?flash=saved");
});

app.post("/materials/:id/delete", requireAuth, async (req, res) => {
  // Usuniecie pozycji NIE usuwa materialu z oferty: cennik zna go dalej,
  // wycena zjedzie na stawke domyslna. Panel steruje cena, a nie tym, co
  // umiemy przeciac.
  await pool.query("DELETE FROM material_stock WHERE id = $1", [req.params.id]);
  await invalidateMaterialCache();
  res.redirect("/materials?flash=deleted");
});

// --- Filament CRUD ---

async function invalidateFilamentCache() {
  const url = process.env.CHAT_API_URL;
  const token = process.env.MATRIX_INVALIDATE_TOKEN;
  if (!url || !token) return;
  fetch(`${url}/api/filaments/invalidate`, {
    method: "POST",
    headers: { "x-invalidate-token": token },
  }).catch(() => {});
}

// LIST filament types
app.get("/filaments", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  const { search, category } = req.query;
  const conditions = [], params = [];
  if (search)   { params.push(`%${search}%`); conditions.push(`(name ILIKE $${params.length} OR type_id ILIKE $${params.length})`); }
  if (category) { params.push(category);      conditions.push(`category = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const [rows, count, catStats, pendingCount] = await Promise.all([
      pool.query(
        `SELECT ft.*, (SELECT COUNT(*) FROM filament_brands fb WHERE fb.filament_type_id = ft.id AND fb.is_active = TRUE) as brand_count
         FROM filament_types ft ${where} ORDER BY ft.sort_order, ft.category, ft.name
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM filament_types ${where}`, params),
      pool.query("SELECT category, COUNT(*) as count FROM filament_types GROUP BY category ORDER BY category"),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    res.render("filaments", {
      user: req.user,
      rows: rows.rows,
      total: parseInt(count.rows[0].count),
      page,
      pages: Math.ceil(parseInt(count.rows[0].count) / limit),
      catStats: catStats.rows,
      pendingContributions: parseInt(pendingCount.rows[0].count),
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// CONTRIBUTIONS list - before /:id routes
app.get("/filaments/contributions", requireAuth, async (req, res) => {
  const statusFilter = req.query.status || "pending";
  const where = statusFilter === "all" ? "" : `WHERE fc.status = $1`;
  const params = statusFilter === "all" ? [] : [statusFilter];
  try {
    const [rows, pendingCount] = await Promise.all([
      pool.query(
        `SELECT fc.*, ft.name as type_name,
                (SELECT COUNT(*) FROM filament_contribution_votes fcv WHERE fcv.contribution_id = fc.id AND fcv.vote = 'confirm') as vote_confirm_count,
                (SELECT COUNT(*) FROM filament_contribution_votes fcv WHERE fcv.contribution_id = fc.id AND fcv.vote = 'dispute') as vote_dispute_count
         FROM filament_contributions fc
         LEFT JOIN filament_types ft ON ft.id = fc.filament_type_id
         ${where} ORDER BY fc.vote_confirm DESC, fc.created_at DESC LIMIT 50`,
        params
      ),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    res.render("filament-contributions", {
      user: req.user,
      rows: rows.rows,
      pendingContributions: parseInt(pendingCount.rows[0].count),
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// APPROVE contribution
app.post("/filaments/contributions/:id/approve", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM filament_contributions WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).render("error", { message: "Contribution not found" });
    const c = rows[0];
    await pool.query(
      `INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max, speed_min, speed_max, notes_pl, notes_en, notes_de, is_verified, is_active, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,TRUE,$13)`,
      [c.filament_type_id, c.brand_name, c.product_name, c.nozzle_min, c.nozzle_max, c.bed_min, c.bed_max, c.speed_min, c.speed_max, c.notes, c.notes, c.notes, req.user.email]
    );
    await pool.query(
      `UPDATE filament_contributions SET status='approved', reviewed_at=NOW(), reviewed_by=$1 WHERE id=$2`,
      [req.user.email, req.params.id]
    );
    await invalidateFilamentCache();
    res.redirect("/filaments/contributions?flash=approved");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// REJECT contribution
app.post("/filaments/contributions/:id/reject", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  try {
    await pool.query(
      `UPDATE filament_contributions SET status='rejected', admin_note=$1, reviewed_at=NOW(), reviewed_by=$2 WHERE id=$3`,
      [req.body.admin_note || null, req.user.email, req.params.id]
    );
    res.redirect("/filaments/contributions?flash=rejected");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// NEW type form - before /:id
app.get("/filaments/new", requireAuth, async (req, res) => {
  const pendingCount = await pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'").catch(() => ({ rows: [{ count: 0 }] }));
  res.render("filament-edit", { user: req.user, row: null, flash: null, pendingContributions: parseInt(pendingCount.rows[0].count) });
});

// BRAND edit form - before /:typeId/brands
app.get("/filaments/brands/:id/edit", requireAuth, async (req, res) => {
  try {
    const [brandRes, pendingCount] = await Promise.all([
      pool.query("SELECT fb.*, ft.name as type_name, ft.nozzle_min as t_nozzle_min, ft.nozzle_max as t_nozzle_max, ft.bed_min as t_bed_min, ft.bed_max as t_bed_max, ft.speed_min as t_speed_min, ft.speed_max as t_speed_max FROM filament_brands fb JOIN filament_types ft ON ft.id = fb.filament_type_id WHERE fb.id = $1", [req.params.id]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!brandRes.rows[0]) return res.status(404).render("error", { message: "Brand not found" });
    res.render("filament-brand-edit", { user: req.user, brand: brandRes.rows[0], typeId: brandRes.rows[0].filament_type_id, flash: req.query.flash || null, pendingContributions: parseInt(pendingCount.rows[0].count) });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// UPDATE brand
app.post("/filaments/brands/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const { rows } = await pool.query("SELECT filament_type_id FROM filament_brands WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).render("error", { message: "Brand not found" });
    await pool.query(
      `UPDATE filament_brands SET brand=$1, product_name=$2, nozzle_min=$3, nozzle_max=$4, bed_min=$5, bed_max=$6,
       speed_min=$7, speed_max=$8, notes_pl=$9, notes_en=$10, notes_de=$11, product_url=$12,
       is_verified=$13, is_active=$14, updated_at=NOW(), updated_by=$15 WHERE id=$16`,
      [b.brand||null, b.product_name||null, b.nozzle_min||null, b.nozzle_max||null, b.bed_min||null, b.bed_max||null,
       b.speed_min||null, b.speed_max||null, b.notes_pl||null, b.notes_en||null, b.notes_de||null, b.product_url||null,
       b.is_verified === 'on', b.is_active === 'on', req.user.email, req.params.id]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments/${rows[0].filament_type_id}/brands?flash=updated&id=${req.params.id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// DELETE brand
app.post("/filaments/brands/:id/delete", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT filament_type_id FROM filament_brands WHERE id = $1", [req.params.id]);
    const typeId = rows[0]?.filament_type_id;
    await pool.query("DELETE FROM filament_brands WHERE id = $1", [req.params.id]);
    await invalidateFilamentCache();
    res.redirect(typeId ? `/filaments/${typeId}/brands?flash=deleted` : "/filaments?flash=deleted");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// CREATE type
app.post("/filaments/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const propsArr = b.props ? b.props.split(",").map(s => s.trim()).filter(Boolean) : [];
    const result = await pool.query(
      `INSERT INTO filament_types (type_id, name, category, nozzle_min, nozzle_max, bed_min, bed_max, temp_resistance,
       speed_min, speed_max, layer_min, layer_max, retraction_min, retraction_max, cooling, enclosure, difficulty,
       density, price_per_kg, props, uses_pl, uses_en, uses_de, notes_pl, notes_en, notes_de, is_active, sort_order, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING id`,
      [b.type_id||null, b.name||null, b.category||null, b.nozzle_min||null, b.nozzle_max||null, b.bed_min||null, b.bed_max||null,
       b.temp_resistance||null, b.speed_min||null, b.speed_max||null, b.layer_min||null, b.layer_max||null,
       b.retraction_min||null, b.retraction_max||null, b.cooling||null, b.enclosure||null,
       b.difficulty ? parseInt(b.difficulty) : null, b.density||null, b.price_per_kg||null,
       propsArr, b.uses_pl||null, b.uses_en||null, b.uses_de||null, b.notes_pl||null, b.notes_en||null, b.notes_de||null,
       b.is_active === 'on', b.sort_order ? parseInt(b.sort_order) : 0, req.user.email]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments?flash=created&id=${result.rows[0].id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// EDIT type form
app.get("/filaments/:id/edit", requireAuth, async (req, res) => {
  try {
    const [rowRes, pendingCount] = await Promise.all([
      pool.query("SELECT * FROM filament_types WHERE id = $1", [req.params.id]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!rowRes.rows[0]) return res.status(404).render("error", { message: "Filament type not found" });
    res.render("filament-edit", { user: req.user, row: rowRes.rows[0], flash: req.query.flash || null, pendingContributions: parseInt(pendingCount.rows[0].count) });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// UPDATE type
app.post("/filaments/:id/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const propsArr = b.props ? b.props.split(",").map(s => s.trim()).filter(Boolean) : [];
    await pool.query(
      `UPDATE filament_types SET name=$1, category=$2, nozzle_min=$3, nozzle_max=$4, bed_min=$5, bed_max=$6,
       temp_resistance=$7, speed_min=$8, speed_max=$9, layer_min=$10, layer_max=$11, retraction_min=$12,
       retraction_max=$13, cooling=$14, enclosure=$15, difficulty=$16, density=$17, price_per_kg=$18,
       props=$19, uses_pl=$20, uses_en=$21, uses_de=$22, notes_pl=$23, notes_en=$24, notes_de=$25,
       is_active=$26, sort_order=$27, updated_at=NOW(), updated_by=$28 WHERE id=$29`,
      [b.name||null, b.category||null, b.nozzle_min||null, b.nozzle_max||null, b.bed_min||null, b.bed_max||null,
       b.temp_resistance||null, b.speed_min||null, b.speed_max||null, b.layer_min||null, b.layer_max||null,
       b.retraction_min||null, b.retraction_max||null, b.cooling||null, b.enclosure||null,
       b.difficulty ? parseInt(b.difficulty) : null, b.density||null, b.price_per_kg||null,
       propsArr, b.uses_pl||null, b.uses_en||null, b.uses_de||null, b.notes_pl||null, b.notes_en||null, b.notes_de||null,
       b.is_active === 'on', b.sort_order ? parseInt(b.sort_order) : 0, req.user.email, req.params.id]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments?flash=updated&id=${req.params.id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// DELETE type
app.post("/filaments/:id/delete", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM filament_types WHERE id = $1", [req.params.id]);
    await invalidateFilamentCache();
    res.redirect("/filaments?flash=deleted");
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// BRANDS list for a type
app.get("/filaments/:typeId/brands", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  try {
    const [typeRes, rows, count, pendingCount] = await Promise.all([
      pool.query("SELECT * FROM filament_types WHERE id = $1", [req.params.typeId]),
      pool.query(
        `SELECT fb.*,
                (SELECT COUNT(*) FROM filament_contribution_votes fcv
                 JOIN filament_contributions fc ON fc.id = fcv.contribution_id
                 WHERE fc.filament_brand_id = fb.id AND fcv.vote = 'confirm') as vote_confirm_count
         FROM filament_brands fb WHERE fb.filament_type_id = $1 ORDER BY fb.brand, fb.product_name LIMIT $2 OFFSET $3`,
        [req.params.typeId, limit, offset]
      ),
      pool.query("SELECT COUNT(*) FROM filament_brands WHERE filament_type_id = $1", [req.params.typeId]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!typeRes.rows[0]) return res.status(404).render("error", { message: "Filament type not found" });
    res.render("filament-brands", {
      user: req.user,
      type: typeRes.rows[0],
      brands: rows.rows,
      total: parseInt(count.rows[0].count),
      page,
      pages: Math.ceil(parseInt(count.rows[0].count) / limit),
      pendingContributions: parseInt(pendingCount.rows[0].count),
      filters: req.query,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// NEW brand form
app.get("/filaments/:typeId/brands/new", requireAuth, async (req, res) => {
  try {
    const [typeRes, pendingCount] = await Promise.all([
      pool.query("SELECT * FROM filament_types WHERE id = $1", [req.params.typeId]),
      pool.query("SELECT COUNT(*) FROM filament_contributions WHERE status='pending'"),
    ]);
    if (!typeRes.rows[0]) return res.status(404).render("error", { message: "Filament type not found" });
    res.render("filament-brand-edit", { user: req.user, brand: null, typeId: req.params.typeId, type: typeRes.rows[0], flash: null, pendingContributions: parseInt(pendingCount.rows[0].count) });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// CREATE brand
app.post("/filaments/:typeId/brands/create", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO filament_brands (filament_type_id, brand, product_name, nozzle_min, nozzle_max, bed_min, bed_max,
       speed_min, speed_max, notes_pl, notes_en, notes_de, product_url, is_verified, is_active, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [req.params.typeId, b.brand||null, b.product_name||null, b.nozzle_min||null, b.nozzle_max||null,
       b.bed_min||null, b.bed_max||null, b.speed_min||null, b.speed_max||null,
       b.notes_pl||null, b.notes_en||null, b.notes_de||null, b.product_url||null,
       b.is_verified === 'on', b.is_active === 'on', req.user.email]
    );
    await invalidateFilamentCache();
    res.redirect(`/filaments/${req.params.typeId}/brands?flash=created&id=${result.rows[0].id}`);
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// --- Email Threads ---
app.get("/email-threads", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const filter = req.query.filter || "active";
  const limit = 50;
  const offset = (page - 1) * limit;

  const whereClause = filter === "all" ? "" :
    filter === "spam" ? "WHERE et.tag = 'spam'" :
    filter === "lead" ? "WHERE et.tag = 'lead'" :
    filter === "not_lead" ? "WHERE et.tag = 'not_lead'" :
    filter === "unclassified" ? "WHERE et.tag = 'unclassified'" :
    "WHERE et.tag != 'spam'";  // default "active": hide spam

  try {
    const [rows, count, stats] = await Promise.all([
      pool.query(`
        SELECT et.*, l.email as lead_email, l.status as lead_status,
          (SELECT COUNT(*) FROM email_messages em WHERE em.thread_id = et.id AND em.direction = 'inbound') as inbound_count,
          (SELECT COUNT(*) FROM email_messages em WHERE em.thread_id = et.id AND em.direction = 'outbound') as outbound_count
        FROM email_threads et
        LEFT JOIN leads l ON l.id = et.lead_id
        ${whereClause}
        ORDER BY et.last_message_at DESC NULLS LAST
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      pool.query(`SELECT COUNT(*) as total FROM email_threads et ${whereClause}`),
      pool.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tag = 'lead') as leads,
        COUNT(*) FILTER (WHERE tag = 'spam') as spam,
        COUNT(*) FILTER (WHERE tag = 'not_lead') as not_lead,
        COUNT(*) FILTER (WHERE tag = 'unclassified') as unclassified,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
        FROM email_threads`),
    ]);
    res.render("email-threads", {
      user: req.user,
      threads: rows.rows,
      total: parseInt(count.rows[0].total),
      page,
      pages: Math.ceil(parseInt(count.rows[0].total) / limit),
      stats: stats.rows[0],
      filter,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

app.post("/email-threads/:id/tag", requireAuth, async (req, res) => {
  const { tag } = req.body;
  const valid = ["spam", "lead", "not_lead", "unclassified"];
  if (!valid.includes(tag)) return res.status(400).json({ error: "invalid tag" });
  try {
    await pool.query("UPDATE email_threads SET tag = $1 WHERE id = $2", [tag, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/email-threads/:id", requireAuth, async (req, res) => {
  try {
    const [thread, messages] = await Promise.all([
      pool.query(`
        SELECT et.*, l.email as lead_email, l.status as lead_status, l.calculator as lead_calculator
        FROM email_threads et
        LEFT JOIN leads l ON l.id = et.lead_id
        WHERE et.id = $1
      `, [req.params.id]),
      pool.query("SELECT * FROM email_messages WHERE thread_id = $1 ORDER BY received_at ASC", [req.params.id]),
    ]);
    if (!thread.rows[0]) return res.status(404).render("error", { message: "Thread not found" });
    res.render("email-thread", {
      user: req.user,
      thread: thread.rows[0],
      messages: messages.rows,
    });
  } catch (err) {
    res.status(500).render("error", { message: err.message });
  }
});

// ============================================================
// SKLEP: PRODUKTY, KODY RABATOWE, PRZELEWY
// ============================================================
// Te trzy rzeczy zyja w bazie sklepu, ale zapis ma skutki uboczne: zmiana
// stanu wchodzi w rezerwacje towaru, a potwierdzenie przelewu wysyla maile
// i przenosi pliki klienta. Dlatego panel nie pisze do bazy sam, tylko wola
// backend sklepu, gdzie te reguly juz sa. Jedna implementacja, jedno miejsce
// na blad.
//
// Wymaga dwoch zmiennych w tej usludze: CHAT_API_URL i ADMIN_API_TOKEN.

const CHAT_API = (process.env.CHAT_API_URL || "").replace(/\/$/, "");

// Adres serwisu, na ktorym stoi strona oferty. Ta sama wartosc co w chat-api,
// wiec link z panelu i link z maila prowadza w to samo miejsce.
const SITE_URL = (process.env.SITE_URL || "https://www.aejaca.com").replace(/\/$/, "");

async function shopApi(path, { method = "GET", body } = {}) {
  if (!CHAT_API) throw new Error("Brak zmiennej CHAT_API_URL w tej usludze");
  if (!process.env.ADMIN_API_TOKEN) throw new Error("Brak zmiennej ADMIN_API_TOKEN w tej usludze");
  const res = await fetch(`${CHAT_API}${path}`, {
    method,
    headers: {
      "X-Admin-Token": process.env.ADMIN_API_TOKEN,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Backend sklepu odpowiedzial ${res.status}`);
  return data;
}

/** Wynik akcji wraca w adresie, zeby odswiezenie strony nie powtarzalo zapisu. */
const back = (res, path, params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  res.redirect(q ? `${path}?${q}` : path);
};

// --- Produkty ---
app.get("/products", requireAuth, async (req, res) => {
  try {
    const { products } = await shopApi("/api/admin/products");
    res.render("products", { user: req.user, products, msg: req.query.msg, err: req.query.err });
  } catch (err) {
    res.render("products", { user: req.user, products: [], msg: null, err: err.message });
  }
});

app.post("/products/:slug/stock", requireAuth, async (req, res) => {
  try {
    const stock = parseInt(req.body.stock, 10);
    await shopApi(`/api/products/${encodeURIComponent(req.params.slug)}/stock`, {
      method: "PATCH", body: { stock },
    });
    back(res, "/products", { msg: `${req.params.slug}: stan ustawiony na ${stock}` });
  } catch (err) { back(res, "/products", { err: err.message }); }
});

app.post("/products/:slug/status", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/products/${encodeURIComponent(req.params.slug)}/status`, {
      method: "PATCH", body: { status: req.body.status },
    });
    back(res, "/products", { msg: `${req.params.slug}: ${req.body.status}` });
  } catch (err) { back(res, "/products", { err: err.message }); }
});

// --- Kody rabatowe ---
app.get("/discounts", requireAuth, async (req, res) => {
  try {
    const { codes } = await shopApi("/api/admin/discounts");
    res.render("discounts", {
      user: req.user, codes,
      created: req.query.created ? req.query.created.split(",") : [],
      msg: req.query.msg, err: req.query.err,
    });
  } catch (err) {
    res.render("discounts", { user: req.user, codes: [], created: [], msg: null, err: err.message });
  }
});

app.post("/discounts", requireAuth, async (req, res) => {
  const b = req.body;
  const batch = b.mode === "batch";
  const num = (v) => (v === "" || v === undefined ? null : parseInt(v, 10));
  try {
    const { codes } = await shopApi("/api/admin/discounts", {
      method: "POST",
      body: {
        code: batch ? undefined : b.code,
        prefix: batch ? (b.prefix || "AEJ") : undefined,
        count: batch ? num(b.count) || 1 : 1,
        kind: b.kind === "amount" ? "amount" : "percent",
        // Kwote podajesz w zlotych, backend liczy w groszach.
        value: b.kind === "amount" ? Math.round(Number(b.value) * 100) : num(b.value),
        appliesTo: b.appliesTo,
        minOrderGrosze: b.minOrder ? Math.round(Number(b.minOrder) * 100) : 0,
        maxUses: num(b.maxUses) ?? (batch ? 1 : null),
        maxUsesPerEmail: num(b.maxUsesPerEmail) || 1,
        validFrom: b.validFrom || null,
        validTo: b.validTo || null,
        campaign: b.campaign || null,
        issuedTo: b.issuedTo || null,
        note: b.note || null,
      },
    });
    back(res, "/discounts", { created: codes.join(",") });
  } catch (err) { back(res, "/discounts", { err: err.message }); }
});

app.post("/discounts/:code/delete", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/admin/discounts/${encodeURIComponent(req.params.code)}`, { method: "DELETE" });
    back(res, "/discounts", { msg: `${req.params.code}: skasowany` });
  } catch (err) { back(res, "/discounts", { err: err.message }); }
});

// Poprawianie kodu, ktory juz gdzies poszedl. Nazwy i licznika uzyc nie
// ruszamy: pierwsza stoi przy zamowieniach, drugi jest zapisem tego, co sie
// stalo. Resztę wolno zmienic, bo akcja potrafi sie przeciagnac albo zmienic
// zasady, a alternatywa jest kasowanie kodu, ktory ktos ma juz w skrzynce.
app.get("/discounts/:code/edit", requireAuth, async (req, res) => {
  try {
    const { codes } = await shopApi("/api/admin/discounts");
    const kod = (codes || []).find((c) => c.code === req.params.code);
    if (!kod) return res.status(404).render("error", { message: "Nie znamy takiego kodu" });
    res.render("discount-edit", { user: req.user, kod, err: req.query.err || null });
  } catch (err) { res.status(500).render("error", { message: err.message }); }
});

app.post("/discounts/:code/update", requireAuth, express.urlencoded({ extended: true }), async (req, res) => {
  const b = req.body;
  const num = (v) => (v === "" || v === undefined ? null : parseInt(v, 10));
  try {
    await shopApi(`/api/admin/discounts/${encodeURIComponent(req.params.code)}`, {
      method: "PATCH",
      body: {
        kind: b.kind === "amount" ? "amount" : "percent",
        // Kwote podajesz w zlotych, backend liczy w groszach. Ta sama zamiana
        // co przy tworzeniu kodu i musi zostac taka sama, inaczej poprawiony
        // kod dawalby sto razy wiecej niz zalozony.
        value: b.kind === "amount" ? Math.round(Number(b.value) * 100) : num(b.value),
        appliesTo: b.appliesTo,
        minOrderGrosze: b.minOrder ? Math.round(Number(b.minOrder) * 100) : 0,
        maxUses: num(b.maxUses),
        maxUsesPerEmail: num(b.maxUsesPerEmail) || 1,
        validFrom: b.validFrom || null,
        validTo: b.validTo || null,
        campaign: b.campaign || null,
        issuedTo: b.issuedTo || null,
        note: b.note || null,
      },
    });
    back(res, "/discounts", { msg: `${req.params.code}: zapisany` });
  } catch (err) {
    res.redirect(`/discounts/${encodeURIComponent(req.params.code)}/edit?err=${encodeURIComponent(err.message)}`);
  }
});

app.post("/discounts/:code/toggle", requireAuth, async (req, res) => {
  try {
    const { active } = await shopApi(`/api/admin/discounts/${encodeURIComponent(req.params.code)}`, {
      method: "PATCH", body: { active: req.body.active === "true" },
    });
    back(res, "/discounts", { msg: `${req.params.code}: ${active ? "aktywny" : "wylaczony"}` });
  } catch (err) { back(res, "/discounts", { err: err.message }); }
});

// --- Przelewy czekajace na potwierdzenie ---
// Przelew nie ma powiadomienia z bramki, wiec jedynym dowodem wplywu jest
// wyciag bankowy. Potwierdzenie robi dokladnie to samo, co SUCCESS z Autopay:
// maile do klienta i przeniesienie plikow do Zamowien. Wykonuje sie raz.
// ------------------------------------------------------------
// WYCENY
// ------------------------------------------------------------
// Jedno miejsce na wszystkie zapytania, niezaleznie od tego, czy przyszly
// z formularza, z kalkulatora, mailem czy telefonem. Numer `WY...` nadaje
// sie od razu, jeszcze przed kwota, bo to on nazywa watek w korespondencji
// i pozniej stoi w tytule platnosci.

app.get("/quotes", requireAuth, async (req, res) => {
  const stan = String(req.query.status || "");
  try {
    const { quotes, counts } = await shopApi(`/api/quotes${stan ? `?status=${encodeURIComponent(stan)}` : ""}`);
    res.render("quotes", { user: req.user, quotes, counts, stan, msg: req.query.msg, err: req.query.err });
  } catch (err) {
    res.render("quotes", { user: req.user, quotes: [], counts: {}, stan, msg: null, err: err.message });
  }
});

app.get("/quotes/:ref", requireAuth, async (req, res) => {
  try {
    const { quote, items } = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/admin`);
    // Link buduje sie tu, a nie w widoku, bo klient przy rozmowie telefonicznej
    // nie dostanie maila i jedynym sposobem przekazania oferty jest skopiowanie
    // tego adresu z ekranu.
    const offerUrl = `${SITE_URL}/oferta/?ref=${encodeURIComponent(quote.quoteRef)}&token=${encodeURIComponent(quote.accessToken)}`;
    res.render("quote-edit", { user: req.user, quote, items, offerUrl, msg: req.query.msg, err: req.query.err });
  } catch (err) {
    back(res, "/quotes", { err: err.message });
  }
});

/** Zalozenie wyceny z rozmowy mailowej albo telefonicznej. */
app.post("/quotes/new", requireAuth, async (req, res) => {
  try {
    const tytuly = [].concat(req.body.title || []).filter((s) => String(s).trim());
    const ilosci = [].concat(req.body.qty || []);
    const items = tytuly.map((tytul, i) => ({
      title: String(tytul).slice(0, 255),
      qty: Math.max(1, Math.floor(Number(ilosci[i]) || 1)),
    }));
    if (!items.length) items.push({ title: String(req.body.message || "Zapytanie").slice(0, 255), qty: 1 });
    const r = await shopApi("/api/quotes/manual", {
      method: "POST",
      body: {
        email: (req.body.email || "").trim() || null,
        name: (req.body.name || "").trim() || null,
        phone: (req.body.phone || "").trim() || null,
        lang: ["pl", "en", "de"].includes(req.body.lang) ? req.body.lang : "pl",
        source: req.body.source === "phone" ? "phone" : "email",
        message: req.body.message || null,
        items,
      },
    });
    back(res, `/quotes/${r.quoteRef}`, { msg: `Zalozono ${r.quoteRef}` });
  } catch (err) { back(res, "/quotes", { err: err.message }); }
});

/** Wpisanie kwot: dopiero to czyni z zapytania oferte. */
app.post("/quotes/:ref/price", requireAuth, async (req, res) => {
  try {
    const idki = [].concat(req.body.itemId || []);
    const kwoty = [].concat(req.body.unitPln || []);
    const lines = idki
      .map((id, i) => ({ id: Number(id), unitGrosze: Math.round(Number(String(kwoty[i]).replace(",", ".")) * 100) }))
      .filter((l) => Number.isFinite(l.unitGrosze) && l.unitGrosze > 0);
    if (!lines.length) throw new Error("Wpisz kwotę przynajmniej jednej pozycji");
    const r = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/price`, {
      method: "POST",
      body: {
        lines,
        note: req.body.note || null,
        validDays: Number(req.body.validDays) > 0 ? Number(req.body.validDays) : undefined,
      },
    });
    back(res, `/quotes/${req.params.ref}`, { msg: `Wyceniono na ${(r.totalGrosze / 100).toFixed(2)} zł, ważne do ${r.validUntil}` });
  } catch (err) { back(res, `/quotes/${req.params.ref}`, { err: err.message }); }
});

/** Wyslanie oferty klientowi. */
app.post("/quotes/:ref/send", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/quotes/${encodeURIComponent(req.params.ref)}/send`, { method: "POST" });
    back(res, `/quotes/${req.params.ref}`, {
      msg: r.mailed ? "Oferta wysłana mailem" : `Oznaczono jako wysłaną. Bez maila, przekaż link: ${r.url}`,
    });
  } catch (err) { back(res, `/quotes/${req.params.ref}`, { err: err.message }); }
});

app.get("/transfers", requireAuth, async (req, res) => {
  try {
    const { orders, reviews = [], closed = [] } = await shopApi("/api/orders/awaiting-transfer");
    res.render("transfers", { user: req.user, orders, reviews, closed, msg: req.query.msg, err: req.query.err });
  } catch (err) {
    res.render("transfers", { user: req.user, orders: [], reviews: [], closed: [], msg: null, err: err.message });
  }
});

app.post("/transfers/:ref/confirm", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/confirm-transfer`, {
      method: "POST",
      body: {
        receivedEur: req.body.receivedEur ? Number(req.body.receivedEur) : undefined,
        force: req.body.force === "true",
      },
    });
    back(res, "/transfers", { msg: `${req.params.ref}: potwierdzony` });
  } catch (err) { back(res, "/transfers", { err: err.message }); }
});

// Rezygnacja: towar i kod wracaja do puli od razu, wiersz zostaje z adnotacja.
app.post("/transfers/:ref/cancel", requireAuth, async (req, res) => {
  try {
    const r = await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}/cancel`, {
      method: "POST",
      body: { by: req.user.email, reason: req.body.reason || null },
    });
    const wrocilo = r.releasedReservations
      ? `, towar wrocil do sprzedazy (${r.releasedReservations})`
      : "";
    const kod = r.releasedCodes ? ", kod rabatowy zwolniony" : "";
    back(res, "/transfers", { msg: `${req.params.ref}: rezygnacja${wrocilo}${kod}` });
  } catch (err) { back(res, "/transfers", { err: err.message }); }
});

// Kasowanie: tylko pomylki i testy. Backend odmawia, gdy cokolwiek sie wydarzylo,
// i podaje powod, ktory pokazujemy wprost zamiast suchej odmowy.
app.post("/transfers/:ref/delete", requireAuth, async (req, res) => {
  try {
    await shopApi(`/api/orders/${encodeURIComponent(req.params.ref)}`, { method: "DELETE" });
    back(res, "/transfers", { msg: `${req.params.ref}: skasowane` });
  } catch (err) { back(res, "/transfers", { err: err.message }); }
});

app.listen(PORT, () => console.log(`AEJaCA Admin running on :${PORT}`));
