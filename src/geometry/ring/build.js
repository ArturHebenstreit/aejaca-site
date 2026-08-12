// ============================================================
// KREATOR PIERSCIONKOW: budowa bryly
// ============================================================
// Czysta funkcja: parametry na wejsciu, zamknieta bryla i masa na wyjsciu.
// Ten sam kod ma dzialac w przegladarce przy podgladzie i na serwerze przy
// zakupie, wiec nie siega do niczego poza `manifold-3d` i naszymi danymi.
//
// UKLAD WSPOLRZEDNYCH, z ktorego wynika cala reszta:
// `Manifold.revolve` obraca przekroj wokol jego osi Y, a ta staje sie osia Z
// bryly. Pierscionek lezy wiec plasko, jego os to Z, a godzina dwunasta jest
// na osi +Y w odleglosci `ro` od srodka. Korone budujemy w osi +Z i dopiero
// obracamy w +Y. Zignorowanie tego daje lapki wiszace w powietrzu i bryle
// rozsypana na kawalki, co juz raz nas kosztowalo wieczor.

import Module from "manifold-3d";
import { CUTS, SEAT, SIDE_SETTINGS, outlineFor, resample, scalePts, validate } from "./params.js";
import { CASTING_ALLOYS, massGrams } from "../../data/castingAlloys.js";

const DEG = Math.PI / 180;
const SEG = 96;                 // segmentow obrotu szyny w wydaniu docelowym

let wasmPromise = null;
/** Jadro wczytujemy raz na proces. W przegladarce to samo, tylko raz na karte. */
export function kernel() {
  if (!wasmPromise) {
    wasmPromise = Module().then((w) => { w.setup(); return w; });
  }
  return wasmPromise;
}

/**
 * PULAPKA, ktora kosztowala pierwsze podejscie do prototypu: `revolve`
 * i `extrude` przy profilu nawinietym zgodnie z ruchem wskazowek zegara
 * zwracaja bryle PUSTA, bez bledu i bez ostrzezenia. Kolejnosc punktow nie
 * moze decydowac o tym, czy model istnieje, wiec pole liczymy sami.
 */
function ccw(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a < 0 ? [...pts].reverse() : pts;
}

// ------------------------------------------------------------
// Szyna
// ------------------------------------------------------------
/** Przekroj szyny w ukladzie (promien, polozenie wzdluz osi pierscionka). */
export function shankProfile({ innerDia, width, thickness, profile }) {
  const ri = innerDia / 2, hw = width / 2, t = thickness;

  if (profile === "flat") {
    return [[ri, -hw], [ri + t, -hw], [ri + t, hw], [ri, hw]];
  }
  if (profile === "knife") {
    return [[ri, -hw], [ri + t, 0], [ri, hw]];
  }
  if (profile === "comfort") {
    // Comfort fit: plaska gora, wnetrze zaokraglone, zeby obraczka zsuwala sie
    // po palcu zamiast go scinac krawedzia.
    const arc = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (i / 12);
      arc.push([ri + 0.35 * (1 - Math.sin(a)), hw * Math.cos(a)]);
    }
    return [[ri + t, -hw], [ri + t, hw], ...arc];
  }
  // Polokragly: polelipsa o polosiach `t` na promieniu i `hw` wzdluz osi.
  const arc = [];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI * (i / 24);
    arc.push([ri + t * Math.sin(a), -hw * Math.cos(a)]);
  }
  return [[ri, -hw], ...arc, [ri, hw]];
}

/**
 * Zewnetrzny promien szyny na zadanej wysokosci wzdluz jej osi.
 *
 * Bez tego kuleczki pave i lapki boczne laduja w powietrzu: szyna polokragla
 * opada ku krawedziom o kilka dziesiatych milimetra, wiec kulka postawiona na
 * promieniu `ro` styka sie z metalem tylko na samym srodku. Suma takich brył
 * rozsypuje sie na kawalki, co `genus` pokazuje od razu, a oko nie.
 *
 * Liczymy przecinajac obrys pozioma linia, wiec dziala dla kazdego profilu,
 * takze tych dolozonych pozniej.
 */
export function shankRadiusAt(p, z) {
  const pts = shankProfile(p);
  let best = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [r1, z1] = pts[i], [r2, z2] = pts[(i + 1) % pts.length];
    if ((z1 - z) * (z2 - z) > 0) continue;              // odcinek nie siega tej wysokosci
    const t = z2 === z1 ? 0 : (z - z1) / (z2 - z1);
    const r = r1 + (r2 - r1) * t;
    if (r > best) best = r;
  }
  return Number.isFinite(best) ? best : p.innerDia / 2 + p.thickness;
}

function buildShank(w, p, segments) {
  const { Manifold, CrossSection } = w;
  const cs = CrossSection.ofPolygons([ccw(shankProfile(p))]);
  return Manifold.revolve(cs, segments);
}

// ------------------------------------------------------------
// Kamien
// ------------------------------------------------------------
// Bryla kamienia w ukladzie lokalnym: rondysta na z = 0, korona w gore,
// pawilon w dol. Kamienia NIE odlewamy, sluzy podgladowi i wycieciu gniazda.
const PROPORTIONS = {
  brilliant: { pav: 0.43, girdle: 0.03, crown: 0.16 },
  step:      { pav: 0.45, girdle: 0.04, crown: 0.12 },
  drop:      { pav: 0.75, girdle: 0.02, crown: 0.55 },
  dome:      { pav: 0.00, girdle: 0.04, crown: 0.35 },
  rose:      { pav: 0.00, girdle: 0.03, crown: 0.28 },
  rosePav:   { pav: 0.50, girdle: 0.04, crown: 0.06 },
};

/** Ostrze stozka budujemy z malego przekroju i duzego `scaleTop`, bo tak
 *  `extrude` rozszerza sie ku gorze bez odbijania bryly. Odbicie zmienialoby
 *  kierunek nawiniecia, a to juz znamy. */
function cone(Manifold, CrossSection, pts, height, downward) {
  const k = 0.02;
  const small = CrossSection.ofPolygons([ccw(scalePts(pts, k))]);
  const c = Manifold.extrude(small, height, 0, 0, [1 / k, 1 / k]);
  return downward ? c.translate([0, 0, -height]) : c;
}

export function stoneSolid(w, cutId, sizeMm) {
  const { Manifold, CrossSection } = w;
  const cut = CUTS[cutId];
  const pr = PROPORTIONS[cut.profile];
  const pts = outlineFor(cutId, sizeMm);
  const cs = CrossSection.ofPolygons([ccw(pts)]);

  const pavH = pr.pav * sizeMm, girdleH = pr.girdle * sizeMm, crownH = pr.crown * sizeMm;
  let solid = Manifold.extrude(cs, girdleH);          // rondysta, z = 0..girdleH

  if (pavH > 0) solid = solid.add(cone(Manifold, CrossSection, pts, pavH, true));
  else solid = solid.add(Manifold.extrude(cs, 0.02).translate([0, 0, -0.02]));

  if (cut.profile === "drop") {
    solid = solid.add(cone(Manifold, CrossSection, pts, crownH, false).translate([0, 0, girdleH]));
  } else if (cut.profile === "dome" || cut.profile === "rose") {
    // Kopula: kilka warstw zwezajacych sie ku gorze, bo `extrude` ze
    // `scaleTop` daje stozek, a nam potrzeba lagodnego luku.
    const layers = cut.profile === "dome" ? 6 : 3;
    for (let i = 0; i < layers; i++) {
      const t0 = i / layers, t1 = (i + 1) / layers;
      const r0 = Math.cos(t0 * Math.PI / 2), r1 = Math.cos(t1 * Math.PI / 2);
      const layer = Manifold.extrude(
        CrossSection.ofPolygons([ccw(scalePts(pts, Math.max(r0, 0.02)))]),
        crownH / layers, 0, 0, [Math.max(r1 / r0, 0.02), Math.max(r1 / r0, 0.02)],
      ).translate([0, 0, girdleH + (crownH * i) / layers]);
      solid = solid.add(layer);
    }
  } else {
    const tbl = Math.max(cut.table, 0.05);
    solid = solid.add(Manifold.extrude(cs, crownH, 0, 0, [tbl, tbl]).translate([0, 0, girdleH]));
  }
  return { solid, pavH, girdleH, crownH };
}

/**
 * Gniazdo, czyli to, co WYCINAMY z metalu.
 *
 * Rondysta gniazda jest o `SEAT.undercut` wezsza od kamienia, bo kamien ma
 * na czyms usiasc. Ponizej idzie stozek o kacie oparcia zgodnym z pawilonem,
 * a powyzej przelot, zeby przez kamien szlo swiatlo i zeby dalo sie go
 * wypchnac od spodu przy przekladaniu.
 */
function seatCutter(w, cutId, sizeMm) {
  const { Manifold, CrossSection } = w;
  const shrunk = Math.max(0.4, sizeMm - 2 * SEAT.undercut);
  const pts = outlineFor(cutId, shrunk);
  const cs = CrossSection.ofPolygons([ccw(pts)]);

  const through = Manifold.extrude(cs, sizeMm * 1.5);                       // w gore, na wylot
  const depth = (shrunk / 2) * Math.tan(SEAT.bearingDeg * DEG) + SEAT.throughClearance;
  const bearing = cone(Manifold, CrossSection, pts, depth, true);
  const belowHole = Manifold.cylinder(sizeMm, shrunk * 0.28, shrunk * 0.28, 24, false)
    .translate([0, 0, -sizeMm - depth + 0.01]);
  return through.add(bearing).add(belowHole);
}

// ------------------------------------------------------------
// Korona
// ------------------------------------------------------------
/** Kierunki, w ktorych maja stanac lapki, jako katy w stopniach. */
function prongAngles(cut, setting) {
  if (setting === "prong4") return [45, 135, 225, 315];
  if (setting === "prong6") return [0, 60, 120, 180, 240, 300];
  if (setting === "vprong") return cut.points || [90, 270];
  if (setting === "corner") {
    const n = cut.corners || 4;
    return Array.from({ length: n }, (_, i) => 90 + (360 / n) * i);
  }
  return [];
}

/** Promien obrysu szlifu w zadanym kierunku, zeby lapka siadla NA kamieniu. */
function radiusAt(pts, deg) {
  const a = deg * DEG, dx = Math.cos(a), dy = Math.sin(a);
  let best = 0;
  for (const [x, y] of pts) {
    const proj = x * dx + y * dy;
    const perp = Math.abs(-x * dy + y * dx);
    if (perp < 0.35 && proj > best) best = proj;
  }
  return best || Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
}

function buildCrown(w, p, stone) {
  const { Manifold, CrossSection } = w;
  const cut = CUTS[p.stone.cut];
  const size = p.stone.size;
  const pts = outlineFor(p.stone.cut, size);
  const rP = p.prongDia / 2;
  let crown = null;
  const add = (m) => { crown = crown ? crown.add(m) : m; };

  // Kosz, czyli galeria pod kamieniem. Bez niego lapki dotykaja szyny
  // punktowo i odlew pęka przy pierwszym uderzeniu.
  //
  // Musi byc WEZSZY od rondysty, inaczej polyka lapki i kamien, a caly wyrob
  // wyglada jak guzik. Lapki staja na promieniu rondysty, czyli na zewnatrz
  // kosza, i dopiero wtedy je widac.
  // Gorny promien MUSI siegac rondysty, bo na nim staja lapki. Wezszy kosz
  // zostawia je w powietrzu i bryla rozpada sie na kawalki.
  const girdleR = Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
  const basketH = SEAT.aboveGalleryMm + stone.pavH * 0.45;
  let basket = Manifold.cylinder(basketH, girdleR * 0.62, girdleR, 48, false)
    .translate([0, 0, -basketH]);

  // Okna galerii. Bez nich kosz jest pelna bryla i caly wyrob wyglada jak
  // guzik, a do tego wazy o kilkadziesiat procent za duzo. Zostawiamy cztery
  // slupki miedzy oknami, wiec kosz dalej trzyma sie kupy.
  const winH = basketH * 0.62;
  for (let k = 0; k < 4; k++) {
    basket = basket.subtract(
      Manifold.cube([girdleR * 2.4, girdleR * 0.62, winH], true)
        .rotate([0, 0, 45 + 90 * k])
        .translate([0, 0, -basketH + winH / 2 + basketH * 0.12]),
    );
  }
  add(basket);

  if (p.setting === "bezel") {
    // Kaseta: scianka dookola rondysty, zawinieta nad kamien. Wnetrze
    // wycina dopiero gniazdo, wiec tu zostawiamy pelny walec obrysu.
    const wall = 0.5;
    const h = stone.girdleH + stone.crownH * 0.35 + 0.4;
    const outer = CrossSection.ofPolygons([ccw(outlineFor(p.stone.cut, size + 2 * wall))]);
    add(Manifold.extrude(outer, h + SEAT.aboveGalleryMm).translate([0, 0, -SEAT.aboveGalleryMm]));
    return { solid: crown, basketH };
  }

  if (p.setting === "channel") {
    // Dwie szynki po bokach kamienia, bez metalu miedzy kamieniami.
    const halfW = Math.max(...pts.map(([x]) => Math.abs(x))) + 0.45;
    const h = stone.girdleH + stone.crownH * 0.4 + 0.5;
    const depth = Math.max(...pts.map(([, y]) => Math.abs(y))) * 2 + 1.0;
    [-1, 1].forEach((s) => {
      add(Manifold.cube([0.9, depth, h], true)
        .translate([s * halfW, 0, h / 2 - 0.2]));
    });
    return { solid: crown, basketH };
  }

  if (p.setting === "drilled") {
    crown = null;
    // Brioleta wisi, wiec zamiast korony robimy kabłąk nad szyna.
    const r = size * 0.28;
    const ring = Manifold.revolve(
      CrossSection.ofPolygons([ccw([[r, -0.35], [r + 0.7, -0.35], [r + 0.7, 0.35], [r, 0.35]])]), 32,
    );
    return { solid: ring.rotate([90, 0, 0]).translate([0, 0, r * 0.6]), basketH: 0 };
  }

  for (const deg of prongAngles(cut, p.setting)) {
    const a = deg * DEG;
    const rr = radiusAt(pts, deg) - rP * 0.15;
    const h = stone.girdleH + stone.crownH * 0.75 + SEAT.aboveGalleryMm;
    let prong = Manifold.cylinder(h, rP, rP * 0.82, 20, false)
      .translate([Math.cos(a) * rr, Math.sin(a) * rr, -SEAT.aboveGalleryMm]);
    if (p.setting === "vprong") {
      // Lapka V obejmuje szpic z dwoch stron, wiec dokladamy klin.
      const wedge = Manifold.cube([rP * 2.6, rP * 2.6, h], false)
        .rotate([0, 0, deg])
        .translate([Math.cos(a) * (rr + rP * 0.2), Math.sin(a) * (rr + rP * 0.2), -SEAT.aboveGalleryMm]);
      prong = prong.add(wedge);
    }
    add(prong);
  }
  return { solid: crown, basketH };
}

// ------------------------------------------------------------
// Kamienie na szynie
// ------------------------------------------------------------
/**
 * Kamienie boczne osadzone W szynie, nie polozone na niej. Zwracamy osobno
 * metal do dodania (kuleczki, szynki) i bryle do odjecia (gniazda), bo
 * kolejnosc ma znaczenie: gniazdo ciete przed zlaczeniem nie siega szyny
 * i bryla wychodzi o kilkanascie procent ciezsza, czyli tez drozsza.
 */
function buildSideStones(w, p) {
  const { Manifold, CrossSection } = w;
  const { count, size, setting } = p.side;
  if (!count) return { addMetal: null, cutSeats: null, stones: [] };

  const ro = p.innerDia / 2 + p.thickness;
  const rMid = p.innerDia / 2 + p.thickness * 0.62;
  const step = Math.asin(Math.min(0.45, (size * 0.62) / rMid)) * 2;
  const start = 0.34;
  let metal = null, seats = null;
  const stones = [];
  const addM = (m) => { metal = metal ? metal.add(m) : m; };
  const addS = (m) => { seats = seats ? seats.add(m) : m; };

  if (setting === "channel") {
    const span = start + step * (count - 0.2);
    [-1, 1].forEach((side) => {
      [-1, 1].forEach((off) => {
        const rail = Manifold.revolve(
          CrossSection.ofPolygons([ccw([
            [rMid - size * 0.1, off * (size * 0.62) - 0.22],
            [ro + 0.15, off * (size * 0.62) - 0.22],
            [ro + 0.15, off * (size * 0.62) + 0.22],
            [rMid - size * 0.1, off * (size * 0.62) + 0.22],
          ])]), 64, (span * 180) / Math.PI,
        ).rotate([0, 0, 90 - (side > 0 ? 0 : (span * 180) / Math.PI)]);
        addM(rail);
      });
    });
  }

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < count; i++) {
      const a = Math.PI / 2 + side * (start + step * i);
      const x = Math.cos(a) * rMid, y = Math.sin(a) * rMid;
      const tilt = [0, 0, 0];

      // OBROT MUSI BYC TAKI SAM JAK PRZY KORONIE SRODKOWEJ. `rotate([90,0,0])`
      // odwraca kamien: tafla patrzy wtedy w glab palca, a koleta na zewnatrz.
      // Na renderze wyglada to prawie tak samo, ale gniazdo wycina sie odwrotnie,
      // wiec zmienia sie objetosc metalu, a z niej cena.
      const { solid } = stoneSolid(w, "round", size);
      const placed = solid
        .rotate([-90, 0, 0])                        // tafla na zewnatrz promienia
        .rotate([0, 0, (a / DEG) - 90])
        .translate([x * (ro / rMid), y * (ro / rMid), 0]);
      stones.push(placed);

      const cutter = seatCutter(w, "round", size)
        .rotate([-90, 0, 0])
        .rotate([0, 0, (a / DEG) - 90])
        .translate([x * (ro / rMid), y * (ro / rMid), 0]);
      addS(cutter);

      // Kuleczki i lapki musza WCHODZIC w szyne, a nie stac na niej. Walec
      // postawiony na wypuklej powierzchni styka sie z nia wzdluz linii, wiec
      // suma daje bryle rozsypana na kawalki, co `genus` natychmiast pokazuje.
      // Promien bierzemy z PROFILU na tej wysokosci, nie z `ro`. Kuleczka
      // ma wejsc w metal, a nie stanac obok niego.
      const SINK = 0.22;
      const at = (tang, axial) => {
        const rad = shankRadiusAt(p, axial) - SINK;
        return [
          Math.cos(a) * rad - Math.sin(a) * tang,
          Math.sin(a) * rad + Math.cos(a) * tang,
          axial,
        ];
      };

      if (setting === "pave") {
        const off = Math.min(size * 0.58, p.width / 2 - 0.18);
        for (const [dt, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          addM(Manifold.sphere(0.3, 16).translate(at(dt * off, dz * off)));
        }
      } else if (setting === "prong") {
        const off = Math.min(size * 0.6, p.width / 2 - 0.2);
        for (const dz of [-1, 1]) {
          addM(Manifold.cylinder(0.9, 0.24, 0.19, 16, false)
            .rotate([0, 90, a / DEG])
            .translate(at(0, dz * off)));
        }
      }
      void tilt;
    }
  }
  return { addMetal: metal, cutSeats: seats, stones };
}

// ------------------------------------------------------------
// Sygnet
// ------------------------------------------------------------
function buildSignetHead(w, p) {
  const { Manifold, CrossSection } = w;
  const { table, length } = p.signet;
  const L = length / 2, W = L * 0.82, T = 2.4;

  let pts;
  if (table === "rect") {
    pts = resample([[-W, -L], [W, -L], [W, L], [-W, L]], 40);
  } else if (table === "cushion") {
    pts = Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), e = 2.7;
      const k = (Math.abs(c) ** e + Math.abs(s) ** e) ** (-1 / e);
      return [k * c * W, k * s * L];
    });
  } else {
    pts = Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return [W * Math.cos(a), L * Math.sin(a)];
    });
  }
  const cs = CrossSection.ofPolygons([ccw(pts)]);
  // Tarcza zwezajaca sie ku szynie, zeby ramiona plynnie w nia przechodzily.
  const head = Manifold.extrude(cs, T, 0, 0, [1, 1]);
  const skirt = Manifold.extrude(CrossSection.ofPolygons([ccw(scalePts(pts, 1.0))]),
    2.0, 0, 0, [0.62, 0.62]).translate([0, 0, -2.0]);
  return head.add(skirt).translate([0, 0, -T * 0.15]);
}

// ------------------------------------------------------------
// Zlozenie
// ------------------------------------------------------------
/**
 * @param {object} input parametry wedlug `params.js`
 * @param {object} [opts] `{ segments, withStones }`
 * @returns {Promise<{metal, stones, params, volumeMm3, massG, patternVolumeMm3}>}
 */
export async function buildRing(input, opts = {}) {
  const p = validate(input);
  const w = await kernel();
  const segments = opts.segments || SEG;

  const ro = p.innerDia / 2 + p.thickness;
  let metal = buildShank(w, p, segments);
  const stones = [];
  // Objetosci kamieni sa potrzebne wycenie, bo karat to jednostka MASY:
  // liczy sie go z objetosci razy gestosc, a nie z szerokosci kamienia.
  // Zbieramy je zawsze, takze gdy podglad kamieni jest wylaczony.
  const stoneVolumesMm3 = { center: 0, side: 0 };

  // Korona i kamien lezyskuja na godzinie dwunastej, czyli w osi +Y.
  const place = (m) => m.rotate([-90, 0, 0]).translate([0, ro, 0]);

  if (p.kind === "signet") {
    metal = metal.add(place(buildSignetHead(w, p)));
  } else {
    const stone = stoneSolid(w, p.stone.cut, p.stone.size);
    stoneVolumesMm3.center = stone.solid.volume();
    const { solid: crown, basketH } = buildCrown(w, p, stone);

    // Kosz stoi NA szynie, wiec rondysta jest o jego wysokosc wyzej. Pominiecie
    // tego wpycha kosz w otwor na palec: pierscionek nadal wyglada poprawnie,
    // a srednica wewnetrzna zmniejsza sie o ponad milimetr i po prostu nie
    // wchodzi na palec. Zabiera 0,35 mm, zeby kosz wtopil sie w szyne.
    const standoff = basketH > 0 ? basketH - 0.35 : 0;

    if (opts.withStones !== false) {
      stones.push(place(stone.solid.translate([0, 0, standoff])));
    }

    const side = buildSideStones(w, p);
    if (p.side.count > 0) stoneVolumesMm3.side = stoneSolid(w, "round", p.side.size).solid.volume();
    if (side.addMetal) metal = metal.add(side.addMetal);
    if (crown) metal = metal.add(place(crown.translate([0, 0, standoff])));

    // Gniazda WYCINAMY dopiero po zlaczeniu wszystkiego, zeby siegaly takze
    // szyny. Odwrotna kolejnosc daje bryle cieszsza o kilkanascie procent.
    if (p.setting !== "drilled") {
      metal = metal.subtract(place(seatCutter(w, p.stone.cut, p.stone.size).translate([0, 0, standoff])));
    }
    if (side.cutSeats) metal = metal.subtract(side.cutSeats);
    if (opts.withStones !== false) stones.push(...side.stones);
  }

  const volumeMm3 = metal.volume();
  const alloyDef = CASTING_ALLOYS[p.alloy] || CASTING_ALLOYS.ag925;
  return {
    params: p,
    metal,
    stones,
    stoneVolumesMm3,
    volumeMm3,
    // Kolor stopu zmienia gestosc, wiec i mase. Bez niego biale zloto
    // liczyloby sie jak zolte i wycena bylaby zanizona o kilkanascie procent.
    massG: massGrams(volumeMm3, p.alloy, p.color) ?? 0,
    /** Objetosc WZORCA do druku, czyli po kompensacji skurczu odlewniczego. */
    patternVolumeMm3: volumeMm3 * alloyDef.shrink ** 3,
    genus: metal.genus(),
    isEmpty: metal.isEmpty(),
  };
}

/**
 * Objetosc samej szyny policzona WZOREM, nie przez jadro.
 *
 * To jedyna obrona przed jadrem, ktore po cichu buduje cos innego, niz mu
 * zlecono: profil nawiniety w zla strone daje bryle pusta, a zla flaga luku
 * pierscionek lzejszy o kilkanascie procent. W obu razach model wyglada
 * poprawnie, a cena jest falszywa.
 */
export function shankVolumeFormula(p) {
  const pts = shankProfile(p);
  // Pole i srodek ciezkosci wielokata ze wzoru Gaussa, wiec liczba nie
  // pochodzi z jadra i wylapie kazdy jego blad przy obrocie.
  let a2 = 0, cx = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const cross = x1 * y2 - x2 * y1;
    a2 += cross;
    cx += (x1 + x2) * cross;
  }
  const area = Math.abs(a2) / 2;
  const rSr = cx / (3 * a2);                        // promien srodka ciezkosci
  return 2 * Math.PI * rSr * area;                  // twierdzenie Pappusa
}

/**
 * Ta sama objetosc, ale ze wzoru ZAMKNIETEGO, bez patrzenia na wielokat.
 *
 * Rozdzielenie tych dwoch funkcji nie jest przesada. `shankVolumeFormula`
 * sprawdza, czy jadro poprawnie obrocilo przekroj, ale przyjmuje przekroj
 * za dobra monete. Ta sprawdza sam przekroj. Dopiero obie razem lapia
 * i zle nawiniety profil, i zly ksztalt profilu.
 *
 * @returns {number|null} null dla profilu, ktory nie ma prostego wzoru
 */
export function shankVolumeClosedForm({ innerDia, width, thickness, profile }) {
  const ri = innerDia / 2, hw = width / 2, t = thickness;
  if (profile === "flat") return 2 * Math.PI * (ri + t / 2) * (width * t);
  if (profile === "knife") return 2 * Math.PI * (ri + t / 3) * ((width * t) / 2);
  if (profile === "round") {
    const area = (Math.PI * t * hw) / 2;            // polelipsa
    return 2 * Math.PI * (ri + (4 * t) / (3 * Math.PI)) * area;
  }
  return null;                                       // comfort: brak prostego wzoru
}
