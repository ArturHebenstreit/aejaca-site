// ============================================================
// PODSTAWA KWOTY WIAZACEJ
// ============================================================
// Kwota wiazaca jest oferta, ktorej dotrzymujemy. Wolno ja podac wylacznie
// wtedy, gdy wynika z czegos MIERZALNEGO, a nie z przedzialu wielkosci.
//
// Stan sprzed tego pliku, zmierzony na zywym `/api/price`: zapytanie bez
// zadnego pliku i bez zadnego wymiaru, samo "S", oddawalo 39,68 zl jako kwote
// wiazaca. Pod spodem silnik zakladal 150 cm3, a w potwierdzeniu klient
// dostawal jedno slowo: "Jak dlon". Przedzial "M" to 800 cm3, "L" to 3000 cm3.
// Zobowiazywalismy sie do kwoty za przedmiot, ktorego objetosci nikt nie znal,
// i nigdzie tej liczby nie zapisywalismy. Nic sie przy tym nie wywalalo.
//
// PODZIAL, KTORY TU OBOWIAZUJE, jest jeden i wynika z tego, KTO decyduje
// o ksztalcie wyrobu:
//
//   1. Ksztalt wybiera KLIENT (jego model, jego rysunek, jego przedmiot).
//      Wtedy cena wynika z geometrii, ktorej nie widzimy, dopoki jej nie
//      zmierzymy. Przedzial wielkosci jest domyslem, wiec daje SZACUNEK.
//   2. Ksztalt wybieramy MY, z wlasnego katalogu (bizuteria z parametrow,
//      naprawa, renowacja, projekt CAD). Wtedy parametry SA specyfikacja:
//      to my wykonamy wyrob o tej masie i tej probie, wiec cena jest wiazaca.
//
// Wymiary podane recznie licza sie jako podstawa, ale zawsze jako GORNA
// GRANICA: bryle wpisana z reki wyceniamy jak pelna. Klient moze na tym
// wylacznie zyskac, a my nie zgadujemy w druga strone.
//
// Ten plik jest lustrzany do `chat-api/pricing/` przez `npm run sync:pricing`,
// bo tej samej reguly musi pilnowac przegladarka (zeby wyjasnic, czego brakuje)
// i serwer (zeby odmowic przyjecia zamowienia, gdy formularz zostanie ominiety).

/** Czego brakuje do kwoty wiazacej. Widok tlumaczy te klucze na zdania. */
export const BRAK = {
  MODEL: "model",         // zmierzony model 3D albo wpisane wymiary bryly
  RYSUNEK: "vector",      // rysunek wektorowy, bo o cenie decyduje dlugosc sciezki
  POLE: "area",           // pole grawerowania: rysunek albo wpisane wymiary pola
  OBJETOSC: "volume",     // objetosc odlewu w mililitrach
};

/** Kalkulatory, w ktorych ksztalt wyrobu przynosi klient jako model 3D. */
const Z_MODELU = new Set(["print3d_fdm", "print3d_msla", "jewelry_casting"]);

/** Kalkulatory, w ktorych o cenie decyduje dlugosc ciecia, a tej nie da sie
 *  wyprowadzic z gabarytu: obrys prostokata i ten sam prostokat z azurem to
 *  dwie zupelnie rozne drogi noza. */
const Z_RYSUNKU = new Set(["laser_co2_cut"]);

/** Grawer i znakowanie licza sie z POLA, wiec wystarczy rysunek albo wymiary. */
const Z_POLA = new Set(["laser_co2_engrave", "laser_fiber"]);

/** Odlew zywiczny: cena idzie z objetosci formy, podanej w mililitrach. */
const Z_OBJETOSCI = new Set(["epoxy"]);

/**
 * Kalkulatory, w ktorych to MY ustalamy wyrob, wiec parametry sa specyfikacja.
 * Nie ma tu nic do zgadniecia: masa wynika z linii, rodzaju i masywnosci,
 * a naprawa i renowacja dotycza czynnosci, nie wielkosci.
 */
const Z_PARAMETROW = new Set([
  "jewelry_new", "jewelry_chain", "jewelry_renovation", "jewelry_repair",
  "cad_design", "jewelry_ring_config",
]);

function liczba(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Czy geometria jest naprawde zmierzona, a nie pustym obiektem. */
function zmierzona(geometry) {
  return Boolean(geometry && liczba(geometry.volumeCm3) && geometry.bbox);
}

/**
 * Czy dla tej pozycji wolno podac kwote wiazaca.
 *
 * @param {object} wejscie
 * @param {string} wejscie.calculator klucz z rejestru kalkulatorow
 * @param {object} [wejscie.params]   parametry pozycji
 * @param {object} [wejscie.geometry] geometria zmierzona przez serwer
 * @param {boolean} [wejscie.fromQuote] pozycja pochodzi z wyceny czlowieka
 * @returns {{binding: boolean, missing: string[], basis: object|null}}
 */
export function bindingBasis({ calculator, params = {}, geometry = null, fromQuote = false } = {}) {
  const kalk = String(calculator || "");

  // WYCENA CZLOWIEKA JEST PODSTAWA SAMA W SOBIE. Kwote wpisal ktos, kto
  // widzial zapytanie w calosci, wiec zaden automat nie ma jej podwazac.
  if (fromQuote) return { binding: true, missing: [], basis: { kind: "quote" } };

  if (Z_PARAMETROW.has(kalk)) {
    return { binding: true, missing: [], basis: { kind: "params" } };
  }

  if (Z_MODELU.has(kalk)) {
    if (zmierzona(geometry)) {
      return { binding: true, missing: [], basis: { kind: "model", volumeCm3: geometry.volumeCm3, bbox: geometry.bbox } };
    }
    const bryla = declaredSolid(params);
    if (bryla) return { binding: true, missing: [], basis: { kind: "declared_solid", ...bryla } };
    return { binding: false, missing: [BRAK.MODEL], basis: null };
  }

  if (Z_RYSUNKU.has(kalk)) {
    if (params?.svgData) return { binding: true, missing: [], basis: { kind: "vector" } };
    return { binding: false, missing: [BRAK.RYSUNEK], basis: null };
  }

  if (Z_POLA.has(kalk)) {
    if (params?.svgData) return { binding: true, missing: [], basis: { kind: "vector" } };
    const pole = declaredField(params);
    if (pole) return { binding: true, missing: [], basis: { kind: "declared_field", ...pole } };
    return { binding: false, missing: [BRAK.POLE], basis: null };
  }

  if (Z_OBJETOSCI.has(kalk)) {
    const ml = liczba(params?.volumeMl);
    if (ml) return { binding: true, missing: [], basis: { kind: "declared_volume", ml } };
    return { binding: false, missing: [BRAK.OBJETOSC], basis: null };
  }

  // Kalkulator, ktorego ta regula jeszcze nie opisuje, NIE dostaje kwoty
  // wiazacej z automatu. Milczaca zgoda na nieznane jest dokladnie tym
  // mechanizmem, ktory ten plik zamyka.
  return { binding: false, missing: [BRAK.MODEL], basis: null };
}

/**
 * Wymiary bryly wpisane z reki, w milimetrach.
 *
 * Wyceniamy je JAK BRYLE PELNA, czyli po gornej granicy. Model o tych
 * gabarytach nie moze miec wiekszej objetosci, wiec kwota nie ma prawa
 * urosnac po zmierzeniu pliku. To jest cala roznica miedzy podstawa
 * a domyslem: domysl potrafi chybic w obie strony.
 */
export function declaredSolid(params = {}) {
  const d = params?.declaredMm;
  const x = liczba(d?.x), y = liczba(d?.y), z = liczba(d?.z);
  if (!x || !y || !z) return null;
  const bbox = { x: x / 10, y: y / 10, z: z / 10 };
  return { volumeCm3: bbox.x * bbox.y * bbox.z, bbox, solid: true };
}

/** Pole grawerowania wpisane z reki, w milimetrach. */
export function declaredField(params = {}) {
  const f = params?.declaredFieldMm;
  const w = liczba(f?.w), h = liczba(f?.h);
  if (!w || !h) return null;
  return { widthMm: w, heightMm: h, areaCm2: (w / 10) * (h / 10) };
}

/**
 * Geometria do policzenia ceny z wymiarow wpisanych z reki.
 * Ten sam ksztalt, ktory oddaje parser pliku, wiec silniki nie musza wiedziec,
 * skad przyszla.
 */
export function geometryFromDeclared(params = {}) {
  const bryla = declaredSolid(params);
  if (!bryla) return null;
  return { volumeCm3: bryla.volumeCm3, bbox: bryla.bbox, triangleCount: 0, declared: true };
}
