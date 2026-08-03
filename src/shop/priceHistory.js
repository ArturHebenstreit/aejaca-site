// ============================================================
// NAJNIZSZA CENA Z 30 DNI PRZED OBNIZKA
// ============================================================
// Art. 4 ust. 2 ustawy o informowaniu o cenach: przy OGLOSZENIU OBNIZKI ceny
// podaje sie obok niej najnizsza cene z 30 dni przed obnizka. Ust. 3 dodaje
// przypadek towaru oferowanego krocej niz 30 dni: wtedy podaje sie najnizsza
// cene z okresu od rozpoczecia oferowania.
//
// Dwie rzeczy, ktore latwo pomylic i ktore ten plik rozstrzyga:
//
// 1. To NIE jest informacja podawana przy kazdej cenie. Obowiazek powstaje
//    wylacznie przy obnizce. Napis "najnizsza cena z 30 dni" obok ceny, ktora
//    nie zostala obnizona, sugeruje promocje, ktorej nie ma, wiec wprowadza
//    w blad zamiast informowac.
// 2. Obnizka to stan faktyczny, nie decyzja marketingowa: cena biezaca nizsza
//    niz najwyzsza z ostatnich 30 dni. Dzieki temu informacja pojawia sie sama
//    w chwili zmiany ceny w panelu i nie zalezy od tego, czy ktos pamietal.

/** Ile dni wstecz siega okres porownawczy. */
export const WINDOW_DAYS = 30;

/**
 * @param {object} p
 * @param {number} p.priceGrosze     cena biezaca
 * @param {number} [p.lowest30Grosze] najnizsza cena w oknie porownawczym
 * @param {number} [p.highest30Grosze] najwyzsza cena w oknie, czyli cena "sprzed obnizki"
 * @param {number} [p.daysOnSale]     ile dni pozycja jest w sprzedazy
 * @returns {null | { lowestGrosze: number, shortHistory: boolean }}
 *   `null` znaczy: nie ma obnizki, nic nie pokazujemy.
 */
export function reductionNotice({ priceGrosze, lowest30Grosze, highest30Grosze, daysOnSale }) {
  if (!Number.isFinite(priceGrosze)) return null;
  if (!Number.isFinite(highest30Grosze) || !Number.isFinite(lowest30Grosze)) return null;

  // Bez obnizki nie ma czego oglaszac. Rowna cena to tez brak obnizki.
  if (priceGrosze >= highest30Grosze) return null;

  return {
    lowestGrosze: Math.min(lowest30Grosze, priceGrosze),
    // Krotsza historia niz okno porownawcze wymaga innego zdania: podajemy
    // cene z okresu od rozpoczecia oferowania, a nie z pelnych 30 dni.
    shortHistory: Number.isFinite(daysOnSale) && daysOnSale < WINDOW_DAYS,
  };
}
