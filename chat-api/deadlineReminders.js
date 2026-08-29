// ============================================================
// PRZYPOMNIENIA O TERMINIE REALIZACJI
// ============================================================
// Zlecenie oplacone i przyjete do pracy nie mialo do tej pory zadnego zegara.
// Termin istnial w glowie i w korespondencji, a system nie umial powiedziec
// ani "to jest za trzy dni", ani "to mialo wyjsc wczoraj".
//
// Reguly wyboru progu mieszkaja TUTAJ, a nie w zapytaniu SQL i nie w obsludze
// crona, bo to one sa cala trescia tej funkcji i to one musza dac sie sprawdzic
// bez stawiania bazy, poczty i zegara systemowego.
//
// Awaria, ktora ten plik zamyka, jest cicha w obie strony:
//   - prog wyslany drugi raz zamienia przypomnienie w szum, a szum sie ignoruje,
//     wiec pierwsze prawdziwe przypomnienie tez przepadnie;
//   - prog niewyslany nie zostawia po sobie zadnego sladu, wiec nikt nie
//     zauwazy, ze mechanizm przestal dzialac.

/**
 * Progi przypomnien, w dniach przed terminem. Kolejnosc malejaca ma znaczenie:
 * czytamy je od najdalszego i bierzemy PIERWSZY, ktory juz minal.
 *
 * `0` to dzien wysylki, czyli sam termin.
 */
export const PROGI = [14, 7, 3, 0];

/** Nazwa progu w zapisie `reminders_sent`. Krotka, bo stoi w bazie. */
export const nazwaProgu = (dni) => `d${dni}`;

/**
 * Ktory prog nalezy wyslac TERAZ, albo null.
 *
 * Zwracamy CO NAJWYZEJ JEDEN prog na przebieg, i to jest sedno tej funkcji.
 * Zlecenie z terminem dwudniowym przekracza progi 14, 7 i 3 w tej samej chwili;
 * wyslanie wszystkich trzech dalo by trzy maile jednego ranka o jednej rzeczy.
 * Bierzemy wiec prog najblizszy prawdzie, a pozostale, dalsze, uznajemy za
 * zalatwione tym samym mailem.
 *
 * @param {number} dniDoTerminu ujemna liczba znaczy dni PO terminie
 * @param {string[]} wyslane nazwy progow juz wyslanych
 * @returns {{prog: number, domkniete: string[]}|null} `domkniete` to progi,
 *   ktore ten mail zalatwia razem z wybranym, wiec zapisuje sie je od razu
 */
export function progDoWyslania(dniDoTerminu, wyslane = []) {
  if (!Number.isFinite(dniDoTerminu)) return null;
  const juz = new Set(wyslane || []);

  // Od progu NAJBLIZSZEGO, czyli od konca listy. Przy terminie dwudniowym
  // minely juz progi 14, 7 i 3 naraz; prawda o tym zleceniu jest "za trzy dni
  // albo mniej", a nie "za czternascie", wiec bierzemy ten najciasniejszy.
  // Pierwsza wersja szla od najdalszego i mowila "za 14 dni" o czyms, co
  // wychodzi pojutrze.
  for (const prog of [...PROGI].reverse()) {
    if (dniDoTerminu > prog) continue;
    if (juz.has(nazwaProgu(prog))) continue;
    // Progi dalsze od wybranego tez juz mineły. Nie mamy o nich czego mowic
    // osobno, wiec zamykamy je razem z tym mailem, zamiast wysylac je jutro
    // jako wiadomosc o terminie, ktory wtedy bedzie jeszcze blizszy.
    const domkniete = PROGI.filter((p) => p >= prog && !juz.has(nazwaProgu(p))).map(nazwaProgu);
    return { prog, domkniete };
  }
  return null;
}

/**
 * Czy zlecenie stojace w ustalaniu szczegolow trzeba szturchnac.
 *
 * Ten etap nie ma terminu, bo czekamy w nim na klienta, a nie on na nas.
 * Bez wlasnego sprawdzenia bylby jednak slepa plama: zlecenie zaplacone,
 * ktorego nikt nie ruszyl, nie odezwaloby sie nigdy.
 *
 * @param {Date|string} odKiedy wejscie w etap (`details_at`)
 * @param {Date|string|null} ostatnie ostatnie szturchniecie
 * @param {Date} teraz
 * @param {number} coIleDni
 */
export function szturchnacSzczegoly(odKiedy, ostatnie, teraz = new Date(), coIleDni = 3) {
  if (!odKiedy) return false;
  const start = new Date(odKiedy);
  if (Number.isNaN(start.getTime())) return false;
  // Liczymy od OSTATNIEGO odezwania sie, a nie zawsze od wejscia w etap:
  // inaczej po pierwszym szturchnieciu mail szedlby juz codziennie.
  const punkt = ostatnie ? new Date(ostatnie) : start;
  if (Number.isNaN(punkt.getTime())) return false;
  return teraz.getTime() - punkt.getTime() >= coIleDni * 86400_000;
}
