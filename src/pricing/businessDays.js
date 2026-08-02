// ============================================================
// DNI ROBOCZE
// ============================================================
// Rezerwacja towaru przy platnosci przelewem wygasa po trzech dniach
// roboczych, a klient dostaje konkretna date. Liczenie samych dni kalendarzowych
// dawaloby daty wypadajace w sobote albo w swieto, czyli zdjecie rezerwacji
// w dniu, w ktorym i tak nie sprawdzamy konta.
//
// Swieta liczymy dla Polski, bo to nasze konto i nasz kalendarz decyduja,
// kiedy widzimy wplyw.

const FIXED_HOLIDAYS = [
  [1, 1],   // Nowy Rok
  [1, 6],   // Trzech Kroli
  [5, 1],   // Swieto Pracy
  [5, 3],   // Swieto Konstytucji
  [8, 15],  // Wniebowziecie
  [11, 1],  // Wszystkich Swietych
  [11, 11], // Niepodleglosc
  [12, 25],
  [12, 26],
];

/** Niedziela wielkanocna, algorytm Meeusa i Jonesa (kalendarz gregorianski). */
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function holidaySet(year) {
  const set = new Set(FIXED_HOLIDAYS.map(([m, d]) => `${year}-${m}-${d}`));
  const e = easter(year);
  // Poniedzialek wielkanocny, Zielone Swiatki i Boze Cialo licza sie od Wielkanocy.
  for (const offset of [1, 49, 60]) {
    const day = new Date(e.getTime() + offset * 86400_000);
    set.add(`${day.getUTCFullYear()}-${day.getUTCMonth() + 1}-${day.getUTCDate()}`);
  }
  return set;
}

export function isBusinessDay(date) {
  const d = new Date(date);
  const weekday = d.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  return !holidaySet(d.getUTCFullYear()).has(key);
}

/**
 * Data po `count` dniach roboczych od `from`. Dzien zlozenia zamowienia sie
 * nie liczy: klient, ktory zamawia o 23:50, ma pelne trzy dni na przelew.
 */
export function addBusinessDays(from, count) {
  const d = new Date(from);
  let left = count;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isBusinessDay(d)) left -= 1;
  }
  // Rezerwacja wygasa z koncem dnia, nie o godzinie zlozenia zamowienia.
  d.setUTCHours(23, 59, 59, 0);
  return d;
}

/** Ile dni roboczych trzymamy towar i kwote przy platnosci przelewem. */
export const TRANSFER_HOLD_BUSINESS_DAYS = 3;
