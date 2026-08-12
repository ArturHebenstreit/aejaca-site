// ============================================================
// TEN SAM PIERSCIONEK, JADRO SIATKOWE (manifold-3d)
// ============================================================
// Zadanie porownawcze: szyna polokragla, gniazdo pod brylant, cztery lapki.
// Wymiary sa te same co w wersji na OpenCascade, zeby porownanie mialo sens.

import Module from "manifold-3d";

export const PARAMS = {
  innerDia: 17.2,   // mm
  width: 2.2,       // szerokosc szyny
  thickness: 1.6,   // grubosc szyny
  stoneDia: 6.5,    // rondysta
  prongs: 4,
  prongDia: 0.9,
};

const deg = (d) => (d * Math.PI) / 180;

// PULAPKA z prototypu: `revolve` przy profilu nawinietym zgodnie z zegarem
// zwraca bryle PUSTA, bez bledu i bez ostrzezenia. Liczymy pole sami.
function ccw(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a < 0 ? [...pts].reverse() : pts;
}

export async function build(p = PARAMS, segments = 96) {
  const wasm = await Module();
  wasm.setup();
  const { Manifold, CrossSection } = wasm;

  const ri = p.innerDia / 2;
  const ro = ri + p.thickness;
  const hw = p.width / 2;

  // ---- szyna: przekroj polokragly obrocony wokol osi pierscionka ----
  // Polokragly profil budujemy z odcinkow, bo jadro siatkowe i tak wszystko
  // zamienia na trojkaty. To jest istota roznicy wobec OpenCascade.
  const arc = [];
  const STEPS = 16;
  for (let i = 0; i <= STEPS; i++) {
    const t = deg(180 * (i / STEPS));
    arc.push([ri + p.thickness * Math.sin(t), -hw * Math.cos(t)]);
  }
  const profile = [[ri, -hw], ...arc, [ri, hw]];
  const shank = Manifold.revolve(CrossSection.ofPolygons([ccw(profile)]), segments);

  // ---- korona ----
  // `revolve` obraca przekroj wokol jego osi Y, a ta staje sie osia Z bryly.
  // Pierscionek lezy wiec plasko, a godzina dwunasta jest na osi +Y w odleglosci
  // `ro` od srodka. Korone budujemy wiec w osi +Z i dopiero obracamy w +Y,
  // inaczej lapki wisza w powietrzu, a bryla rozpada sie na kawalki.
  const seatR = p.stoneDia / 2;
  const prongH = p.stoneDia * 0.95;

  // `prongs: 0` znaczy sama szyna, bez korony. Ten wariant sluzy kontroli
  // objetosci wzorem, wiec nie moze sie wywracac na pustej koronie.
  if (!p.prongs) return { manifold: shank, wasm };

  let crown = null;
  for (let i = 0; i < p.prongs; i++) {
    const a = (i / p.prongs) * Math.PI * 2 + Math.PI / 4;
    const prong = Manifold.cylinder(prongH, p.prongDia / 2, p.prongDia / 2, 24, false)
      .translate([Math.cos(a) * seatR, Math.sin(a) * seatR, -0.6]);
    crown = crown ? crown.add(prong) : prong;
  }
  // Kosz pod lapkami, zeby korona trzymala sie szyny jedna bryla, a nie
  // czterema slupkami stykajacymi sie z nia punktowo.
  // Walec, nie stozek, bo drugie jadro walec robi jedna komenda, a stozek
  // wymaga obrotu profilu. Porownujemy jadra, nie nasza pomyslowosc.
  const basket = Manifold.cylinder(1.2, seatR + p.prongDia / 2, seatR + p.prongDia / 2, 48, false)
    .translate([0, 0, -1.0]);
  crown = crown.add(basket);

  const place = (m) => m.rotate([-90, 0, 0]).translate([0, ro, 0]);

  // Gniazdo odejmujemy PO zlaczeniu korony z szyna, nie przed. Kolejnosc nie
  // jest kosmetyczna: ciete przed zlaczeniem gniazdo nie siega szyny i bryla
  // wychodzi o kilkanascie procent ciezsza, czyli tez drozsza.
  const seat = Manifold.cylinder(p.stoneDia * 0.62, seatR, seatR, 48, false)
    .translate([0, 0, -0.3]);

  const solid = shank.add(place(crown)).subtract(place(seat));
  return { manifold: solid, wasm };
}

export function report(solid) {
  const mesh = solid.getMesh();
  return {
    trojkatow: mesh.numTri,
    wierzcholkow: mesh.numVert,
    objetoscMm3: solid.volume(),
    genus: solid.genus(),          // 1 dla obraczki, potwierdza ze dziura istnieje
    pustaBryla: solid.isEmpty(),
  };
}
