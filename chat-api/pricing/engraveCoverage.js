// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/engraveCoverage.js
// Regeneracja: npm run sync:pricing

// ============================================================
// POKRYCIE RYSUNKU W WYCENIE GRAWERU
// ============================================================
// Jedno miejsce, z ktorego czytaja OBIE maszyny grawerujace: CO2 i fiber.
// Reguly powielonej w dwoch silnikach nie da sie poprawic raz, a rozjechanie
// sie tych dwoch kopii byloby niewidoczne: obie dalej zwracalyby kwote.
//
// Pomiar robi `src/utils/svgCoverage.js` i tam stoi opis, dlaczego liczymy
// rozpietosc sladu w wierszach, a nie procent zaczernienia. Tutaj jest juz
// tylko decyzja, CO Z TA LICZBA ROBIMY.
//
// CZAS MASZYNY IDZIE Z POKRYCIA, RESZTA Z PROSTOKATA. Glowica przejezdza tylko
// tam, gdzie cos jest, wiec czas grawerowania skaluje sie pokryciem. Ale plyta,
// ktora kupujemy, i jej przygotowanie obejmuja CALY prostokat niezaleznie od
// tego, jak gesty jest wzor. Pomylka w te strone byla by cicha: cena spadlaby
// razem z materialem, ktory i tak zamawiamy w calosci.

/**
 * Ulamek prostokata, po ktorym glowica faktycznie jezdzi.
 *
 * BRAK POMIARU ZNACZY PELNY PROSTOKAT, a nie zero. Pomiar wymaga rastra, wiec
 * nie ma go dla rysunkow DXF ani dla plikow, ktore siegaja po zewnetrzne
 * zasoby. W takim wypadku zostajemy przy starym wzorze: kwota jest zawyzona,
 * czyli mylimy sie na wlasna niekorzysc, a nie na niekorzysc warsztatu.
 */
export function coverageOf(svgData) {
  const c = Number(svgData?.coverage);
  if (!Number.isFinite(c) || c <= 0) return 1;
  return Math.min(1, c);
}

/** Pole, po ktorym glowica przejezdza, w centymetrach kwadratowych. */
export function sweptAreaCm2(areaCm2, svgData) {
  return Number(areaCm2) * coverageOf(svgData);
}

/** Czy pokrycie zmierzylismy, czy tylko zalozylismy pelny prostokat. */
export function coverageMeasured(svgData) {
  const c = Number(svgData?.coverage);
  return Number.isFinite(c) && c > 0 && c < 1;
}
