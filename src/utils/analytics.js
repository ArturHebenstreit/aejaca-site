// ============================================================
// AEJaCA ANALYTICS - lightweight event tracking
// ============================================================
// Zdarzenia ida przez sendBeacon na wlasny punkt zbiorczy. Bez ciasteczek,
// bez danych osobowych i BEZ ZAPISU CZEGOKOLWIEK W URZADZENIU.
//
// To ostatnie jest wymogiem, nie zbiegiem okolicznosci. Art. 398 Prawa
// komunikacji elektronicznej wymaga zgody na przechowywanie informacji
// w urzadzeniu koncowym poza tym, co niezbedne do wykonania uslugi zadanej
// przez uzytkownika. Statystyka niezbedna nie jest, wiec gdyby cokolwiek
// zapisywala, potrzebowalaby zgody, czyli banera.
//
// Kolejka zyje w pamieci strony i ginie razem z nia, identyfikator odwiedzin
// tak samo: losowany przy wejsciu, nigdzie nie zapisywany, wiec nie laczy
// dwoch wizyt tej samej osoby. Wczesniej byla tu jeszcze sciezka zapasowa
// zapisujaca zdarzenia do localStorage, gdy nie skonfigurowano punktu
// zbiorczego. Nigdy nie dzialala na produkcji, ale jej samo istnienie
// sprawialo, ze zdanie "nic nie zapisujemy" bylo prawdziwe warunkowo,
// a nie z konstrukcji. Zostala usunieta.
// ============================================================

const _chatBase = import.meta.env.VITE_CHAT_API_URL?.replace(/\/$/, '');
const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL
  || (_chatBase ? `${_chatBase}/api/events` : null);
const FLUSH_INTERVAL = 30_000;  // flush every 30s
const MAX_QUEUE = 200;

let queue = [];
let sessionId = null;

function getSessionId() {
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  return sessionId;
}

/**
 * Track a custom event.
 * @param {string} category - Event category (e.g. "calculator", "navigation", "inquiry")
 * @param {string} action   - What happened (e.g. "select_metal", "change_lang", "send_inquiry")
 * @param {string} [label]  - Additional context (e.g. "gold_18k", "pl→en", "Fiber Laser")
 * @param {number} [value]  - Optional numeric value
 */
export function trackEvent(category, action, label = "", value = null) {
  const event = {
    c: category,
    a: action,
    l: label,
    v: value,
    t: Date.now(),
    s: getSessionId(),
    p: typeof window !== "undefined" ? window.location.pathname : "/",
  };

  queue.push(event);

  // Trim queue if too large
  if (queue.length > MAX_QUEUE) {
    queue = queue.slice(-MAX_QUEUE);
  }
}

/**
 * Track a page view (called on route change).
 */
export function trackPageView(path, referrer = "") {
  trackEvent("page", "view", path);
}

/**
 * Track calculator interaction.
 */
export function trackCalc(calculator, param, value) {
  trackEvent("calc", `${calculator}:${param}`, String(value));
}

/**
 * Track inquiry form submission.
 */
export function trackInquiry(calculator, params) {
  trackEvent("inquiry", "send", `${calculator}|${params}`);
}

/**
 * Track language change.
 */
export function trackLangChange(from, to) {
  trackEvent("nav", "lang_change", `${from}→${to}`);
}

/**
 * Track CTA button click (hero buttons, contact links, etc.)
 * @param {string} label  - Human-readable label (e.g. "hero_jewelry_cta", "navbar_contact")
 * @param {string} [href] - Destination path (optional)
 */
export function trackCTA(label, href = "") {
  trackEvent("cta", "click", label, null);
  if (href) trackEvent("cta", "destination", href);
}

/**
 * Track funnel step progression.
 * @param {string} funnel - Funnel name (e.g. "jewelry_quote", "studio_quote")
 * @param {string} step   - Step name (e.g. "open_calculator", "set_metal", "submit_inquiry")
 */
export function trackFunnel(funnel, step) {
  trackEvent("funnel", step, funnel);
}

/**
 * Initialize scroll-depth tracking for the current page.
 * Fires once per milestone (25 / 50 / 75 / 90 %) per page navigation.
 * Call on every route change - it replaces the previous listener.
 */
let _scrollCleanup = null;
export function initScrollTracking() {
  if (typeof window === "undefined") return;

  // Remove previous listener if called again on route change
  if (_scrollCleanup) {
    _scrollCleanup();
    _scrollCleanup = null;
  }

  const milestones = [25, 50, 75, 90];
  const fired = new Set();

  function onScroll() {
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    if (total <= window.innerHeight) return;
    const pct = Math.floor((scrolled / total) * 100);
    for (const m of milestones) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        trackEvent("scroll", "depth", window.location.pathname, m);
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  _scrollCleanup = () => window.removeEventListener("scroll", onScroll);
}

// --- Flushing ---

function flush() {
  if (queue.length === 0) return;

  const batch = [...queue];
  queue = [];

  if (ENDPOINT) {
    // Send to CF Worker - use text/plain Blob to avoid CORS preflight
    // (application/json triggers OPTIONS preflight which complicates credentials)
    const payload = JSON.stringify({ events: batch });
    const blob = new Blob([payload], { type: "text/plain" });
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (!ok) {
        fetch(ENDPOINT, { method: "POST", body: payload, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(() => {});
      }
    } else {
      fetch(ENDPOINT, { method: "POST", body: payload, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(() => {});
    }
  }
  // Bez skonfigurowanego punktu zbiorczego zdarzenia po prostu przepadaja.
  // Statystyka nie jest warta zapisu w cudzym urzadzeniu.
}

// Browser-only initialization
if (typeof window !== "undefined") {
  setInterval(flush, FLUSH_INTERVAL);

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);

  // Podglad tego, co czeka w pamieci, do zajrzenia w konsoli przy diagnozie.
  window.getAnalyticsEvents = () => [...queue];

  window.exportAnalyticsCSV = () => {
    const events = [...queue];
    const csv = "timestamp,session,page,category,action,label,value\n" +
      events.map(e => `${new Date(e.t).toISOString()},${e.s},${e.p},${e.c},${e.a},${e.l},${e.v ?? ""}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aejaca-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
}
