// ============================================================
// GENERATOR PIERSCIONKOW, WATEK ROBOCZY
// ============================================================
// Zbudowanie bryly zajmuje kilkadziesiat milisekund, a jadro geometryczne to
// pol megabajta WebAssembly, ktore trzeba najpierw wczytac. Na watku glownym
// pierwszy ruch suwakiem zacinalby strone, a kazdy kolejny gubil klatki.
//
// Przez granice watku ida wylacznie dane proste: w jedna strone obiekt
// parametrow, w druga plaskie tablice wierzcholkow i indeksow, przekazywane
// bez kopiowania. Manifoldowej bryly nie da sie przeslac i nie ma potrzeby:
// watek glowny potrzebuje siatki do narysowania, a nie jadra do liczenia.
//
// KAZDA odpowiedz niesie `seq` z zapytania. Suwak potrafi wyslac dziesiec
// zadan, zanim wroci pierwsza odpowiedz, a bez numeru kolejnego wolniejsza
// z nich nadpisalaby nowsza i podglad pokazywalby poprzedni ksztalt.

import { buildRing } from "../geometry/ring/build.js";

/** Podglad nie potrzebuje gestosci docelowej: mniej segmentow, szybsza reakcja. */
const PREVIEW_SEGMENTS = 64;

function pack(manifold) {
  const mesh = manifold.getMesh();
  return {
    positions: new Float32Array(mesh.vertProperties),
    indices: new Uint32Array(mesh.triVerts),
    triangles: mesh.numTri,
  };
}

self.onmessage = async (e) => {
  const { seq, params } = e.data || {};
  try {
    const r = await buildRing(params, { segments: PREVIEW_SEGMENTS });

    const metal = pack(r.metal);
    let stones = null;
    if (r.stones.length) {
      let s = r.stones[0];
      for (let i = 1; i < r.stones.length; i++) s = s.add(r.stones[i]);
      stones = pack(s);
    }

    const transfer = [metal.positions.buffer, metal.indices.buffer];
    if (stones) transfer.push(stones.positions.buffer, stones.indices.buffer);

    self.postMessage({
      seq, ok: true, metal, stones,
      volumeMm3: r.volumeMm3,
      massG: r.massG,
      genus: r.genus,
      params: r.params,
    }, transfer);
  } catch (err) {
    // Niedozwolone zakucie rzuca stad z czytelnym komunikatem po polsku,
    // wiec nie tlumaczymy go ponownie na watku glownym.
    self.postMessage({ seq, ok: false, error: String(err?.message || err) });
  }
};
