// ============================================================
// CO MAMY NA STANIE, CZYLI WYBOR ZAMIAST PUSTEGO POLA
// ============================================================
// Przy "Na materiale AEJaCA" pytalismy pustym polem tekstowym: "napisz, na
// jakim konkretnie materiale ma byc wykonana usluga". To jest najgorsze
// mozliwe pytanie w tym miejscu, bo trafia w osobe, ktora wlasnie dlatego
// wybrala szybka wycene, ze na materialach sie nie zna. Odpowiedzia bywalo
// "cos z drewna" albo nic, czyli zlecenie i tak wracalo do wymiany maili.
//
// LISTA NIE JEST PRZEPISANA RECZNIE. Bierzemy ja wprost z cennika, wiec nie
// da sie dopisac tu materialu, ktorego silnik nie umie wycenic, ani zapomniec
// o materiale, ktory doszedl do cennika. Przepisana kopia rozjechalaby sie po
// pierwszej zmianie stawki i nikt by tego nie zauwazyl.
//
// WYBOR MUSI ZMIENIAC CENE, INACZEJ JEST OZDOBA. Szybka wycena zgadywala
// material za klienta (sklejka 3 mm przy cieciu, drewno przy grawerze).
// Wybrana pozycja podmienia `matId` w wycenie, wiec akryl 5 mm kosztuje tyle,
// ile kosztuje akryl 5 mm, a nie tyle, co domyslna sklejka.
//
// DOSTEPNOSCI NIE OBIECUJEMY. Lista mowi, co UMIEMY obrobic i co zwykle mamy,
// a nie co w tej chwili lezy na polce. Potwierdzenie dostepnosci i cena
// samego materialu ida przy realizacji, tak jak dotad, bo kwota z kalkulatora
// obejmuje wylacznie robocizne.

import { ENGRAVE_MATERIALS, CUT_MATERIALS } from "../pricing/laserCo2.js";
import { MATERIALS as FIBER_MATERIALS } from "../pricing/laserFiber.js";

/** Pozycja "wpisze wlasny" konczy liste i przywraca pole tekstowe. */
export const STOCK_OTHER = "other";

/**
 * KAFELEK MATERIALU ZAWEZA LISTE. Klient, ktory kliknal "Drewno", dostawal
 * ponizej pelen cennik razem z guma, papierem i tkanina. To nie jest tylko
 * balagan: dluga lista uczy, ze wybor jest przypadkowy, wiec przestaje sie
 * czytac i klika pierwsza pozycje. Grupa idzie z cennika (pole `grupa`),
 * a nie z osobnej tablicy nazw, bo dwie listy zawsze sie rozjezdzaja.
 */
const GRUPA_Z_KAFLA = {
  wood: "wood",
  metal: "metal",
  // Kafelek "Szklo / Kamien / Inne" zbiera wszystko, co nie jest drewnem
  // ani metalem: akryl, szklo, kamien, skore, papier, tkanine i gume.
  glass: "other",
};

/**
 * Metale szlachetne na POCZATKU listy, a nie na koncu.
 *
 * Srebro i zloto sa najczestszym powodem, dla ktorego ktos przychodzi do
 * znakowania swiatlowodem, wiec szukanie ich na szarym koncu listy stali
 * i mosiadzu jest praca, ktorej nie musi wykonywac. Dostepnosc samej
 * blaszki potwierdzamy przy realizacji, tak jak przy kazdym innym
 * materiale z tej listy.
 */
const szlachetneNaPoczatku = (a, b) => Number(Boolean(b.precious)) - Number(Boolean(a.precious));

/**
 * Materialy do wyboru dla podanej technologii, trybu pracy i kafla materialu.
 *
 * @param {{tech?: string, mode?: string, material?: string}} arg
 * @returns {{id: string, label: {pl: string, en: string, de: string}}[]}
 */
export function stockOptions({ tech, mode, material } = {}) {
  let zrodlo = null;
  if (tech === "fiber") zrodlo = [...FIBER_MATERIALS].sort(szlachetneNaPoczatku);
  else if (tech === "co2") zrodlo = mode === "cut" ? CUT_MATERIALS : ENGRAVE_MATERIALS;
  if (!zrodlo) return [];

  // `custom` w cenniku znaczy "wycena reczna", a nie material. Zastepuje je
  // nasza wlasna pozycja koncowa, ktora odslania pole tekstowe.
  let lista = zrodlo.filter((m) => !m.custom);

  // Zawezamy tylko wtedy, gdy kafelek cos znaczy dla tej technologii. Przy
  // "Nie wiem" i przy kaflu bez odpowiednika pokazujemy calosc: pusta lista
  // bylaby gorsza niz dluga, bo wygladalaby na usterke.
  const grupa = GRUPA_Z_KAFLA[material];
  if (grupa) {
    const zawezona = lista.filter((m) => m.grupa === grupa);
    if (zawezona.length) lista = zawezona;
  }

  return lista.map((m) => ({ id: m.id, label: m.label }));
}

/**
 * Czy wybrana pozycja pasuje do listy tej technologii.
 *
 * Wybor z poprzedniej technologii musi przestac obowiazywac, inaczej cena
 * liczylaby sie z identyfikatora, ktorego biezacy silnik nie zna, i po cichu
 * spadlaby do wartosci domyslnej.
 */
export function stockAllowed(id, arg) {
  return Boolean(id) && stockOptions(arg).some((o) => o.id === id);
}
