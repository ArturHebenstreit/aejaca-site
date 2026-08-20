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

/**
 * Stawka, gdy tabela milczy.
 *
 * To jest MEDIANA cen rynkowych materialow z tabeli (2026-08, 24 pozycje
 * liczone na metry). Nie srednia, bo srednia wynosi 241 zl i jest ciagnieta
 * przez tytan i miedz, ktorych prawie nie tniemy; mediana 141 zl opisuje
 * material typowy. Dla nieznanej pozycji ta liczba myli sie najmniej: przy
 * sklejce zawyzy, przy akrylu 8 mm zanizy, ale zaden z tych bledow nie
 * bedzie rzedu wielkosci, a taki wlasnie popelnialismy wczesniej.
 *
 * `scripts/test-material-stock.mjs` przelicza mediane z tabeli i wywala
 * build, gdy ta stala od niej odjedzie.
 */
export const DEFAULT_PLN_PER_M2 = 140;

/** Zapas na odpad miedzy elementami i przy krawedziach arkusza. */
export const MATERIAL_WASTE = 1.15;

/**
 * NARZUT NA MATERIAL: ryzyko i marza (decyzja wlasciciela, 2026-08-20).
 *
 * Narzut stoi TUTAJ, a nie w tabeli, i to jest rozstrzygniecie celowe.
 * W tabeli trzymamy to, ILE PLACIMY, bo taka liczbe da sie sprawdzic
 * z fakturą i z cennikiem hurtowni. Gdyby narzut byl juz w niej wliczony,
 * po roku nikt by nie wiedzial, ktora czesc kwoty jest rynkiem, a ktora
 * nasza decyzja, i kazda aktualizacja cen wymagalaby liczenia wstecz.
 *
 * Za co placi ten narzut: zakup i dojazd, magazynowanie, kapital zamrozony
 * w arkuszach, arkusz uszkodzony przy cieciu i resztki, ktorych nie da sie
 * juz uzyc. Przy jednej sztuce z arkusza 1525x1525 odpad realny jest duzo
 * wiekszy niz zapas 15%, wiec narzut pokrywa takze te roznice.
 */
export const MATERIAL_MARKUP = 1.5;

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

/** Rekord materialu z tabeli, albo null. */
export function stockRecord(matId, stock) {
  return Array.isArray(stock)
    ? stock.find((m) => m.material_id === matId || m.id === matId) || null
    : null;
}

/** Stawka za metr kwadratowy dla materialu, z tabeli albo domyslna. */
export function ratePerM2(matId, stock) {
  const stawka = Number(stockRecord(matId, stock)?.pln_per_m2);
  return stawka > 0 ? stawka : DEFAULT_PLN_PER_M2;
}

/**
 * Cena za SZTUKE, gdy material kupuje sie jako przedmiot, a nie na metry.
 *
 * Szklanka, kubek i plytka lupkowa maja cene sztuki i nie maja sensownej ceny
 * za metr kwadratowy. Przeliczanie ich na metry byloby liczba wygladajaca
 * poprawnie i nieprawdziwa, a to najgorszy rodzaj danych.
 */
export function ratePerPiece(matId, stock) {
  const cena = Number(stockRecord(matId, stock)?.pln_per_piece);
  return cena > 0 ? cena : null;
}

/**
 * Czy material ma byc wyceniony osobno, poza kalkulatorem.
 *
 * Srebro i zloto rozlicza sie WAGOWO, a nie powierzchniowo: gram zlota
 * kosztuje inaczej w kazdym tygodniu i zalezy od proby. Zero w obu
 * kolumnach znaczy wprost "tutaj nie wyceniamy", a nie "za darmo".
 */
export function pricedSeparately(matId, stock) {
  const rekord = stockRecord(matId, stock);
  if (!rekord) return false;
  return Number(rekord.pln_per_m2) === 0 && Number(rekord.pln_per_piece || 0) === 0;
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
  if (pricedSeparately(matId, stock)) return 0;

  // CENA ZA SZTUKE MA PIERWSZENSTWO. Kupujemy szklanke, a nie metr kwadratowy
  // szklanki, wiec zapas na odpad tez tu nie wchodzi: przy przedmiocie nie ma
  // odpadu miedzy elementami, jest albo caly przedmiot, albo nic.
  const zaSztuke = ratePerPiece(matId, stock);
  if (zaSztuke != null) return zaSztuke * MATERIAL_MARKUP;

  const cm2 = sheetUsedCm2(areaCm2);
  if (!cm2) return 0;
  return (cm2 / 10000) * ratePerM2(matId, stock) * MATERIAL_MARKUP;
}

/**
 * Stawka SPRZEDAZY za metr kwadratowy, czyli koszt razy narzut.
 *
 * Panel administracyjny pokazuje ja obok ceny zakupu, zeby nie trzeba bylo
 * liczyc w glowie ani zgadywac, czy narzut juz jest wliczony.
 */
export function salePerM2(kosztPerM2) {
  const k = Number(kosztPerM2);
  return k > 0 ? k * MATERIAL_MARKUP : 0;
}

/** To samo dla ceny za sztuke. */
export function salePerPiece(kosztPerPiece) {
  const k = Number(kosztPerPiece);
  return k > 0 ? k * MATERIAL_MARKUP : 0;
}
