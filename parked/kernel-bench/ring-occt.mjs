// ============================================================
// TEN SAM PIERSCIONEK, JADRO POWIERZCHNIOWE (OpenCascade przez replicad)
// ============================================================
// Te same wymiary co w wersji manifoldowej. Roznica jest w tym, ze tu
// polokragly przekroj jest PRAWDZIWYM lukiem, a nie lamana z szesnastu
// odcinkow, i dopiero eksport zamienia go na trojkaty.

import { setOC, draw, makeCylinder, exportSTEP } from "replicad";
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export const PARAMS = {
  innerDia: 17.2, width: 2.2, thickness: 1.6,
  stoneDia: 6.5, prongs: 4, prongDia: 0.9,
};

let ready = null;
export function init() {
  if (ready) return ready;
  const wasmPath = fileURLToPath(
    new URL("./node_modules/replicad-opencascadejs/src/replicad_single.wasm", import.meta.url)
  );
  // ZNALEZISKO DO PROTOKOLU: ten build OpenCascade konczy sie `export default`,
  // czyli jest modulem ESM, ale w galezi nodowej siega po `__dirname` i `require`,
  // ktorych w ESM nie ma. Bez tych dwoch podstawien proces gasnie z kodem 1,
  // BEZ zadnego komunikatu, a Node wypisuje caly zrodlowy plik zamiast bledu.
  // Manifold takiego obejscia nie potrzebuje ani w Node, ani w przegladarce.
  globalThis.__dirname = dirname(wasmPath);
  globalThis.require = createRequire(import.meta.url);

  ready = opencascade({ locateFile: () => wasmPath })
    .then((OC) => { setOC(OC); return OC; });
  return ready;
}

export async function build(p = PARAMS, { fillet = 0 } = {}) {
  await init();
  const ri = p.innerDia / 2;
  const hw = p.width / 2;

  // ---- szyna ----
  // Przekroj rysujemy w plaszczyznie XZ: X to promien, Z to szerokosc.
  // `halfEllipseTo` daje JEDEN luk, a nie lamana z szesnastu odcinkow jak
  // w wersji siatkowej, i to jest cala roznica miedzy jadrami. Polelipsa ma te same polosie co tamta lamana,
  // wiec obie bryly opisuja NAPRAWDE ten sam ksztalt. Bez tego porownanie
  // objetosci nie znaczyloby nic.
  //
  // UWAGA NA FLAGE `sweep`. Z wartoscia `true` luk wychodzi inny, a bryla jest
  // o 15 procent lzejsza. Nic nie zglasza bledu, model wyglada poprawnie,
  // a cena spada o 15 procent. Dlatego objetosc sprawdzamy WZOREM, a nie okiem:
  // polelipsa obrocona wokol osi ma objetosc z twierdzenia Pappusa,
  // 2*PI*Rsr*A, i to jest liczba, ktora musi sie zgadzac.
  const profile = draw([ri, -hw])
    .lineTo([ri, hw])
    .halfEllipseTo([ri, -hw], p.thickness, false)
    .close();

  let solid = profile.sketchOnPlane("XZ").revolve([0, 0, 1]);

  // Zaokraglenie robimy NA SZYNIE, przed dolaczeniem korony. Wywolane na
  // gotowej, zespawanej bryle pada przy kazdym promieniu, bo OpenCascade
  // probuje wtedy zaokraglic takze krawedzie styczne i zdegenerowane.
  // To jest realne ograniczenie, ale nie brak funkcji: na osobnych czesciach
  // dziala. Manifold nie ma tego operatora w ogole.
  if (fillet > 0) solid = solid.fillet(fillet);

  // ---- korona ----
  // Pierscionek lezy plasko, os w Z, wiec godzina dwunasta jest na +Y
  // w odleglosci `ro`. Korone budujemy w osi +Y, tak samo jak w manifoldzie.
  if (!p.prongs) return solid;          // sama szyna, do kontroli wzorem

  const ro = ri + p.thickness;
  const seatR = p.stoneDia / 2;
  const prongH = p.stoneDia * 0.95;
  const dir = [0, 1, 0];
  const at = (x, z, off) => [x, ro + off, z];

  for (let i = 0; i < p.prongs; i++) {
    const a = (i / p.prongs) * Math.PI * 2 + Math.PI / 4;
    const prong = makeCylinder(p.prongDia / 2, prongH,
      at(Math.cos(a) * seatR, Math.sin(a) * seatR, -0.6), dir);
    solid = solid.fuse(prong);
  }
  const basket = makeCylinder(seatR + p.prongDia / 2, 1.2, at(0, 0, -1.0), dir);
  solid = solid.fuse(basket);

  const seat = makeCylinder(seatR, p.stoneDia * 0.62, at(0, 0, -0.3), dir);
  solid = solid.cut(seat);

  return solid;
}

/**
 * Objetosc liczymy z siatki, a nie z jadra, bo ta wersja replicada nie wystawia
 * `volume`, a nam i tak zalezy na porownaniu apples to apples: obie strony
 * dostaja te sama miare, liczona tak samo.
 */
export function meshVolume(vertices, triangles) {
  let v = 0;
  for (let i = 0; i < triangles.length; i += 3) {
    const a = triangles[i] * 3, b = triangles[i + 1] * 3, c = triangles[i + 2] * 3;
    const ax = vertices[a], ay = vertices[a + 1], az = vertices[a + 2];
    const bx = vertices[b], by = vertices[b + 1], bz = vertices[b + 2];
    const cx = vertices[c], cy = vertices[c + 1], cz = vertices[c + 2];
    v += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  return Math.abs(v);
}

export function report(solid, tolerance = 0.05) {
  const mesh = solid.mesh({ tolerance, angularTolerance: 15 });
  return {
    trojkatow: mesh.triangles.length / 3,
    wierzcholkow: mesh.vertices.length / 3,
    objetoscMm3: meshVolume(mesh.vertices, mesh.triangles),
    scian: solid.faces.length,
  };
}

/** `exportSTEP` przyjmuje LISTE opisow ksztaltu, nie sam ksztalt. */
export function toSTEP(solid) {
  return exportSTEP([{ shape: solid, name: "pierscionek" }]);
}
