// ============================================================
// AEJaCA: LICZNIK ODWIEDZIN BEZ ZAPISU W URZADZENIU
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
// dwoch wizyt tej samej osoby. Konsekwencja jest swiadoma: NIE MIERZYMY
// POWRACAJACYCH i nie sklejamy sciezki przez kilka dni. Zeby to zmienic,
// trzeba banera zgody, a nie sprytniejszego kodu.
//
// Od 2026-08-31 kazde zdarzenie niesie takze POCHODZENIE WIZYTY: skad
// przyszla (referrer) i z jakiej kampanii (utm_*). Bez tego pytanie "skad
// biora sie odwiedzajacy" nie mialo w danych zadnej odpowiedzi, a jest to
// pierwsze pytanie, ktore ktokolwiek zadaje statystyce. Pochodzenie ustala
// sie RAZ, przy wejsciu, i jedzie z kazdym zdarzeniem, zeby zapytanie
// w panelu nie musialo szukac pierwszego wiersza sesji.
// ============================================================

const _chatBase = import.meta.env.VITE_CHAT_API_URL?.replace(/\/$/, '');
const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL
  || (_chatBase ? `${_chatBase}/api/events` : null);
const FLUSH_INTERVAL = 30_000;  // co 30 sekund
const MAX_QUEUE = 200;

let queue = [];
let sessionId = null;

// --- Wlasny ruch wlasciciela ---------------------------------------------
// Wlasciciel oglada swoj serwis z trzech urzadzen, z domu, z pracy i z telefonu,
// a adres IP ma zmienny, wiec wykluczenie po adresie nie ma czego zlapac.
// Przegladarka nie zdradza zadnego identyfikatora urzadzenia (podaje system
// i przegladarke, wspolne dla milionow ludzi) i tak ma byc.
//
// Zostaje wiec znacznik, ktory wlasciciel ustawia sobie SAM: wejscie na adres
// z `?nolicz=1` zapisuje jeden klucz w tej przegladarce, `?nolicz=0` go kasuje.
// To jedyna rzecz, ktora ten plik zapisuje w urzadzeniu, i jest wyjatkiem
// uzasadnionym: zapisuje ja swiadomie sam zainteresowany, sluzy WYLACZNIE
// wylaczeniu zliczania i nie niesie zadnej informacji o czlowieku.
//
// Zdarzenia z oznaczonego urzadzenia nadal LECA na serwer, tylko z flaga
// "wewnetrzne". Kokpit ich domyslnie nie liczy, ale da sie je pokazac jednym
// przelacznikiem. Wyrzucanie ich juz w przegladarce byloby wygodniejsze
// i gorsze: brak wpisow wyglada dokladnie tak samo jak zepsuty licznik.
const KLUCZ_WEWNETRZNY = "aejaca_nolicz";
let ruchWewnetrzny = false;

function ustalZnacznik() {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(window.location.search).get("nolicz");
    if (q === "1") localStorage.setItem(KLUCZ_WEWNETRZNY, "1");
    else if (q === "0") localStorage.removeItem(KLUCZ_WEWNETRZNY);
    ruchWewnetrzny = localStorage.getItem(KLUCZ_WEWNETRZNY) === "1";
  } catch {
    // Tryb prywatny potrafi zablokowac pamiec przegladarki. Bez znacznika
    // wizyta liczy sie normalnie, co jest lepsze niz wywrocenie licznika.
    ruchWewnetrzny = false;
  }
}

function getSessionId() {
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  return sessionId;
}

// --- Pochodzenie wizyty ---------------------------------------------------

/**
 * Skad przyszla ta wizyta. Liczone raz, przy pierwszym zdarzeniu.
 *
 * Referrer obcinamy do gospodarza i sciezki: pelny adres cudzej strony bywa
 * dluzszy niz sama informacja i potrafi niesc parametry, ktorych nie chcemy
 * u siebie trzymac. Wejscie z naszej wlasnej domeny to nie jest zrodlo ruchu,
 * tylko przejscie miedzy stronami, wiec je pomijamy.
 *
 * Klasyfikacje na kanaly (wyszukiwarka, spolecznosciowe, poczta, polecenie)
 * robi serwer, bo tam da sie ja poprawic bez wdrazania serwisu od nowa.
 */
let pochodzenie = null;
function skadPrzyszli() {
  if (pochodzenie) return pochodzenie;
  if (typeof window === "undefined") return {};

  let ref = "";
  try {
    const r = document.referrer || "";
    if (r) {
      const u = new URL(r);
      if (u.hostname !== window.location.hostname) {
        ref = (u.hostname + u.pathname).slice(0, 200);
      }
    }
  } catch {
    // Referrer bywa pusty albo niepoprawny. Brak zrodla to tez informacja.
  }

  const q = new URLSearchParams(window.location.search);
  const utm = (nazwa) => (q.get(nazwa) || "").slice(0, 100) || undefined;

  pochodzenie = {
    r: ref || undefined,
    us: utm("utm_source"),
    um: utm("utm_medium"),
    uc: utm("utm_campaign"),
  };
  return pochodzenie;
}

/**
 * Identyfikator biezacej wizyty, do dolaczenia przy skladaniu zamowienia
 * albo zapytania. Dzieki niemu widac, z ktorej strony wejscia i z jakiego
 * zrodla wzial sie PRZYCHOD, a nie samo zainteresowanie. Identyfikator jest
 * losowy, zyje tylko w pamieci karty i nie laczy dwoch wizyt.
 */
export function idSesji() {
  return getSessionId();
}

/**
 * Zapisuje zdarzenie do kolejki.
 * @param {string} category - Kategoria (np. "page", "calc", "shop", "inquiry")
 * @param {string} action   - Co sie stalo (np. "view", "add_to_cart")
 * @param {string} [label]  - Szczegol (np. "gold_18k", "pierscionek-granat")
 * @param {number} [value]  - Liczba, jesli zdarzenie ja niesie
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
    ...skadPrzyszli(),
    ...(ruchWewnetrzny ? { w: 1 } : {}),
  };

  queue.push(event);
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
}

// --- Odslony i czas na stronie -------------------------------------------

/**
 * Czas spedzony na stronie, liczony TYLKO wtedy, gdy karta jest widoczna.
 *
 * Bez tego zastrzezenia karta otwarta w tle przez godzine wygladalaby jak
 * najbardziej wciagajaca strona w serwisie. Wynik idzie osobnym zdarzeniem
 * przy wyjsciu ze strony, bo dopiero wtedy jest znany.
 */
let biezaca = null;

function zamknijPomiar() {
  if (!biezaca) return;
  const teraz = Date.now();
  if (biezaca.odKiedyWidoczna) biezaca.widoczneMs += teraz - biezaca.odKiedyWidoczna;
  const sekundy = Math.round(biezaca.widoczneMs / 1000);
  // Zdarzenie o zerowej dlugosci nie niesie nic poza szumem.
  if (sekundy > 0) {
    queue.push({
      c: "page", a: "engaged", l: biezaca.path, v: Math.min(sekundy, 3600),
      t: teraz, s: getSessionId(), p: biezaca.path, ...skadPrzyszli(),
      ...(ruchWewnetrzny ? { w: 1 } : {}),
    });
  }
  biezaca = null;
}

/** Odslona strony. Wolane przy kazdej zmianie trasy. */
export function trackPageView(path, referrer = "") {
  ustalZnacznik();
  zamknijPomiar();
  trackEvent("page", "view", path);
  if (typeof window !== "undefined") {
    biezaca = {
      path,
      widoczneMs: 0,
      odKiedyWidoczna: document.visibilityState === "visible" ? Date.now() : null,
    };
  }
}

/** Interakcja z kalkulatorem. */
export function trackCalc(calculator, param, value) {
  trackEvent("calc", `${calculator}:${param}`, String(value));
}

/** Wyslane zapytanie o wycene. */
export function trackInquiry(calculator, params) {
  trackEvent("inquiry", "send", `${calculator}|${params}`);
}

/** Zmiana jezyka. */
export function trackLangChange(from, to) {
  trackEvent("nav", "lang_change", `${from}→${to}`);
}

/**
 * Klikniecie w wezwanie do dzialania.
 * @param {string} label  - Nazwa czytelna dla czlowieka (np. "hero_jewelry_cta")
 * @param {string} [href] - Dokad prowadzi
 */
export function trackCTA(label, href = "") {
  trackEvent("cta", "click", label, null);
  if (href) trackEvent("cta", "destination", href);
}

/** Krok lejka. */
export function trackFunnel(funnel, step) {
  trackEvent("funnel", step, funnel);
}

// --- Sklep ----------------------------------------------------------------
// Sklep, koszyk i kasa nie wysylaly do 2026-08-31 zadnego zdarzenia, wiec
// statystyka konczyla sie na kalkulatorze i o sprzedazy nie mowila nic.
// Kwoty podajemy w ZLOTOWKACH (a nie w groszach), bo tak czyta je czlowiek
// w panelu, a kolumna `value` jest liczbowa i sredniej z groszy nikt nie
// przeczyta bez dzielenia w glowie.

/** Obejrzenie karty produktu albo usługi. `rodzaj` to "product" albo "service". */
export function trackProduct(rodzaj, identyfikator, cenaGrosze = null) {
  trackEvent("shop", `view_${rodzaj}`, String(identyfikator || ""),
    cenaGrosze == null ? null : Math.round(cenaGrosze) / 100);
}

/** Dodanie do koszyka albo usuniecie z niego. */
export function trackCart(akcja, tytul, wartoscGrosze = null) {
  trackEvent("shop", akcja, String(tytul || ""),
    wartoscGrosze == null ? null : Math.round(wartoscGrosze) / 100);
}

/** Wejscie do kasy i wybory w niej: dostawa, sposob zaplaty. */
export function trackCheckout(krok, szczegol = "", wartoscGrosze = null) {
  trackEvent("shop", krok, String(szczegol || ""),
    wartoscGrosze == null ? null : Math.round(wartoscGrosze) / 100);
}

/** Otwarcie oferty przyslanej mailem i klikniecie zaplaty na niej. */
export function trackOffer(akcja, szczegol = "") {
  trackEvent("offer", akcja, String(szczegol || ""));
}

/**
 * Uzycie darmowego narzedzia (przelicznik rozmiaru, parametry lasera i reszta).
 *
 * Odslona strony narzedzia mowi tylko, ze ktos ja otworzyl. Dopiero policzenie
 * czegos odroznia realne zainteresowanie od przypadkowego wejscia z wyszukiwarki,
 * a te strony sa naszym najwiekszym zrodlem ruchu z Google.
 */
export function trackTool(narzedzie, akcja = "use", szczegol = "") {
  trackEvent("tool", akcja, `${narzedzie}${szczegol ? `|${szczegol}` : ""}`);
}

/**
 * Uzycie narzedzia, liczone RAZ na wizyte na danej stronie narzedziowej.
 *
 * Dziewiec darmowych narzedzi (rozmiarowka, parametry lasera, kurczliwosc,
 * kreator pierscionka i reszta) jest naszym najwiekszym magnesem z wyszukiwarki,
 * a odslona ich strony mowi tylko tyle, ze ktos ja otworzyl. Roznica miedzy
 * "wszedl z Google i wyszedl" a "policzyl sobie rozmiar" jest cala roznica
 * miedzy ruchem a zainteresowaniem, i to ona decyduje, ktore narzedzie warto
 * rozwijac.
 *
 * Nasluch stoi w JEDNYM miejscu, na poziomie dokumentu, zamiast w kazdym
 * z jedenastu narzedzi osobno. Powod jest ten sam co przy koszyku: jedenascie
 * kopii licznika rozjezdza sie przy dwunastym narzedziu, a to, ze ktos ruszyl
 * suwakiem albo wpisal liczbe, wyglada tak samo w kazdym z nich.
 */
const ADRESY_NARZEDZI = /^\/(?:en\/|de\/)?(toolsjewelry|toolstudio)\//;
let _narzedzieCleanup = null;

export function initToolTracking(path) {
  if (typeof window === "undefined") return;
  if (_narzedzieCleanup) { _narzedzieCleanup(); _narzedzieCleanup = null; }
  if (!ADRESY_NARZEDZI.test(path || "")) return;

  const zdarzenia = ["pointerdown", "keydown", "input", "change"];
  const raz = (e) => {
    // Klikniecie w odnosnik albo w menu to opuszczenie strony, a nie uzycie
    // narzedzia. Liczymy dopiero ruch W SRODKU: pole, suwak, przycisk liczenia.
    if (e.type === "pointerdown" && e.target?.closest?.("a, nav, header, footer")) return;
    trackTool(path);
    sprzataj();
  };
  const sprzataj = () => {
    zdarzenia.forEach((n) => window.removeEventListener(n, raz, true));
    _narzedzieCleanup = null;
  };
  zdarzenia.forEach((n) => window.addEventListener(n, raz, true));
  _narzedzieCleanup = sprzataj;
}

/** Przewijanie strony. Fires once per milestone per page navigation. */
let _scrollCleanup = null;
export function initScrollTracking() {
  if (typeof window === "undefined") return;

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

// --- Wysylka --------------------------------------------------------------

function flush() {
  if (queue.length === 0) return;

  const batch = [...queue];
  queue = [];

  if (ENDPOINT) {
    // text/plain, zeby nie wywolywac zapytania wstepnego CORS.
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

if (typeof window !== "undefined") {
  ustalZnacznik();
  setInterval(flush, FLUSH_INTERVAL);

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Karta schowana: domykamy odliczanie czasu, ale strony nie konczymy,
      // bo czytajacy potrafi wrocic do tej samej karty za minute.
      if (biezaca?.odKiedyWidoczna) {
        biezaca.widoczneMs += Date.now() - biezaca.odKiedyWidoczna;
        biezaca.odKiedyWidoczna = null;
      }
      flush();
    } else if (biezaca && !biezaca.odKiedyWidoczna) {
      biezaca.odKiedyWidoczna = Date.now();
    }
  });

  window.addEventListener("pagehide", () => {
    zamknijPomiar();
    flush();
  });

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
