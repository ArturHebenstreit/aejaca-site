// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/geometry/ring/params.js
// Regeneracja: npm run sync:pricing

// ============================================================
// KREATOR PIERSCIONKOW: model parametrow i reguly warsztatowe
// ============================================================
// Jeden obiekt przechodzi przez cala droge: formularz, generator bryly,
// wycena, koszyk, zapisana wycena. To tez jest schemat, ktory ma wypelnic
// model jezykowy, gdy klient opisze pierscionek zdaniem.
//
// Ten plik nie importuje niczego z jadra geometrycznego, bo korzysta z niego
// takze interfejs, ktory rysuje szlify w SVG. Obrysy sa wiec zwyklymi
// listami punktow w ukladzie jednostkowym (promien 1), przeskalowanymi
// dopiero przy budowie bryly.

const TAU = Math.PI * 2;

const ngon = (n, rot = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU + rot;
    return [Math.cos(a), Math.sin(a)];
  });

const smooth = (fn, n) => Array.from({ length: n }, (_, i) => fn(i / n));

/** Obrys rozciagniety na `n` rownomiernych punktow, po odcinkach. */
export function resample(pts, n) {
  const out = [], m = pts.length;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * m, k = Math.floor(t), f = t - k;
    const a = pts[k % m], b = pts[(k + 1) % m];
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

export const scalePts = (p, s) => p.map(([x, y]) => [x * s, y * s]);

// ------------------------------------------------------------
// Obrysy szlifow, w ukladzie jednostkowym
// ------------------------------------------------------------
export const OUTLINES = {
  round: () => smooth((t) => { const a = t * TAU; return [Math.cos(a), Math.sin(a)]; }, 48),
  oval: () => smooth((t) => { const a = t * TAU; return [0.74 * Math.cos(a), 1.06 * Math.sin(a)]; }, 48),
  cushion: () => smooth((t) => {
    const a = t * TAU, c = Math.cos(a), s = Math.sin(a), p = 2.7;
    const k = (Math.abs(c) ** p + Math.abs(s) ** p) ** (-1 / p);
    return [k * c * 0.96, k * s * 0.96];
  }, 48),
  square: () => resample(scalePts(ngon(4, Math.PI / 4), 0.99), 32),
  octagon: () => {
    const c = 0.42, x = 0.78, y = 1.0;      // szmaragdowy: sciete naroza
    return resample([[-x + c, -y], [x - c, -y], [x, -y + c], [x, y - c],
      [x - c, y], [-x + c, y], [-x, y - c], [-x, -y + c]], 32);
  },
  baguette: () => resample([[-0.5, -1.1], [0.5, -1.1], [0.5, 1.1], [-0.5, 1.1]], 32),
  pentagon: () => resample(ngon(5, -Math.PI / 2), 30),
  // Trojkat o bokach WYPUKLYCH. Wzor biegunowy daje tu grudke, wiec idziemy
  // bokiem po boku i wypychamy kazdy punkt wzdluz normalnej zewnetrznej.
  trillion: () => {
    const v = ngon(3, -Math.PI / 2), pts = [];
    for (let i = 0; i < 3; i++) {
      const a = v[i], b = v[(i + 1) % 3];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      const nx = dy / L, ny = -dx / L;
      for (let s = 0; s < 16; s++) {
        const t = s / 16, g = 0.17 * Math.sin(Math.PI * t);
        pts.push([a[0] + dx * t + nx * g, a[1] + dy * t + ny * g]);
      }
    }
    return pts;
  },
  pear: () => smooth((t) => {
    const a = t * TAU - Math.PI / 2;
    const w = 0.76 * (1 - 0.52 * Math.max(0, Math.cos(a / 2)) ** 3.2);
    return [-w * Math.sin(a), -Math.cos(a) * 1.08];
  }, 56),
  marquise: () => smooth((t) => {
    const a = t * TAU;
    return [0.52 * Math.sin(a) * Math.abs(Math.sin(a)), -Math.cos(a) * 1.22];
  }, 56),
  heart: () => smooth((t) => {
    const a = t * TAU;
    const x = 16 * Math.sin(a) ** 3;
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return [x / 17, -y / 15];
  }, 60),
  briolette: () => smooth((t) => {
    const a = t * TAU - Math.PI / 2;
    const w = 0.62 * (1 - 0.62 * Math.max(0, Math.cos(a / 2)) ** 2.4);
    return [-w * Math.sin(a), -Math.cos(a) * 1.34];
  }, 56),
};

// ------------------------------------------------------------
// Szlify
// ------------------------------------------------------------
// `profil` opisuje bryle kamienia w pionie:
//   brilliant  korona, rondysta, pawilon do kolety
//   step       to samo, ale lagodniejszy pawilon (szlify schodkowe)
//   drop       brioleta, oszlifowana dookola, bez tafli
//   dome       kopula na plaskim spodzie (bufftop)
//   rose       niska korona fasetowa na plaskim spodzie
//   rosePav    rozeta z pawilonem: plaska gora, stozek pod spodem
//
// `points` to naroza wymagajace lapki V, podane jako kat w stopniach
// liczony od osi +Y obrysu. Bez nich generator nie wie, gdzie ta lapka ma
// stanac, a to wlasnie w tych miejscach kamien odpryskuje.
export const CUTS = {
  round:     { pl: "okrągły", outline: "round", profile: "brilliant", table: 0.57,
               settings: ["prong4", "prong6", "bezel"], corners: 4 },
  oval:      { pl: "owal", outline: "oval", profile: "brilliant", table: 0.55,
               settings: ["prong4", "prong6", "bezel"], corners: 4 },
  cushion:   { pl: "poduszka", outline: "cushion", profile: "brilliant", table: 0.58,
               settings: ["prong4", "corner", "bezel"], corners: 4 },
  square:    { pl: "kwadrat", outline: "square", profile: "brilliant", table: 0.6,
               settings: ["corner", "bezel"], corners: 4 },
  octagon:   { pl: "ośmiokąt", outline: "octagon", profile: "step", table: 0.62,
               settings: ["corner", "bezel"], corners: 4 },
  baguette:  { pl: "bagietka", outline: "baguette", profile: "step", table: 0.66,
               settings: ["channel", "corner", "bezel"], corners: 4 },
  pentagon:  { pl: "pięciokąt", outline: "pentagon", profile: "brilliant", table: 0.58,
               settings: ["corner", "bezel"], corners: 5 },
  trillion:  { pl: "trylion", outline: "trillion", profile: "brilliant", table: 0.58,
               settings: ["vprong", "bezel"], points: [90, 210, 330] },
  pear:      { pl: "gruszka", outline: "pear", profile: "brilliant", table: 0.55,
               settings: ["vprong", "bezel"], points: [90] },
  marquise:  { pl: "markiza", outline: "marquise", profile: "brilliant", table: 0.5,
               settings: ["vprong", "bezel"], points: [90, 270] },
  heart:     { pl: "serce", outline: "heart", profile: "brilliant", table: 0.54,
               settings: ["vprong", "bezel"], points: [90] },
  briolette: { pl: "briolet", outline: "briolette", profile: "drop", table: 0,
               settings: ["drilled"] },
  roseP:     { pl: "rozeta z pawilonem", outline: "round", profile: "rosePav", table: 0,
               settings: ["prong4", "bezel"], corners: 4 },
  bufftop:   { pl: "bufftop", outline: "oval", profile: "dome", table: 0,
               settings: ["bezel"] },
  roseFlat:  { pl: "rozeta płaska", outline: "round", profile: "rose", table: 0,
               settings: ["bezel"] },
};

export const SETTINGS = {
  prong4:  { pl: "4 łapki", prongs: 4 },
  prong6:  { pl: "6 łapek", prongs: 6 },
  corner:  { pl: "narożne", prongs: 0 },   // liczba lapek z `corners` szlifu
  vprong:  { pl: "łapki V", prongs: 0 },   // lapki siadaja na `points` szlifu
  bezel:   { pl: "kaseta", prongs: 0 },
  channel: { pl: "kanałowa", prongs: 0 },
  drilled: { pl: "wiercony", prongs: 0 },
};

export const SIDE_SETTINGS = {
  pave:    { pl: "pavé", metalPerStone: 0.8 },
  channel: { pl: "kanałowa", metalPerStone: 2.2 },
  prong:   { pl: "łapkowa", metalPerStone: 1.4 },
};

export const SHANK_PROFILES = ["round", "flat", "knife", "comfort"];
export const SIGNET_TABLES = ["oval", "cushion", "rect"];

// ------------------------------------------------------------
// Stale warsztatowe
// ------------------------------------------------------------
// Te liczby decyduja o tym, czy kamien wejdzie w gniazdo. Ich zmiana bez
// proby na realnym odlewie to prosta droga do serii braków.
export const SEAT = {
  /** Gniazdo musi byc odrobine WEZSZE od rondysty, inaczej kamien przelatuje. */
  undercut: 0.06,        // mm na promieniu
  /** Kat oparcia odpowiada kątowi pawilonu ponizej rondysty. */
  bearingDeg: 41,
  /** Rondysta siedzi mniej wiecej tyle nad galeria. */
  aboveGalleryMm: 1.0,
  /** Luz na obrobke, doliczany do otworu przelotowego pod kamieniem. */
  throughClearance: 0.25,
};

export const LIMITS = {
  innerDia: [14.0, 23.0],
  width: [1.4, 8.0],
  thickness: [1.0, 4.0],
  stoneSize: [2.0, 10.0],
  sideCount: [0, 5],
  sideSize: [1.0, 2.6],
  signetLength: [9.0, 20.0],
  prongDia: [0.7, 1.4],
};

export const DEFAULTS = {
  kind: "ring",
  innerDia: 17.2,
  alloy: "ag925",
  profile: "round",
  width: 2.2,
  thickness: 1.6,
  stone: { cut: "round", size: 6.5, material: "cz", origin: "stock" },
  setting: "prong4",
  prongDia: 0.9,
  side: { count: 0, size: 1.6, setting: "pave", material: "cz" },
  signet: { table: "oval", length: 14, engraving: "none" },
};

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Sprowadza dowolne wejscie do poprawnego zestawu parametrow albo rzuca.
 *
 * Rzucamy TYLKO przy niemozliwym zakuciu, bo to jedyny blad, ktorego nie da
 * sie po cichu naprawic: markiza w zwyklych lapkach odpryska, a kaboszon
 * z nich wypadnie. Reszte przycinamy do zakresu, bo suwak i tak nie wyjdzie
 * poza swoje granice, a model jezykowy potrafi podac liczbe z sufitu.
 */
export function validate(input = {}) {
  const p = { ...DEFAULTS, ...input };
  p.stone = { ...DEFAULTS.stone, ...(input.stone || {}) };
  p.side = { ...DEFAULTS.side, ...(input.side || {}) };
  p.signet = { ...DEFAULTS.signet, ...(input.signet || {}) };

  p.kind = p.kind === "signet" ? "signet" : "ring";
  p.innerDia = clamp(num(p.innerDia, DEFAULTS.innerDia), LIMITS.innerDia);
  p.width = clamp(num(p.width, DEFAULTS.width), LIMITS.width);
  p.thickness = clamp(num(p.thickness, DEFAULTS.thickness), LIMITS.thickness);
  p.prongDia = clamp(num(p.prongDia, DEFAULTS.prongDia), LIMITS.prongDia);
  if (!SHANK_PROFILES.includes(p.profile)) p.profile = DEFAULTS.profile;

  if (p.kind === "signet") {
    p.signet.length = clamp(num(p.signet.length, 14), LIMITS.signetLength);
    if (!SIGNET_TABLES.includes(p.signet.table)) p.signet.table = "oval";
    p.side = { ...p.side, count: 0 };
    return p;
  }

  const cut = CUTS[p.stone.cut];
  if (!cut) throw new Error(`Nieznany szlif: ${p.stone.cut}`);
  p.stone.size = clamp(num(p.stone.size, 6.5), LIMITS.stoneSize);

  if (!cut.settings.includes(p.setting)) {
    throw new Error(
      `Zakucie "${p.setting}" nie pasuje do szlifu "${cut.pl}". ` +
      `Dozwolone: ${cut.settings.map((s) => SETTINGS[s].pl).join(", ")}.`,
    );
  }

  // Brioleta wisi na kabłąku, wiec nie ma szyny z kamieniami bocznymi.
  if (p.setting === "drilled") p.side = { ...p.side, count: 0 };

  p.side.count = Math.round(clamp(num(p.side.count, 0), LIMITS.sideCount));
  p.side.size = clamp(num(p.side.size, 1.6), LIMITS.sideSize);
  if (!SIDE_SETTINGS[p.side.setting]) p.side.setting = "pave";

  return p;
}

/** Obrys szlifu przeskalowany do zadanej szerokosci kamienia w mm. */
export function outlineFor(cutId, sizeMm) {
  const cut = CUTS[cutId];
  if (!cut) throw new Error(`Nieznany szlif: ${cutId}`);
  return scalePts(OUTLINES[cut.outline](), sizeMm / 2);
}
