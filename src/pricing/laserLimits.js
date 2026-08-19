// ============================================================
// POLE ROBOCZE LASEROW
// ============================================================
// Druk 3D mial swoja granice od dawna: model wiekszy od stolu nie dostaje
// ceny, tylko droge wyjscia. Lasery takiej granicy nie mialy w ogole, wiec
// rysunek 573,9 x 901,0 mm dostawal kwote wiazaca 497,83 zl. To 57 na 90 cm,
// czyli poza kazda nasza maszyna. Obietnica bez pokrycia, wystawiona z pelna
// pewnoscia siebie, i nic sie przy tym nie wywalalo.
//
// CO2 (xTool P2): pole 600 x 308 mm. Przelotka z podajnikiem przesuwa
// material, wiec DLUGOSC rosnie, a SZEROKOSC zostaje. To nie jest wieksze
// pole, tylko dluzsze, i wlasnie dlatego nie da sie tego opisac jednym
// prostokatem 1000 x 500.
//
// Fiber: pole soczewki, jedno przelozenie. Wieksze prace wymagalyby skladania
// z kilku pozycji, a szew bywa widoczny, wiec tego automatycznie nie wyceniamy.
//
// Wymiary w MILIMETRACH, bo tak przychodza z parsera rysunku (bboxMm).

export const LASER_BEDS = {
  // Przelotka juz dzis istnieje w wycenie jako `extended` i kosztuje wiecej
  // (dluzszy setup, dodatkowy sprzet). Ten plik tylko mowi, KIEDY jest
  // potrzebna, zeby kalkulator nie musial tego zgadywac.
  co2: { widthMm: 308, lengthMm: 600, extendedLengthMm: 3000 },
  fiber: { widthMm: 150, lengthMm: 150 },
};

/**
 * Najwieksza skala, w ktorej rysunek jeszcze miesci sie w polu.
 *
 * Boki porownujemy PO POSORTOWANIU, bo materiał kladzie sie na stole tak, jak
 * pasuje. Rysunek 500 x 200 mm miesci sie na polu 600 x 308 mm dopiero po
 * obroceniu i to jest normalna praca, a nie sztuczka.
 *
 * @returns {number|null} null, gdy nie ma czego liczyc
 */
export function maxScaleForBed(bboxMm, bed) {
  if (!bboxMm || !bed) return null;
  const rysunek = [bboxMm.x, bboxMm.y].map(Number).sort((a, b) => a - b);
  if (!rysunek.every((n) => Number.isFinite(n) && n > 0)) return null;
  const pole = [bed.widthMm, bed.lengthMm].sort((a, b) => a - b);
  return Math.min(...rysunek.map((d, i) => pole[i] / d));
}

/**
 * Co da sie zrobic z rysunkiem w tej skali.
 *
 * @param {{x:number,y:number}} bboxMm wymiary rysunku w milimetrach
 * @param {"co2"|"fiber"} tech
 * @param {number} scale skala wykonania
 * @returns {{fits: boolean, needsExtended: boolean, maxScale: number|null,
 *            maxScaleExtended: number|null}}
 *          `fits` falszywe znaczy: bez ceny automatycznej, do wyceny
 *          indywidualnej. `needsExtended` znaczy: miesci sie, ale wymaga
 *          przelotki, wiec wycena musi to policzyc.
 */
export function bedFit(bboxMm, tech, scale = 1) {
  const bed = LASER_BEDS[tech];
  // Nieznana technologia nie blokuje sprzedazy. Lepiej wycenic bez granicy
  // niz nie wycenic nic z powodu literowki w identyfikatorze.
  if (!bed || !bboxMm) return { fits: true, needsExtended: false, maxScale: null, maxScaleExtended: null };

  const s = Number(scale) || 1;
  const maxScale = maxScaleForBed(bboxMm, bed);
  const maxScaleExtended = bed.extendedLengthMm
    ? maxScaleForBed(bboxMm, { widthMm: bed.widthMm, lengthMm: bed.extendedLengthMm })
    : null;

  if (maxScale == null) return { fits: true, needsExtended: false, maxScale: null, maxScaleExtended: null };

  // Zapas na bledy zaokraglenia, zeby rysunek dokladnie na wymiar pola nie
  // odbijal sie od wlasnej granicy.
  const EPS = 1e-4;
  if (s <= maxScale + EPS) return { fits: true, needsExtended: false, maxScale, maxScaleExtended };
  if (maxScaleExtended != null && s <= maxScaleExtended + EPS) {
    return { fits: true, needsExtended: true, maxScale, maxScaleExtended };
  }
  return { fits: false, needsExtended: false, maxScale, maxScaleExtended };
}

/** Najwiekszy wymiar pola w centymetrach, do opisu na ekranie. */
export function bedMaxCm(tech) {
  const bed = LASER_BEDS[tech];
  if (!bed) return null;
  return Math.max(bed.widthMm, bed.extendedLengthMm || bed.lengthMm) / 10;
}
