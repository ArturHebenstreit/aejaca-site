// ============================================================
// AEJaCA Analytics Worker — Cloudflare Workers + D1
// ============================================================
// POST /events        — receive event batches from frontend
// GET  /dash?token=X  — analytics dashboard
// GET  /api/stats     — JSON API for dashboard data
// GET  /api/events    — raw events query
// GET  /api/export    — CSV export
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers — accept both www and non-www origins
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = [
      env.ALLOWED_ORIGIN || "https://www.aejaca.com",
      "https://aejaca.com",
      "https://www.aejaca.com",
    ];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- Event ingestion ---
      if (path === "/events" && request.method === "POST") {
        return handleEvents(request, env, corsHeaders);
      }

      // --- Dashboard (HTML) ---
      if (path === "/dash") {
        return handleDashboard(url, env);
      }

      // --- API endpoints (require token) ---
      if (path.startsWith("/api/")) {
        const token = url.searchParams.get("token");
        if (token !== env.DASHBOARD_TOKEN) {
          return json({ error: "Unauthorized" }, 401);
        }
        if (path === "/api/stats") return handleStats(url, env);
        if (path === "/api/events") return handleEventsList(url, env);
        if (path === "/api/export") return handleExport(url, env);
        if (path === "/api/top") return handleTop(url, env);
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },

  // Optional: scheduled aggregation
  async scheduled(event, env) {
    await aggregateDaily(env);
  },
};

// ============================================================
// EVENT INGESTION
// ============================================================

async function handleEvents(request, env, corsHeaders) {
  let body;
  try {
    // sendBeacon sends as text/plain, so request.json() may fail
    const text = await request.text();
    body = JSON.parse(text);
  } catch {
    return json({ error: "Invalid JSON" }, 400, corsHeaders);
  }

  const events = body.events;
  if (!Array.isArray(events) || events.length === 0) {
    return json({ error: "No events" }, 400, corsHeaders);
  }

  // Device detection from UA
  const ua = request.headers.get("user-agent") || "";
  const device = /Mobile|Android|iPhone/i.test(ua) ? "mobile" :
                 /Tablet|iPad/i.test(ua) ? "tablet" : "desktop";

  // Country from CF headers
  const country = request.headers.get("cf-ipcountry") || "";

  // Rate limit: max 50 events per request
  const batch = events.slice(0, 50);

  const stmt = env.DB.prepare(
    `INSERT INTO events (ts, session, path, category, action, label, value, country, device)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const inserts = batch.map(e => stmt.bind(
    e.t || Date.now(),
    String(e.s || "").slice(0, 20),
    String(e.p || "").slice(0, 200),
    String(e.c || "").slice(0, 50),
    String(e.a || "").slice(0, 100),
    String(e.l || "").slice(0, 500),
    e.v != null ? Number(e.v) : null,
    country,
    device
  ));

  await env.DB.batch(inserts);

  return json({ ok: true, count: batch.length }, 200, corsHeaders);
}

// ============================================================
// API: STATS
// ============================================================

async function handleStats(url, env) {
  const days = parseInt(url.searchParams.get("days") || "30");
  const since = Date.now() - days * 86400000;

  const [overview, pages, calcs, langs, inquiries, countries, devices] = await Promise.all([
    // Overview counts
    env.DB.prepare(`
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT session) as unique_visitors,
        SUM(CASE WHEN category='page' THEN 1 ELSE 0 END) as pageviews,
        SUM(CASE WHEN category='inquiry' THEN 1 ELSE 0 END) as inquiries
      FROM events WHERE ts >= ?
    `).bind(since).first(),

    // Top pages
    env.DB.prepare(`
      SELECT label as page, COUNT(*) as views, COUNT(DISTINCT session) as visitors
      FROM events WHERE category='page' AND ts >= ?
      GROUP BY label ORDER BY views DESC LIMIT 20
    `).bind(since).all(),

    // Top calculator interactions
    env.DB.prepare(`
      SELECT action, label, COUNT(*) as count
      FROM events WHERE category='calc' AND ts >= ?
      GROUP BY action, label ORDER BY count DESC LIMIT 30
    `).bind(since).all(),

    // Language distribution
    env.DB.prepare(`
      SELECT label, COUNT(*) as count
      FROM events WHERE category='nav' AND action='lang_change' AND ts >= ?
      GROUP BY label ORDER BY count DESC
    `).bind(since).all(),

    // Inquiry details
    env.DB.prepare(`
      SELECT label, ts, session, country
      FROM events WHERE category='inquiry' AND ts >= ?
      ORDER BY ts DESC LIMIT 50
    `).bind(since).all(),

    // Countries
    env.DB.prepare(`
      SELECT country, COUNT(DISTINCT session) as visitors, COUNT(*) as events
      FROM events WHERE ts >= ? AND country != ''
      GROUP BY country ORDER BY visitors DESC LIMIT 20
    `).bind(since).all(),

    // Devices
    env.DB.prepare(`
      SELECT device, COUNT(DISTINCT session) as visitors
      FROM events WHERE ts >= ?
      GROUP BY device ORDER BY visitors DESC
    `).bind(since).all(),
  ]);

  // Daily chart data
  const daily = await env.DB.prepare(`
    SELECT date(created) as day,
      COUNT(CASE WHEN category='page' THEN 1 END) as pageviews,
      COUNT(DISTINCT session) as visitors,
      COUNT(CASE WHEN category='inquiry' THEN 1 END) as inquiries
    FROM events WHERE ts >= ?
    GROUP BY day ORDER BY day
  `).bind(since).all();

  return json({
    period: { days, since: new Date(since).toISOString() },
    overview,
    pages: pages.results,
    calculators: calcs.results,
    languages: langs.results,
    inquiries: inquiries.results,
    countries: countries.results,
    devices: devices.results,
    daily: daily.results,
  });
}

// ============================================================
// API: RAW EVENTS
// ============================================================

async function handleEventsList(url, env) {
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const category = url.searchParams.get("category") || null;
  const session = url.searchParams.get("session") || null;

  let sql = "SELECT * FROM events WHERE 1=1";
  const params = [];

  if (category) { sql += " AND category = ?"; params.push(category); }
  if (session) { sql += " AND session = ?"; params.push(session); }

  sql += " ORDER BY ts DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await env.DB.prepare(sql).bind(...params).all();
  return json({ events: result.results, count: result.results.length });
}

// ============================================================
// API: TOP (specific dimension)
// ============================================================

async function handleTop(url, env) {
  const dim = url.searchParams.get("dim") || "action";
  const days = parseInt(url.searchParams.get("days") || "30");
  const since = Date.now() - days * 86400000;
  const allowed = ["action", "label", "path", "category", "country", "device"];
  if (!allowed.includes(dim)) return json({ error: "Invalid dimension" }, 400);

  const result = await env.DB.prepare(`
    SELECT ${dim} as key, COUNT(*) as count, COUNT(DISTINCT session) as sessions
    FROM events WHERE ts >= ?
    GROUP BY ${dim} ORDER BY count DESC LIMIT 50
  `).bind(since).all();

  return json({ dimension: dim, days, results: result.results });
}

// ============================================================
// API: CSV EXPORT
// ============================================================

async function handleExport(url, env) {
  const days = parseInt(url.searchParams.get("days") || "30");
  const since = Date.now() - days * 86400000;

  const result = await env.DB.prepare(`
    SELECT ts, session, path, category, action, label, value, country, device, created
    FROM events WHERE ts >= ? ORDER BY ts DESC LIMIT 10000
  `).bind(since).all();

  const csv = "timestamp,session,path,category,action,label,value,country,device,created\n" +
    result.results.map(e =>
      `${new Date(e.ts).toISOString()},${e.session},${e.path},${e.category},${e.action},"${(e.label || "").replace(/"/g, '""')}",${e.value ?? ""},${e.country},${e.device},${e.created}`
    ).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="aejaca-analytics-${days}d.csv"`,
    },
  });
}

// ============================================================
// DASHBOARD (HTML)
// ============================================================

function handleDashboard(url, env) {
  const token = url.searchParams.get("token");
  if (token !== env.DASHBOARD_TOKEN) {
    return new Response("Unauthorized. Add ?token=YOUR_TOKEN to URL.", { status: 401 });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AEJaCA Analytics</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:20px}
h1{font-size:1.5rem;margin-bottom:4px;color:#fff}
h2{font-size:1.1rem;color:#a3a3a3;margin:24px 0 12px;border-bottom:1px solid #262626;padding-bottom:8px}
.subtitle{color:#737373;font-size:.85rem;margin-bottom:20px}
.controls{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.controls button{padding:8px 16px;border:1px solid #333;background:#171717;color:#a3a3a3;border-radius:8px;cursor:pointer;font-size:.85rem}
.controls button.active{border-color:#60a5fa;color:#60a5fa;background:#60a5fa10}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}
.card{background:#171717;border:1px solid #262626;border-radius:12px;padding:16px}
.card .num{font-size:2rem;font-weight:700;color:#fff}
.card .lbl{font-size:.75rem;color:#737373;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{text-align:left;color:#737373;padding:8px;border-bottom:1px solid #262626;font-weight:500}
td{padding:8px;border-bottom:1px solid #1a1a1a}
tr:hover td{background:#1a1a1a}
.bar{height:6px;background:#60a5fa;border-radius:3px;min-width:2px}
.chart{display:flex;align-items:end;gap:2px;height:100px;margin:16px 0}
.chart .col{flex:1;background:#60a5fa;border-radius:2px 2px 0 0;min-width:4px;position:relative}
.chart .col:hover{background:#93c5fd}
.chart .col:hover::after{content:attr(data-tip);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:2px 6px;border-radius:4px;font-size:.7rem;white-space:nowrap}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;background:#262626;color:#a3a3a3;margin:2px}
.amber{color:#fbbf24}
.blue{color:#60a5fa}
.green{color:#4ade80}
.red{color:#f87171}
#loading{text-align:center;padding:40px;color:#737373}
.section{margin-bottom:32px}
.export-btn{padding:6px 14px;border:1px solid #333;background:#171717;color:#60a5fa;border-radius:6px;cursor:pointer;font-size:.8rem;float:right}
</style>
</head>
<body>
<h1>AEJaCA Analytics</h1>
<div class="subtitle">Event tracking dashboard — aejaca.com</div>

<div class="controls">
  <button onclick="load(1)" id="btn-1">Today</button>
  <button onclick="load(7)" id="btn-7" class="active">7 days</button>
  <button onclick="load(30)" id="btn-30">30 days</button>
  <button onclick="load(90)" id="btn-90">90 days</button>
  <button onclick="load(365)" id="btn-365">Year</button>
  <button class="export-btn" onclick="exportCSV()">Export CSV</button>
</div>

<div id="loading">Loading...</div>
<div id="content" style="display:none">

  <!-- Overview cards -->
  <div class="grid">
    <div class="card"><div class="num blue" id="v-visitors">—</div><div class="lbl">Unique visitors</div></div>
    <div class="card"><div class="num" id="v-pageviews">—</div><div class="lbl">Page views</div></div>
    <div class="card"><div class="num amber" id="v-inquiries">—</div><div class="lbl">Inquiries</div></div>
    <div class="card"><div class="num" id="v-events">—</div><div class="lbl">Total events</div></div>
  </div>

  <!-- Daily chart -->
  <div class="section">
    <h2>Daily visitors</h2>
    <div class="chart" id="daily-chart"></div>
  </div>

  <!-- Top pages -->
  <div class="section">
    <h2>Top pages</h2>
    <table id="t-pages"><thead><tr><th>Page</th><th>Views</th><th>Visitors</th><th></th></tr></thead><tbody></tbody></table>
  </div>

  <!-- Calculator usage -->
  <div class="section">
    <h2>Calculator interactions</h2>
    <table id="t-calcs"><thead><tr><th>Action</th><th>Selection</th><th>Count</th><th></th></tr></thead><tbody></tbody></table>
  </div>

  <!-- Inquiries -->
  <div class="section">
    <h2>Inquiry submissions</h2>
    <table id="t-inquiries"><thead><tr><th>Time</th><th>Details</th><th>Country</th></tr></thead><tbody></tbody></table>
  </div>

  <!-- Countries -->
  <div class="section">
    <h2>Countries</h2>
    <table id="t-countries"><thead><tr><th>Country</th><th>Visitors</th><th>Events</th><th></th></tr></thead><tbody></tbody></table>
  </div>

  <!-- Devices -->
  <div class="section">
    <h2>Devices</h2>
    <div class="grid" id="devices-grid"></div>
  </div>

  <!-- Languages -->
  <div class="section">
    <h2>Language changes</h2>
    <table id="t-langs"><thead><tr><th>Change</th><th>Count</th></tr></thead><tbody></tbody></table>
  </div>
</div>

<script>
const TOKEN = new URLSearchParams(location.search).get("token");
const BASE = location.origin;
let currentDays = 7;

async function load(days) {
  currentDays = days;
  document.querySelectorAll(".controls button:not(.export-btn)").forEach(b => b.classList.remove("active"));
  document.getElementById("btn-"+days)?.classList.add("active");
  document.getElementById("loading").style.display = "block";
  document.getElementById("content").style.display = "none";

  const r = await fetch(BASE+"/api/stats?token="+TOKEN+"&days="+days);
  const d = await r.json();

  document.getElementById("loading").style.display = "none";
  document.getElementById("content").style.display = "block";

  // Overview
  const o = d.overview;
  document.getElementById("v-visitors").textContent = fmt(o.unique_visitors);
  document.getElementById("v-pageviews").textContent = fmt(o.pageviews);
  document.getElementById("v-inquiries").textContent = fmt(o.inquiries);
  document.getElementById("v-events").textContent = fmt(o.total_events);

  // Daily chart
  const chart = document.getElementById("daily-chart");
  chart.innerHTML = "";
  if (d.daily.length > 0) {
    const maxV = Math.max(...d.daily.map(r=>r.visitors), 1);
    d.daily.forEach(r => {
      const col = document.createElement("div");
      col.className = "col";
      col.style.height = Math.max(4, (r.visitors/maxV)*100) + "px";
      col.setAttribute("data-tip", r.day+": "+r.visitors+" visitors, "+r.pageviews+" views");
      chart.appendChild(col);
    });
  }

  // Pages
  fillTable("t-pages", d.pages, r => [r.page||"/", r.views, r.visitors, bar(r.views, d.pages[0]?.views)]);

  // Calculators
  fillTable("t-calcs", d.calculators, r => [r.action, r.label, r.count, bar(r.count, d.calculators[0]?.count)]);

  // Inquiries
  fillTable("t-inquiries", d.inquiries, r => [
    new Date(r.ts).toLocaleString(),
    '<span class="tag">'+esc(r.label)+'</span>',
    r.country||"—"
  ]);

  // Countries
  fillTable("t-countries", d.countries, r => [flag(r.country)+" "+r.country, r.visitors, r.events, bar(r.visitors, d.countries[0]?.visitors)]);

  // Devices
  const dg = document.getElementById("devices-grid");
  dg.innerHTML = "";
  const icons = {desktop:"&#128187;", mobile:"&#128241;", tablet:"&#128218;"};
  d.devices.forEach(r => {
    dg.innerHTML += '<div class="card"><div class="num">'+(icons[r.device]||"")+" "+fmt(r.visitors)+'</div><div class="lbl">'+r.device+'</div></div>';
  });

  // Languages
  fillTable("t-langs", d.languages, r => [r.label, r.count]);
}

function fillTable(id, rows, mapper) {
  const tbody = document.querySelector("#"+id+" tbody");
  tbody.innerHTML = "";
  (rows||[]).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = mapper(r).map(v => "<td>"+(v??"—")+"</td>").join("");
    tbody.appendChild(tr);
  });
  if (!rows?.length) tbody.innerHTML = '<tr><td colspan="9" style="color:#525252;text-align:center">No data</td></tr>';
}

function bar(val, max) {
  const pct = max ? Math.round((val/max)*100) : 0;
  return '<div class="bar" style="width:'+pct+'%"></div>';
}

function fmt(n) { return (n||0).toLocaleString(); }
function esc(s) { const d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
function flag(cc) {
  if (!cc || cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

function exportCSV() {
  window.open(BASE+"/api/export?token="+TOKEN+"&days="+currentDays);
}

load(7);
</script>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
}

// ============================================================
// DAILY AGGREGATION (optional cron)
// ============================================================

async function aggregateDaily(env) {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dayStart = new Date(yesterday + "T00:00:00Z").getTime();
  const dayEnd = dayStart + 86400000;

  const metrics = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(DISTINCT session) as visitors,
      SUM(CASE WHEN category='page' THEN 1 ELSE 0 END) as pageviews,
      SUM(CASE WHEN category='inquiry' THEN 1 ELSE 0 END) as inquiries
    FROM events WHERE ts >= ? AND ts < ?
  `).bind(dayStart, dayEnd).first();

  const stmt = env.DB.prepare(
    `INSERT OR REPLACE INTO daily_stats (day, metric, dimension, count) VALUES (?, ?, ?, ?)`
  );

  await env.DB.batch([
    stmt.bind(yesterday, "pageviews", "", metrics.pageviews || 0),
    stmt.bind(yesterday, "visitors", "", metrics.visitors || 0),
    stmt.bind(yesterday, "inquiries", "", metrics.inquiries || 0),
    stmt.bind(yesterday, "total_events", "", metrics.total || 0),
  ]);
}

// ============================================================
// HELPERS
// ============================================================

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
