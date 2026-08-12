#!/usr/bin/env node
// ============================================================
// GENERATOR PIERSCIONKOW: prog akceptacji etapu pierwszego
// ============================================================
// Cztery rzeczy, ktore musza sie zgadzac, zanim powstanie jakikolwiek ekran:
//
//   1. Objetosc samej szyny zgodna ze WZOREM w granicy 2 procent.
//      Oba jadra potrafia po cichu oddac inna bryle, niz sie im zleca:
//      profil nawiniety zgodnie z zegarem daje bryle PUSTA, a zla flaga
//      luku pierscionek lzejszy o 15 procent. Zadne nie zglasza bledu,
//      model wyglada poprawnie, a cena jest falszywa.
//   2. Siatka zamknieta i o wlasciwej topologii dla kazdego zestawu.
//   3. Srednica wewnetrzna trafiona, bo od niej zalezy, czy pierscionek
//      w ogole wejdzie na palec.
//   4. Niedozwolone zakucia odrzucone, a nie po cichu poprawione.
//
// Wchodzi do builda.

import { buildRing, shankVolumeFormula, shankVolumeClosedForm, shankProfile, kernel } from "../src/geometry/ring/build.js";
import { CUTS, SETTINGS, validate } from "../src/geometry/ring/params.js";
import { CASTING_ALLOYS } from "../src/data/castingAlloys.js";

const PROG_OBJETOSC = 2.0;      // procent
const PROG_SREDNICA = 0.05;     // mm

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { failed++; console.error(`  ✗ ${m}`); };

// ------------------------------------------------------------
console.log("\n1. Objetosc szyny wobec wzoru");
// ------------------------------------------------------------
for (const profile of ["round", "flat", "knife", "comfort"]) {
  for (const [innerDia, width, thickness] of [[14.0, 1.4, 1.0], [17.2, 2.2, 1.6], [23.0, 8.0, 4.0]]) {
    const p = { innerDia, width, thickness, profile };
    const label = `${profile} ${innerDia}x${width}x${thickness}`;

    // Warstwa pierwsza: czy PRZEKROJ ma ksztalt, o ktory prosilismy.
    const zamkniety = shankVolumeClosedForm(p);
    const zWielokata = shankVolumeFormula(p);
    if (zamkniety !== null) {
      const d = (zWielokata / zamkniety - 1) * 100;
      if (Math.abs(d) > PROG_OBJETOSC) {
        bad(`${label}: przekroj odbiega od wzoru zamknietego o ${d.toFixed(2)} %`);
        continue;
      }
    }

    // Warstwa druga: czy JADRO poprawnie obrocilo ten przekroj.
    const zJadra = await buildShankOnly(p);
    const odch = (zJadra / zWielokata - 1) * 100;
    if (Math.abs(odch) <= PROG_OBJETOSC) {
      ok(`${label.padEnd(26)} jadro ${zJadra.toFixed(2)}, wzor ${zWielokata.toFixed(2)} mm3, odchylka ${odch.toFixed(2)} %`);
    } else {
      bad(`${label}: jadro ${zJadra.toFixed(2)} wobec wzoru ${zWielokata.toFixed(2)}, odchylka ${odch.toFixed(2)} % (prog ${PROG_OBJETOSC} %)`);
    }
  }
}

async function buildShankOnly(p) {
  const w = await kernel();
  const pts = shankProfile(p);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  const poly = a < 0 ? [...pts].reverse() : pts;
  return w.Manifold.revolve(w.CrossSection.ofPolygons([poly]), 256).volume();
}

// ------------------------------------------------------------
console.log("\n2. Dwadziescia zestawow: siatka, topologia, masa");
// ------------------------------------------------------------
const ZESTAWY = [
  { stone: { cut: "round", size: 6.5 }, setting: "prong4" },
  { stone: { cut: "round", size: 2.0 }, setting: "prong6" },
  { stone: { cut: "round", size: 10.0 }, setting: "bezel" },
  { stone: { cut: "oval", size: 7.0 }, setting: "prong6" },
  { stone: { cut: "cushion", size: 6.0 }, setting: "corner" },
  { stone: { cut: "square", size: 5.5 }, setting: "corner" },
  { stone: { cut: "octagon", size: 7.5 }, setting: "bezel" },
  { stone: { cut: "baguette", size: 4.0 }, setting: "channel" },
  { stone: { cut: "pentagon", size: 6.0 }, setting: "corner" },
  { stone: { cut: "trillion", size: 6.5 }, setting: "vprong" },
  { stone: { cut: "pear", size: 7.0 }, setting: "vprong" },
  { stone: { cut: "marquise", size: 6.0 }, setting: "vprong" },
  { stone: { cut: "heart", size: 6.5 }, setting: "vprong" },
  { stone: { cut: "briolette", size: 6.0 }, setting: "drilled" },
  { stone: { cut: "roseP", size: 6.0 }, setting: "prong4" },
  { stone: { cut: "bufftop", size: 7.0 }, setting: "bezel" },
  { stone: { cut: "roseFlat", size: 6.0 }, setting: "bezel" },
  { stone: { cut: "round", size: 5.0 }, setting: "prong4", side: { count: 5, setting: "pave", size: 1.6 } },
  { stone: { cut: "round", size: 5.0 }, setting: "prong4", side: { count: 3, setting: "channel", size: 2.0 } },
  { stone: { cut: "oval", size: 6.0 }, setting: "prong4", side: { count: 4, setting: "prong", size: 1.4 } },
  { kind: "signet", signet: { table: "oval", length: 14 } },
  { kind: "signet", signet: { table: "cushion", length: 16 } },
  { kind: "signet", signet: { table: "rect", length: 11 } },
];

for (const z of ZESTAWY) {
  const name = z.kind === "signet"
    ? `sygnet ${z.signet.table} ${z.signet.length}mm`
    : `${CUTS[z.stone.cut].pl} ${z.stone.size}mm ${SETTINGS[z.setting].pl}` +
      (z.side ? ` +${z.side.count}x2 ${z.side.setting}` : "");
  try {
    const r = await buildRing({ innerDia: 17.2, ...z }, { segments: 64 });
    const problems = [];
    if (r.isEmpty) problems.push("BRYLA PUSTA");
    if (r.volumeMm3 <= 0) problems.push("objetosc <= 0");
    // Pierscionek ma dokladnie jedna dziure na palec. Wieksze `genus` znaczy
    // przelot pod kamieniem, co jest poprawne, ale ujemne znaczy rozsypana bryle.
    if (r.genus < 1) problems.push(`genus ${r.genus}, bryla nie trzyma sie kupy`);
    if (!(r.massG > 0.2) || !(r.massG < 60)) problems.push(`masa ${r.massG.toFixed(2)} g poza rozsadkiem`);
    if (problems.length) bad(`${name}: ${problems.join("; ")}`);
    else ok(`${name.padEnd(38)} ${r.volumeMm3.toFixed(1)} mm3, ${r.massG.toFixed(2)} g, genus ${r.genus}`);
  } catch (e) {
    bad(`${name}: ${e.message}`);
  }
}

// ------------------------------------------------------------
console.log("\n3. Srednica wewnetrzna trafiona");
// ------------------------------------------------------------
for (const dia of [14.0, 16.6, 17.2, 19.1, 23.0]) {
  const r = await buildRing({ innerDia: dia, stone: { cut: "round", size: 5 }, setting: "prong4" },
    { segments: 256, withStones: false });
  // Najmniejszy promien w plaszczyznie pierscionka to jego srednica wewnetrzna.
  const mesh = r.metal.getMesh();
  let min = Infinity;
  for (let i = 0; i < mesh.numVert; i++) {
    const x = mesh.vertProperties[i * 3], y = mesh.vertProperties[i * 3 + 1];
    const rr = Math.hypot(x, y);
    if (rr < min) min = rr;
  }
  const got = min * 2;
  const err = got - dia;
  if (Math.abs(err) <= PROG_SREDNICA) ok(`zadano ${dia.toFixed(1)} mm, zmierzono ${got.toFixed(3)} mm`);
  else bad(`zadano ${dia.toFixed(1)} mm, zmierzono ${got.toFixed(3)} mm, blad ${err.toFixed(3)} mm (prog ${PROG_SREDNICA})`);
}

// ------------------------------------------------------------
console.log("\n4. Niedozwolone zakucia odrzucone");
// ------------------------------------------------------------
const ZAKAZANE = [
  ["marquise", "prong4",  "markiza w zwyklych lapkach odprysnie na szpicach"],
  ["bufftop",  "prong4",  "bufftop nie ma rondysty, lapka nie ma czego chwycic"],
  ["roseFlat", "prong6",  "rozeta plaska nie ma pawilonu"],
  ["briolette", "bezel",  "brioleta wisi, nie osadza sie w kasecie"],
  ["square",   "prong4",  "kwadrat wymaga lapek naroznych"],
  ["heart",    "corner",  "serce wymaga lapki V na wcieciu"],
];
for (const [cut, setting, why] of ZAKAZANE) {
  try {
    validate({ stone: { cut, size: 6 }, setting });
    bad(`${CUTS[cut].pl} + ${SETTINGS[setting].pl} PRZESZLO, a nie powinno: ${why}`);
  } catch {
    ok(`${(CUTS[cut].pl + " + " + SETTINGS[setting].pl).padEnd(34)} odrzucone`);
  }
}
// Kontrola pozytywna: dozwolone kombinacje maja przechodzic.
for (const [id, c] of Object.entries(CUTS)) {
  for (const s of c.settings) {
    try { validate({ stone: { cut: id, size: 6 }, setting: s }); }
    catch (e) { bad(`${c.pl} + ${SETTINGS[s].pl} odrzucone, a jest dozwolone: ${e.message}`); }
  }
}
ok("wszystkie dozwolone kombinacje szlif + zakucie przechodza");

// ------------------------------------------------------------
console.log("\n5. Kompensacja skurczu wchodzi do wzorca");
// ------------------------------------------------------------
for (const [id, a] of Object.entries(CASTING_ALLOYS)) {
  const r = await buildRing({ innerDia: 17.2, alloy: id, stone: { cut: "round", size: 5 }, setting: "prong4" },
    { segments: 64 });
  const ratio = r.patternVolumeMm3 / r.volumeMm3;
  const want = a.shrink ** 3;
  if (Math.abs(ratio - want) < 1e-9) ok(`${id.padEnd(6)} masa ${r.massG.toFixed(2)} g, wzorzec x${ratio.toFixed(4)} objetosciowo`);
  else bad(`${id}: wzorzec x${ratio.toFixed(4)}, oczekiwano x${want.toFixed(4)}`);
}

console.log(failed ? `\n${failed} bledow\n` : "\nGenerator pierscionkow: wszystko sie zgadza\n");
process.exit(failed ? 1 : 0);
