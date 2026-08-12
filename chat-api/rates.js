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

// ============================================================
// HARMONOGRAM POBIERANIA
// ============================================================
// Metalpriceapi daje sto zapytan na miesiac. Dotychczasowy harmonogram zjadal
// osiemdziesiat dwa i do tego dokladal jedno przy kazdym deployu, wiec w
// miesiacu z czestymi wdrozeniami limit konczyl sie sam z siebie.
//
// Harmonogram trzymamy jako DANE, nie jako piec wywolan `cron.schedule`
// rozsypanych po pliku, bo tylko wtedy da sie policzyc jego koszt i pilnowac
// go testem. Dwa warunki, ktore musi spelniac naraz:
//
//   1. miesiecznie mniej niz `METAL_API_MONTHLY_LIMIT` z zapasem,
//   2. najdluzsza przerwa krotsza niz `RATE_STALE_AFTER_H`, inaczej sami
//      wywolalibysmy ostrzezenie o przeterminowanym kursie.
//
// Gieldy metali w weekend nie handluja, wiec sobota i niedziela nie wnosza
// nowej ceny. Wystarczy jedno pobranie w niedziele, zeby przerwa miedzy
// piatkowym zamknieciem a poniedzialkowym otwarciem nie przekroczyla progu.

export const METAL_API_MONTHLY_LIMIT = 100;
/** Nie zblizamy sie do limitu bardziej niz tyle, bo deploy tez czasem pobiera. */
export const METAL_API_SAFE_FRACTION = 0.75;

/** 0 = niedziela. Godziny w UTC. */
export const RATE_FETCH_SLOTS = [
  { days: [1, 2, 3, 4, 5], hourUTC: 8,  note: "otwarcie rynku, okolo 9 rano w Warszawie" },
  { days: [1, 2, 3, 4, 5], hourUTC: 16, note: "zamkniecie, okolo 17 w Warszawie" },
  { days: [0],             hourUTC: 10, note: "pomost przez weekend, gielda nie handluje" },
];

/** Wyrazenia cron gotowe dla `node-cron`, wprost z powyzszych slotow. */
export function fetchCronExpressions(slots = RATE_FETCH_SLOTS) {
  return slots.map((s) => `0 ${s.hourUTC} * * ${s.days.join(",")}`);
}

const DAYS_PER_MONTH_OF_WEEKDAY = 365 / 12 / 7;   // ile razy w miesiacu wypada dany dzien tygodnia

export function monthlyRequests(slots = RATE_FETCH_SLOTS) {
  return slots.reduce((sum, s) => sum + s.days.length * DAYS_PER_MONTH_OF_WEEKDAY, 0);
}

/** Najdluzsza przerwa miedzy pobraniami, w godzinach, liczona na okragly tydzien. */
export function longestGapH(slots = RATE_FETCH_SLOTS) {
  const hours = [];
  for (const s of slots) for (const d of s.days) hours.push(d * 24 + s.hourUTC);
  if (hours.length < 2) return Infinity;
  hours.sort((a, b) => a - b);
  let max = hours[0] + 168 - hours[hours.length - 1];      // przez granice tygodnia
  for (let i = 1; i < hours.length; i++) max = Math.max(max, hours[i] - hours[i - 1]);
  return max;
}
