// ============================================================
// PLIK PRZECHODZI RAZEM Z KLIENTEM
// ============================================================
// Szybka wycena i tryb zaawansowany to dwa osobne komponenty z osobnym
// stanem. Przelaczenie trybu znaczylo dotad: wgraj plik jeszcze raz,
// ustaw wielkosc jeszcze raz. Klient, ktory wlasnie posluchal naszej rady
// ("chcesz wybrac sam? przejdz do trybu zaawansowanego"), dostawal za to
// kare w postaci powtorzonej pracy, wiec rada byla wart tyle, co nic.
//
// Paczka jest JEDNORAZOWA. Kasujemy ja natychmiast po przejeciu, bo inaczej
// przy kazdym powrocie do zakladki plik wskakiwalby z powrotem i nie dalby
// sie usunac. To jest przeniesienie, a nie stan wspoldzielony.
//
// NIE PRZELICZAMY GEOMETRII PONOWNIE. Siatka jest juz sparsowana, a parser
// duzego STL-a potrafi zajac sekundy; drugi przebieg nie da innego wyniku,
// tylko zawiesi interfejs w chwili przejscia.

/** @typedef {"mesh"|"vector"} HandoffKind */

/**
 * Paczka przekazywana z szybkiej wyceny do trybu zaawansowanego.
 *
 * @param {object} arg
 * @param {HandoffKind} arg.kind rodzaj geometrii, decyduje kto ja przyjmie
 * @param {File|null} arg.file oryginalny plik, potrzebny przy zakupie
 * @param {string} arg.name nazwa do pokazania
 * @param {object|null} arg.data geometria W SKALI ORYGINALU (bez skalowania)
 * @param {number} arg.scale skala ustawiona suwakiem wielkosci
 */
export function makeHandoff({ kind, file = null, name = "", data = null, scale = 1 }) {
  if (!data || (kind !== "mesh" && kind !== "vector")) return null;
  return { kind, file, name: name || file?.name || "", data, scale: Number(scale) > 0 ? Number(scale) : 1 };
}

/**
 * Czy paczka pasuje do kalkulatora, ktory ja przejmuje.
 *
 * Siatka wrzucona do kalkulatora lasera i rysunek wrzucony do druku to nie
 * jest blad kosmetyczny: kalkulator czytalby pola, ktorych paczka nie ma,
 * i pokazal cene policzona z niczego.
 */
export function handoffFor(handoff, kind) {
  return handoff && handoff.kind === kind ? handoff : null;
}

// ============================================================
// POCZEKALNIA: paczka, ktora przezywa zmiane strony
// ============================================================
// Przejscie miedzy trybami kalkulatora zalatwia zwykly props, bo oba tryby
// zyja w jednym komponencie. Przejscie do SKLEPU to zmiana trasy: kalkulator
// znika razem ze swoim stanem, a konfigurator uslugi montuje sie od zera.
// Props nie ma tu jak dojechac, wiec paczka czeka poza drzewem Reacta.
//
// TRZY OGRANICZENIA, KTORE TO CZYNIA BEZPIECZNYM:
//   1. Odebrac mozna RAZ. Inaczej plik doklejalby sie do kazdej kolejnej
//      karty uslugi, ktora klient otworzy, i wygladalo to jak usterka.
//   2. Odebrac moze tylko ten, kto obsluguje ten rodzaj geometrii.
//   3. Paczka przeterminowuje sie po kwadransie, bo zamiar sprzed godziny
//      nie jest juz zamiarem.
//
// Plik `File` nie da sie zapisac do `sessionStorage`, wiec TWARDE ODSWIEZENIE
// strony paczke traci. To jest swiadomy kompromis: alternatywa byloby
// trzymanie kilkunastu megabajtow w pamieci przegladarki miedzy sesjami.

const WAZNOSC_MS = 15 * 60 * 1000;

let poczekalnia = null;

/** Odklada paczke przed przejsciem do sklepu. */
export function stashHandoff(handoff) {
  poczekalnia = handoff ? { ...handoff, stamp: Date.now() } : null;
}

/**
 * Odbiera paczke, jesli pasuje rodzajem i nie jest przeterminowana.
 * Odbior jest jednorazowy.
 */
export function claimHandoff(kind) {
  if (!poczekalnia) return null;
  if (Date.now() - poczekalnia.stamp > WAZNOSC_MS) {
    poczekalnia = null;
    return null;
  }
  if (poczekalnia.kind !== kind) return null;
  const paczka = poczekalnia;
  poczekalnia = null;
  return paczka;
}

/** Czysci poczekalnie, na przyklad przy wyjsciu z kalkulatora. */
export function clearHandoff() {
  poczekalnia = null;
}
