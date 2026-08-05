// Analiza drukowalnosci: topologia, gabaryty, grubosc scianek, nawisy.
//
// Testujemy na siatkach zbudowanych recznie, o znanym z gory wyniku, bo bledy
// w geometrii sa ciche. Zle policzona grubosc nie wywala niczego, tylko mowi
// klientowi "wydrukuje sie", a klient dostaje odpad. Zly znak normalnej daje
// model, ktory na podgladzie wyglada dobrze i drukuje sie jako pelna kostka.
//
// Najwazniejszy przypadek to plyta 0,3 mm: ta sama geometria ma byc BLOKADA
// przy dyszy 0,4 i tylko ostrzezeniem przy 0,2. Cale narzedzie istnieje po to,
// zeby ta roznica byla widoczna przed drukiem, a nie po nim.

import assert from "node:assert/strict";
import {
  analyzeTopology, analyzeThickness, analyzeOverhangs, signedVolumeMm3,
  boundsOf, analyzePrintability, NOZZLES, MACHINES,
} from "../src/analysis/printability.js";

// ------------------------------------------------------------
// Siatki wzorcowe
// ------------------------------------------------------------

/** Prostopadloscian od (0,0,0) do (sx,sy,sz), normalne na zewnatrz. */
function box(sx, sy, sz, ox = 0, oy = 0, oz = 0) {
  const v = (x, y, z) => [ox + x, oy + y, oz + z];
  const a = v(0, 0, 0), b = v(sx, 0, 0), c = v(sx, sy, 0), d = v(0, sy, 0);
  const e = v(0, 0, sz), f = v(sx, 0, sz), g = v(sx, sy, sz), h = v(0, sy, sz);
  return [
    [a, c, b], [a, d, c],   // dol, normalna -Z
    [e, f, g], [e, g, h],   // gora, +Z
    [a, b, f], [a, f, e],   // przod, -Y
    [d, h, g], [d, g, c],   // tyl, +Y
    [a, e, h], [a, h, d],   // lewo, -X
    [b, c, g], [b, g, f],   // prawo, +X
  ];
}

const reverse = (tris) => tris.map(([p, q, r]) => [p, r, q]);

// ------------------------------------------------------------
// Topologia
// ------------------------------------------------------------

{
  const t = analyzeTopology(box(10, 10, 10));
  assert.equal(t.triangleCount, 12);
  assert.equal(t.edgeCount, 18, "szescian ma 18 krawedzi po sklejeniu wierzcholkow");
  assert.equal(t.boundaryEdges, 0, "bryla zamknieta nie ma krawedzi brzegowych");
  assert.equal(t.nonManifoldEdges, 0);
  assert.equal(t.reversedFaces, 0, "spojne nawiniecie nie daje odwroconych scianek");
  assert.equal(t.degenerate, 0);
  assert.ok(t.isWatertight);
}

{
  // Sklejanie wierzcholkow: te same punkty zapisane z szumem float32 musza
  // nadal tworzyc bryle zamknieta, inaczej kazdy realny plik bylby "dziurawy".
  const noisy = box(10, 10, 10).map((tri) => tri.map((p) => p.map((c) => c + (Math.random() - 0.5) * 1e-6)));
  const t = analyzeTopology(noisy);
  assert.ok(t.isWatertight, "szum ponizej precyzji float32 nie moze rozspajac siatki");
}

{
  // Szescian bez dna: cztery krawedzie brzegowe, czyli dziura.
  const open = box(10, 10, 10).slice(2);
  const t = analyzeTopology(open);
  assert.equal(t.boundaryEdges, 4, "brakujaca sciana zostawia 4 krawedzie brzegowe");
  assert.equal(t.isWatertight, false);
}

{
  // Trojkat zdegenerowany, o zerowym polu, nie moze psuc pozostalych liczb.
  const withBad = [...box(10, 10, 10), [[0, 0, 0], [1, 0, 0], [2, 0, 0]]];
  const t = analyzeTopology(withBad);
  assert.equal(t.degenerate, 1);
  assert.ok(t.isWatertight, "zdegenerowany trojkat jest pomijany, a nie liczony jako dziura");
}

// ------------------------------------------------------------
// Objetosc i orientacja
// ------------------------------------------------------------

assert.ok(Math.abs(signedVolumeMm3(box(10, 10, 10)) - 1000) < 1e-6, "szescian 10 mm ma 1000 mm3");
assert.ok(signedVolumeMm3(reverse(box(10, 10, 10))) < 0, "odwrocona siatka daje objetosc ujemna");
assert.deepEqual(boundsOf(box(30, 20, 10)).size, [30, 20, 10]);

// ------------------------------------------------------------
// Grubosc scianek
// ------------------------------------------------------------

{
  // Kostka 10 mm: z kazdego punktu w glab jest dokladnie 10 mm do drugiej strony.
  const th = analyzeThickness(box(10, 10, 10), { samples: 500 });
  assert.ok(Math.abs(th.median - 10) < 0.01, `mediana ${th.median} zamiast 10 mm`);
  assert.ok(Math.abs(th.min - 10) < 0.01, `minimum ${th.min} zamiast 10 mm`);
}

{
  // Plyta 0,3 mm: prawie cala powierzchnia to gora i dol, wiec p1 ma pokazac
  // grubosc plyty, a nie 40 mm mierzone wzdluz niej.
  const th = analyzeThickness(box(40, 40, 0.3), { samples: 2000 });
  assert.ok(Math.abs(th.p1 - 0.3) < 0.02, `p1 ${th.p1} zamiast 0,3 mm`);
  assert.ok(th.shareBelow(0.4) > 0.9, "ponad 90% powierzchni plyty jest cienszej niz 0,4 mm");
  assert.ok(th.shareBelow(0.2) < 0.05, "nic nie jest ciensze niz 0,2 mm");
}

{
  // Determinizm: ten sam plik ma dawac ten sam wynik przy kazdym wgraniu.
  const a = analyzeThickness(box(12, 8, 5), { samples: 400 });
  const b = analyzeThickness(box(12, 8, 5), { samples: 400 });
  assert.equal(a.p1, b.p1, "wynik musi byc powtarzalny, inaczej klient dostaje dwie rozne odpowiedzi");
  assert.equal(a.median, b.median);
}

// ------------------------------------------------------------
// Nawisy i przyleganie do stolu
// ------------------------------------------------------------

{
  const o = analyzeOverhangs(box(10, 10, 10));
  assert.ok(Math.abs(o.totalAreaMm2 - 600) < 1e-6, "szescian 10 mm ma 600 mm2 powierzchni");
  assert.ok(Math.abs(o.bedContactMm2 - 100) < 1e-6, "dno przylega calym polem 100 mm2");
  assert.equal(o.overhangAreaMm2, 0, "scianki pionowe i gorna nie sa nawisem");
}

{
  // Kostka uniesiona nad stolem, obok cienkiej podkladki wyznaczajacej poziom
  // stolu: dno kostki przestaje przylegac i staje sie nawisem do podparcia.
  const raised = box(10, 10, 10, 0, 0, 5);
  const o = analyzeOverhangs([...raised, ...box(2, 2, 0.1)]);
  assert.ok(o.overhangAreaMm2 > 90, "uniesione dno liczy sie jako nawis, a nie jako podstawa");
  assert.ok(o.bedContactMm2 < 10, "przylega tylko podkladka");
}

// ------------------------------------------------------------
// Progi zalezne od dyszy, czyli sedno narzedzia
// ------------------------------------------------------------

{
  const plate = box(40, 40, 0.3);
  const id = (r) => r.findings.map((f) => f.id);

  const n04 = analyzePrintability(plate, { tech: "fdm", nozzleId: "0.4", samples: 1200 });
  assert.ok(id(n04).includes("too_thin"), "0,3 mm przy dyszy 0,4 to blokada");
  assert.equal(n04.findings.find((f) => f.id === "too_thin").level, "blocker");

  const n02 = analyzePrintability(plate, { tech: "fdm", nozzleId: "0.2", samples: 1200 });
  assert.ok(!id(n02).includes("too_thin"), "przy dyszy 0,2 ta sama plyta juz nie jest blokada");
  assert.ok(id(n02).includes("thin"), "ale nadal jest ostrzezeniem, bo to jedna sciezka");

  const n08 = analyzePrintability(plate, { tech: "fdm", nozzleId: "0.8", samples: 1200 });
  assert.equal(n08.findings.find((f) => f.id === "too_thin").limit, 0.8, "prog rosnie razem z dysza");

  // MSLA ma wlasny prog, niezalezny od dyszy.
  const msla = analyzePrintability(plate, { tech: "msla", samples: 1200 });
  assert.ok(id(msla).includes("too_thin"), "0,3 mm w zywicy tez jest za cienkie");
  assert.equal(msla.nozzle, null, "przy MSLA dysza nie ma znaczenia");
}

{
  // Scianka 1 mm: przechodzi przy kazdej dyszy do 0,6 wlacznie.
  const wall = box(30, 30, 1.0);
  for (const n of ["0.2", "0.4", "0.6"]) {
    const r = analyzePrintability(wall, { tech: "fdm", nozzleId: n, samples: 1000 });
    const ids = r.findings.map((f) => f.id);
    assert.ok(!ids.includes("too_thin"), `1 mm ma przejsc przy dyszy ${n}`);
  }
  const big = analyzePrintability(wall, { tech: "fdm", nozzleId: "0.8", samples: 1000 });
  assert.ok(big.findings.some((f) => f.id === "thin"), "przy dyszy 0,8 scianka 1 mm to juz tylko jedna sciezka");
}

// ------------------------------------------------------------
// Gabaryty
// ------------------------------------------------------------

{
  const r = analyzePrintability(box(310, 100, 100), { tech: "fdm", samples: 200 });
  assert.equal(r.fits, true, "310 mm miesci sie po obrocie, bo os Z ma 325 mm");
  assert.equal(r.fitsOnlyRotated, true);
  assert.ok(r.findings.some((f) => f.id === "fits_rotated"));
}

{
  const r = analyzePrintability(box(400, 400, 400), { tech: "fdm", samples: 200 });
  assert.equal(r.fits, false);
  assert.equal(r.findings[0].id, "too_big", "blokada gabarytowa ma byc na wierzchu listy");
  assert.equal(r.findings[0].level, "blocker");
}

{
  // Ten sam model miesci sie na FDM, a nie miesci na mniejszym stole MSLA.
  const part = box(200, 110, 200);
  assert.equal(analyzePrintability(part, { tech: "fdm", samples: 200 }).fits, true);
  assert.equal(analyzePrintability(box(200, 150, 200), { tech: "msla", samples: 200 }).fits, false,
    "150 mm nie zmiesci sie w zadnej osi Saturna poza Z, a Z zajmuje juz 200 mm");
}

// ------------------------------------------------------------
// Skala i siatka nieszczelna
// ------------------------------------------------------------

{
  const r = analyzePrintability(box(1.2, 1.2, 1.2), { tech: "fdm", samples: 200 });
  assert.equal(r.suspiciousScale, "small");
  assert.ok(r.findings.some((f) => f.id === "scale_small"), "model wielkosci ziarnka to zwykle zla jednostka");
}

{
  const open = box(20, 20, 20).slice(2);
  const r = analyzePrintability(open, { tech: "fdm", samples: 300 });
  const ids = r.findings.map((f) => f.id);
  assert.ok(ids.includes("holes"), "dziura ma byc zgloszona");
  assert.equal(r.thickness, null, "gruboscia nie mierzymy na siatce nieszczelnej");
  assert.ok(ids.includes("thickness_skipped"), "i trzeba o tym powiedziec wprost, a nie milczec");
}

{
  const r = analyzePrintability(reverse(box(20, 20, 20)), { tech: "fdm", samples: 300 });
  assert.equal(r.inverted, true);
  assert.ok(r.findings.some((f) => f.id === "inverted"));
  assert.ok(Math.abs(r.volumeCm3 - 8) < 1e-6, "objetosc podajemy dodatnia mimo odwroconej siatki");
}

// ------------------------------------------------------------
// Dane maszyn
// ------------------------------------------------------------

assert.equal(MACHINES.fdm.build.x, 300);
assert.equal(MACHINES.msla.build.y, 123);
assert.equal(NOZZLES.filter((n) => n.inHouse).map((n) => n.id).join(","), "0.2,0.4",
  "w pracowni pracujemy dysza 0,2 i 0,4; wieksze sa do analizy, nie do obietnicy");
for (const n of NOZZLES) {
  assert.ok(n.safe > n.min, `dysza ${n.id}: prog bezpieczny musi byc wyzszy niz minimalny`);
  assert.ok(Math.abs(n.min - n.dia) < 1e-9, `dysza ${n.id}: jedna sciezka rowna sie srednicy dyszy`);
}

console.log("Drukowalnosc: topologia, objetosc, grubosc, nawisy, gabaryty i progi dysz zgodne");
