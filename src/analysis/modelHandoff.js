// ============================================================
// PRZEKAZANIE MODELU Z KONFIGURATORA DO STRONY ANALIZY
// ============================================================
// Bramka drukowalnosci pokazuje skrot ustalen i odsyla po pelna analize pod
// `/toolstudio/printability/`. Do tej pory byl to goly odnosnik, wiec klient
// ladowal ten sam plik drugi raz, recznie ustawiajac te sama technologie i te
// sama dysze. Kazdy z tych krokow mozna wykonac inaczej niz w konfiguratorze,
// a wtedy pelna analiza odpowiada na inne pytanie niz to, ktore ja wywolalo.
//
// Przekazujemy SIATKE, a nie plik. Powod jest rzeczowy: w konfiguratorze klient
// mogl zmienic wielkosc wydruku, a bramka analizowala model PO przeskalowaniu.
// Ponowne wczytanie pliku daloby oryginal i inny werdykt przy tych samych
// ustawieniach. Przekazujemy tez technologie i dysze, bo to one zmieniaja
// odpowiedz, i nazwe pliku, zeby bylo widac, ze to ten sam model.
//
// Nosnikiem jest IndexedDB, bo docelowa strona otwiera sie w NOWEJ KARCIE.
// Pamiec modulu tego nie przekroczy, `postMessage` wymaga uchwytu do okna i
// gubi sie przy wolnym starcie, a `sessionStorage` nie przyjmie tablicy
// typowanej bez kosztownej zamiany na tekst. IndexedDB klonuje `Float32Array`
// binarnie i jest widoczna we wszystkich kartach tego samego pochodzenia.
//
// Zapis nie narusza obietnicy "plik nie opuszcza przegladarki": IndexedDB
// lezy na dysku klienta, my go nie widzimy. Rekord kasujemy przy odczycie i
// odrzucamy po kwadransie, zeby model nie czekal w przegladarce na kogos,
// kto otworzy narzedzie tydzien pozniej i nie bedzie wiedzial, skad sie wzial.

const DB_NAME = "aejaca-model-handoff";
const STORE = "mesh";
const KEY = "current";
const MAX_AGE_MS = 15 * 60_000;

/** Znacznik w adresie. Strona analizy siega po rekord tylko z nim. */
export const HANDOFF_PARAM = "model";
export const HANDOFF_VALUE = "handoff";
export const HANDOFF_URL = `/toolstudio/printability/?${HANDOFF_PARAM}=${HANDOFF_VALUE}`;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("no-idb")); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("blocked"));
  });
}

function run(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const out = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(out?.result ?? null);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Odklada siatke dla strony analizy.
 *
 * Awaria zapisu nie moze przerwac przejscia: klient trafi na narzedzie z pustym
 * formularzem, czyli tam, gdzie trafial dotad. To jest gorsze, ale dziala.
 *
 * @param {{positions: Float32Array, tech: "fdm"|"msla", nozzleId?: string, name?: string, scale?: number}} record
 * @returns {Promise<boolean>} czy sie udalo
 */
export async function saveModelHandoff(record) {
  let db;
  try {
    db = await openDb();
    await run(db, "readwrite", (store) =>
      store.put({ ...record, savedAt: Date.now() }, KEY)
    );
    return true;
  } catch {
    return false;
  } finally {
    db?.close();
  }
}

/** Odczytuje i od razu kasuje rekord. Zwraca `null`, gdy go nie ma albo jest stary. */
export async function takeModelHandoff() {
  let db;
  try {
    db = await openDb();
    const record = await run(db, "readonly", (store) => store.get(KEY));
    if (!record) return null;
    await run(db, "readwrite", (store) => store.delete(KEY));
    if (!record.positions?.length) return null;
    if (Date.now() - (record.savedAt || 0) > MAX_AGE_MS) return null;
    return record;
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

/**
 * Czeka na rekord, bo nowa karta potrafi wystartowac szybciej niz konczy sie
 * zapis duzej siatki w karcie zrodlowej. Bez tego dwustumegabajtowy model
 * gubilby sie losowo, a to najgorszy rodzaj bledu: dziala u nas, nie dziala
 * u klienta z wolniejszym dyskiem.
 */
export async function waitForModelHandoff(timeoutMs = 4000, stepMs = 120) {
  const koniec = Date.now() + timeoutMs;
  for (;;) {
    const record = await takeModelHandoff();
    if (record) return record;
    if (Date.now() >= koniec) return null;
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

/** Czy ten adres prosi o model z konfiguratora. */
export function wantsHandoff(search = typeof location !== "undefined" ? location.search : "") {
  return new URLSearchParams(search).get(HANDOFF_PARAM) === HANDOFF_VALUE;
}

/**
 * Plaska tablica pozycji z trojkatow parsera, od razu w skali zamowienia.
 *
 * Skalowanie MUSI sie dziac tutaj, a nie w kalkulatorach. Kazdy z nich
 * przeliczal dotad tylko objetosc i gabaryt, a siatke podawal analizie w
 * oryginale, wiec model zmniejszony do polowy mial polowe grubosci muru,
 * a bramka nadal widziala grubosc sprzed zmniejszenia i go przepuszczala.
 */
export function flattenTriangles(triangles, scale = 1) {
  const s = Number(scale) || 1;
  const positions = new Float32Array(triangles.length * 9);
  for (let i = 0, o = 0; i < triangles.length; i++, o += 9) {
    const [a, b, c] = triangles[i];
    positions[o] = a[0] * s; positions[o + 1] = a[1] * s; positions[o + 2] = a[2] * s;
    positions[o + 3] = b[0] * s; positions[o + 4] = b[1] * s; positions[o + 5] = b[2] * s;
    positions[o + 6] = c[0] * s; positions[o + 7] = c[1] * s; positions[o + 8] = c[2] * s;
  }
  return positions;
}

/** Odwrotnosc `flattenTriangles`: podglad i parser oczekuja zagniezdzonej postaci. */
export function trianglesFromPositions(positions) {
  const count = Math.floor(positions.length / 9);
  const triangles = new Array(count);
  for (let i = 0, o = 0; i < count; i++, o += 9) {
    triangles[i] = [
      [positions[o], positions[o + 1], positions[o + 2]],
      [positions[o + 3], positions[o + 4], positions[o + 5]],
      [positions[o + 6], positions[o + 7], positions[o + 8]],
    ];
  }
  return triangles;
}
