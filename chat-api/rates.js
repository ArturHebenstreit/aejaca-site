// ============================================================
// KURSY KRUSZCOW: kontrola swiezosci
// ============================================================
// Zapytanie o kursy bierze NAJNOWSZA niepusta wartosc, nie patrzac na jej
// wiek. To znaczy, ze gdy pobieranie pada od tygodni, kurs sprzed miesiaca
// wyglada dokladnie tak samo jak dzisiejszy, a wycena po cichu liczy ze
// starej ceny kruszcu. Nic nie rzuca bledu, nic nie wyglada na zepsute,
// a kwota jest nieprawdziwa.
//
// AEJaCA pracuje glownie w srebrze, wiec akurat ten kurs musi byc swiezy.
//
// Osobny plik, bo to jedyna czesc mechanizmu kursow, ktora da sie sprawdzic
// bez bazy i bez podnoszenia serwera.

/** Powyzej tylu godzin kurs uznajemy za przeterminowany i glosno o tym mowimy. */
export const RATE_STALE_AFTER_H = 48;

/** Pobranie przy starcie procesu ma sens dopiero, gdy odczyt jest starszy niz tyle. */
export const STARTUP_REFETCH_AFTER_H = 12;

/**
 * Kursy starsze niz prog, jako gotowe opisy do logu.
 *
 * @param {Record<string, number>} ages wiek kazdego kursu w godzinach
 * @param {number} [thresholdH]
 * @returns {string[]} puste, gdy wszystko swieze
 */
export function staleRates(ages, thresholdH = RATE_STALE_AFTER_H) {
  return Object.entries(ages || {})
    .filter(([, h]) => Number.isFinite(h) && h > thresholdH)
    .map(([field, h]) => `${field} sprzed ${Math.round(h)} h`);
}

/** Wiek w godzinach, odporny na brak wiersza i na nieparsowalna date. */
export function ageHours(fetchedAt, now = Date.now()) {
  if (!fetchedAt) return Infinity;
  const t = new Date(fetchedAt).getTime();
  return Number.isFinite(t) ? (now - t) / 3600000 : Infinity;
}
