// ============================================================
// KWOTY W SKLEPIE
// ============================================================
// Cena zrodlowa zawsze jest w groszach PLN, bo w tej walucie rozliczamy
// platnosc i taka kwota trafia do bazy. Euro jest wylacznie warstwa
// wyswietlania dla en/de, przeliczana po kursie NBP z /api/market-rates.
// Dzieki temu zmiana kursu miedzy dodaniem do koszyka a zaplata nie ma
// wplywu na to, ile klient realnie placi.

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useMarketRates } from "../hooks/useMarketRates.js";
import { eurCentsFromGrosze, FALLBACK_PLN_PER_EUR } from "../pricing/currency.js";

const LOCALES = { pl: "pl-PL", en: "en-IE", de: "de-DE" };
export { FALLBACK_PLN_PER_EUR };

function fmt(amount, currency, lang) {
  const locale = LOCALES[lang] || LOCALES.en;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatPln(grosze, lang = "pl") {
  return fmt((grosze || 0) / 100, "PLN", lang);
}

export function formatEur(grosze, plnPerEur, lang = "en") {
  return fmt(eurCentsFromGrosze(grosze, plnPerEur) / 100, "EUR", lang);
}

export function eurCents(grosze, plnPerEur) {
  return eurCentsFromGrosze(grosze, plnPerEur);
}

/**
 * Zwraca pare funkcji: kwota glowna w walucie jezyka oraz kwota pomocnicza
 * w tej drugiej. `showEur` przydaje sie tam, gdzie trzeba dopisac zdanie
 * o obciazeniu w zlotowkach.
 */
export function useMoney() {
  const { lang } = useLanguage();
  const { rates } = useMarketRates();
  const showEur = lang === "en" || lang === "de";
  const rate = rates.pln_per_eur || FALLBACK_PLN_PER_EUR;

  return {
    showEur,
    rate,
    lang,
    money: (grosze) => (showEur ? formatEur(grosze, rate, lang) : formatPln(grosze, lang)),
    alt: (grosze) => (showEur ? formatPln(grosze, lang) : formatEur(grosze, rate, lang)),
  };
}

// Zdanie o cenie w euro. Swiadomie nie obiecuje "zadnych doplat": przy
// wysylce poza Unie clo pobiera kurier przy doreczeniu i jest to poza nasza
// cena. Tresc o cle stoi w kasie, przy wyborze kraju.
export const EUR_PRICE_NOTE = {
  pl: null,
  en: "Prices in EUR are final for the goods and shipping. Customs duty outside the EU is collected by the courier on delivery.",
  de: "Die Preise in EUR sind Endpreise für Ware und Versand. Zoll außerhalb der EU zieht der Kurier bei der Zustellung ein.",
};
