// ============================================================
// MATERIAL Z NASZEGO MAGAZYNU JAKO POZYCJA WYCENY
// ============================================================
// Do tej pory material byl liczony ZLE W OBIE STRONY, i obie pomylki byly
// ciche, bo kwota zawsze wygladala poprawnie:
//
//   - przy CIECIU doliczalismy material zawsze, takze wtedy, gdy klient
//     przysylal wlasna plyte, wiec placil nam za cos, czego nie dostarczamy,
//   - przy GRAWERZE nie doliczalismy go nigdy, takze wtedy, gdy deska byla
//     nasza, wiec oddawalismy ja gratis do kwoty, ktora sami nazwalismy
//     wiazaca.
//
// Powod byl jeden: wybor "Na czym pracujemy" w ogole nie docieral do silnika.
//
// CENA IDZIE Z TABELI, NIE Z KODU. Stawka za metr kwadratowy zyje w bazie
// (`material_stock`) i zmienia sie z panelu administracyjnego, bo to jest
// liczba handlowa, ktora zmienia sie razem z rynkiem, a nie stala fizyczna.
// Gdy baza milczy, wracamy do wartosci domyslnej: awaria bazy ma wstrzymac
// aktualizacje cennika, a nie sprzedaz.
//
// ZAPAS 15% jest czescia wzoru, a nie zaokragleniem. Z arkusza nie wycina sie
// samego ksztaltu: zostaje odpad miedzy elementami i przy krawedziach, wiec
// zuzywamy wiecej materialu, niz wynosi pole wyrobu.

/** Stawka, gdy tabela milczy. Wartosc startowa ustalona przez wlasciciela. */
export const DEFAULT_PLN_PER_M2 = 100;

/** Zapas na odpad miedzy elementami i przy krawedziach arkusza. */
export const MATERIAL_WASTE = 1.15;

/** Ile centymetrow kwadratowych arkusza zuzyjemy na wyrob o danym polu. */
export function sheetUsedCm2(areaCm2) {
  const a = Number(areaCm2);
  return a > 0 ? a * MATERIAL_WASTE : 0;
}

/**
 * Czy material w tym zleceniu jest NASZ.
 *
 * Brak odpowiedzi znaczy "nasz": tak wygladaja karty uslug w sklepie i tryb
 * zaawansowany, gdzie pytania o podloze nie ma, a material domyslnie
 * wydajemy z magazynu.
 */
export function materialIsOurs(podloze) {
  return podloze !== "own_item" && podloze !== "own_stock";
}

/** Stawka za metr kwadratowy dla materialu, z tabeli albo domyslna. */
export function ratePerM2(matId, stock) {
  const rekord = Array.isArray(stock)
    ? stock.find((m) => m.material_id === matId || m.id === matId)
    : null;
  const stawka = Number(rekord?.pln_per_m2);
  return stawka > 0 ? stawka : DEFAULT_PLN_PER_M2;
}

/**
 * Koszt materialu dla jednej sztuki, w zlotowkach.
 *
 * @param {object} arg
 * @param {number} arg.areaCm2 pole wyrobu (bez zapasu)
 * @param {string} arg.matId identyfikator materialu z cennika
 * @param {string|null} arg.podloze kto dostarcza material
 * @param {Array|null} arg.stock tabela stanow magazynowych
 * @returns {number}
 */
export function materialCostPLN({ areaCm2, matId, podloze = null, stock = null }) {
  if (!materialIsOurs(podloze)) return 0;
  const cm2 = sheetUsedCm2(areaCm2);
  if (!cm2) return 0;
  return (cm2 / 10000) * ratePerM2(matId, stock);
}
