#!/usr/bin/env node
// ============================================================
// PRZYKLADOWY PLIK STEP DO TESTU
// ============================================================
// STEP opisuje bryle powierzchniami, nie trojkatami, wiec nie da sie go
// zlozyc recznie w kilku linijkach jak STL. Generujemy tu prostopadloscian
// 20 x 10 x 5 mm jako poprawny AP214 manifold_solid_brep, zeby test wiedzial,
// jakiej objetosci ma sie spodziewac.
//
//   node scripts/make-step-fixture.mjs > plik.step

const SX = 20, SY = 10, SZ = 5;

const V = [
  [0, 0, 0], [SX, 0, 0], [SX, SY, 0], [0, SY, 0],
  [0, 0, SZ], [SX, 0, SZ], [SX, SY, SZ], [0, SY, SZ],
];

// Sciany jako czworokaty, kolejnosc wierzcholkow przeciwnie do wskazowek
// patrzac z zewnatrz, plus normalna sciany.
const FACES = [
  { loop: [0, 3, 2, 1], n: [0, 0, -1] }, // dol
  { loop: [4, 5, 6, 7], n: [0, 0, 1] },  // gora
  { loop: [0, 1, 5, 4], n: [0, -1, 0] },
  { loop: [1, 2, 6, 5], n: [1, 0, 0] },
  { loop: [2, 3, 7, 6], n: [0, 1, 0] },
  { loop: [3, 0, 4, 7], n: [-1, 0, 0] },
];

const lines = [];
let id = 0;
const next = () => `#${++id}`;

const num = (x) => (Number.isInteger(x) ? `${x}.` : String(x));
const p3 = (v) => `(${num(v[0])},${num(v[1])},${num(v[2])})`;

function emit(text) {
  const ref = next();
  lines.push(`${ref} = ${text};`);
  return ref;
}

// Kontekst geometryczny
const uncA = emit("( NAMED_UNIT ( * ) SI_UNIT ( $, .STERADIAN. ) SOLID_ANGLE_UNIT ( ) )");
const uncP = emit("( NAMED_UNIT ( * ) PLANE_ANGLE_UNIT ( ) SI_UNIT ( $, .RADIAN. ) )");
const uncL = emit("( LENGTH_UNIT ( ) NAMED_UNIT ( * ) SI_UNIT ( .MILLI., .METRE. ) )");
const unc = emit(`UNCERTAINTY_MEASURE_WITH_UNIT (LENGTH_MEASURE( 1.0E-07 ), ${uncL}, 'distance_accuracy_value', 'NONE')`);
const ctx = emit(
  `( GEOMETRIC_REPRESENTATION_CONTEXT ( 3 ) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT ( ( ${unc} ) ) ` +
  `GLOBAL_UNIT_ASSIGNED_CONTEXT ( ( ${uncL}, ${uncP}, ${uncA} ) ) REPRESENTATION_CONTEXT ( 'NONE', 'WORKASPACE' ) )`
);

/** Punkty kartezjanskie dla wierzcholkow */
const pts = V.map((v) => emit(`CARTESIAN_POINT ( 'NONE', ${p3(v)} )`));
const vtx = pts.map((p) => emit(`VERTEX_POINT ( 'NONE', ${p} )`));

/** Krawedzie dzielone miedzy sciany, zeby bryla byla zamknieta */
const edgeCache = new Map();
function edgeCurve(a, b) {
  const key = a < b ? `${a}-${b}` : `${b}-${a}`;
  if (edgeCache.has(key)) return edgeCache.get(key);

  const from = a < b ? a : b;
  const to = a < b ? b : a;
  const dir = [V[to][0] - V[from][0], V[to][1] - V[from][1], V[to][2] - V[from][2]];
  const len = Math.hypot(...dir);
  const unit = dir.map((c) => c / len);

  const org = emit(`CARTESIAN_POINT ( 'NONE', ${p3(V[from])} )`);
  const d = emit(`DIRECTION ( 'NONE', ${p3(unit)} )`);
  const vec = emit(`VECTOR ( 'NONE', ${d}, ${num(len)} )`);
  const line = emit(`LINE ( 'NONE', ${org}, ${vec} )`);
  const ec = emit(`EDGE_CURVE ( 'NONE', ${vtx[from]}, ${vtx[to]}, ${line}, .T. )`);

  const rec = { ref: ec, from, to };
  edgeCache.set(key, rec);
  return rec;
}

const faceRefs = FACES.map(({ loop, n }) => {
  const oriented = loop.map((a, i) => {
    const b = loop[(i + 1) % loop.length];
    const e = edgeCurve(a, b);
    // Orientacja mowi, czy krawedz biegnie zgodnie z kierunkiem petli.
    const sameDir = e.from === a;
    return emit(`ORIENTED_EDGE ( 'NONE', *, *, ${e.ref}, ${sameDir ? ".T." : ".F."} )`);
  });

  const el = emit(`EDGE_LOOP ( 'NONE', ( ${oriented.join(", ")} ) )`);
  const fb = emit(`FACE_OUTER_BOUND ( 'NONE', ${el}, .T. )`);

  // Plaszczyzna sciany: punkt na sciance i uklad osi zgodny z normalna.
  const base = V[loop[0]];
  const axisDir = emit(`DIRECTION ( 'NONE', ${p3(n)} )`);
  // Kierunek odniesienia musi byc prostopadly do normalnej.
  const ref = Math.abs(n[0]) < 0.5 ? [1, 0, 0] : [0, 1, 0];
  const refDir = emit(`DIRECTION ( 'NONE', ${p3(ref)} )`);
  const org = emit(`CARTESIAN_POINT ( 'NONE', ${p3(base)} )`);
  const ax = emit(`AXIS2_PLACEMENT_3D ( 'NONE', ${org}, ${axisDir}, ${refDir} )`);
  const pl = emit(`PLANE ( 'NONE', ${ax} )`);

  return emit(`ADVANCED_FACE ( 'NONE', ( ${fb} ), ${pl}, .T. )`);
});

const shell = emit(`CLOSED_SHELL ( 'NONE', ( ${faceRefs.join(", ")} ) )`);
const brep = emit(`MANIFOLD_SOLID_BREP ( 'Box', ${shell} )`);

const originPt = emit("CARTESIAN_POINT ( 'NONE', (0.,0.,0.) )");
const zDir = emit("DIRECTION ( 'NONE', (0.,0.,1.) )");
const xDir = emit("DIRECTION ( 'NONE', (1.,0.,0.) )");
const originAx = emit(`AXIS2_PLACEMENT_3D ( 'NONE', ${originPt}, ${zDir}, ${xDir} )`);
const shapeRep = emit(`ADVANCED_BREP_SHAPE_REPRESENTATION ( 'Box', ( ${originAx}, ${brep} ), ${ctx} )`);

const appCtx = emit("APPLICATION_CONTEXT ( 'automotive design' )");
emit(`APPLICATION_PROTOCOL_DEFINITION ( 'international standard', 'automotive_design', 2000, ${appCtx} )`);
const prod = emit(`PRODUCT ( 'Box', 'Box', '', ( ${emit(`PRODUCT_CONTEXT ( 'NONE', ${appCtx}, 'mechanical' )`)} ) )`);
const pdf = emit(`PRODUCT_DEFINITION_FORMATION ( 'ANY', '', ${prod} )`);
const pd = emit(`PRODUCT_DEFINITION ( 'UNKNOWN', '', ${pdf}, ${emit(`PRODUCT_DEFINITION_CONTEXT ( 'detailed design', ${appCtx}, 'design' )`)} )`);
const pds = emit(`PRODUCT_DEFINITION_SHAPE ( 'NONE', 'NONE', ${pd} )`);
emit(`SHAPE_DEFINITION_REPRESENTATION ( ${pds}, ${shapeRep} )`);

const out = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION (( 'STEP AP214' ), '1' );
FILE_NAME ('box.step', '2026-01-01T00:00:00', ( '' ), ( '' ), 'AEJaCA fixture', '', '' );
FILE_SCHEMA (( 'AUTOMOTIVE_DESIGN' ));
ENDSEC;

DATA;
${lines.join("\n")}
ENDSEC;
END-ISO-10303-21;
`;

process.stdout.write(out);
