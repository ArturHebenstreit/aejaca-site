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
// 7: kanal wlewowy i stopka w podgladzie
// 8: wieniec halo osobno od kamieni bocznych, bo ma wlasny material
const WORKER_VERSION = 13;

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

    // Kanal i stopka ida do podgladu razem z metalem, bo sa z tego samego
    // materialu i klient ma zobaczyc, co dostanie w pliku. Do MASY nie
    // wchodza: ta idzie z `r.massG`, liczonej z samego wyrobu.
    const metal = pack(r.casting ? r.metal.add(r.casting) : r.metal);

    // Kamien centralny idzie OSOBNO od bocznych, bo moga byc z innego
    // materialu. Zlaczone w jedna siatke daloby sie narysowac tylko jedna
    // barwa i szafir w otoczeniu brylantow wygladalby jak brylant.
    // `buildRing` wklada centralny jako pierwszy, a boczne za nim.
    // `buildRing` uklada je w stalej kolejnosci: centralny, potem wieniec,
    // potem boczne. Kazda z tych trzech grup ma w formularzu WLASNY wybor
    // kamienia, wiec zlaczenie ich w jedna siatke odbieraloby dwom z nich
    // barwe: szafirowe halo wokol brylantu rysowaloby sie jak brylanty.
    const scal = (lista) => {
      let s = lista[0];
      for (let i = 1; i < lista.length; i++) s = s.add(lista[i]);
      return pack(s);
    };
    const ileHalo = r.stoneVolumesMm3.haloCount || 0;
    let stones = null, haloStones = null, sideStones = null;
    if (r.stones.length) {
      stones = pack(r.stones[0]);
      const wieniec = r.stones.slice(1, 1 + ileHalo);
      const boczne = r.stones.slice(1 + ileHalo);
      if (wieniec.length) haloStones = scal(wieniec);
      if (boczne.length) sideStones = scal(boczne);
    }

    const transfer = [metal.positions.buffer, metal.indices.buffer];
    for (const g of [stones, haloStones, sideStones]) {
      if (g) transfer.push(g.positions.buffer, g.indices.buffer);
    }

    self.postMessage({
      seq, ok: true, workerVersion: WORKER_VERSION, metal, stones, haloStones, sideStones,
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
