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
    const [leadStats, subStats, recentLeads, recentSubs, analyticsKpi] = await Promise.all([
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
    ]);
    res.render("dashboard", {
      user: req.user,
      leadStats: leadStats.rows[0],
      subStats: subStats.rows[0],
      recentLeads: recentLeads.rows,
      recentSubs: recentSubs.rows,
      analyticsKpi: analyticsKpi.rows[0] || {},
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

app.listen(PORT, () => console.log(`AEJaCA Admin running on :${PORT}`));
