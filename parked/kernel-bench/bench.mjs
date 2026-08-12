// ============================================================
// POROWNANIE JADER: manifold-3d kontra OpenCascade
// ============================================================
// Pytanie, na ktore to odpowiada, brzmi: na czym budowac kreator
// pierscionkow, skoro klient ma dostac STL, 3MF, a docelowo tez STEP.
//
//   node bench.mjs
//
// Nie wchodzi do builda serwisu.

import { performance } from "node:perf_hooks";
import { writeFileSync, statSync, existsSync } from "node:fs";

const ROUNDS = 5;
const line = (s = "") => console.log(s);
const ms = (n) => n.toFixed(1).padStart(7) + " ms";

async function time(label, fn, rounds = ROUNDS) {
  await fn();                                   // rozgrzewka, poza pomiarem
  const t = [];
  for (let i = 0; i < rounds; i++) {
    const a = performance.now();
    await fn();
    t.push(performance.now() - a);
  }
  t.sort((x, y) => x - y);
  return { label, mediana: t[Math.floor(t.length / 2)], min: t[0], max: t[t.length - 1] };
}

line("=".repeat(64));
line("POROWNANIE JADER GEOMETRYCZNYCH, ten sam pierscionek");
line("szyna polokragla 17,2 x 2,2 x 1,6 mm, gniazdo 6,5 mm, 4 lapki");
line("=".repeat(64));

// ---------------------------------------------------------------
// manifold-3d
// ---------------------------------------------------------------
line("\n--- manifold-3d 3.5.1 ---");
const M = await import("./ring-manifold.mjs");

const tmStart = performance.now();
const { manifold: mSolid } = await M.build();
const tmFirst = performance.now() - tmStart;

const mRep = M.report(mSolid);
line(`  pierwsze uruchomienie (z wczytaniem wasm): ${ms(tmFirst)}`);
line(`  trojkatow:     ${mRep.trojkatow}`);
line(`  objetosc:      ${mRep.objetoscMm3.toFixed(2)} mm3`);
line(`  genus:         ${mRep.genus}   (1 = bryla ma dziure, czyli to obraczka)`);
line(`  pusta bryla:   ${mRep.pustaBryla}`);

const mTime = await time("manifold", async () => { const r = await M.build(); r.manifold.getMesh(); });
line(`  generowanie:   mediana ${ms(mTime.mediana)}  (min ${mTime.min.toFixed(1)} / max ${mTime.max.toFixed(1)})`);

// gestosc siatki przy roznej liczbie segmentow obrotu
for (const seg of [48, 96, 192]) {
  const t = await time(`seg${seg}`, async () => { await M.build(M.PARAMS, seg); }, 3);
  const { manifold } = await M.build(M.PARAMS, seg);
  line(`  segmentow ${String(seg).padStart(3)}: ${manifold.getMesh().numTri} trojkatow, ${ms(t.mediana)}`);
}

// ---------------------------------------------------------------
// OpenCascade przez replicad
// ---------------------------------------------------------------
line("\n--- OpenCascade (replicad 0.23.1) ---");
const O = await import("./ring-occt.mjs");

const toStart = performance.now();
await O.init();
const tInit = performance.now() - toStart;
line(`  wczytanie wasm:  ${ms(tInit)}`);

let oSolid, oRep, oErr = null;
try {
  const b = performance.now();
  oSolid = await O.build();
  const tBuild = performance.now() - b;
  oRep = O.report(oSolid);
  line(`  pierwsza budowa: ${ms(tBuild)}`);
  line(`  scian B-Rep:     ${oRep.scian}`);
  line(`  objetosc:        ${oRep.objetoscMm3.toFixed(2)} mm3`);
  line(`  trojkatow po teselacji (tol 0,05 mm): ${oRep.trojkatow}`);

  const oTime = await time("occt", async () => { await O.build(); }, 3);
  line(`  generowanie:     mediana ${ms(oTime.mediana)}  (min ${oTime.min.toFixed(1)} / max ${oTime.max.toFixed(1)})`);

  // teselacja przy roznej tolerancji: to jest odpowiednik segmentow w manifoldzie
  for (const tol of [0.2, 0.05, 0.01]) {
    const r = O.report(oSolid, tol);
    line(`  tolerancja ${String(tol).padEnd(5)}: ${r.trojkatow} trojkatow`);
  }
} catch (e) {
  oErr = e;
  line(`  BLAD BUDOWY: ${e.message}`);
}

// ---------------------------------------------------------------
// Zaokraglenie, czyli ryzyko numer jeden z planu
// ---------------------------------------------------------------
line("\n--- zaokraglenie przejsc (fillet) ---");
line("  manifold-3d:  brak operatora, zaokraglenie trzeba wpisac w profil");
if (!oErr) {
  try {
    const f = performance.now();
    const filleted = await O.build(O.PARAMS, { fillet: 0.3 });
    const tf = performance.now() - f;
    line(`  OpenCascade:  fillet 0,3 mm wykonany w ${ms(tf)}, objetosc ${O.report(filleted).objetoscMm3.toFixed(2)} mm3`);
  } catch (e) {
    line(`  OpenCascade:  fillet NIE PRZESZEDL: ${String(e && e.message || e).slice(0, 120)}`);
  }
}

// ---------------------------------------------------------------
// Eksport
// ---------------------------------------------------------------
line("\n--- eksport ---");
try {
  const mesh = mSolid.getMesh();
  const stl = meshToSTL(mesh);
  writeFileSync(new URL("./out-manifold.stl", import.meta.url), stl);
  line(`  manifold STL:   ${(stl.length / 1024).toFixed(0)} kB`);
} catch (e) { line(`  manifold STL:   blad ${e.message}`); }
line("  manifold STEP:  NIEMOZLIWY, jadro siatkowe nie zna powierzchni");

if (!oErr) {
  try {
    const step = O.toSTEP(oSolid);
    const buf = Buffer.from(await step.arrayBuffer());
    writeFileSync(new URL("./out-occt.step", import.meta.url), buf);
    line(`  OpenCascade STEP: ${(buf.length / 1024).toFixed(0)} kB`);
  } catch (e) { line(`  OpenCascade STEP: blad ${String(e && e.message || e).slice(0, 120)}`); }
}

// ---------------------------------------------------------------
function meshToSTL(mesh) {
  const n = mesh.numTri;
  const buf = Buffer.alloc(84 + n * 50);
  buf.writeUInt32LE(n, 80);
  const v = mesh.vertProperties, idx = mesh.triVerts;
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50;
    for (let k = 0; k < 3; k++) {
      const p = idx[i * 3 + k] * 3;
      buf.writeFloatLE(v[p], o + 12 + k * 12);
      buf.writeFloatLE(v[p + 1], o + 16 + k * 12);
      buf.writeFloatLE(v[p + 2], o + 20 + k * 12);
    }
  }
  return buf;
}

line("\n" + "=".repeat(64));
for (const f of ["out-manifold.stl", "out-occt.step"]) {
  const u = new URL("./" + f, import.meta.url);
  if (existsSync(u)) line(`  ${f.padEnd(20)} ${(statSync(u).size / 1024).toFixed(0)} kB`);
}

// ---------------------------------------------------------------
// STRAZNIK, ktory powinien wejsc do builda
// ---------------------------------------------------------------
// Oba jadra potrafia po cichu oddac inna bryle, niz sie im zleca, i zadne
// z nich nie zglasza przy tym bledu:
//   manifold      profil nawiniety zgodnie z zegarem daje bryle PUSTA,
//   OpenCascade   flaga `sweep` odwrocona daje pierscionek lzejszy o 15%.
// W obu razach model wyglada poprawnie, a cena jest falszywa. Jedyna obrona
// to porownanie objetosci z wartoscia policzona wzorem.
line("\n--- kontrola objetosci wzorem (twierdzenie Pappusa) ---");
{
  const P = M.PARAMS;
  const a = P.thickness, b = P.width / 2, ri = P.innerDia / 2;
  const pole = (Math.PI * a * b) / 2;
  const rSr = ri + (4 * a) / (3 * Math.PI);
  const wzor = 2 * Math.PI * rSr * pole;
  line(`  szyna wedlug wzoru:        ${wzor.toFixed(2)} mm3`);

  const { manifold: shankOnly } = await M.build({ ...P, prongs: 0, stoneDia: 0.001 });
  const mOdchyl = (shankOnly.volume() / wzor - 1) * 100;
  line(`  manifold, sama szyna:      ${shankOnly.volume().toFixed(2)} mm3   odchylka ${mOdchyl.toFixed(2)} %`);

  if (!oErr) {
    const oShank = await O.build({ ...O.PARAMS, prongs: 0, stoneDia: 0.001 });
    const oVol = O.report(oShank, 0.005).objetoscMm3;
    line(`  OpenCascade, sama szyna:   ${oVol.toFixed(2)} mm3   odchylka ${((oVol / wzor - 1) * 100).toFixed(2)} %`);
  }
  line(`  prog akceptacji: 2 %. Powyzej tego build ma sie wywalic.`);
}
