// ============================================================
// ANALIZA DRUKOWALNOSCI MODELU
// ============================================================
// Odpowiada na pytanie, ktore i tak przychodzi mailem po wgraniu pliku:
// "czy to sie wydrukuje". Odpowiedz zalezy od technologii i od dyszy, wiec
// narzedzie liczy raz geometrie, a potem konfrontuje ja z progami maszyny.
//
// Kolejnosc kontroli nie jest przypadkowa i wynika z tego, ktora usterka
// blokuje pozostale:
//
//   1. szczelnosc siatki   bez niej slicer zgaduje, a nasza wycena liczy
//                          objetosc z bryly, ktora nie jest bryla
//   2. spojnosc normalnych odwrocone scianki wywracaja wnetrze na zewnatrz
//   3. gabaryty            model wiekszy od stolu nie wydrukuje sie wcale
//   4. grubosc scianek     zalezy od dyszy, i to jest sedno tego narzedzia
//   5. nawisy i podpory    nie blokuja, ale zmieniaja cene i wyglad
//
// Wszystko liczymy z samej listy trojkatow, tej samej, ktora zwraca
// `parseSTL`. Zadnej zaleznosci zewnetrznej, bo to ma dzialac w przegladarce
// na pliku, ktorego nigdzie nie wysylamy.
//
// Modul lezy w `src/analysis`, a nie w `src/pricing`, i to jest decyzja.
// Katalog `src/pricing` jest kopiowany do `chat-api` przez `sync-pricing`,
// bo backend musi umiec przeliczyc cene zamowienia od nowa. Drukowalnosc
// ceny nie dotyka: to analiza dla czlowieka przed zamowieniem. Trzymanie jej
// w rdzeniu cenowym wysylaloby na serwer martwy kod i sugerowaloby, ze te
// progi wplywaja na kwote do zaplaty. Nie wplywaja.

// ------------------------------------------------------------
// Maszyny i progi
// ------------------------------------------------------------

/** Stol roboczy w milimetrach. Liczby z realnego parku maszyn. */
export const MACHINES = {
  fdm: { id: "fdm", name: "Bambu Lab H2D", build: { x: 300, y: 320, z: 325 } },
  msla: { id: "msla", name: "Elegoo Saturn 4 Ultra 16K", build: { x: 218, y: 123, z: 250 } },
};

/**
 * Dysze FDM. `min` to najcienszy sensowny mur, czyli jedna sciezka; `safe` to
 * dwie sciezki, czyli scianka, ktora zniesie szlifowanie i uzytkowanie.
 *
 * Jedna sciezka daje sie wydrukowac i bywa uzywana swiadomie (obudowy, wzory
 * azurowe), ale peka przy najmniejszym nacisku. Dlatego narzedzie rozroznia
 * "da sie" od "warto".
 */
export const NOZZLES = [
  { id: "0.2", dia: 0.2, min: 0.2, safe: 0.42, layerMin: 0.06, layerMax: 0.14, inHouse: true },
  { id: "0.4", dia: 0.4, min: 0.4, safe: 0.84, layerMin: 0.08, layerMax: 0.28, inHouse: true },
  { id: "0.6", dia: 0.6, min: 0.6, safe: 1.25, layerMin: 0.15, layerMax: 0.42, inHouse: false },
  { id: "0.8", dia: 0.8, min: 0.8, safe: 1.65, layerMin: 0.20, layerMax: 0.56, inHouse: false },
];

/**
 * MSLA. Piksel 14 um w plaszczyznie XY pochodzi ze specyfikacji naszej
 * drukarki. Prog scianki jest wyzszy niz rozdzielczosc i to nie jest blad:
 * zywica utwardzona w jednej warstwie pikseli istnieje, ale odrywa sie przy
 * odklejaniu od folii FEP.
 */
export const MSLA_LIMITS = {
  pixelMm: 0.014,
  wallMin: 0.4,      // scianka wolnostojaca, ponizej tego zwykle urywa sie przy odklejaniu
  wallSafe: 0.8,     // scianka, ktora przetrwa mycie, doczyszczanie i transport
  detailMin: 0.2,    // najmniejszy detal, ktory realnie widac po utwardzeniu
  cavityWarnCm3: 1.0, // zamknieta pustka powyzej tej objetosci potrzebuje otworu spustowego
};

/**
 * Dysza wynikajaca z ustawien wybranych w kalkulatorze.
 *
 * Kalkulator opisuje precyzje jako `standard_04`, czyli dysza 0,4 mm i pewna
 * wysokosc warstwy. Do progu grubosci scianki liczy sie tylko dysza.
 *
 * Wartosc nieznana schodzi do 0,4, a nie do najlagodniejszego progu. To nasza
 * dysza domyslna, wiec ostrzezenie dotyczy tego, co realnie sie wydarzy przy
 * druku, a nie najkorzystniejszego wariantu na papierze.
 */
export function nozzleFromPrecision(precisionId) {
  const m = String(precisionId || "").match(/_0(\d)$/);
  const id = m ? `0.${m[1]}` : null;
  return id && NOZZLES.some((n) => n.id === id) ? id : "0.4";
}

/** Kat nawisu liczony od pionu. Powyzej niego slicer stawia podpory. */
export const OVERHANG_DEG = 45;

// ------------------------------------------------------------
// Topologia siatki
// ------------------------------------------------------------

// Sklejanie wierzcholkow: wspolrzedne w STL sa float32, wiec ten sam punkt
// zapisany w dwoch trojkatach potrafi roznic sie na ostatnim bicie. Bez
// sklejenia KAZDA krawedz wygladalaby na brzegowa i kazdy model bylby
// "dziurawy". Kwant 1e-4 mm jest ponizej precyzji float32 przy 300 mm, wiec
// nie skleja punktow, ktore sa realnie osobne.
const WELD = 1e4;

function key(v) {
  return `${Math.round(v[0] * WELD)},${Math.round(v[1] * WELD)},${Math.round(v[2] * WELD)}`;
}

export function triNormal(a, b, c) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const acx = c[0] - a[0], acy = c[1] - a[1], acz = c[2] - a[2];
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  const len = Math.hypot(nx, ny, nz);
  if (len === 0) return null; // trojkat zdegenerowany, zerowe pole
  return [nx / len, ny / len, nz / len];
}

/**
 * Szczelnosc, spojnosc normalnych, liczba brył i trojkaty zdegenerowane.
 *
 * Krawedz w poprawnej bryle zamknietej nalezy do dokladnie dwoch trojkatow
 * i jest przez nie przebiegana w przeciwnych kierunkach. Kazde odstepstwo ma
 * swoja nazwe i swoj skutek dla druku, wiec liczymy je osobno zamiast zwracac
 * jedno "model niepoprawny".
 */
export function analyzeTopology(triangles) {
  // Klucze tekstowe sa tu kusace i az trzykrotnie kosztowniejsze: przy 490
  // tysiacach trojkatow zlozenie miliona lancuchow w rodzaju "123,456>789,012"
  // zajmowalo ponad szesc sekund i zamrazalo karte. Wierzcholki numerujemy
  // wiec raz, a krawedzie trzymamy jako liczby.
  const vertexId = new Map();
  const idOf = (v) => {
    const k = key(v);
    let id = vertexId.get(k);
    if (id === undefined) vertexId.set(k, (id = vertexId.size));
    return id;
  };

  const tri = new Int32Array(triangles.length * 3);
  const skip = new Uint8Array(triangles.length);
  let degenerate = 0;

  for (let i = 0; i < triangles.length; i++) {
    const t = triangles[i];
    if (!triNormal(t[0], t[1], t[2])) { skip[i] = 1; degenerate++; continue; }
    const a = idOf(t[0]), b = idOf(t[1]), c = idOf(t[2]);
    // Trojkat, w ktorym dwa wierzcholki skleily sie w jeden, nie ma pola i nie
    // opisuje zadnej powierzchni. Liczenie jego krawedzi robilo z sasiednich
    // scianek falszywe dziury.
    if (a === b || b === c || a === c) { skip[i] = 1; degenerate++; continue; }
    tri[i * 3] = a; tri[i * 3 + 1] = b; tri[i * 3 + 2] = c;
  }

  // Numer krawedzi mieci sie w liczbie zmiennoprzecinkowej dopoki wierzcholkow
  // jest mniej niz 2^21, czyli 2,1 mln. Powyzej wracamy do lancuchow: wolniej,
  // ale poprawnie, zamiast cicho gubic krawedzie na przepelnieniu.
  const SHIFT = 2097152;
  const big = vertexId.size >= SHIFT;
  const ek = big ? (a, b) => `${a}|${b}` : (a, b) => a * SHIFT + b;

  const edges = new Map();
  const directed = new Set();
  let reversedPairs = 0;

  for (let i = 0; i < triangles.length; i++) {
    if (skip[i]) continue;
    const v = [tri[i * 3], tri[i * 3 + 1], tri[i * 3 + 2]];
    for (let e = 0; e < 3; e++) {
      const a = v[e], b = v[(e + 1) % 3];
      const und = a < b ? ek(a, b) : ek(b, a);
      edges.set(und, (edges.get(und) || 0) + 1);
      // Ta sama krawedz przebiegana dwa razy w TYM SAMYM kierunku oznacza
      // dwie scianki zwrocone w przeciwne strony.
      const dir = ek(a, b);
      if (directed.has(dir)) reversedPairs++;
      else directed.add(dir);
    }
  }

  let boundary = 0, nonManifold = 0;
  for (const count of edges.values()) {
    if (count === 1) boundary++;
    else if (count > 2) nonManifold++;
  }

  return {
    triangleCount: triangles.length,
    degenerate,
    vertexCount: vertexId.size,
    edgeCount: edges.size,
    boundaryEdges: boundary,
    nonManifoldEdges: nonManifold,
    reversedFaces: reversedPairs,
    isWatertight: boundary === 0 && nonManifold === 0,
  };
}

/**
 * Objetosc ze znakiem. Ujemna oznacza siatke wywrocona na lewa strone:
 * geometria wyglada poprawnie na podgladzie, a slicer uzna wnetrze za
 * zewnetrze i wydrukuje kostke zamiast skorupy.
 */
export function signedVolumeMm3(triangles) {
  let v = 0;
  for (const [a, b, c] of triangles) {
    v += (
      a[0] * (b[1] * c[2] - b[2] * c[1]) +
      a[1] * (b[2] * c[0] - b[0] * c[2]) +
      a[2] * (b[0] * c[1] - b[1] * c[0])
    ) / 6;
  }
  return v;
}

export function boundsOf(triangles) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const t of triangles) {
    for (const v of t) {
      if (v[0] < minX) minX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[2] < minZ) minZ = v[2];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] > maxY) maxY = v[1];
      if (v[2] > maxZ) maxZ = v[2];
    }
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ], size: [maxX - minX, maxY - minY, maxZ - minZ] };
}

// ------------------------------------------------------------
// Nawisy i przyleganie do stolu
// ------------------------------------------------------------

/**
 * Udzial powierzchni wymagajacej podpor oraz pole styku ze stolem.
 *
 * Scianka pionowa ma normalna poziomą i podpor nie potrzebuje. Sufit plaski
 * ma normalna skierowana w dol i potrzebuje ich najbardziej. Prog liczymy od
 * pionu, tak samo jak slicery.
 */
export function analyzeOverhangs(triangles, thresholdDeg = OVERHANG_DEG) {
  const limit = -Math.cos((thresholdDeg * Math.PI) / 180);
  const b = boundsOf(triangles);
  const bedTol = 0.2; // trojkat lezacy do 0,2 mm nad stolem nadal do niego przylega

  let total = 0, overhang = 0, bed = 0;
  for (const [p, q, r] of triangles) {
    const n = triNormal(p, q, r);
    if (!n) continue;
    const abx = q[0] - p[0], aby = q[1] - p[1], abz = q[2] - p[2];
    const acx = r[0] - p[0], acy = r[1] - p[1], acz = r[2] - p[2];
    const cx = aby * acz - abz * acy, cy = abz * acx - abx * acz, cz = abx * acy - aby * acx;
    const area = Math.hypot(cx, cy, cz) / 2;
    total += area;

    if (n[2] < limit) {
      const maxZ = Math.max(p[2], q[2], r[2]);
      // Scianka plaska tuz nad stolem to podstawa, a nie nawis do podparcia.
      if (maxZ - b.min[2] <= bedTol) bed += area;
      else overhang += area;
    }
  }

  return {
    totalAreaMm2: total,
    overhangAreaMm2: overhang,
    overhangShare: total > 0 ? overhang / total : 0,
    bedContactMm2: bed,
  };
}

// ------------------------------------------------------------
// Grubosc scianek
// ------------------------------------------------------------
//
// Mierzymy tak, jak mierzy sie suwmiarka: z punktu na powierzchni w glab
// materialu, prostopadle do scianki, az do napotkania drugiej strony.
//
// Pelne przejscie kazdego promienia przez kazdy trojkat to O(F^2) i przy
// 200 tysiacach scianek zawiesza karte. Dlatego trojkaty ida do siatki
// przestrzennej, a promien przechodzi przez nia algorytmem DDA, komorka po
// komorce, w kolejnosci od najblizszej. Krok stalej dlugosci bylby prostszy,
// ale potrafi przeskoczyc cienka scianke i wtedy narzedzie zaraportowaloby
// model grubszy, niz jest naprawde. Blad w te strone jest gorszy niz brak
// odpowiedzi, bo klient uslyszalby "wydrukuje sie" i dostal odpad.

const EPS = 1e-9;

function buildGrid(triangles, targetPerCell = 4) {
  const b = boundsOf(triangles);
  const extent = Math.max(b.size[0], b.size[1], b.size[2]) || 1;
  const cells = Math.max(1, Math.min(128, Math.round(Math.cbrt(triangles.length / targetPerCell))));
  const cell = Math.max(extent / cells, 1e-4);
  const dims = [
    Math.max(1, Math.ceil(b.size[0] / cell) || 1),
    Math.max(1, Math.ceil(b.size[1] / cell) || 1),
    Math.max(1, Math.ceil(b.size[2] / cell) || 1),
  ];
  const map = new Map();
  const idx = (i, j, k) => i + dims[0] * (j + dims[1] * k);

  triangles.forEach((t, ti) => {
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const v of t) for (let d = 0; d < 3; d++) {
      if (v[d] < lo[d]) lo[d] = v[d];
      if (v[d] > hi[d]) hi[d] = v[d];
    }
    const c0 = [0, 1, 2].map((d) => Math.max(0, Math.min(dims[d] - 1, Math.floor((lo[d] - b.min[d]) / cell))));
    const c1 = [0, 1, 2].map((d) => Math.max(0, Math.min(dims[d] - 1, Math.floor((hi[d] - b.min[d]) / cell))));
    for (let k = c0[2]; k <= c1[2]; k++)
      for (let j = c0[1]; j <= c1[1]; j++)
        for (let i = c0[0]; i <= c1[0]; i++) {
          const key2 = idx(i, j, k);
          let list = map.get(key2);
          if (!list) map.set(key2, (list = []));
          list.push(ti);
        }
  });

  return { min: b.min, cell, dims, map, idx };
}

/** Moller-Trumbore. Zwraca odleglosc wzdluz promienia albo null. */
function rayTriangle(orig, dir, a, b, c) {
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const p = [dir[1] * e2[2] - dir[2] * e2[1], dir[2] * e2[0] - dir[0] * e2[2], dir[0] * e2[1] - dir[1] * e2[0]];
  const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
  if (Math.abs(det) < EPS) return null;
  const inv = 1 / det;
  const tv = [orig[0] - a[0], orig[1] - a[1], orig[2] - a[2]];
  const u = (tv[0] * p[0] + tv[1] * p[1] + tv[2] * p[2]) * inv;
  if (u < -1e-7 || u > 1 + 1e-7) return null;
  const q = [tv[1] * e1[2] - tv[2] * e1[1], tv[2] * e1[0] - tv[0] * e1[2], tv[0] * e1[1] - tv[1] * e1[0]];
  const v = (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]) * inv;
  if (v < -1e-7 || u + v > 1 + 1e-7) return null;
  const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
  return t > 1e-6 ? t : null;
}

/**
 * Najblizsze trafienie wzdluz promienia. Przechodzimy komorki w kolejnosci
 * od najblizszej (DDA Amanatidesa i Woo) i konczymy, gdy trafienie lezy
 * przed wyjsciem z biezacej komorki. Dzieki temu nie testujemy calej siatki,
 * a mimo to nie da sie przeoczyc bliższej scianki.
 */
function firstHit(grid, triangles, orig, dir, maxDist) {
  const { min, cell, dims, map, idx } = grid;
  const c = [0, 1, 2].map((d) => Math.max(0, Math.min(dims[d] - 1, Math.floor((orig[d] - min[d]) / cell))));
  const step = [0, 0, 0], tMax = [0, 0, 0], tDelta = [0, 0, 0];

  for (let d = 0; d < 3; d++) {
    if (Math.abs(dir[d]) < EPS) {
      step[d] = 0; tMax[d] = Infinity; tDelta[d] = Infinity;
    } else {
      step[d] = dir[d] > 0 ? 1 : -1;
      const boundary = min[d] + (c[d] + (step[d] > 0 ? 1 : 0)) * cell;
      tMax[d] = (boundary - orig[d]) / dir[d];
      tDelta[d] = Math.abs(cell / dir[d]);
    }
  }

  let best = Infinity;
  const seen = new Set();
  for (let guard = 0; guard < dims[0] + dims[1] + dims[2] + 3; guard++) {
    const list = map.get(idx(c[0], c[1], c[2]));
    if (list) {
      for (const ti of list) {
        if (seen.has(ti)) continue;
        seen.add(ti);
        const t = rayTriangle(orig, dir, triangles[ti][0], triangles[ti][1], triangles[ti][2]);
        if (t !== null && t < best) best = t;
      }
    }
    const exit = Math.min(tMax[0], tMax[1], tMax[2]);
    // Trafienie przed wyjsciem z komorki jest juz najblizsze, dalej nie ma sensu.
    if (best <= exit || exit > maxDist) break;
    const axis = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : (tMax[1] < tMax[2] ? 1 : 2);
    c[axis] += step[axis];
    if (c[axis] < 0 || c[axis] >= dims[axis]) break;
    tMax[axis] += tDelta[axis];
  }
  return best === Infinity ? null : best;
}

/**
 * Rozklad gruboscia scianek, z probkowania powierzchni.
 *
 * Probkujemy proporcjonalnie do pola, wiec duza plaska sciana dostaje wiecej
 * probek niz maly wypustek. To celowe: interesuje nas, JAK DUZO powierzchni
 * jest za cienkie, a nie tylko czy gdziekolwiek jest cienka.
 *
 * Zwracamy percentyl, a nie samo minimum. Pojedynczy zdegenerowany trojkat
 * albo szpic na styku dwoch scianek potrafi dac odczyt bliski zeru, ktory nie
 * mowi nic o modelu. `p1` to wartosc, ponizej ktorej lezy 1% probek.
 */
export function analyzeThickness(triangles, { samples = 3000, seed = 7 } = {}) {
  if (!triangles.length) return null;
  const grid = buildGrid(triangles);
  const b = boundsOf(triangles);
  const maxDist = Math.hypot(b.size[0], b.size[1], b.size[2]);

  // Pole skumulowane, do losowania proporcjonalnego do powierzchni.
  const cum = new Float64Array(triangles.length);
  let acc = 0;
  for (let i = 0; i < triangles.length; i++) {
    const [p, q, r] = triangles[i];
    const abx = q[0] - p[0], aby = q[1] - p[1], abz = q[2] - p[2];
    const acx = r[0] - p[0], acy = r[1] - p[1], acz = r[2] - p[2];
    const cx = aby * acz - abz * acy, cy = abz * acx - abx * acz, cz = abx * acy - aby * acx;
    acc += Math.hypot(cx, cy, cz) / 2;
    cum[i] = acc;
  }
  if (acc <= 0) return null;

  // Generator wlasny, deterministyczny: ten sam plik ma dawac ten sam wynik
  // przy kazdym wgraniu, inaczej klient dostaje inna odpowiedz za drugim razem.
  let state = seed >>> 0;
  const rnd = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const values = [];
  for (let s = 0; s < samples; s++) {
    // Wybor trojkata proporcjonalnie do pola, wyszukiwanie binarne.
    const target = rnd() * acc;
    let lo = 0, hi = triangles.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1; else hi = mid;
    }
    const [p, q, r] = triangles[lo];
    const n = triNormal(p, q, r);
    if (!n) continue;

    // Punkt losowy na trojkacie, rownomiernie.
    let u = rnd(), v = rnd();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const pt = [
      p[0] + u * (q[0] - p[0]) + v * (r[0] - p[0]),
      p[1] + u * (q[1] - p[1]) + v * (r[1] - p[1]),
      p[2] + u * (q[2] - p[2]) + v * (r[2] - p[2]),
    ];

    // W glab materialu, czyli przeciwnie do normalnej zewnetrznej. Odsuwamy
    // start o wlos, zeby promien nie trafil w trojkat, z ktorego wyszedl.
    const dir = [-n[0], -n[1], -n[2]];
    const orig = [pt[0] + dir[0] * 1e-4, pt[1] + dir[1] * 1e-4, pt[2] + dir[2] * 1e-4];
    const t = firstHit(grid, triangles, orig, dir, maxDist);
    if (t !== null && t > 0) values.push(t + 1e-4);
  }

  if (!values.length) return null;
  values.sort((a, z) => a - z);
  const at = (p) => values[Math.min(values.length - 1, Math.floor(p * values.length))];

  return {
    samples: values.length,
    min: values[0],
    p1: at(0.01),
    p5: at(0.05),
    median: at(0.5),
    /** Udzial probek ponizej progu. Mowi, ile powierzchni jest za cienkie. */
    shareBelow: (mm) => values.filter((x) => x < mm).length / values.length,
  };
}

// ------------------------------------------------------------
// Raport
// ------------------------------------------------------------

/**
 * Pelna analiza dla wybranej technologii.
 *
 * `nozzleId` dotyczy wylacznie FDM. Dla MSLA progi biora sie z rozdzielczosci
 * i z tego, co realnie wytrzymuje odklejanie od folii.
 */
export function analyzePrintability(triangles, { tech = "fdm", nozzleId = "0.4", samples = 3000 } = {}) {
  const topo = analyzeTopology(triangles);
  const bounds = boundsOf(triangles);
  const signed = signedVolumeMm3(triangles);
  const over = analyzeOverhangs(triangles);
  // Grubosc mierzona na siatce nieszczelnej klamie, bo promien wylatuje przez
  // dziure i trafia w przypadkowa scianke po drugiej stronie modelu.
  const raw = topo.isWatertight ? analyzeThickness(triangles, { samples }) : null;

  const machine = MACHINES[tech === "msla" ? "msla" : "fdm"];
  const nozzle = NOZZLES.find((n) => n.id === nozzleId) || NOZZLES[1];
  const limits = tech === "msla"
    ? { min: MSLA_LIMITS.wallMin, safe: MSLA_LIMITS.wallSafe, detail: MSLA_LIMITS.detailMin }
    : { min: nozzle.min, safe: nozzle.safe, detail: nozzle.dia };

  const size = bounds.size;
  // Model obraca sie na stole, wiec porownujemy posortowane wymiary. Czesc
  // "za dluga" w X czesto miesci sie po obrocie o 90 stopni.
  const partSorted = [...size].sort((a, b) => b - a);
  const buildSorted = [machine.build.x, machine.build.y, machine.build.z].sort((a, b) => b - a);
  const fits = partSorted.every((d, i) => d <= buildSorted[i]);
  const fitsUnrotated = size[0] <= machine.build.x && size[1] <= machine.build.y && size[2] <= machine.build.z;

  const maxDim = Math.max(...size);

  const findings = buildFindings({ topo, signed, fits, fitsUnrotated, over, thickness: raw, limits, tech, maxDim, size, machine });

  // Wynik przechodzi przez granice workera, a przez `structuredClone` nie
  // przejdzie funkcja. `shareBelow` zostaje wiec wewnatrz modulu, a na zewnatrz
  // wychodza gotowe udzialy dla progow, ktore i tak pokazujemy.
  const thickness = raw && {
    samples: raw.samples, min: raw.min, p1: raw.p1, p5: raw.p5, median: raw.median,
  };
  const thicknessBelow = raw && { min: raw.shareBelow(limits.min), safe: raw.shareBelow(limits.safe) };

  return {
    tech,
    machine,
    nozzle: tech === "fdm" ? nozzle : null,
    limits,
    topology: topo,
    bounds,
    sizeMm: size,
    volumeCm3: Math.abs(signed) / 1000,
    inverted: signed < 0,
    fits,
    fitsOnlyRotated: fits && !fitsUnrotated,
    overhang: over,
    thickness,
    thicknessBelow,
    /** Model mniejszy od paznokcia albo wiekszy od szafy to prawie zawsze zla jednostka. */
    suspiciousScale: maxDim < 3 ? "small" : maxDim > 1000 ? "large" : null,
    findings,
  };
}

/**
 * Lista ustalen, posortowana wagą. `blocker` zatrzymuje druk, `warning`
 * zmienia wynik albo cene, `info` warto wiedziec.
 *
 * Kazde ustalenie niesie `fix`, bo sam komunikat "model ma dziury" nie pomaga
 * nikomu, kto nie wie, ze naprawia sie to w Meshmixerze albo w Blenderze.
 */
function buildFindings({ topo, signed, fits, fitsUnrotated, over, thickness, limits, tech, maxDim, size, machine }) {
  const out = [];

  if (!topo.triangleCount) {
    out.push({ id: "empty", level: "blocker" });
    return out;
  }
  if (topo.boundaryEdges > 0) {
    out.push({ id: "holes", level: "blocker", value: topo.boundaryEdges });
  }
  if (topo.nonManifoldEdges > 0) {
    out.push({ id: "nonmanifold", level: "blocker", value: topo.nonManifoldEdges });
  }
  if (topo.reversedFaces > 0) {
    out.push({ id: "reversed", level: "warning", value: topo.reversedFaces });
  }
  if (signed < 0) {
    out.push({ id: "inverted", level: "warning" });
  }
  if (topo.degenerate > 0) {
    out.push({ id: "degenerate", level: "info", value: topo.degenerate });
  }
  if (maxDim < 3) {
    out.push({ id: "scale_small", level: "warning", value: maxDim });
  } else if (maxDim > 1000) {
    out.push({ id: "scale_large", level: "warning", value: maxDim });
  }
  if (!fits) {
    out.push({ id: "too_big", level: "blocker", value: size, machine: machine.name });
  } else if (!fitsUnrotated) {
    out.push({ id: "fits_rotated", level: "info" });
  }

  if (thickness) {
    const share = thickness.shareBelow(limits.min);
    const shareSafe = thickness.shareBelow(limits.safe);
    if (thickness.p1 < limits.min) {
      out.push({ id: "too_thin", level: "blocker", value: thickness.p1, limit: limits.min, share, tech });
    } else if (thickness.p1 < limits.safe) {
      out.push({ id: "thin", level: "warning", value: thickness.p1, limit: limits.safe, share: shareSafe, tech });
    } else {
      out.push({ id: "thickness_ok", level: "info", value: thickness.p1 });
    }
  } else if (!topo.isWatertight) {
    out.push({ id: "thickness_skipped", level: "info" });
  }

  if (over.overhangShare > 0.35) {
    out.push({ id: "overhangs_many", level: "warning", value: over.overhangShare });
  } else if (over.overhangShare > 0.12) {
    out.push({ id: "overhangs_some", level: "info", value: over.overhangShare });
  }

  if (tech === "fdm" && over.bedContactMm2 < 100 && fits) {
    out.push({ id: "small_base", level: "warning", value: over.bedContactMm2 });
  }

  const order = { blocker: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
