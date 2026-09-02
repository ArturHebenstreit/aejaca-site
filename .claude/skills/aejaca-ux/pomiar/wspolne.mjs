// ============================================================
// WSPOLNE NARZEDZIA POMIARU UX
// ============================================================
// Trzy skrypty w tym katalogu (mapa, dostepnosc, bledy) jada na tej samej
// przegladarce, tym samym parserze argumentow i tej samej liscie slow, ktorych
// nie wolno kliknac. Bez wspolnego modulu kazdy z nich mialby wlasna wersje
// tych trzech rzeczy i rozjechalyby sie po pierwszej poprawce.
//
// Przegladarka: Chromium z `node_modules/playwright`, plik wykonywalny
// z `PW_EXECUTABLE_PATH` albo z domyslnej sciezki srodowiska zdalnego.
// Nigdy `npx playwright install`: instrukcja srodowiska zabrania pobierania
// przegladarek, a lokalnie Playwright znajdzie swoja sam.
//
// Obce hosty (fonty Google, opinie, analityka) sa odcinane, tak samo jak
// w `scripts/audit-pages.mjs`: w srodowisku zdalnym nie odpowiadaja i kazde
// zadanie wisi kilkanascie sekund, a na to, co mierzymy, nie wplywaja.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { JEZYKI, JEZYK_DOMYSLNY } from "../../../../src/routes.js";

/**
 * Jezyk przegladarki idzie za jezykiem strony. Serwis pokazuje pasek "Ta
 * strona jest tez po polsku", gdy `navigator.languages` nie zgadza sie
 * z jezykiem adresu (`JezykPodpowiedz.jsx`). Pierwszy przebieg pomiaru jechal
 * na jednym `pl-PL` dla wszystkiego, wiec kazda strona `/en/` i `/de/` miala
 * na zrzucie polski pasek, a axe zglaszal go szesc razy jako tresc poza
 * landmarkiem. To nie byl blad serwisu, tylko pomiaru.
 */
export const LOCALE = { pl: "pl-PL", en: "en-US", de: "de-DE" };

export function jezykAdresu(adres) {
  try {
    const m = new URL(adres).pathname.match(/^\/([a-z]{2})\//);
    if (m && JEZYKI.includes(m[1])) return m[1];
  } catch {}
  return JEZYK_DOMYSLNY;
}

export const PLIK_PRZEGLADARKI =
  process.env.PW_EXECUTABLE_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Dwie szerokosci, w ktorych ogladamy kazda strone. Telefon pierwszy, bo tam sie chowa wiecej. */
export const EKRANY = {
  telefon: { width: 390, height: 844 },
  monitor: { width: 1280, height: 800 },
};

/**
 * Slowa, po ktorych poznajemy przycisk, ktorego pomiar NIE klika. Lista z
 * oryginalnego `site-audit` (angielski) plus polski i niemiecki, bo dwie
 * trzecie serwisu mowi w tych jezykach i angielska lista przepuscilaby
 * "Zamow" albo "Kaufen". Playwright bez tej listy chetnie zlozylby zamowienie.
 */
export const SLOWA_ZABRONIONE = [
  // en
  "buy", "purchase", "pay", "checkout", "order", "subscribe", "sign up", "register",
  "create account", "log in", "login", "sign in", "delete", "remove", "cancel subscription",
  "confirm", "send", "submit", "apply", "book", "reserve", "add to cart", "add to basket", "donate",
  // pl
  "kup", "zaplac", "zapłać", "zamow", "zamów", "zamawiam", "do kasy", "wyslij", "wyślij",
  "usun", "usuń", "potwierd", "zarejestruj", "zaloguj", "zapisz", "do koszyka", "dodaj", "rezerwuj",
  // de
  "kaufen", "bezahlen", "bestellen", "zur kasse", "senden", "absenden", "abschicken",
  "loschen", "löschen", "entfernen", "bestatigen", "bestätigen", "registrieren", "anmelden",
  "einloggen", "in den warenkorb", "hinzufugen", "hinzufügen", "reservieren",
];

export function czyBezpiecznyKlik(tekst) {
  const t = String(tekst || "").toLowerCase().trim();
  if (!t) return false;
  return !SLOWA_ZABRONIONE.some((slowo) => t.includes(slowo));
}

/** `--klucz=wartosc` i `--flaga`. Nic wiecej nie jest potrzebne. */
export function parsujArgumenty(argv = process.argv.slice(2), domyslne = {}) {
  const out = { ...domyslne };
  for (const a of argv) {
    const m = a.match(/^--([a-z-]+)(?:=(.*))?$/i);
    if (!m) continue;
    out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

export function zapiszJson(sciezka, dane) {
  mkdirSync(dirname(sciezka), { recursive: true });
  writeFileSync(sciezka, JSON.stringify(dane, null, 2) + "\n");
}

/** Bez fragmentu, bez `index.html`, z koncowym ukosnikiem tam, gdzie serwis go uzywa. */
export function normalizujAdres(adres, baza) {
  let u;
  try { u = new URL(adres, baza); } catch { return null; }
  u.hash = "";
  if (u.pathname.endsWith("/index.html")) u.pathname = u.pathname.slice(0, -"index.html".length);
  if (!/\.[a-z0-9]{1,5}$/i.test(u.pathname) && !u.pathname.endsWith("/")) u.pathname += "/";
  return u.toString();
}

export function tenSamHost(adres, host) {
  try { return new URL(adres).host === host; } catch { return false; }
}

export async function uruchomPrzegladarke() {
  return chromium.launch({ headless: true, executablePath: PLIK_PRZEGLADARKI });
}

/**
 * Kontekst z odcietymi obcymi hostami. `motyw` ustawia `data-theme` przed
 * pierwszym skryptem strony, bo `ThemeContext` czyta zapisany wybor
 * z `localStorage` i dopiero wtedy pisze atrybut; bez tego pomiar w ciemnym
 * motywie musialby czekac na hydracje.
 */
export async function nowyKontekst(przegladarka, { host, ekran = EKRANY.monitor, motyw = null, dotyk = false, lang = JEZYK_DOMYSLNY } = {}) {
  // `dotyk` daje kontekst z ekranem dotykowym i bez najechania: tylko tak da
  // sie sprawdzic, czy menu odslaniane po najechaniu ma wersje na telefon.
  // `lang` ustawia jezyk przegladarki pod jezyk strony (patrz LOCALE wyzej).
  const ctx = await przegladarka.newContext({
    viewport: ekran, locale: LOCALE[lang] || LOCALE[JEZYK_DOMYSLNY], hasTouch: dotyk, isMobile: dotyk,
  });
  await ctx.route("**/*", (route) => {
    const u = route.request().url();
    if (u.startsWith("data:") || u.startsWith("blob:")) return route.continue();
    return tenSamHost(u, host) ? route.continue() : route.abort();
  });
  if (motyw) {
    await ctx.addInitScript((m) => {
      try { localStorage.setItem("aejaca-theme", m); } catch {}
      document.documentElement.setAttribute("data-theme", m);
    }, motyw);
  }
  return ctx;
}

/**
 * Kod uruchamiany W STRONIE: jednoznaczny selektor CSS elementu. Najpierw id,
 * potem data-testid, potem sciezka po `nth-of-type`. Selektor zapisany w mapie
 * musi trafiac w ten sam element w kolejnym skrypcie, inaczej "martwy klik"
 * bylby wina selektora, a nie strony.
 */
export const KOD_SELEKTORA = `(el) => {
  const esc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s);
  if (el.id) return "#" + esc(el.id);
  const tid = el.getAttribute("data-testid");
  if (tid) return "[data-testid=\\"" + tid + "\\"]";
  const parts = [];
  let n = el;
  while (n && n.nodeType === 1 && n !== document.body) {
    let s = n.tagName.toLowerCase();
    if (n.id) { parts.unshift("#" + esc(n.id)); break; }
    const rodzenstwo = Array.from(n.parentNode ? n.parentNode.children : []).filter((c) => c.tagName === n.tagName);
    if (rodzenstwo.length > 1) s += ":nth-of-type(" + (rodzenstwo.indexOf(n) + 1) + ")";
    parts.unshift(s);
    n = n.parentNode;
  }
  return parts.join(" > ");
}`;

/** Nazwa dostepna elementu, tak jak zobaczy ja czytnik ekranu. Kod uruchamiany W STRONIE. */
export const KOD_NAZWY = `(el) => {
  const a = el.getAttribute("aria-label");
  if (a) return a.trim();
  const lb = el.getAttribute("aria-labelledby");
  if (lb) { const t = document.getElementById(lb); if (t) return (t.textContent || "").trim(); }
  const img = el.querySelector("img[alt]");
  const txt = (el.textContent || "").replace(/\\s+/g, " ").trim();
  return txt || (img ? img.getAttribute("alt") : "") || el.getAttribute("title") || "";
}`;
