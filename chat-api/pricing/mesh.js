// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/pricing/mesh.js
// Regeneracja: npm run sync:pricing

// ============================================================
// PARSER MODELI - STL, OBJ, 3MF, STEP
// ============================================================
// Jeden wejsciowy punkt dla wszystkich formatow. Przegladarka uzywa go,
// zeby pokazac model, a backend zamowien, zeby policzyc wiazaca cene.
// Obie strony musza dostac te same liczby, dlatego objetosc liczy wspolne
// metricsFromTriangles z stl.js.
//
// STL, OBJ i 3MF to gotowe siatki trojkatow: odczyt jest natychmiastowy.
// STEP opisuje bryle powierzchniami, wiec najpierw idzie przez tesselacje
// jadrem OpenCascade (step.js) i dlatego wymaga wersji asynchronicznej.

import { parseSTL, metricsFromTriangles } from "./stl.js";
import { unzipSync, strFromU8 } from "fflate";

/** Formaty siatkowe: odczyt jest natychmiastowy i synchroniczny */
export const MESH_EXTENSIONS = ["stl", "obj", "3mf"];

/** Formaty CAD: wymagaja tesselacji jadrem OpenCascade, wiec sa asynchroniczne */
export const CAD_EXTENSIONS = ["step", "stp"];

/** Wszystko, co umiemy wycenic bez udzialu czlowieka */
export const SUPPORTED_EXTENSIONS = [...MESH_EXTENSIONS, ...CAD_EXTENSIONS];

/** Mnozniki do milimetra dla jednostek deklarowanych w 3MF */
const MM_PER_UNIT = {
  micron: 0.001,
  millimeter: 1,
  centimeter: 10,
  inch: 25.4,
  foot: 304.8,
  meter: 1000,
};

export class MeshError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function extensionOf(fileName = "") {
  const parts = String(fileName).toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

/**
 * @param {ArrayBuffer|Uint8Array} input
 * @param {string} fileName rozszerzenie decyduje o parserze
 * @returns {{volumeCm3:number, bbox:{x:number,y:number,z:number}, surfaceAreaCm2:number, triangleCount:number, triangles:number[][][]}}
 */
export function parseMesh(input, fileName = "") {
  const ext = extensionOf(fileName);
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (ext === "stl") {
    // parseSTL czyta z ArrayBuffer, wiec podajemy dokladnie ten wycinek.
    return parseSTL(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }
  if (ext === "obj") return metricsFromTriangles(parseOBJ(bytes));
  if (ext === "3mf") return metricsFromTriangles(parse3MF(bytes));

  if (CAD_EXTENSIONS.includes(ext)) {
    throw new MeshError("needs_async", `Format .${ext} wymaga parseMeshAsync`);
  }
  throw new MeshError("unsupported_format", `Format .${ext} nie jest obsługiwany`);
}

/**
 * Jedno wejscie dla wszystkich formatow, takze tych wymagajacych jadra CAD.
 *
 * Siatki czytamy tym samym kodem co wczesniej, wiec nic sie dla nich nie
 * zmienia. STEP przechodzi przez tesselacje, a dalej liczy sie identycznie:
 * ta sama objetosc, to samo pole, ta sama cena.
 *
 * @param {ArrayBuffer|Uint8Array} input
 * @param {string} fileName
 */
export async function parseMeshAsync(input, fileName = "") {
  const ext = extensionOf(fileName);
  if (!CAD_EXTENSIONS.includes(ext)) return parseMesh(input, fileName);

  const { parseSTEPTriangles, StepError } = await import("./step.js");
  try {
    return metricsFromTriangles(await parseSTEPTriangles(input));
  } catch (e) {
    if (e instanceof StepError) throw new MeshError(e.code, e.message);
    throw new MeshError("file_unreadable", `Nie udało się odczytać pliku .${ext}`);
  }
}

// ------------------------------------------------------------
// OBJ
// ------------------------------------------------------------
// Format tekstowy bez jednostek. Przyjmujemy milimetry, tak samo jak dla
// STL. Wielokaty rozbijamy wachlarzem, bo scianka w OBJ moze miec wiecej
// niz trzy wierzcholki.

function parseOBJ(bytes) {
  const text = new TextDecoder().decode(bytes);
  const verts = [];
  const triangles = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line[0] === "#") continue;

    if (line[0] === "v" && (line[1] === " " || line[1] === "\t")) {
      const p = line.slice(2).trim().split(/\s+/);
      verts.push([parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2])]);
      continue;
    }

    if (line[0] === "f" && (line[1] === " " || line[1] === "\t")) {
      const tokens = line.slice(2).trim().split(/\s+/);
      const face = [];
      for (const tok of tokens) {
        // Wierzcholek moze byc zapisany jako v, v/vt, v//vn lub v/vt/vn.
        const idxRaw = parseInt(tok.split("/")[0], 10);
        if (!Number.isFinite(idxRaw) || idxRaw === 0) continue;
        // Ujemny indeks liczy sie od konca listy wierzcholkow.
        const idx = idxRaw > 0 ? idxRaw - 1 : verts.length + idxRaw;
        const v = verts[idx];
        if (v) face.push(v);
      }
      for (let i = 2; i < face.length; i++) {
        triangles.push([face[0], face[i - 1], face[i]]);
      }
    }
  }

  if (!triangles.length) throw new MeshError("file_unreadable", "Plik OBJ nie zawiera ścianek");
  return triangles;
}

// ------------------------------------------------------------
// 3MF
// ------------------------------------------------------------
// Archiwum ZIP z modelem w XML. W przeciwienstwie do STL i OBJ format
// deklaruje jednostke, wiec skalujemy do milimetrow zamiast zgadywac.

/**
 * Atrybut XML, w apostrofach ALBO w cudzyslowach.
 *
 * XML dopuszcza oba, a czesc eksporterow uzywa apostrofow. Wczesniej kazdy
 * odczyt szukal wylacznie cudzyslowow, wiec taki plik przechodzil przez
 * parser bez jednego trojkata i konczyl komunikatem "nie zawiera geometrii".
 * Plik byl poprawny, my go nie umielismy przeczytac.
 */
function attr(name, src) {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(src || "");
  return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
}

/** Sciezka wewnatrz archiwum, bez wiodacego ukosnika i w jednej wielkosci liter. */
function normPath(pth) {
  return String(pth || "").replace(/^\/+/, "").toLowerCase();
}

function parse3MF(bytes) {
  let files;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new MeshError("file_unreadable", "Nie udało się otworzyć archiwum 3MF");
  }

  // Archiwum potrafi zawierac WIELE plikow .model. Bambu Studio i PrusaSlicer
  // zapisuja projekt tak, ze `3D/3dmodel.model` niesie sam sklad sceny, a
  // geometria lezy w `3D/Objects/*.model` i jest wolana przez atrybut p:path.
  // Czytanie tylko pierwszego znalezionego pliku dawalo wiec pusty wynik dla
  // kazdego projektu ze slicera, czyli dla plikow, ktore klienci maja najczesciej.
  const modele = new Map();
  for (const nazwa of Object.keys(files)) {
    if (nazwa.toLowerCase().endsWith(".model")) modele.set(normPath(nazwa), strFromU8(files[nazwa]));
  }
  if (!modele.size) throw new MeshError("file_unreadable", "Brak modelu w archiwum 3MF");

  const KORZEN = normPath("3D/3dmodel.model");
  const glownaSciezka = modele.has(KORZEN) ? KORZEN : [...modele.keys()][0];
  const glowny = modele.get(glownaSciezka);

  const scale = MM_PER_UNIT[(attr("unit", /<model\b[^>]*>/i.exec(glowny)?.[0] || "") || "millimeter").toLowerCase()] ?? 1;

  // Klucz obiektu to sciezka pliku ORAZ id, bo numeracja zaczyna sie od nowa
  // w kazdym pliku i "1" z dwoch roznych plikow to dwa rozne obiekty.
  const objects = new Map();
  for (const [sciezka, xml] of modele) {
    for (const [id, obj] of collectObjects(xml)) objects.set(`${sciezka}|${id}`, { ...obj, sciezka });
  }
  if (!objects.size) throw new MeshError("file_unreadable", "Plik 3MF nie zawiera geometrii");

  const triangles = [];
  const items = [...glowny.matchAll(/<item\b([^>]*)\/?>/gi)];

  if (items.length) {
    for (const [, attrs] of items) {
      const id = attr("objectid", attrs);
      if (!id) continue;
      const sciezka = normPath(attr("p:path", attrs) || attr("path", attrs) || glownaSciezka);
      emitObject(objects, id, sciezka, matrixFrom(attrs), scale, triangles, 0);
    }
  }

  // Bez sekcji build, albo gdy sklad sceny nie doprowadzil do zadnego trojkata,
  // bierzemy wszystko, co ma wlasna siatke. Lepiej wycenic z calego archiwum
  // niz odmowic wyceny pliku, ktory geometrie ma.
  if (!triangles.length) {
    for (const [klucz, obj] of objects) {
      if (obj.mesh) {
        const [sciezka, id] = klucz.split("|");
        emitObject(objects, id, sciezka, null, scale, triangles, 0);
      }
    }
  }

  if (!triangles.length) throw new MeshError("file_unreadable", "Plik 3MF nie zawiera trójkątów");
  return triangles;
}

/** Mapa id -> { mesh, components } z surowego XML */
function collectObjects(xml) {
  const objects = new Map();
  const re = /<object\b([^>]*)>([\s\S]*?)<\/object>|<object\b([^>]*)\/>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1] ?? m[3] ?? "";
    const body = m[2] ?? "";
    const id = attr("id", attrs);
    if (!id) continue;

    const meshBody = /<mesh\b[^>]*>([\s\S]*?)<\/mesh>/i.exec(body)?.[1] || null;
    const components = [...body.matchAll(/<component\b([^>]*)\/?>/gi)].map(([, a]) => ({
      objectid: attr("objectid", a),
      // Komponent moze wskazywac obiekt w INNYM pliku archiwum.
      path: attr("p:path", a) || attr("path", a) || null,
      matrix: matrixFrom(a),
    }));

    objects.set(id, { mesh: meshBody, components });
  }
  return objects;
}

/**
 * Dopisuje trojkaty obiektu do wyniku, schodzac po komponentach.
 * Glebokosc jest ograniczona, zeby zapetlone odwolania nie zawiesily serwera.
 */
function emitObject(objects, id, sciezka, matrix, scale, out, depth) {
  if (depth > 8) return;
  const obj = objects.get(`${sciezka}|${id}`)
    // Zapas, gdy plik odwoluje sie do id bez podania sciezki, a obiekt lezy
    // w innym pliku archiwum. Lepiej znalezc go po samym id niz oddac pusta
    // wycene za plik, ktory geometrie ma.
    || [...objects.entries()].find(([k]) => k.endsWith(`|${id}`))?.[1];
  if (!obj) return;

  if (obj.mesh) {
    for (const tri of meshTriangles(obj.mesh)) {
      out.push(tri.map((v) => applyMatrix(v, matrix, scale)));
    }
  }
  for (const c of obj.components) {
    if (!c.objectid) continue;
    emitObject(objects, c.objectid, normPath(c.path || obj.sciezka), composeMatrix(matrix, c.matrix), scale, out, depth + 1);
  }
}

function meshTriangles(meshBody) {
  const verts = [];
  const vre = /<vertex\b([^>]*)\/?>/gi;
  let m;
  while ((m = vre.exec(meshBody)) !== null) {
    const a = m[1];
    verts.push([
      parseFloat(attr("x", a) || "0"),
      parseFloat(attr("y", a) || "0"),
      parseFloat(attr("z", a) || "0"),
    ]);
  }

  const tris = [];
  const tre = /<triangle\b([^>]*)\/?>/gi;
  while ((m = tre.exec(meshBody)) !== null) {
    const a = m[1];
    const i1 = parseInt(attr("v1", a) ?? "", 10);
    const i2 = parseInt(attr("v2", a) ?? "", 10);
    const i3 = parseInt(attr("v3", a) ?? "", 10);
    const v1 = verts[i1], v2 = verts[i2], v3 = verts[i3];
    if (v1 && v2 && v3) tris.push([v1, v2, v3]);
  }
  return tris;
}

/** Transformacja 3MF to 12 liczb: trzy kolumny obrotu i przesuniecie */
function matrixFrom(attrs) {
  const raw = attr("transform", attrs);
  if (!raw) return null;
  const n = raw.trim().split(/\s+/).map(Number);
  return n.length === 12 && n.every(Number.isFinite) ? n : null;
}

function applyMatrix(v, m, scale) {
  if (!m) return [v[0] * scale, v[1] * scale, v[2] * scale];
  return [
    (v[0] * m[0] + v[1] * m[3] + v[2] * m[6] + m[9]) * scale,
    (v[0] * m[1] + v[1] * m[4] + v[2] * m[7] + m[10]) * scale,
    (v[0] * m[2] + v[1] * m[5] + v[2] * m[8] + m[11]) * scale,
  ];
}

function composeMatrix(parent, child) {
  if (!parent) return child;
  if (!child) return parent;
  const r = new Array(12);
  for (let c = 0; c < 3; c++) {
    for (let row = 0; row < 3; row++) {
      r[c * 3 + row] = child[c * 3] * parent[row] + child[c * 3 + 1] * parent[row + 3] + child[c * 3 + 2] * parent[row + 6];
    }
  }
  for (let row = 0; row < 3; row++) {
    r[9 + row] = child[9] * parent[row] + child[10] * parent[row + 3] + child[11] * parent[row + 6] + parent[9 + row];
  }
  return r;
}
