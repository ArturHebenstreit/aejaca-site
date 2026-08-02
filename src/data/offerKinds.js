// ============================================================
// RODZAJE OFERTY I REZIMY ODSTAPIENIA
// ============================================================
// Male, wspolne stale. Osobny plik, bo korzysta z nich i katalog sklepu,
// i dane startowe, a wzajemny import tych dwoch zrobilby cykl.

/**
 * Trzy rodzaje oferty, rozroznione tym, ile pracy dzieli zamowienie od wysylki.
 * Klient czyta z tego termin i zakres wplywu na wyrob, wiec granice musza byc
 * ostre, inaczej wszystko zlewa sie w jedna liste o nieznanym czasie realizacji.
 *
 *   ready        gotowe, pakujemy i wysylamy. Zero pracy warsztatowej.
 *   personalized polprodukt lezy na polce, dopasowujemy go do klienta
 *                (grawer, wymiar, kolor). Praca liczona w minutach.
 *   service      wykonujemy od nowa albo prawie od nowa. Praca w godzinach.
 */
export const OFFER_KIND = {
  READY: "ready",
  PERSONALIZED: "personalized",
  SERVICE: "service",
};

/**
 * Rezim odstapienia decyduje o tresci zgod w koszyku:
 *  standard      rzecz gotowa, pelne 14 dni
 *  made_to_order rzecz na zamowienie, art. 38 pkt 3 UPK
 *  digital       tresc cyfrowa, art. 38 pkt 13 UPK
 */
export const WITHDRAWAL = {
  STANDARD: "standard",
  MADE_TO_ORDER: "made_to_order",
  DIGITAL: "digital",
};

/**
 * Rezim odstapienia wynika z rodzaju rzeczy, wiec liczymy go, zamiast trzymac
 * w bazie kolumne, ktora mozna przez pomylke ustawic niezgodnie z produktem.
 */
export function withdrawalFor(product) {
  if (product.kind === "digital") return WITHDRAWAL.DIGITAL;
  if (product.offer === OFFER_KIND.PERSONALIZED) return WITHDRAWAL.MADE_TO_ORDER;
  return WITHDRAWAL.STANDARD;
}
