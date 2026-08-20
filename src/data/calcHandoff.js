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
