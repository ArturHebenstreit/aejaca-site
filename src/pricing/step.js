// ============================================================
// STEP: tesselacja jadrem CAD
// ============================================================
// STEP nie jest siatka. Opisuje bryle powierzchniami i krzywymi, wiec zeby
// policzyc objetosc, trzeba go najpierw zamienic na trojkaty. Robi to
// OpenCascade skompilowany do WebAssembly, ten sam po obu stronach:
// w przegladarce dla podgladu i na serwerze dla ceny wiazacej.
//
// Modul wazy okolo 7 MB, wiec ladujemy go leniwie i tylko raz. Klient,
// ktory nigdy nie wgra STEP-a, nie sciagnie ani bajta.

let occtPromise = null;

/**
 * Adres pliku .wasm w przegladarce.
 * Kopiowany do public/wasm/ przez scripts/copy-occt-wasm.mjs, bo bundler
 * nie umie sam podac go modulowi Emscriptena.
 */
const BROWSER_WASM = "/wasm/occt-import-js.wasm";

function loadOcct() {
  if (occtPromise) return occtPromise;

  occtPromise = import("occt-import-js").then((mod) => {
    const factory = mod.default || mod;
    const inBrowser = typeof window !== "undefined";
    return factory(inBrowser ? { locateFile: () => BROWSER_WASM } : undefined);
  });
  return occtPromise;
}

export class StepError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Trojkaty z pliku STEP, w milimetrach.
 *
 * OCCT zwraca kazda bryle osobno, a plik moze zawierac zlozenie. Sklejamy
 * wszystkie w jedna liste, bo wyceniamy to, co klient kaze wydrukowac,
 * a nie pojedyncza czesc zlozenia.
 *
 * @param {ArrayBuffer|Uint8Array} input
 * @returns {Promise<number[][][]>}
 */
export async function parseSTEPTriangles(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const occt = await loadOcct();

  let result;
  try {
    result = occt.ReadStepFile(bytes, null);
  } catch (e) {
    throw new StepError("file_unreadable", `Nie udało się odczytać pliku STEP: ${e.message}`);
  }

  if (!result?.success) throw new StepError("file_unreadable", "Nie udało się odczytać pliku STEP");
  if (!result.meshes?.length) throw new StepError("file_unreadable", "Plik STEP nie zawiera brył");

  const triangles = [];
  for (const mesh of result.meshes) {
    const pos = mesh.attributes?.position?.array;
    const idx = mesh.index?.array;
    if (!pos || !idx) continue;

    for (let i = 0; i + 2 < idx.length; i += 3) {
      const a = idx[i] * 3;
      const b = idx[i + 1] * 3;
      const c = idx[i + 2] * 3;
      triangles.push([
        [pos[a], pos[a + 1], pos[a + 2]],
        [pos[b], pos[b + 1], pos[b + 2]],
        [pos[c], pos[c + 1], pos[c + 2]],
      ]);
    }
  }

  if (!triangles.length) throw new StepError("file_unreadable", "Tesselacja pliku STEP nie dała geometrii");
  return triangles;
}
