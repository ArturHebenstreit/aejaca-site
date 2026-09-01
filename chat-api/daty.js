// ============================================================
// JEDEN SPOSOB NA ZAMIANE DATY Z BAZY NA "RRRR-MM-DD"
// ============================================================
// Sterownik bazy oddaje kolumne DATE i TIMESTAMPTZ jako OBIEKT Date, a nie
// jako napis. `String(obiektDate).slice(0, 10)` daje wtedy "Tue Sep 22",
// i to jest cichy blad, bo wyglada jak data i przechodzi kazdy warunek
// sprawdzajacy, czy cos w ogole jest.
//
// Zdazyl juz zrobic trzy rozne szkody naraz:
//   1. Strona zamowienia NIE POKAZYWALA terminu. Wzorzec "RRRR-MM-DD"
//      odrzucal "Tue Sep 22", a odrzucona data nie rysuje niczego, wiec
//      naglowek "Planowana finalizacja" stal nad pustym miejscem, mimo ze
//      w mailu ta sama data byla.
//   2. Mail o etapie pisal pod kropkami "Thu Aug 27" w polskim mailu.
//   3. OFERTY NIGDY NIE WYGASALY. Warunek porownywal "Tue Sep 22" z "2026-09-01"
//      jak dwa napisy, a "T" stoi w alfabecie za "2", wiec kazda oferta,
//      takze sprzed miesiaca, wychodzila jako wazna.
//
// Dlatego zamiana ma jedno miejsce, a `scripts/check-daty.mjs` pilnuje, zeby
// nie wrocila rozsypana po kodzie.

/**
 * Data z bazy jako "RRRR-MM-DD", albo null, gdy jej nie ma.
 *
 * Skladamy ja z pol lokalnych, a nie przez `toISOString()`. Sterownik oddaje
 * kolumne DATE jako polnoc LOKALNA, wiec przeliczenie na UTC w strefie na
 * wschod od Greenwich cofneloby date o jeden dzien. Termin przesuniety o dobe
 * jest gorszy od braku terminu, bo nikt go nie zakwestionuje.
 */
export function dataISO(wartosc) {
  if (wartosc === null || wartosc === undefined || wartosc === "") return null;
  if (wartosc instanceof Date) {
    if (Number.isNaN(wartosc.getTime())) return null;
    const r = wartosc.getFullYear();
    const m = String(wartosc.getMonth() + 1).padStart(2, "0");
    const d = String(wartosc.getDate()).padStart(2, "0");
    return `${r}-${m}-${d}`;
  }
  const napis = String(wartosc);
  // Napis juz w dobrej postaci, na przyklad z parametru zapytania.
  const wprost = napis.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(wprost)) return wprost;
  // Ostatnia deska: cokolwiek, co przegladarka i Node umieja przeczytac.
  const odczytana = new Date(napis);
  return Number.isNaN(odczytana.getTime()) ? null : dataISO(odczytana);
}

/** Dzisiaj jako "RRRR-MM-DD", do porownan z terminami waznosci. */
export function dzisISO() {
  return dataISO(new Date());
}
