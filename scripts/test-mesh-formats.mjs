// Ten sam szescian 20x10x5 mm zapisany jako STL, OBJ i 3MF musi dac
// identyczna objetosc, pole i gabaryty. Inaczej klient placi rozne kwoty
// za ten sam model w zaleznosci od tego, co wyeksportowal.
import { parseMeshAsync } from "../src/pricing/mesh.js";
import { zipSync, strToU8 } from "fflate";
import { execFileSync } from "node:child_process";

const SX = 20, SY = 10, SZ = 5;

// Wierzcholki szescianu i sciany jako pary trojkatow (kolejnosc CCW na zewnatrz)
const V = [
  [0, 0, 0], [SX, 0, 0], [SX, SY, 0], [0, SY, 0],
  [0, 0, SZ], [SX, 0, SZ], [SX, SY, SZ], [0, SY, SZ],
];
const F = [
  [0, 2, 1], [0, 3, 2],   // dol
  [4, 5, 6], [4, 6, 7],   // gora
  [0, 1, 5], [0, 5, 4],
  [1, 2, 6], [1, 6, 5],
  [2, 3, 7], [2, 7, 6],
  [3, 0, 4], [3, 4, 7],
];

function binarySTL() {
  const buf = Buffer.alloc(84 + F.length * 50);
  buf.writeUInt32LE(F.length, 80);
  let o = 84;
  for (const f of F) {
    o += 12; // normalna zostaje zerowa, parser jej nie uzywa
    for (const idx of f) {
      buf.writeFloatLE(V[idx][0], o); buf.writeFloatLE(V[idx][1], o + 4); buf.writeFloatLE(V[idx][2], o + 8);
      o += 12;
    }
    o += 2;
  }
  return buf;
}

function objFile() {
  const lines = V.map((v) => `v ${v[0]} ${v[1]} ${v[2]}`);
  // Celowo mieszamy zapis: goly indeks, v/vt, v//vn oraz czworokat.
  lines.push("f 1//1 3//1 2//1", "f 1/1/1 4/2/1 3/3/1");
  lines.push("f 5 6 7 8");                       // czworokat -> wachlarz
  lines.push("f -8 -7 -3", "f 1 6 5");
  lines.push("f 2 3 7", "f 2 7 6");
  lines.push("f 3 4 8", "f 3 8 7");
  lines.push("f 4 1 5", "f 4 5 8");
  return Buffer.from(lines.join("\n"), "utf8");
}

function threeMF(unit = "millimeter", divisor = 1) {
  const verts = V.map((v) => `<vertex x="${v[0] / divisor}" y="${v[1] / divisor}" z="${v[2] / divisor}"/>`).join("");
  const tris = F.map((f) => `<triangle v1="${f[0]}" v2="${f[1]}" v3="${f[2]}"/>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="${unit}" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
  <object id="1" type="model"><mesh><vertices>${verts}</vertices><triangles>${tris}</triangles></mesh></object>
 </resources>
 <build><item objectid="1"/></build>
</model>`;
  return Buffer.from(zipSync({ "3D/3dmodel.model": strToU8(xml) }));
}


/**
 * 3MF zapisany apostrofami zamiast cudzyslowow.
 *
 * XML dopuszcza oba. Czesc eksporterow uzywa apostrofow, a nasz parser czytal
 * wylacznie cudzyslowy, wiec taki plik przechodzil przez cala sciezke bez
 * jednego trojkata i konczyl komunikatem "nie zawiera geometrii". Plik byl
 * poprawny, my go nie umielismy przeczytac.
 */
function threeMFapostrofy() {
  const verts = V.map((v) => `<vertex x='${v[0]}' y='${v[1]}' z='${v[2]}'/>`).join("");
  const tris = F.map((f) => `<triangle v1='${f[0]}' v2='${f[1]}' v3='${f[2]}'/>`).join("");
  const xml = `<?xml version='1.0' encoding='UTF-8'?>
<model unit='millimeter'><resources>
  <object id='1' type='model'><mesh><vertices>${verts}</vertices><triangles>${tris}</triangles></mesh></object>
 </resources><build><item objectid='1'/></build></model>`;
  return Buffer.from(zipSync({ "3D/3dmodel.model": strToU8(xml) }));
}

/**
 * 3MF w postaci PROJEKTU ze slicera, czyli tak, jak zapisuja Bambu Studio
 * i PrusaSlicer: `3D/3dmodel.model` niesie sam sklad sceny, a geometria lezy
 * w osobnym pliku i jest wolana przez atrybut p:path.
 *
 * To jest najczestszy 3MF, jaki klient ma na dysku, i wlasnie ten przypadek
 * konczyl sie u nas komunikatem "nie zawiera trojkatow". Cena po prostu sie
 * nie pojawiala, bez zadnego bledu.
 */
function threeMFprojekt() {
  const verts = V.map((v) => `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}"/>`).join("");
  const tris = F.map((f) => `<triangle v1="${f[0]}" v2="${f[1]}" v3="${f[2]}"/>`).join("");
  const geometria = `<?xml version="1.0"?><model unit="millimeter"><resources>
    <object id="1" type="model"><mesh><vertices>${verts}</vertices><triangles>${tris}</triangles></mesh></object>
  </resources></model>`;
  const sklad = `<?xml version="1.0"?><model unit="millimeter"><resources>
    <object id="2" type="model"><components><component p:path="/3D/Objects/object_1.model" objectid="1"/></components></object>
  </resources><build><item objectid="2"/></build></model>`;
  return Buffer.from(zipSync({
    "3D/3dmodel.model": strToU8(sklad),
    "3D/Objects/object_1.model": strToU8(geometria),
  }));
}

// STEP powstaje osobnym generatorem, bo opisuje bryle powierzchniami.
const stepBuf = execFileSync("node", [new URL("./make-step-fixture.mjs", import.meta.url).pathname]);

const cases = [
  ["cube.step", stepBuf],
  ["cube.stl", binarySTL()],
  ["cube.obj", objFile()],
  ["cube.3mf", threeMF()],
  ["cube-cm.3mf", threeMF("centimeter", 10)],
  ["cube-inch.3mf", threeMF("inch", 25.4)],
  ["cube-quotes.3mf", threeMFapostrofy()],
  ["cube-project.3mf", threeMFprojekt()],
];

const expected = { volumeCm3: (SX * SY * SZ) / 1000, surfaceAreaCm2: 2 * (SX * SY + SX * SZ + SY * SZ) / 100 };
let bad = 0;

for (const [name, buf] of cases) {
  const r = await parseMeshAsync(buf, name);
  const dv = Math.abs(r.volumeCm3 - expected.volumeCm3);
  const ds = Math.abs(r.surfaceAreaCm2 - expected.surfaceAreaCm2);
  const db = Math.abs(r.bbox.x - SX / 10) + Math.abs(r.bbox.y - SY / 10) + Math.abs(r.bbox.z - SZ / 10);
  const ok = dv < 1e-6 && ds < 1e-6 && db < 1e-6;
  if (!ok) bad++;
  console.log(
    `${ok ? "OK  " : "BLAD"} ${name.padEnd(14)} obj=${r.volumeCm3.toFixed(6)} cm3  pole=${r.surfaceAreaCm2.toFixed(4)} cm2  ` +
    `bbox=${r.bbox.x.toFixed(2)}x${r.bbox.y.toFixed(2)}x${r.bbox.z.toFixed(2)} cm  trojkaty=${r.triangleCount}`
  );
}

console.log(`\noczekiwano: obj=${expected.volumeCm3} cm3  pole=${expected.surfaceAreaCm2} cm2`);
console.log(bad ? `\n${bad} przypadkow niezgodnych` : "\nwszystkie formaty zgodne");
process.exit(bad ? 1 : 0);
