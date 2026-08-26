// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/currency.js
// Regeneracja: npm run sync:pricing

// ============================================================
// WALUTA: PLN -> EUR
// ============================================================
// Cena zrodlowa jest w groszach PLN. Sprzedaz w euro obciazamy narzutem,
// bo miedzy zamrozeniem kwoty a ksiegowaniem przelewu mija kilka dni, a
// kurs w tym czasie chodzi. Narzut pokrywa te roznice oraz koszt przewalutowania
// po naszej stronie; bez niego kazdy ruch kursu w gore zjadalby marze.
//
// Ta sama stala musi obowiazywac na stronie i w backendzie, inaczej klient
// zobaczylby inna kwote niz ta, ktora zamrozimy w bazie. Dlatego plik lezy
// w rdzeniu cenowym i jest kopiowany do chat-api przez sync-pricing.

export const EUR_FX_MARGIN = 1.08;
export const FALLBACK_PLN_PER_EUR = 4.25;

/**
 * Zamienia grosze PLN na eurocenty. Zaokraglamy w gore do pelnego centa,
 * zeby zamowienie nigdy nie bylo niedoplacone o czesc centa.
 */
export function eurCentsFromGrosze(grosze, plnPerEur) {
  const rate = Number(plnPerEur) || FALLBACK_PLN_PER_EUR;
  return Math.ceil(((grosze || 0) / rate) * EUR_FX_MARGIN);
}

/** Waluty, ktore obslugujemy. Zrodlem ceny zostaje PLN, EUR jest przeliczeniem. */
export const CURRENCIES = ["PLN", "EUR"];

/**
 * Waluta, ktora obowiazuje przy danym jezyku.
 *
 * To jest DOMYSLNA waluta, a nie przypisana na stale: Polak czytajacy po
 * angielsku moze chciec zaplacic w zlotowkach, a Niemiec czytajacy po polsku
 * w euro. Wybor klienta ma pierwszenstwo przed ta tabelka, bo waluta zaplaty
 * wynika z tego, gdzie klient ma konto, a nie z tego, w jakim jezyku czyta.
 */
export const CURRENCY_BY_LANG = { pl: "PLN", en: "EUR", de: "EUR" };

export function defaultCurrency(lang) {
  return CURRENCY_BY_LANG[lang] || "EUR";
}

export function normalizeCurrency(waluta, lang = "pl") {
  const w = String(waluta || "").toUpperCase();
  return CURRENCIES.includes(w) ? w : defaultCurrency(lang);
}

/**
 * Jak placi sie w danej walucie.
 *
 * Bramka rozlicza WYLACZNIE zlotowki: BLIK i pay-by-link sa polskie, a nasza
 * umowa z operatorem nie obejmuje euro. Zaplata w euro idzie wiec przelewem
 * na rachunek walutowy, z recznym ksiegowaniem po naszej stronie. To nie jest
 * wybor wygody, tylko jedyna droga, ktora naprawde mamy.
 */
export function paymentMethodForCurrency(waluta) {
  return String(waluta).toUpperCase() === "EUR" ? "bank_transfer" : "autopay";
}
