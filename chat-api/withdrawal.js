// ============================================================
// PRAWO ODSTAPIENIA: KTORE POUCZENIE DO KTOREGO ZAMOWIENIA
// ============================================================
// Mail potwierdzajacy zamowienie jest potwierdzeniem umowy na trwalym nosniku
// (art. 21 ustawy o prawach konsumenta), wiec to jego tresc liczy sie jako
// informacja udzielona konsumentowi.
//
// Do 2026-08-03 wysylal jedno zdanie do wszystkich: ze rzecz jest wykonywana
// wedlug specyfikacji klienta, wiec prawo odstapienia nie przysluguje. Odkad
// sklep sprzedaje takze produkty z polki, dla czesci zamowien bylo to
// nieprawda. Powiedzenie konsumentowi, ze nie ma prawa, ktore ma, jest
// wprowadzeniem w blad, a brak pouczenia wydluza sam termin odstapienia do
// dwunastu miesiecy (art. 29 upk).
//
// Dlatego pouczenie dobiera sie do tego, co faktycznie jest w zamowieniu.

export const REGIME = {
  /** Rzecz gotowa z polki: pelne 14 dni bez podania przyczyny. */
  STANDARD: "standard",
  /** Rzecz wykonywana wedlug specyfikacji klienta: art. 38 pkt 3. */
  MADE_TO_ORDER: "made_to_order",
  /** Tresc cyfrowa: prawo wygasa z chwila rozpoczecia pobierania, art. 38 pkt 13. */
  DIGITAL: "digital",
};

/**
 * Rezim dla pojedynczej pozycji zamowienia.
 *
 * Usluga z kalkulatora zawsze powstaje pod klienta (druk z jego pliku, grawer
 * jego trescia, bizuteria wedlug jego projektu), wiec idzie jako wykonywana
 * na zamowienie. Przy produkcie decyduje katalog: cyfrowy, personalizowany
 * albo gotowy.
 */
/**
 * Usluga, ktorej wynikiem jest PLIK, a nie rzecz.
 *
 * Kreator pierscionkow sprzedaje z jednej konfiguracji cztery rzeczy: dwie
 * z nich sa plikiem do pobrania, dwie jada kurierem. Rozstrzyga `output`,
 * bo to on decyduje, co klient dostanie.
 */
export function isDigitalService(item = {}) {
  if (item.calculator !== "jewelry_ring_config") return false;
  const output = item.params?.output;
  return output === "mesh" || output === "step";
}

export function regimeForItem(item = {}) {
  // WYJATEK, ktory pojawil sie razem z kreatorem pierscionkow: usluga tez
  // potrafi byc trescia cyfrowa. Klient, ktory kupuje sam plik STL, dostaje
  // go od razu po zaplacie i nie ma tu zadnego wykonania na zamowienie
  // w rozumieniu art. 38 pkt 3, tylko dostarczenie tresci cyfrowej, czyli
  // pkt 13. Roznica nie jest akademicka: przy pkt 13 prawo wygasa dopiero
  // Z CHWILA ROZPOCZECIA POBIERANIA i wylacznie po wyraznej zgodzie klienta,
  // a te zgode formularz zamowienia musi wtedy zebrac osobno.
  if (item.item_type !== "product") {
    return isDigitalService(item) ? REGIME.DIGITAL : REGIME.MADE_TO_ORDER;
  }
  if (item.product_kind === "digital") return REGIME.DIGITAL;
  if (item.product_offer === "personalized") return REGIME.MADE_TO_ORDER;
  return REGIME.STANDARD;
}

/**
 * Podsumowanie calego zamowienia. Zamowienie mieszane jest normalne (pierscionek
 * z polki plus grawer na zamowienie), wiec pouczenie musi umiec powiedziec,
 * ktore pozycje obejmuje prawo, a ktorych nie.
 */
export function withdrawalSummary(items = []) {
  const covered = [];
  const excluded = [];
  for (const item of items) {
    const regime = regimeForItem(item);
    (regime === REGIME.STANDARD ? covered : excluded).push({ ...item, regime });
  }

  const regimes = [...new Set([...covered, ...excluded].map((i) => i.regime))];
  return {
    covered,
    excluded,
    regimes,
    /** Czy w zamowieniu jest cokolwiek, od czego mozna odstapic. */
    hasCovered: covered.length > 0,
    /** Czy trzeba tlumaczyc wyjatki. */
    hasExcluded: excluded.length > 0,
    /** Jedyny rezim, gdy zamowienie jest jednorodne; inaczej null. */
    single: regimes.length === 1 ? regimes[0] : null,
    mixed: regimes.length > 1,
  };
}
