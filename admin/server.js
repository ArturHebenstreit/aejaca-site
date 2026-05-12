import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "contact@aejaca.com")
  .split(",").map(e => e.trim().toLowerCase());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// --- Session ---
app.set("trust proxy", 1);
app.use(session({
  secret: process.env.SESSION_SECRET || "aejaca-admin-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === "production", sameSite: "lax" },
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
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('pl-PL') + ' ' + dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };
  next();
});

// --- View engine ---
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

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
    const [leadStats, subStats, recentLeads, recentSubs, analyticsKpi, laserMatrixCount, gemResult] = await Promise.all([
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
    const [rows, count, byCalc] = await Promise.all([
      pool.query("SELECT * FROM leads ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]),
      pool.query("SELECT COUNT(*) as total FROM leads"),
      pool.query("SELECT calculator, COUNT(*) as count FROM leads GROUP BY calculator ORDER BY count DESC"),
    ]);
    res.render("leads", {
      user: req.user,
      leads: rows.rows,
      total: parseInt(count.rows[0].total),
      page,
      pages: Math.ceil(count.rows[0].total / limit),
      byCalc: byCalc.rows,
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
app.get("/export/:table", requireAuth, async (req, res) => {
  const table = req.params.table === "subscribers" ? "subscribers" : "leads";
  try {
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${table === "leads" ? "created_at" : "subscribed_at"} DESC`);
    if (!rows.length) return res.status(404).send("No data");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
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

// EXPORT CSV — must be before /:id routes
app.get("/laser-matrix/export", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM laser_matrix ORDER BY id");
    if (!rows.length) return res.status(404).send("No data");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
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
    res.render("gemstone-prices", { user: req.user, gems: rows });
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
  res.redirect("/gemstone-prices");
});

app.listen(PORT, () => console.log(`AEJaCA Admin running on :${PORT}`));
