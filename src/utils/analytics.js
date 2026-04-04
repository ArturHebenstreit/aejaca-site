// ============================================================
// AEJaCA ANALYTICS — lightweight event tracking
// ============================================================
// Uses Cloudflare Web Analytics custom events via sendBeacon.
// No cookies, no PII, GDPR-compliant.
// Events are sent to a CF Workers endpoint for aggregation.
//
// If no CF Worker endpoint is configured, events are stored
// in localStorage for later export / debugging.
// ============================================================

const ENDPOINT = window.__AEJACA_ANALYTICS_URL || null;
const QUEUE_KEY = "aejaca_events";
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
    p: window.location.pathname,
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

// --- Flushing ---

function flush() {
  if (queue.length === 0) return;

  const batch = [...queue];
  queue = [];

  if (ENDPOINT) {
    // Send to CF Worker
    const payload = JSON.stringify({ events: batch });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, payload);
    } else {
      fetch(ENDPOINT, { method: "POST", body: payload, keepalive: true }).catch(() => {});
    }
  } else {
    // Store locally for debugging / manual export
    try {
      const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      const merged = [...stored, ...batch].slice(-500);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(merged));
    } catch {
      // localStorage full or unavailable — silently skip
    }
  }
}

// Flush periodically
setInterval(flush, FLUSH_INTERVAL);

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}

/**
 * Debug: get all stored events from localStorage.
 * Call in browser console: getAnalyticsEvents()
 */
window.getAnalyticsEvents = () => {
  flush();
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
};

/**
 * Debug: export events as CSV.
 * Call in browser console: exportAnalyticsCSV()
 */
window.exportAnalyticsCSV = () => {
  const events = window.getAnalyticsEvents();
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
