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
