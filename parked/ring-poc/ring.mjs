// Prototyp: parametryczny pierscionek zareczynowy z kamieniem i lapkami.
// Cel: sprawdzic, czy da sie zbudowac bryle do druku z samych parametrow,
// bez modelowania recznego, i ile to kosztuje czasu.

import Module from "manifold-3d";

const wasm = await Module();
wasm.setup();
const { Manifold, CrossSection } = wasm;

const deg = (d) => (d * Math.PI) / 180;

// PULAPKA, ktora kosztowala pierwsze podejscie: `revolve` przy profilu
// nawinietym zgodnie z zegarem zwraca bryle PUSTA, bez bledu i bez ostrzezenia.
// Kolejnosc punktow w profilu nie moze decydowac o tym, czy model istnieje,
// wiec pole liczymy sami i w razie czego odwracamy.
function ccw(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a < 0 ? [...pts].reverse() : pts;
}

// ------------------------------------------------------------
// Kamien: brylant okragly z proporcji szlifu
// ------------------------------------------------------------
// Nie modelujemy 57 fasetek pojedynczo. Bryla powstaje z obrotu profilu
// (korona, rondysta, pawilon) o zadanej liczbie segmentow, a liczba
// segmentow = liczbie glownych fasetek. Ksztalt jest wiec prawdziwy
// geometrycznie, a nie "stozek udajacy kamien".
function brilliant({ diameter = 6.5, tablePct = 57, crownDeg = 34.5, pavilionDeg = 40.8, girdlePct = 3 } = {}) {
  const r = diameter / 2;
  const rTable = r * (tablePct / 100);
  const crownH = (r - rTable) * Math.tan(deg(crownDeg));
  const girdleH = diameter * (girdlePct / 100);
  const pavH = r * Math.tan(deg(pavilionDeg));

  // Profil w plaszczyznie (promien, wysokosc), liczony od kolety.
  const profile = [
    [0, 0],
    [r, pavH],
    [r, pavH + girdleH],
    [rTable, pavH + girdleH + crownH],
    [0, pavH + girdleH + crownH],
  ];
  return Manifold.revolve(CrossSection.ofPolygons([ccw(profile)]), 16);
}

// ------------------------------------------------------------
// Obraczka: przekroj obrocony wokol osi pierscionka
// ------------------------------------------------------------
function shank({ innerDia = 17.2, width = 2.2, thickness = 1.6, comfort = true } = {}) {
  const ri = innerDia / 2;
  const ro = ri + thickness;
  const hw = width / 2;

  // Profil przekroju w plaszczyznie (promien, polozenie wzdluz osi).
  // Comfort fit zaokragla wnetrze, bo obraczka ma sie wygodnie zsuwac.
  const pts = comfort
    ? [[ri + 0.25, -hw], [ri, -hw * 0.45], [ri, hw * 0.45], [ri + 0.25, hw], [ro, hw * 0.8], [ro, -hw * 0.8]]
    : [[ri, -hw], [ri, hw], [ro, hw], [ro, -hw]];

  return Manifold.revolve(CrossSection.ofPolygons([ccw(pts)]), 128);
}

// ------------------------------------------------------------
// Lapki i galeria
// ------------------------------------------------------------
function prongs({ count = 4, stoneDia = 6.5, wire = 0.9, height = 4.2, seatZ = 0 } = {}) {
  const parts = [];
  const rSeat = stoneDia / 2 - wire * 0.25;
  for (let i = 0; i < count; i++) {
    const a = (2 * Math.PI * i) / count + Math.PI / 4;
    // Lapka: walec lekko zwezany ku gorze, pochylony do srodka.
    let p = Manifold.cylinder(height, wire / 2, wire / 2.6, 16, false)
      .rotate([6, 0, 0])
      .translate([rSeat * Math.cos(a), rSeat * Math.sin(a), seatZ]);
    parts.push(p);
  }
  return Manifold.union(parts);
}

// Galeria to obrecz pod kamieniem plus dwa slupki schodzace do obraczki.
// Bez slupkow glowica jest OSOBNA BRYLA: model wyglada poprawnie na podgladzie,
// a po odlaniu czesc odpada. Liczymy to skladowymi, nie ogladamy na oko.
//
// Slupki musza staka w plaszczyznie obraczki (|y| < polowa szerokosci) i na
// promieniu obreczy. Pierwsze podejscie stawialo je w y = +-1,6 mm przy
// obraczce szerokiej 2,2 mm, wiec mijaly ja w powietrzu.
function gallery({ stoneDia = 6.5, wire = 1.0, z = 0, downTo = 0 } = {}) {
  const r = stoneDia / 2 - 0.35;
  const hoop = Manifold.cylinder(wire, r + wire / 2, r + wire / 2, 64, true)
    .subtract(Manifold.cylinder(wire * 3, r - wire / 2, r - wire / 2, 64, true))
    .translate([0, 0, z]);

  const h = z - downTo + wire;
  const posts = [-1, 1].map((sx) =>
    Manifold.cylinder(h, wire / 2, wire / 2, 20, false).translate([sx * r, 0, downTo])
  );
  return Manifold.union([hoop, ...posts]);
}

// ------------------------------------------------------------
// Zlozenie
// ------------------------------------------------------------
export function buildRing(p = {}) {
  const {
    ringSizeEu = 54, bandWidth = 2.2, bandThickness = 1.6,
    stoneDia = 6.5, prongCount = 4, headHeight = 4.6,
  } = p;

  const innerDia = ringSizeEu / Math.PI;
  const ri = innerDia / 2;

  // `revolve` obraca wokol osi Y, wiec obraczka sama z siebie stoi pionowo
  // w plaszczyznie XZ, a jej gora lezy na +Z. Zadnego obrotu nie potrzeba;
  // pierwsza wersja obracala ja o 90 stopni i glowica ladowala w srodku
  // pierscionka zamiast na obraczce.
  const band = shank({ innerDia, width: bandWidth, thickness: bandThickness });

  const ro = ri + bandThickness;
  // Kamien siada na obraczce: koleta schowana lekko w metal, zeby oczko
  // nie wisialo w powietrzu i zeby bylo co odjac przy gniezdzie.
  const seatZ = ro - 0.4;
  const stone = brilliant({ diameter: stoneDia }).translate([0, 0, seatZ]);

  const gal = gallery({ stoneDia, wire: 1.0, z: seatZ + 0.5, downTo: ro - bandThickness * 0.6 });
  const pr = prongs({ count: prongCount, stoneDia, height: headHeight, seatZ: seatZ - 0.2 });

  // Metal to suma obraczki, galerii i lapek, MINUS gniazdo kamienia.
  // Bez odejmowania kamienia lapki wchodzilyby w niego i wydruk mialby
  // material tam, gdzie ma byc szlif.
  // PULAPKA: `scale` skaluje wzgledem POCZATKU UKLADU, a nie wzgledem srodka
  // bryly. Kamien osadzony na wysokosci 9,8 mm i przeskalowany o 2% podskakuje
  // o 0,2 mm i przecina lapki, odcinajac je od reszty. Powiekszamy wiec luz
  // wokol srodka kamienia, a nie wokol zera.
  const seat = brilliant({ diameter: stoneDia + 0.12 }).translate([0, 0, seatZ - 0.06]);
  const metal = Manifold.union([band, gal, pr]).subtract(seat);

  return { metal, stone, innerDia };
}

// ------------------------------------------------------------
// Pomiar
// ------------------------------------------------------------
const t0 = Date.now();
const { metal, stone, innerDia } = buildRing({ ringSizeEu: 54, stoneDia: 6.5, prongCount: 4 });
const ms = Date.now() - t0;

const mesh = metal.getMesh();
const tris = [];
for (let i = 0; i < mesh.triVerts.length; i += 3) {
  const v = (k) => {
    const o = mesh.triVerts[i + k] * mesh.numProp;
    return [mesh.vertProperties[o], mesh.vertProperties[o + 1], mesh.vertProperties[o + 2]];
  };
  tris.push([v(0), v(1), v(2)]);
}

console.log("czas generowania:", ms, "ms");
console.log("srednica wewnetrzna:", innerDia.toFixed(2), "mm (rozmiar EU 54)");
console.log("trojkatow metalu:", tris.length);
console.log("objetosc metalu:", (metal.volume() / 1000).toFixed(3), "cm3");
console.log("czy jedna spojna bryla:", metal.decompose().length === 1, "(skladowych:", metal.decompose().length + ")");
console.log("objetosc kamienia:", (stone.volume() / 1000).toFixed(3), "cm3");

// Masa w zlocie 585 (gestosc 13,1 g/cm3) i w srebrze 925 (10,36).
const vol = metal.volume() / 1000;
console.log("masa Au 585:", (vol * 13.1).toFixed(2), "g  | Ag 925:", (vol * 10.36).toFixed(2), "g");

// Karat kamienia: gestosc diamentu 3,52 g/cm3, 1 karat = 0,2 g
console.log("masa kamienia:", ((stone.volume() / 1000) * 3.52 / 0.2).toFixed(2), "ct");

// Zapis STL do sprawdzenia sprawdzarka
import { writeFileSync } from "node:fs";
const buf = Buffer.alloc(84 + tris.length * 50);
buf.writeUInt32LE(tris.length, 80);
let o = 84;
for (const [a, b, c] of tris) {
  o += 12;
  for (const v of [a, b, c]) { buf.writeFloatLE(v[0], o); buf.writeFloatLE(v[1], o + 4); buf.writeFloatLE(v[2], o + 8); o += 12; }
  o += 2;
}
writeFileSync(new URL("./pierscionek.stl", import.meta.url), buf);
console.log("zapisano pierscionek.stl");
