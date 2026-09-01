// ============================================================
// JEDEN KSZTALT DATY DLA TERMINOW
// ============================================================
// Termin realizacji, waznosc oferty i data przelewu to ta sama rzecz z punktu
// widzenia klienta: dzien, do ktorego cos obowiazuje albo w ktorym cos sie
// stanie. Do 2 wrzesnia 2026 kazde z tych miejsc pisalo ja inaczej:
//
//   mail o etapie      22.09.2026
//   strona zamowienia  22.09.2026, ale data przelewu juz "1.09.2026"
//   strona oferty      2026-09-22
//   zapisana wycena    1.09.2026
//
// Klient dostaje dwie wiadomosci o jednej sprawie i widzi dwa zapisy jednej
// daty. Nie jest to blad, ktory cokolwiek psuje, i wlasnie dlatego zyl tak
// dlugo: kazde miejsce z osobna wygladalo poprawnie.
//
// Decyzja wlasciciela (2026-09-02): WSZEDZIE liczbowo, "DD.MM.RRRR",
// z zerem wiodacym. Zero wiodace nie jest ozdoba: kolumna dat bez niego
// skacze, a "1.09" i "01.09" w dwoch mailach o jednej sprawie wygladaja jak
// dwie rozne daty.
//
// Skladamy z NAPISU, a nie przez `Intl`: dane ICU w Node i w przegladarce
// bywaja z roznych wersji, a rozjazd na prerenderze wyrzuca cale poddrzewo
// (ADR-0022). Z tego samego powodu nie liczymy tu niczego z `Date.now()`.

/**
 * Dzien jako "DD.MM.RRRR". Zwraca `null`, gdy wartosci nie da sie odczytac:
 * puste miejsce jest lepsze od napisu "Invalid Date" w mailu do klienta.
 *
 * @param {string|Date|null|undefined} wartosc data z API ("RRRR-MM-DD" albo
 *   pelny znacznik czasu) lub obiekt Date
 */
export function dzienNumerycznie(wartosc) {
  if (!wartosc) return null;

  if (wartosc instanceof Date) {
    if (Number.isNaN(wartosc.getTime())) return null;
    const d = String(wartosc.getDate()).padStart(2, "0");
    const m = String(wartosc.getMonth() + 1).padStart(2, "0");
    return `${d}.${m}.${wartosc.getFullYear()}`;
  }

  const iso = String(wartosc).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}
