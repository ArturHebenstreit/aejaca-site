#!/usr/bin/env node
// ============================================================
// PLIKI KREATORA: siatka bez zdublowanych wierzcholkow i zerowych trojkatow
// ============================================================
// Jadro oddaje siatke zamknieta, ale z parami wierzcholkow blizej siebie niz
// rozdzielczosc pliku. Slicer widzi wtedy trojkat o zerowym polu i zglasza
// blad siatki, mimo ze bryla jest poprawna. Kontrola negatywna: siatka
// z takim wierzcholkiem podana wprost, z pominieciem jadra.
import assert from "node:assert/strict";
import { siatkaDoZapisu, toSTL, to3MF } from "./ringExport.js";
import { unzipSync, strFromU8 } from "fflate";

// Szescian 1 mm: 8 wierzcholkow, 12 trojkatow, nawiniecie na zewnatrz.
const V = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];
const T = [
  [0, 2, 1], [0, 3, 2],   // dol
  [4, 5, 6], [4, 6, 7],   // gora
  [0, 1, 5], [0, 5, 4],   // przod
  [1, 2, 6], [1, 6, 5],   // prawo
  [2, 3, 7], [2, 7, 6],   // tyl
  [3, 0, 4], [3, 4, 7],   // lewo
];
// Wierzcholek 8 to kopia wierzcholka 1 przesunieta o 0,03 mikrometra, czyli
// ponizej rozdzielczosci pliku. Jeden trojkat wskazuje na kopie, a jeden
// dodatkowy jest zdegenerowany: dwa jego rogi to ten sam punkt.
const vert = [...V, [1 + 3e-8, 0, 0]];
const tri = [...T.slice(0, 4), [0, 8, 5], ...T.slice(5), [1, 8, 5]];
const zepsuty = {
  getMesh: () => ({
    numProp: 3,
    numVert: vert.length,
    numTri: tri.length,
    vertProperties: Float32Array.from(vert.flat()),
    triVerts: Uint32Array.from(tri.flat()),
  }),
};

const s = siatkaDoZapisu(zepsuty);
assert.equal(s.numVert, 8, "kopia wierzcholka ma zostac zlepiona z oryginalem");
assert.equal(s.numTri, 12, "trojkat o zerowym polu ma wypasc");

// Kazda krawedz dokladnie raz w kazda strone: siatka zamknieta i spojnie
// nawinieta, a wiec bez otworu po wyrzuconym trojkacie.
const krawedzie = new Map();
for (let i = 0; i < s.numTri; i++) {
  const t = s.trojkaty.slice(i * 3, i * 3 + 3);
  for (let k = 0; k < 3; k++) {
    const e = `${t[k]}>${t[(k + 1) % 3]}`;
    krawedzie.set(e, (krawedzie.get(e) || 0) + 1);
  }
}
for (const [e, n] of krawedzie) {
  assert.equal(n, 1, `krawedz ${e} powtorzona`);
  const [a, b] = e.split(">");
  assert.ok(krawedzie.has(`${b}>${a}`), `krawedz ${e} bez pary`);
}

// STL: liczba trojkatow z naglowka zgodna z czysta siatka, objetosc 1 mm3.
const stl = toSTL(zepsuty, "test");
assert.equal(stl.readUInt32LE(80), 12);
assert.equal(stl.length, 84 + 12 * 50);
let objetosc = 0;
for (let i = 0; i < 12; i++) {
  const o = 84 + i * 50 + 12;
  const p = [0, 1, 2].map((j) => [stl.readFloatLE(o + j * 12), stl.readFloatLE(o + j * 12 + 4), stl.readFloatLE(o + j * 12 + 8)]);
  const [a, b, c] = p;
  objetosc += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
}
assert.ok(Math.abs(objetosc - 1) < 1e-6, `objetosc STL ${objetosc}`);

// 3MF: osiem wierzcholkow i dwanascie trojkatow w modelu.
const paczka = unzipSync(new Uint8Array(to3MF(zepsuty, "test")));
const model = strFromU8(paczka["3D/3dmodel.model"]);
assert.equal((model.match(/<vertex /g) || []).length, 8);
assert.equal((model.match(/<triangle /g) || []).length, 12);
assert.ok(model.includes('unit="millimeter"'));

console.log("ringExport: siatka do zapisu bez duplikatow i zerowych trojkatow, STL i 3MF zgodne");
