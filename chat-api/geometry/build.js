// PLIK GENEROWANY, NIE EDYTOWAC RECZNIE.
// Zrodlo: src/geometry/ring/build.js
// Regeneracja: npm run sync:pricing

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
import { CASTING_ALLOYS, massGrams } from "../pricing/castingAlloys.js";
import { gemDensity } from "../pricing/gemOptics.js";

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

/**
 * Szyna o przekroju ZMIENNYM wzdluz obwodu.
 *
 * `revolve` obraca jeden przekroj, wiec daje szyne rownej grubosci na calym
 * obwodzie. Na zdjeciach katalogowych tak nie jest prawie nigdy: szyna
 * pierscionka zareczynowego zweza sie ku glowicy, a sygnet odwrotnie,
 * gestnieje pod tarcza. To nie jest ozdobnik, tylko powod, dla ktorego
 * pierscionek wyglada na zaprojektowany, a nie wyciety z rurki.
 *
 * Siatke skladamy sami, bo jadro nie ma przeciagniecia po sciezce. Przekroj
 * jest zamknietym obrysem, obwod tez jest zamkniety, wiec powstaje z tego
 * torus i nie trzeba domykac konców. Kolejnosc wierzcholkow w czworokacie
 * decyduje o stronie scian: przy odwrotnej jadro oddaje bryle o ujemnej
 * objetosci, co lapie test.
 *
 * Mnozniki dzialaja na ODLEGLOSC OD SRODKA PRZEKROJU, nie na wspolrzedne,
 * zeby wnetrze szyny zostalo okragle. Palec ma byc w otworze o stalej
 * srednicy niezaleznie od tego, co dzieje sie na zewnatrz.
 */
const TAPERS = {
  none: null,
  /** Zwezana: waska przy glowicy, pelna z tylu. Klasyka pierscionka z kamieniem. */
  // Zwezenie do 0,58 szerokosci zostawialo pod koszem szczeline: kosz ma
  // okolo czterech milimetrow, a szyna przy glowicy schodzila do jednego
  // i kosz opieral sie na niej tylko srodkiem.
  tapered: (u) => ({ w: 0.70 + 0.30 * u, t: 0.84 + 0.16 * u }),
  /** Katedralna: ramiona podnosza sie luklem do glowicy, szerokosc bez zmian. */
  cathedral: (u) => {
    const s = Math.max(0, 1 - u / 0.45);
    return { w: 1, t: 1 + 0.95 * s * s };
  },
  /** Sygnetowa: pod tarcza szyna gestnieje i rozszerza sie w ramiona. */
  signet: (u) => {
    const s = Math.max(0, 1 - u / 0.55);
    const k = s * s * (3 - 2 * s);
    return { w: 1 + 0.62 * k, t: 1 + 1.05 * k };
  },
};

export function taperFor(p) {
  const nazwa = p.taper === "auto" ? (p.kind === "signet" ? "signet" : "none") : p.taper;
  return TAPERS[nazwa] || null;
}

export function buildShank(w, p, segments) {
  const { Manifold, CrossSection, Mesh } = w;
  const pts = ccw(shankProfile(p));
  const taper = taperFor(p);

  // Bez zwezenia zostaje obrot: jedna operacja jadra zamiast recznej siatki,
  // wiec szybciej i bez ryzyka pomylki w orientacji scian.
  if (!taper) return Manifold.revolve(CrossSection.ofPolygons([pts]), segments);

  const ri = p.innerDia / 2;
  const K = pts.length, M = Math.max(48, segments);
  const vert = new Float32Array(M * K * 3);
  const tri = new Uint32Array(M * K * 2 * 3);

  for (let i = 0; i < M; i++) {
    const th = (i / M) * Math.PI * 2;
    // Godzina dwunasta, czyli miejsce glowicy, lezy na +Y.
    // ODLEGLOSC KATOWA OD GLOWICY, i to jest cala subtelnosc tego miejsca.
    // Bylo tu `1 - d / PI`, czyli u = 1 dokladnie tam, gdzie siedzi glowica,
    // podczas gdy wszystkie zwezenia opisane wyzej licza u = 0 przy glowicy.
    // Sylwetki wychodzily wiec ODWROCONE: sygnet gestnial na dole zamiast
    // pod tarcza, a szyna zwezana byla waska z tylu. Objetosc sie zgadzala,
    // bo calka nie wie, ktora strona jest gora, i dlatego test tego nie lapal.
    const d = Math.abs(((th - Math.PI / 2) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
    const u = d / Math.PI;                  // 0 przy glowicy, 1 po przeciwnej stronie
    const k = taper(u);
    const ct = Math.cos(th), st = Math.sin(th);

    for (let j = 0; j < K; j++) {
      const [r, z] = pts[j];
      const rr = ri + (r - ri) * k.t;
      const o = (i * K + j) * 3;
      vert[o] = rr * ct; vert[o + 1] = rr * st; vert[o + 2] = z * k.w;
    }
  }

  let n = 0;
  for (let i = 0; i < M; i++) {
    const i2 = (i + 1) % M;
    for (let j = 0; j < K; j++) {
      const j2 = (j + 1) % K;
      const a = i * K + j, b = i2 * K + j, c = i2 * K + j2, d = i * K + j2;
      tri[n++] = a; tri[n++] = b; tri[n++] = c;
      tri[n++] = a; tri[n++] = c; tri[n++] = d;
    }
  }

  return new Manifold(new Mesh({ numProp: 3, vertProperties: vert, triVerts: tri }));
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

/**
 * Lapka: pret, ktory podnosi sie wzdluz kamienia, ZAGINA nad rondysta
 * i konczy sie zaokraglonym pazurkiem lezacym na koronie.
 *
 * Poprzednia wersja byla prostym walcem sciętym plasko na wysokosci korony.
 * Wygladalo to jak cztery gwozdzie wbite obok kamienia i, co wazniejsze,
 * TAK BY TO ODLANO: prosta lapka niczego nie trzyma, bo kamien wychodzi
 * gora przy pierwszym zaczepieniu. Zagiecie nad rondysta jest tym, co
 * fizycznie utrzymuje kamien w oprawie.
 *
 * Bryle skladamy z ciagu kul wzdluz toru. Jadro nie ma operacji otoczki
 * wypuklej ani zamiatania po krzywej, a kule zachodza na siebie, wiec daja
 * gladki pret bez szwow i zaokraglaja koniec za darmo. Kul jest dziewiec:
 * mniej widac jako paciorki, wiecej nie zmienia juz ksztaltu, a kazda to
 * osobna suma logiczna. Kule sa gladkie, bo lapka jest tu najblizej oka
 * i granie na jej powierzchni widac od razu.
 */
export function prongSolid(w, { radius, prongR, base, girdleTop, crownH }) {
  const { Manifold } = w;
  const N = 11;

  // Nad rondysta lapka pochyla sie do srodka o tyle promienia kamienia.
  const overhang = prongR * 1.25;
  // Pazurek konczy sie mniej wiecej w polowie korony. Wyzej zaslanialby
  // tafle, nizej nie trzymalby kamienia.
  const top = girdleTop + crownH * 0.5;
  // Do konca rondysty pret idzie prosto, dopiero potem sie zagina.
  const bend = (girdleTop - base) / (top - base);

  let solid = null;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const z = base + (top - base) * t;
    // Wygladzenie zamiast zalamania: zagiecie narasta lagodnie.
    const u = t <= bend ? 0 : (t - bend) / (1 - bend);
    const r = radius - overhang * (u * u * (3 - 2 * u));
    // Pret zweza sie ku gorze, tak jak zweza sie odlana lapka po opilowaniu.
    const rad = prongR * (1 - 0.28 * t);
    // Lapke budujemy na osi +X i dopiero gotowa obracamy na miejsce.
    // Kazda kula to osobna suma logiczna, wiec liczenie szesciu lapek od zera
    // kosztowalo szescdziesiat kilka operacji i podglad reagowal z polsekundowym
    // opoznieniem. Ten sam ksztalt starczy raz.
    const ball = Manifold.sphere(rad, 24).translate([r, 0, z]);
    solid = solid ? solid.add(ball) : ball;
  }
  return solid;
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
    // Kaseta: scianka dookola rondysty, zawinieta nad kamien.
    //
    // Wczesniej byla prostym walcem o plaskiej gornej krawedzi, czyli tulejka.
    // Prawdziwa kaseta zweza sie ku gorze, bo jubiler DOCISKA rant na kamien,
    // a metal przy tym plynie do srodka. Plaska krawedz nie tylko wyglada
    // technicznie, ale i sugeruje, ze kamien mozna wyjac bez rozgiecia oprawy.
    //
    // Wnetrze wycina dopiero gniazdo, wiec tu zostawiamy pelny obrys.
    const wall = 0.5;
    const h = stone.girdleH + stone.crownH * 0.35 + 0.4;
    const outer = CrossSection.ofPolygons([ccw(outlineFor(p.stone.cut, size + 2 * wall))]);
    const trzon = h * 0.7 + SEAT.aboveGalleryMm;
    add(Manifold.extrude(outer, trzon).translate([0, 0, -SEAT.aboveGalleryMm]));
    // Rant dociskany na kamien: ta sama scianka, ale zbiegajaca do wewnatrz.
    const zbieg = 1 - (wall * 0.85) / (size / 2 + wall);
    add(Manifold.extrude(outer, h * 0.3, 0, 0, [zbieg, zbieg])
      .translate([0, 0, trzon - SEAT.aboveGalleryMm]));
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

  // Lapki o tym samym promieniu roznia sie wylacznie obrotem, a przy szlifie
  // okraglym promien jest jeden dla wszystkich. Budujemy wiec ksztalt raz
  // na promien i powielamy obrotem.
  const wzorce = new Map();
  for (const deg of prongAngles(cut, p.setting)) {
    const a = deg * DEG;
    const rr = radiusAt(pts, deg) - rP * 0.15;
    const klucz = rr.toFixed(4);
    if (!wzorce.has(klucz)) {
      wzorce.set(klucz, prongSolid(w, {
        radius: rr, prongR: rP,
        base: -SEAT.aboveGalleryMm,
        girdleTop: stone.girdleH,
        crownH: stone.crownH,
      }));
    }
    let prong = wzorce.get(klucz).rotate([0, 0, deg]);
    if (p.setting === "vprong") {
      // Lapka V obejmuje szpic z dwoch stron, wiec dokladamy klin.
      const h = stone.girdleH + stone.crownH * 0.75 + SEAT.aboveGalleryMm;
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

  // Kamienie boczne ida po obwodzie, wiec ich promien tez musi isc za
  // zwezeniem, inaczej pierwszy zostaje na szynie, a ostatni wisi obok niej.
  const kBok = taperFor(p);
  const gr = (u) => p.thickness * (kBok ? kBok(u).t : 1);
  const ro = p.innerDia / 2 + gr(0);
  const rMid = p.innerDia / 2 + gr(0) * 0.62;
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
      // Kazdy kamien lezy pod innym katem od glowicy, wiec przy zwezonej
      // szynie kazdy siedzi na innym promieniu. Jeden wspolny promien
      // zostawialby ostatni kamien wiszacy obok metalu.
      const odchyl = start + step * i;
      const a = Math.PI / 2 + side * odchyl;
      const roI = p.innerDia / 2 + gr(odchyl / Math.PI);
      const rMidI = p.innerDia / 2 + gr(odchyl / Math.PI) * 0.62;
      const x = Math.cos(a) * rMidI, y = Math.sin(a) * rMidI;
      const tilt = [0, 0, 0];

      // OBROT MUSI BYC TAKI SAM JAK PRZY KORONIE SRODKOWEJ. `rotate([90,0,0])`
      // odwraca kamien: tafla patrzy wtedy w glab palca, a koleta na zewnatrz.
      // Na renderze wyglada to prawie tak samo, ale gniazdo wycina sie odwrotnie,
      // wiec zmienia sie objetosc metalu, a z niej cena.
      const { solid } = stoneSolid(w, "round", size);
      const placed = solid
        .rotate([-90, 0, 0])                        // tafla na zewnatrz promienia
        .rotate([0, 0, (a / DEG) - 90])
        .translate([x * (roI / rMidI), y * (roI / rMidI), 0]);
      stones.push(placed);

      const cutter = seatCutter(w, "round", size)
        .rotate([-90, 0, 0])
        .rotate([0, 0, (a / DEG) - 90])
        .translate([x * (roI / rMidI), y * (roI / rMidI), 0]);
      addS(cutter);

      // Kuleczki i lapki musza WCHODZIC w szyne, a nie stac na niej. Walec
      // postawiony na wypuklej powierzchni styka sie z nia wzdluz linii, wiec
      // suma daje bryle rozsypana na kawalki, co `genus` natychmiast pokazuje.
      // Promien bierzemy z PROFILU na tej wysokosci, nie z `ro`. Kuleczka
      // ma wejsc w metal, a nie stanac obok niego.
      // Przy szynie zwezonej promien profilu trzeba PRZELICZYC: obrys jest
      // rozciagniety w szerokosc razy `w` i odsuniety od srodka razy `t`,
      // wiec wysokosc wzdluz osi wraca do ukladu obrysu przez podzielenie.
      // Bez tego kuleczki na zwezonej szynie stoja obok metalu.
      const kk = kBok ? kBok(odchyl / Math.PI) : { w: 1, t: 1 };
      const ri0 = p.innerDia / 2;
      const SINK = 0.22;
      const at = (tang, axial) => {
        const rad = ri0 + (shankRadiusAt(p, axial / kk.w) - ri0) * kk.t - SINK;
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

  // Trzy czesci, bo tak wyglada odlany sygnet i tak sie go poleruje.
  //
  // 1. Tarcza, plaska, w ktora idzie grawer.
  // 2. FAZA na krawedzi tarczy. Bez niej krawedz jest ostra jak po
  //    wykrojniku i cala glowica wyglada jak plytka doklejona do szyny.
  //    Na kazdym sygnecie z polki ta faza jest, bo powstaje sama przy
  //    polerowaniu kanta.
  // 3. Ramiona, ktore rozszerzaja sie ku tarczy. Wczesniej byl tu krotki,
  //    dwumilimetrowy stozek i przejscie w szyne bylo urwane. Wyzszy
  //    i lagodniejszy daje sylwetke, ktora widac na kazdym zdjeciu:
  //    szyna waska od spodu, masywna pod tarcza.
  const faza = Math.min(0.45, T * 0.22);
  const zbieg = 1 - faza / Math.min(W, L);

  const tarcza = Manifold.extrude(cs, T - faza);
  const kant = Manifold.extrude(cs, faza, 0, 0, [zbieg, zbieg]).translate([0, 0, T - faza]);

  // Ramiona budujemy OD DOLU do gory, a nie przez odbicie gotowej bryly.
  // Odbicie odwraca kierunek nawiniecia scian i jadro oddaje wtedy bryle
  // pusta, po cichu, bez bledu. Ten sam mechanizm zjadl juz raz cala szyne.
  // Wysokosc i zwezenie dobrane pod sylwetke ze zdjec katalogowych: ramiona
  // maja WTAPIAC sie w tarcze, a nie podpierac ja jak nozka kieliszka.
  // Przy 3,4 mm i zwezeniu do 0,46 glowica wygladala jak grzyb postawiony
  // na cienkiej szynie.
  const ramionaH = 2.2;
  const wask = 0.76;
  const ramiona = Manifold.extrude(
    CrossSection.ofPolygons([ccw(scalePts(pts, wask))]),
    ramionaH, 0, 0, [1 / wask, 1 / wask],
  ).translate([0, 0, -ramionaH]);

  // Glowica siedzi GLEBIEJ w szynie, zeby przejscie bylo plynne.
  return tarcza.add(kant).add(ramiona).translate([0, 0, -T * 0.45]);
}

// ------------------------------------------------------------
// Zlozenie
// ------------------------------------------------------------



/**
 * Galeria, czyli luk laczacy kosz z ramionami.
 *
 * Kosz stoi na szynie i dotyka jej tylko w linii srodkowej, bo szyna jest
 * okragla, a kosz plaski od spodu. Na zdjeciach katalogowych w tym miejscu
 * jest lagodny luk schodzacy z glowicy na ramiona i to on odpowiada za
 * sylwetke, ktora czyta sie jako "katedralna".
 *
 * To nie jest wylacznie wyglad. Styk punktowy jest najslabszym miejscem
 * odlewu: glowica odlamuje sie wlasnie tam, przy pierwszym mocniejszym
 * uderzeniu, bo caly moment przechodzi przez kilka dziesiatych milimetra
 * metalu.
 *
 * Znowu ciag zachodzacych kul, z tego samego powodu co przy lapce: jadro nie
 * zamiata po krzywej, a kule daja gladki przekroj i same sie zaokraglaja.
 * Luk idzie po OBWODZIE pierscionka, wiec promien kazdej kuli bierzemy
 * z profilu szyny w tym miejscu, razem ze zwezeniem.
 */
export function buildGallery(w, p, basketH) {
  const { Manifold } = w;
  const ri = p.innerDia / 2;
  const kG = taperFor(p);
  const N = 15;
  const rozpietosc = 34 * DEG;                 // jak daleko luk schodzi po obwodzie
  const wznios = Math.max(0.3, basketH * 0.5);

  let solid = null;
  for (const s of [-1, 1]) {
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const th = Math.PI / 2 + s * t * rozpietosc;
      const u = (t * rozpietosc) / Math.PI;
      const k = kG ? kG(u) : { w: 1, t: 1 };

      // Powierzchnia szyny w tym miejscu, i wzniesienie ku glowicy.
      const rSzyna = ri + (shankRadiusAt(p, 0) - ri) * k.t;
      const podniesienie = wznios * (1 - t) ** 1.6;
      // Kula ma sie ZANURZYC w szynie, a nie usiasc na niej. Plytsze
      // zanurzenie dawalo walek z widocznymi paciorkami zamiast pogrubienia.
      const r = rSzyna - 0.5 + podniesienie;
      // Kula chudnie ku dolowi, zeby luk wtopil sie w szyne, a nie usiadl
      // na niej jako osobny walek.
      const rad = Math.max(0.22, (p.width * k.w) / 2 * (1.0 - 0.30 * t));

      const ball = Manifold.sphere(rad, 16)
        .translate([Math.cos(th) * r, Math.sin(th) * r, 0]);
      solid = solid ? solid.add(ball) : ball;
    }
  }
  return solid;
}

/**
 * Kamienie po OBWODZIE szyny, czyli eternity i half eternity.
 *
 * Rozne od kamieni bocznych tym, ze nie odnosza sie do glowicy: nie ma tu
 * zadnej glowicy. Kamienie ida rownomiernie po calym obwodzie albo po jego
 * gornej polowie, a ich liczbe wyznacza obwod podzielony przez srednice.
 *
 * Eternity ma wade, ktora trzeba znac przed zakupem, i mowimy o niej wprost
 * w opisie presetu: pierscionka z kamieniami dookola NIE DA SIE rozciagnac
 * ani zwezic, bo nie ma gladkiego odcinka, w ktory jubiler moglby wejsc.
 * Half eternity tej wady nie ma.
 */
function buildBandStones(w, p) {
  const { Manifold } = w;
  if (p.band.coverage === "none") {
    return { addMetal: null, cutSeats: null, stones: [], stoneVolume: 0 };
  }

  const d = p.band.size;
  const kB = taperFor(p);
  const ri = p.innerDia / 2;
  const promien = (u) => ri + p.thickness * (kB ? kB(u).t : 1);

  // Kamienie siadaja na promieniu szyny, a rozstaw liczymy po srodkowej.
  const rMid = promien(0.5) * 0.985;
  const krok = Math.asin(Math.min(0.5, (d * 0.56) / rMid)) * 2;
  const pelny = p.band.coverage === "full";
  const n = Math.max(3, Math.floor((pelny ? Math.PI * 2 : Math.PI) / krok));

  let metal = null, seats = null;
  const stones = [];
  const addM = (m) => { metal = metal ? metal.add(m) : m; };

  for (let i = 0; i < n; i++) {
    // Pelny obwod liczymy od godziny dwunastej w obie strony, polowe tylko
    // po gorze, zeby dol szyny zostal gladki i dal sie chwycic przy zmianie
    // rozmiaru.
    const a = pelny
      ? Math.PI / 2 + (i / n) * Math.PI * 2
      : Math.PI / 2 - Math.PI / 2 + ((i + 0.5) / n) * Math.PI;
    const odchyl = Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const u = odchyl / Math.PI;             // 0 przy glowicy, jak wszedzie indziej
    // Kamien siada NIECO PONIZEJ powierzchni szyny. Postawiony dokladnie na
    // niej wystaje poza obrys obraczki i zaczepia o wszystko, a przy okazji
    // wyglada jak doklejony.
    const ro2 = promien(u) - Math.min(0.22, d * 0.12);
    const x = Math.cos(a) * ro2, y = Math.sin(a) * ro2;

    const maly = stoneSolid(w, "round", d);
    stones.push(maly.solid.rotate([-90, 0, 0]).rotate([0, 0, (a / DEG) - 90]).translate([x, y, 0]));

    const cut = seatCutter(w, "round", d).rotate([-90, 0, 0]).rotate([0, 0, (a / DEG) - 90])
      .translate([x, y, 0]);
    seats = seats ? seats.add(cut) : cut;

    if (p.band.setting === "pave") {
      // Promien MUSI byc wziety z profilu na wysokosci kuleczki, a nie ze
      // szczytu szyny. Szyna polokragla opada ku krawedziom, wiec kuleczka
      // postawiona na promieniu szczytu wisi obok metalu i bryla rozpada sie
      // na kilkadziesiat czesci. Widac to w ujemnym `genus`, nie na renderze.
      const kk = kB ? kB(u) : { w: 1, t: 1 };
      const off = Math.min(d * 0.56, (p.width * kk.w) / 2 - 0.16);
      const rad = ri + (shankRadiusAt(p, off / kk.w) - ri) * kk.t - 0.2;
      for (const s of [-1, 1]) {
        addM(Manifold.sphere(0.28, 14)
          .translate([Math.cos(a) * rad, Math.sin(a) * rad, s * off]));
      }
    }
  }

  return {
    addMetal: metal, cutSeats: seats, stones,
    stoneVolume: stoneSolid(w, "round", d).solid.volume(),
  };
}

/**
 * Halo: wieniec drobnych kamieni WOKOL korony.
 *
 * Buduje sie go w ukladzie korony, czyli rondysta kamienia centralnego na
 * z = 0, tafla w gore. Cala grupa jedzie potem tym samym przeksztalceniem
 * co korona, wiec nie trzeba jej ustawiac osobno.
 *
 * Liczba kamieni NIE jest parametrem. Wynika z obwodu wienca podzielonego
 * przez srednice kamienia: to jest ta sama arytmetyka, ktora robi jubiler
 * przy stole, a zostawienie jej klientowi konczy sie albo dziura w wiencu,
 * albo kamieniami zachodzacymi na siebie.
 */
function buildHalo(w, p, stone, girdleR) {
  const { Manifold, CrossSection } = w;
  const d = p.halo.size;
  const luz = 0.18;                                // odstep wienca od rondysty
  const rW = girdleR + luz + d / 2;                // promien, na ktorym siedza kamienie
  const n = Math.max(8, Math.floor((Math.PI * 2 * rW) / (d * 1.06)));

  // Plyta wienca: pierscien metalu z otworem na kamien centralny. Otwor musi
  // byc mniejszy od rondysty, inaczej kamien centralny nie ma na czym usiasc,
  // a wieniec wisi na samych lapkach.
  const kolo = (r) => smoothCircle(r, 64);
  const rZewn = rW + d / 2 + 0.34;
  const rWewn = Math.max(0.4, girdleR - 0.12);
  const grubosc = Math.max(0.9, d * 0.72);
  const plyta = Manifold.extrude(
    CrossSection.ofPolygons([ccw(kolo(rZewn)), ccw(kolo(rWewn)).reverse()]),
    grubosc,
  ).translate([0, 0, -grubosc + stone.girdleH * 0.5]);

  let metal = plyta;
  let seats = null;
  const stones = [];
  const zK = stone.girdleH * 0.5 - 0.06;           // rondysta kamyka wienca

  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rW, y = Math.sin(a) * rW;

    const maly = stoneSolid(w, "round", d);
    stones.push(maly.solid.translate([x, y, zK]));

    const cut = seatCutter(w, "round", d).translate([x, y, zK]);
    seats = seats ? seats.add(cut) : cut;

    // Kuleczki trzymajace, po dwie na kamien, na zewnetrznej krawedzi wienca.
    for (const s of [-1, 1]) {
      const b = a + s * (Math.PI / n) * 0.82;
      metal = metal.add(Manifold.sphere(0.26, 12)
        .translate([Math.cos(b) * (rW + d * 0.42), Math.sin(b) * (rW + d * 0.42), zK + 0.1]));
    }
  }

  return { metal, seats, stones, count: n, stoneVolume: stones.length ? stoneSolid(w, "round", d).solid.volume() : 0 };
}

/** Okrag jako lista punktow. Uzywany tam, gdzie potrzebny jest przekroj z otworem. */
function smoothCircle(r, n) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}


// ------------------------------------------------------------
// Dodatki odlewnicze: kanal wlewowy i stopka
// ------------------------------------------------------------
/**
 * Kanal wlewowy i stopka odlewnicza.
 *
 * NIE sa czescia wyrobu. Kanal odcina sie po odlaniu, a metal z niego wraca
 * do tygla, wiec nie wchodzi ani do masy pierscionka, ani do jego ceny.
 * Bryla wraca stad OSOBNO i dolacza sie wylacznie do pliku.
 *
 * Kanal wchodzi w NAJGRUBSZE miejsce odlewu i to nie jest wybor estetyczny.
 * Metal krzepnie od cienkich scianek ku grubym, a kanal musi zastygnac jako
 * ostatni, zeby do konca dokarmial kurczacy sie odlew. Wpiety w cienka szyne
 * zakrzepnie pierwszy i pod glowica zostanie jama skurczowa.
 *
 * Przy szynie zwezanej ku glowicy najgrubszy jest DOL pierscionka, przy
 * sygnetowej odwrotnie. Wybieramy wiec strone z pomiaru, a nie z zalozenia.
 *
 * Stopka to zbiornik metalu pod kanalem. Jej rola jest ta sama, tylko na
 * wieksza skale: trzyma cieklo najdluzej i oddaje metal w glab formy.
 */
function buildCasting(w, p) {
  const { Manifold } = w;
  const ri = p.innerDia / 2;
  const k = taperFor(p);
  const przyGlowicy = ri + p.thickness * (k ? k(0).t : 1);
  const naDole = ri + p.thickness * (k ? k(1).t : 1);

  // Strona grubsza wygrywa. Przy remisie schodzimy na dol, bo tam kanal nie
  // koliduje z glowica i latwiej go odcinac.
  const doGory = przyGlowicy > naDole + 0.05;
  const promien = doGory ? przyGlowicy : naDole;
  const znak = doGory ? 1 : -1;

  // Srednice kanalow sa warsztatowe, nie dowolne. Ponizej trzech milimetrow
  // kanal krzepnie przed odlewem i cala jego funkcja znika.
  const rKanal = 1.6;
  const dlugosc = 9.0;
  const rStopka = 5.0;                        // stopka o srednicy 10 mm
  const hStopka = 3.0;

  /**
   * Odcinek stozkowy ulozony wzdluz osi wlewu, liczony od srodka pierscionka.
   *
   * `Manifold.cylinder` rosnie wzdluz +Z od zera, a obrot przenosi go na os Y.
   * Przy pierwszym podejsciu przesuwalem bryle o `promien + dlugosc`, czyli
   * o dlugosc kanalu ZA DUZO, i kanal stal obok pierscionka, nie w nim.
   * Widac to bylo dopiero po policzeniu czesci skladowych: dwie zamiast
   * jednej, czyli w pliku dwa osobne przedmioty.
   */
  const odcinek = (h, r0, r1, od) =>
    Manifold.cylinder(h, r0, r1, 28, false)
      .rotate([znak > 0 ? -90 : 90, 0, 0])
      .translate([0, znak * od, 0]);

  // Kanal zaczyna sie POD powierzchnia odlewu, zeby polaczenie bylo pewne,
  // i zweza sie ku niemu, bo tak plynie metal i tak zastyga we wlasciwej
  // kolejnosci: najdalej od odlewu najpozniej.
  const start = promien - 0.8;
  let solid = odcinek(dlugosc, rKanal * 0.62, rKanal, start);

  if (p.casting.button) {
    // Przejscie stozkowe, zeby przekroj nie zmienial sie skokiem: ostry
    // uskok to miejsce, w ktorym odlew rwie sie przy stygnieciu.
    solid = solid
      .add(odcinek(2.0, rKanal, rStopka * 0.92, start + dlugosc - 0.3))
      .add(odcinek(hStopka, rStopka, rStopka * 0.88, start + dlugosc + 1.5));
  }

  return solid;
}

/**
 * @param {object} input parametry wedlug `params.js`
 * @param {object} [opts] `{ segments, withStones }`
 * @returns {Promise<{metal, stones, params, volumeMm3, massG, patternVolumeMm3}>}
 */
export async function buildRing(input, opts = {}) {
  const p = validate(input);
  // Kamienie moga zniknac z modelu na dwa sposoby: przez parametr klienta
  // i przez wywolanie wewnetrzne, ktore ich nie potrzebuje. Oba znacza to
  // samo, wiec skladamy je w jedno.
  const zKamieniami = opts.withStones !== false && p.casting.stones !== false;
  const w = await kernel();
  const segments = opts.segments || SEG;

  // Promien szyny NA GODZINIE DWUNASTEJ, czyli tam, gdzie siada glowica.
  // Przy zwezonej szynie to NIE jest `ri + grubosc`: zwezenie sciaga metal
  // do srodka i korona postawiona na starej wysokosci wisi nad szyna, ze
  // szczelina, ktora widac golym okiem. Ten sam blad w druga strone, przy
  // sylwetce sygnetowej, wpychalby glowice w szyne.
  const kGlowica = taperFor(p);
  const ro = p.innerDia / 2 + p.thickness * (kGlowica ? kGlowica(0).t : 1);
  let metal = buildShank(w, p, segments);
  const stones = [];
  // Objetosci kamieni sa potrzebne wycenie, bo karat to jednostka MASY:
  // liczy sie go z objetosci razy gestosc, a nie z szerokosci kamienia.
  // Zbieramy je zawsze, takze gdy podglad kamieni jest wylaczony.
  const stoneVolumesMm3 = { center: 0, side: 0 };
  let haloSeats = null;

  // Korona i kamien lezyskuja na godzinie dwunastej, czyli w osi +Y.
  const place = (m) => m.rotate([-90, 0, 0]).translate([0, ro, 0]);

  if (p.kind === "band") {
    // Obraczka: sama szyna. Kamienie, jesli sa, ida po obwodzie.
    const b = buildBandStones(w, p);
    if (b.addMetal) metal = metal.add(b.addMetal);
    if (b.cutSeats) metal = metal.subtract(b.cutSeats);
    if (zKamieniami) stones.push(...b.stones);
    stoneVolumesMm3.side = b.stoneVolume;
    stoneVolumesMm3.sideCount = b.stones.length;
  } else if (p.kind === "signet") {
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

    if (zKamieniami) {
      stones.push(place(stone.solid.translate([0, 0, standoff])));
    }

    // Halo obejmuje korone, wiec jedzie razem z nia: tym samym obrotem
    // i o te sama wysokosc, o ktora kosz podnosi kamien nad szyne.
    if (p.halo.on) {
      const girdleR = Math.max(...outlineFor(p.stone.cut, p.stone.size).map(([x, y]) => Math.hypot(x, y)));
      const halo = buildHalo(w, p, stone, girdleR);
      metal = metal.add(place(halo.metal.translate([0, 0, standoff])));
      haloSeats = place(halo.seats.translate([0, 0, standoff]));
      if (zKamieniami) {
        stones.push(...halo.stones.map((sn) => place(sn.translate([0, 0, standoff]))));
      }
      stoneVolumesMm3.halo = halo.stoneVolume;
      stoneVolumesMm3.haloCount = halo.count;
    }

    const side = buildSideStones(w, p);
    if (p.side.count > 0) stoneVolumesMm3.side = stoneSolid(w, "round", p.side.size).solid.volume();
    if (side.addMetal) metal = metal.add(side.addMetal);
    if (crown) {
      metal = metal.add(place(crown.translate([0, 0, standoff])));
      // Galeria ma sens tylko wtedy, gdy jest co podeprzec: przy briolecie
      // kosza nie ma, a przy kasecie rant siega szyny wlasnym trzonem.
      if (basketH > 0 && p.setting !== "bezel") {
        // Wysokosc kosza, a NIE kosz plus podniesienie: kosz jest juz
        // przesuniety o `standoff`, wiec zsumowanie obu podnosilo luk
        // dwukrotnie i zamiast wtopic sie w szyne siadal na niej guzkami.
        metal = metal.add(buildGallery(w, p, basketH));
      }
    }

    // Gniazda WYCINAMY dopiero po zlaczeniu wszystkiego, zeby siegaly takze
    // szyny. Odwrotna kolejnosc daje bryle cieszsza o kilkanascie procent.
    if (p.setting !== "drilled") {
      metal = metal.subtract(place(seatCutter(w, p.stone.cut, p.stone.size).translate([0, 0, standoff])));
    }
    if (side.cutSeats) metal = metal.subtract(side.cutSeats);
    // Gniazda wienca tez po zlaczeniu, z tego samego powodu co srodkowe.
    if (haloSeats) metal = metal.subtract(haloSeats);
    if (zKamieniami) stones.push(...side.stones);
  }

  const volumeMm3 = metal.volume();
  const alloyDef = CASTING_ALLOYS[p.alloy] || CASTING_ALLOYS.ag925;

  // MASA KAMIENI, osobno od metalu.
  //
  // Do tej pory podawalismy "mase metalu" i to bylo uczciwe, ale niepelne:
  // klient trzyma w reku pierscionek, nie sam odlew, a kamienie waza. Karat
  // to jednostka masy, wiec liczy sie ja z objetosci razy gestosc.
  //
  // Rozdzial jest istotny takze technicznie: WYJECIE kamienia zmienia mase
  // gotowego wyrobu, ale NIE mase odlewu z gniazdami. Gniazda sa wyciete
  // niezaleznie od tego, czy kamien w nich siedzi.
  const wagaKamieni = (id, objetosc, ile) => (objetosc / 1000) * gemDensity(id) * ile;
  let stoneMassG = 0, caratTotal = 0;
  const dolicz = (id, objetosc, ile) => {
    if (!(objetosc > 0) || !(ile > 0)) return;
    const g = wagaKamieni(id, objetosc, ile);
    stoneMassG += g;
    caratTotal += g * 5;                  // 1 ct = 0,2 g
  };
  if (p.kind === "band") {
    dolicz(p.band.material, stoneVolumesMm3.side, stoneVolumesMm3.sideCount || 0);
  } else if (p.kind !== "signet") {
    dolicz(p.stone.material, stoneVolumesMm3.center, p.setting === "drilled" ? 0 : 1);
    dolicz(p.side.material, stoneVolumesMm3.side, p.side.count * 2);
    dolicz(p.halo.material, stoneVolumesMm3.halo || 0, stoneVolumesMm3.haloCount || 0);
  }
  // Kanal i stopka wracaja OSOBNO. Gdyby weszly do `metal`, podniosly by
  // objetosc o kilkadziesiat procent, a wraz z nia mase i cene, za metal,
  // ktory po odcieciu wraca do tygla.
  const casting = p.casting.sprues ? buildCasting(w, p) : null;

  return {
    params: p,
    metal,
    casting,
    stones,
    stoneVolumesMm3,
    volumeMm3,
    // Kolor stopu zmienia gestosc, wiec i mase. Bez niego biale zloto
    // liczyloby sie jak zolte i wycena bylaby zanizona o kilkanascie procent.
    massG: massGrams(volumeMm3, p.alloy, p.color) ?? 0,
    stoneMassG,
    caratTotal,
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
