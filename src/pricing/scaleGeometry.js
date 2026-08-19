// ============================================================
// SKALOWANIE GEOMETRII DO WYCENY
// ============================================================
// Klient wgrywa plik i moze zmienic wielkosc wykonania. Cena musi wtedy
// wynikac z geometrii PO zmianie, bo to ona zostanie wykonana.
//
// Wzory sa proste, ale rozjezdzaja sie latwo, bo kazdy wymiar skaluje sie
// inna potega: dlugosc liniowo, powierzchnia kwadratowo, objetosc szescienne.
// Ten sam rachunek stal dotad przepisany osobno w kalkulatorze druku, w CO2
// i w laserze swiatlowodowym. Trzy kopie jednego wzoru to trzy okazje, zeby
// przy nastepnej zmianie poprawic dwie.
//
// UWAGA CO DO TROJKATOW. `scaleMesh` NIE rusza listy trojkatow i to jest
// swiadome. Skalowanie setek tysiecy wierzcholkow przy kazdym ruchu suwaka
// zjadaloby klatki, a odbiorcy potrzebuja czego innego: podglad rysuje sie
// z proporcji, wiec skala go nie zmienia, a analiza drukowalnosci dostaje
// skale osobnym parametrem i skaluje sobie sama w jednym przebiegu.
// Kto potrzebuje trojkatow w skali, ma je w `flattenTriangles(tri, scale)`.

/**
 * Siatka OKROJONA DO TEGO, CZEGO POTRZEBUJE WYCENA.
 *
 * Kalkulator trzymal w parametrach cala liste trojkatow i wysylal ja do
 * `/api/price` jako pole formularza. Dla skromnego modelu na piec tysiecy
 * trojkatow to 303 kB zamiast 218 B, czyli 1423 razy wiecej, a dla modelu
 * z detalem idzie to w megabajty. Zapytanie potrafilo z tego powodu nie
 * dojsc, a klient widzial wtedy tylko "tej konfiguracji nie wycenimy
 * automatycznie" i nie mial jak zgadnac, o co chodzi.
 *
 * Trojkaty i tak nie mialy tam nic do roboty: silnik czyta wylacznie
 * objetosc i gabaryty, a serwer PODMIENIA te wartosci na wlasny pomiar
 * z wgranego pliku, bo wynikowi z przegladarki nie ufa.
 */
export function meshForPricing(mesh) {
  if (!mesh) return mesh;
  const { triangles, ...bezTrojkatow } = mesh;
  return bezTrojkatow;
}

/**
 * Siatka 3D w nowej skali. Objetosc rosnie z szescianem, gabaryt liniowo.
 *
 * @param {{volumeCm3: number, bbox: {x:number,y:number,z:number}}|null} mesh
 * @param {number} scale
 */
export function scaleMesh(mesh, scale = 1) {
  const s = Number(scale) || 1;
  if (!mesh || s === 1) return mesh;
  return {
    ...mesh,
    volumeCm3: mesh.volumeCm3 * s * s * s,
    bbox: { x: mesh.bbox.x * s, y: mesh.bbox.y * s, z: mesh.bbox.z * s },
  };
}

/**
 * Rysunek wektorowy w nowej skali. Dlugosc sciezki rosnie liniowo (bo laser
 * przejezdza dluzsza droge), pole grawerowania kwadratowo.
 *
 * @param {{bboxMm: {x:number,y:number}, pathLengthCm: number, engravAreaCm2: number}|null} vector
 * @param {number} scale
 */
export function scaleVector(vector, scale = 1) {
  const s = Number(scale) || 1;
  if (!vector || s === 1) return vector;
  return {
    ...vector,
    bboxMm: { x: vector.bboxMm.x * s, y: vector.bboxMm.y * s },
    pathLengthCm: vector.pathLengthCm * s,
    engravAreaCm2: vector.engravAreaCm2 * s * s,
  };
}

/** Najwiekszy wymiar siatki, w centymetrach. Tym steruje suwak wielkosci. */
export function meshMaxCm(mesh) {
  if (!mesh?.bbox) return null;
  return Math.max(mesh.bbox.x, mesh.bbox.y, mesh.bbox.z);
}

/** Najwiekszy wymiar rysunku, w centymetrach. Parser wektorow podaje milimetry. */
export function vectorMaxCm(vector) {
  if (!vector?.bboxMm) return null;
  return Math.max(vector.bboxMm.x, vector.bboxMm.y) / 10;
}
