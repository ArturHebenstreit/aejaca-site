// ============================================================
// SKAD PRZYSZLA WIZYTA
// ============================================================
// Przegladarka podaje dwie rzeczy: adres strony, z ktorej klikneto (referrer),
// i parametry kampanii w adresie (utm_*). Zadna z nich nie jest odpowiedzia na
// pytanie wlasciciela, ktore brzmi "czy warto dalej pisac na Instagramie".
// Odpowiedzia jest KANAL, czyli garstka nazw, ktore da sie policzyc i porownac
// miedzy miesiacami.
//
// Klasyfikacja stoi po stronie serwera, nie w przegladarce, z jednego powodu:
// listy adresow trzeba poprawiac (dochodzi nowy serwis, zmienia sie domena
// przekierowania), a poprawka na serwerze wchodzi z jednym wdrozeniem, podczas
// gdy poprawka w przegladarce dziala dopiero u tych, ktorzy pobiora nowy
// serwis. Zapisujemy JEDNO I DRUGIE: kanal do liczenia i surowe zrodlo do
// zajrzenia, gdy liczba wyglada dziwnie.

/** Wyszukiwarki. Ruch stad jest darmowy i mowi, ze tresc dziala. */
const WYSZUKIWARKI = [
  "google.", "bing.", "duckduckgo.", "search.yahoo.", "ecosia.", "yandex.",
  "seznam.", "search.brave.", "startpage.", "qwant.", "baidu.",
];

/** Serwisy spolecznosciowe razem z ich domenami przekierowan (t.co, lm.facebook). */
const SPOLECZNOSCIOWE = [
  "facebook.", "fb.", "lm.facebook.", "l.facebook.", "instagram.", "l.instagram.",
  "t.co", "twitter.", "x.com", "linkedin.", "lnkd.in", "pinterest.", "pin.it",
  "tiktok.", "youtube.", "youtu.be", "reddit.", "threads.", "mastodon.",
];

/** Skrzynki pocztowe: klikniecie w odnosnik w mailu, nie w kampanii. */
const POCZTA = [
  "mail.google.", "outlook.", "mail.yahoo.", "poczta.", "wp.pl", "o2.pl",
  "interia.", "onet.", "mail.proton", "roundcube.",
];

/** Sztuczna inteligencja jako zrodlo ruchu. Osobno, bo to nowy kanal i rosnie. */
const ASYSTENCI = [
  "chatgpt.", "chat.openai.", "perplexity.", "claude.ai", "copilot.microsoft.",
  "gemini.google.", "you.com", "phind.",
];

/** Nasze wlasne adresy. Przejscie miedzy stronami nie jest zrodlem ruchu. */
const NASZE = ["aejaca.com", "www.aejaca.com"];

function pasuje(host, lista) {
  return lista.some((w) => host === w || host.startsWith(w) || host.endsWith(`.${w.replace(/\.$/, "")}`));
}

/**
 * Nazwa kanalu z parametru `utm_medium`. Kampanie opisuje sie roznie
 * ("cpc", "ppc", "paid_social", "e-mail"), a liczyc chcemy w jednej nazwie.
 */
function kanalZMedium(medium) {
  const m = String(medium || "").toLowerCase();
  if (!m) return null;
  if (/cpc|ppc|paid|ads?$/.test(m)) return "platne";
  if (/e?-?mail|newsletter/.test(m)) return "poczta";
  if (/social/.test(m)) return "spolecznosciowe";
  if (/organic|search/.test(m)) return "wyszukiwarki";
  if (/referral|link/.test(m)) return "polecenia";
  if (/qr|print|offline|wizytow/.test(m)) return "poza siecia";
  return "kampania";
}

/**
 * Kanal i zrodlo wizyty.
 *
 * @param {string} referrer  gospodarz i sciezka strony, z ktorej przyszli
 * @param {object} utm       { source, medium, campaign }
 * @returns {{kanal: string, zrodlo: string}}
 */
export function zrodloWizyty(referrer, utm = {}) {
  const utmSource = String(utm.source || "").toLowerCase().slice(0, 100);
  const utmMedium = String(utm.medium || "").toLowerCase().slice(0, 100);

  // Kampania oznaczona przez nas samych wygrywa z referrerem. To jedyna
  // informacja, ktora ktos wpisal SWIADOMIE, wiec jest dokladniejsza niz
  // zgadywanie po domenie.
  if (utmSource || utmMedium) {
    return {
      kanal: kanalZMedium(utmMedium) || "kampania",
      zrodlo: utmSource || utmMedium,
    };
  }

  const host = String(referrer || "").toLowerCase().split("/")[0].replace(/^www\./, "");
  if (!host) return { kanal: "wprost", zrodlo: "(wprost)" };
  if (pasuje(host, NASZE)) return { kanal: "wewnetrzne", zrodlo: host };
  if (pasuje(host, WYSZUKIWARKI)) return { kanal: "wyszukiwarki", zrodlo: host };
  if (pasuje(host, SPOLECZNOSCIOWE)) return { kanal: "spolecznosciowe", zrodlo: host };
  if (pasuje(host, POCZTA)) return { kanal: "poczta", zrodlo: host };
  if (pasuje(host, ASYSTENCI)) return { kanal: "asystenci AI", zrodlo: host };
  return { kanal: "polecenia", zrodlo: host };
}

/**
 * Jezyk z adresu strony. Polski nie ma prefiksu (ADR-0023), wiec brak prefiksu
 * to polski, a nie "nieznany".
 */
export function jezykZeSciezki(sciezka) {
  const m = /^\/(en|de)(\/|$)/.exec(String(sciezka || ""));
  return m ? m[1] : "pl";
}

/**
 * Czy to ruch maszyny. Prawdziwe roboty wyszukiwarek nie wykonuja JavaScriptu
 * i do licznika nie docieraja w ogole, ale narzedzia do sprawdzania stron,
 * monitoringi i przegladarki sterowane skryptem juz tak, a licza sie wtedy jak
 * odwiedzajacy. Przy naszym ruchu jedno takie narzedzie potrafi podwoic dzien.
 */
const ROBOTY = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|pingdom|uptime|gtmetrix|pagespeed|curl|wget|python-requests|axios|scrapy|semrush|ahrefs|dataprovider|screaming/i;

export function toRobot(userAgent) {
  return ROBOTY.test(String(userAgent || ""));
}
