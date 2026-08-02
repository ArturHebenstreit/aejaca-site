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

const LOCALES = { pl: "pl-PL", en: "en-IE", de: "de-DE" };
export const FALLBACK_PLN_PER_EUR = 4.25;

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
  const rate = plnPerEur || FALLBACK_PLN_PER_EUR;
  return fmt(Math.round((grosze || 0) / rate) / 100, "EUR", lang);
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

// Zdanie przy platnosci: cena jest w euro, obciazenie w zlotowkach.
export const CHARGED_IN_PLN = {
  pl: null,
  en: "Prices are shown in EUR, converted at the National Bank of Poland rate. Your card or bank is charged in PLN.",
  de: "Preise in EUR, umgerechnet zum Kurs der polnischen Nationalbank. Belastet wird Ihre Karte bzw. Bank in PLN.",
};
