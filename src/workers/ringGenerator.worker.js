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

// Znacznik wersji, ODSYLANY w odpowiedzi.
//
// Nazwa pliku po zbudowaniu zawiera skrot jego TRESCI, a `/assets/*` jest
// oznaczone jako `immutable` na rok. Gdy tresc sie nie zmienia, przegladarka
// serwuje plik z dysku RAZEM ze starymi naglowkami, wiec poprawka polityki
// bezpieczenstwa do niego nie dociera. Podbicie tej liczby zmienia skrot
// i wymusza pobranie na nowo.
//
// Wartosc musi byc REALNIE uzyta, inaczej minifikator ja usunie, plik wyjdzie
// bajt w bajt taki sam i cala sztuczka nic nie da. Odsylamy ja wiec w kazdej
// odpowiedzi, co przy okazji pozwala sprawdzic w konsoli, ktora wersja
// watku odpowiedziala.
//
// 3: naglowki tego pliku byly starsze niz polityka na stronie. Dokument ma
// `must-revalidate`, wiec dostawal polityke nowa, ale watek siedzial w cache
// BRZEGOWYM Cloudflare, razem z polityka z dnia, w ktorym plik tam trafil.
// Nowa przegladarka niczego nie zmieniala, bo cache nie byl po jej stronie.
// 4: kamien centralny i boczne ida osobnymi siatkami, zeby mogly miec
// rozne materialy.
// 5: liczba kamieni z generatora
// 6: masa kamieni i karaty, zeby podac mase PIERSCIONKA, a nie samego odlewu
const WORKER_VERSION = 6;

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

    // Kamien centralny idzie OSOBNO od bocznych, bo moga byc z innego
    // materialu. Zlaczone w jedna siatke daloby sie narysowac tylko jedna
    // barwa i szafir w otoczeniu brylantow wygladalby jak brylant.
    // `buildRing` wklada centralny jako pierwszy, a boczne za nim.
    let stones = null, sideStones = null;
    if (r.stones.length) {
      stones = pack(r.stones[0]);
      if (r.stones.length > 1) {
        let s = r.stones[1];
        for (let i = 2; i < r.stones.length; i++) s = s.add(r.stones[i]);
        sideStones = pack(s);
      }
    }

    const transfer = [metal.positions.buffer, metal.indices.buffer];
    if (stones) transfer.push(stones.positions.buffer, stones.indices.buffer);
    if (sideStones) transfer.push(sideStones.positions.buffer, sideStones.indices.buffer);

    self.postMessage({
      seq, ok: true, workerVersion: WORKER_VERSION, metal, stones, sideStones,
      stoneCount: r.stones.length,
      stoneMassG: r.stoneMassG,
      caratTotal: r.caratTotal,
      volumeMm3: r.volumeMm3,
      massG: r.massG,
      genus: r.genus,
      params: r.params,
    }, transfer);
  } catch (err) {
    // Niedozwolone zakucie rzuca stad z czytelnym komunikatem po polsku,
    // wiec nie tlumaczymy go ponownie na watku glownym.
    self.postMessage({ seq, ok: false, workerVersion: WORKER_VERSION, error: String(err?.message || err) });
  }
};
