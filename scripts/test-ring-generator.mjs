#!/usr/bin/env node
// ============================================================
// GENERATOR PIERSCIONKOW: prog akceptacji etapu pierwszego
// ============================================================
// Cztery rzeczy, ktore musza sie zgadzac, zanim powstanie jakikolwiek ekran:
//
//   1. Objetosc samej szyny zgodna ze WZOREM w granicy 2 procent.
//      Oba jadra potrafia po cichu oddac inna bryle, niz sie im zleca:
//      profil nawiniety zgodnie z zegarem daje bryle PUSTA, a zla flaga
//      luku pierscionek lzejszy o 15 procent. Zadne nie zglasza bledu,
//      model wyglada poprawnie, a cena jest falszywa.
//   2. Siatka zamknieta i o wlasciwej topologii dla kazdego zestawu.
//   3. Srednica wewnetrzna trafiona, bo od niej zalezy, czy pierscionek
//      w ogole wejdzie na palec.
//   4. Niedozwolone zakucia odrzucone, a nie po cichu poprawione.
//
// Wchodzi do builda.

import { buildRing, shankVolumeFormula, shankVolumeClosedForm, shankProfile, kernel, prongSolid, stoneSolid, taperFor, buildShank, buildGallery } from "../src/geometry/ring/build.js";
import { CUTS, SETTINGS, SEAT, SIGNET_TABLES, DEFAULTS, prongAngles, outlineFor, validate } from "../src/geometry/ring/params.js";

/**
 * Zwolnienie bryly po pomiarze.
 *
 * Jadro trzyma bryly w pamieci WebAssembly i NIE oddaje jej samo: zbieracz
 * smieci JavaScriptu o tej pamieci nie wie. Przy kilkudziesieciu bryłach
 * w jednym przebiegu proces wywracal sie z "memory access out of bounds",
 * i to w losowym miejscu, bo zalezalo od tego, ktora bryla przelala szale.
 */
function ileCzesci(m) {
  // `decompose` tworzy NOWA bryle na kazda czesc skladowa i one tez zostaja
  // w pamieci jadra. Przy szesnastu ukladach po kilkanascie czesci to setki
  // nieoddanych brył, czyli szybsza droga do wyczerpania pamieci niz same
  // pierscionki. Liczymy i od razu zwalniamy.
  const czesci = m.decompose();
  const ile = czesci.length;
  for (const c of czesci) c.delete?.();
  return ile;
}

function zwolnij(r) {
  r?.metal?.delete?.();
  r?.casting?.delete?.();
  for (const s of r?.stones || []) s?.delete?.();
}
import { CASTING_ALLOYS, METAL_COLORS, colorsFor, densityFor } from "../src/data/castingAlloys.js";
import { GEMSTONES } from "../src/pricing/jewelryConfig.js";
import { RING_PRESETS, PRESET_GROUPS, applyPreset } from "../src/data/ringPresets.js";
import { gemOptics, GEM_OPTICS } from "../src/data/gemOptics.js";

const PROG_OBJETOSC = 2.0;      // procent
const PROG_SREDNICA = 0.05;     // mm

let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { failed++; console.error(`  ✗ ${m}`); };

// ------------------------------------------------------------
console.log("\n1. Objetosc szyny wobec wzoru");
// ------------------------------------------------------------
for (const profile of ["round", "flat", "knife", "comfort"]) {
  for (const [innerDia, width, thickness] of [[14.0, 1.4, 1.0], [17.2, 2.2, 1.6], [23.0, 8.0, 4.0]]) {
    const p = { innerDia, width, thickness, profile };
    const label = `${profile} ${innerDia}x${width}x${thickness}`;

    // Warstwa pierwsza: czy PRZEKROJ ma ksztalt, o ktory prosilismy.
    const zamkniety = shankVolumeClosedForm(p);
    const zWielokata = shankVolumeFormula(p);
    if (zamkniety !== null) {
      const d = (zWielokata / zamkniety - 1) * 100;
      if (Math.abs(d) > PROG_OBJETOSC) {
        bad(`${label}: przekroj odbiega od wzoru zamknietego o ${d.toFixed(2)} %`);
        continue;
      }
    }

    // Warstwa druga: czy JADRO poprawnie obrocilo ten przekroj.
    const zJadra = await buildShankOnly(p);
    const odch = (zJadra / zWielokata - 1) * 100;
    if (Math.abs(odch) <= PROG_OBJETOSC) {
      ok(`${label.padEnd(26)} jadro ${zJadra.toFixed(2)}, wzor ${zWielokata.toFixed(2)} mm3, odchylka ${odch.toFixed(2)} %`);
    } else {
      bad(`${label}: jadro ${zJadra.toFixed(2)} wobec wzoru ${zWielokata.toFixed(2)}, odchylka ${odch.toFixed(2)} % (prog ${PROG_OBJETOSC} %)`);
    }
  }
}

async function buildShankOnly(p) {
  const w = await kernel();
  const pts = shankProfile(p);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  const poly = a < 0 ? [...pts].reverse() : pts;
  return w.Manifold.revolve(w.CrossSection.ofPolygons([poly]), 256).volume();
}

// ------------------------------------------------------------
console.log("\n2. Dwadziescia zestawow: siatka, topologia, masa");
// ------------------------------------------------------------
const ZESTAWY = [
  { stone: { cut: "round", size: 6.5 }, setting: "prong4" },
  { stone: { cut: "round", size: 2.0 }, setting: "prong6" },
  { stone: { cut: "round", size: 10.0 }, setting: "bezel" },
  { stone: { cut: "oval", size: 7.0 }, setting: "prong6" },
  { stone: { cut: "cushion", size: 6.0 }, setting: "corner" },
  { stone: { cut: "square", size: 5.5 }, setting: "corner" },
  { stone: { cut: "octagon", size: 7.5 }, setting: "bezel" },
  { stone: { cut: "baguette", size: 4.0 }, setting: "channel" },
  { stone: { cut: "pentagon", size: 6.0 }, setting: "corner" },
  { stone: { cut: "trillion", size: 6.5 }, setting: "vprong" },
  { stone: { cut: "pear", size: 7.0 }, setting: "vprong" },
  { stone: { cut: "marquise", size: 6.0 }, setting: "vprong" },
  { stone: { cut: "heart", size: 6.5 }, setting: "vprong" },
  { stone: { cut: "briolette", size: 6.0 }, setting: "drilled" },
  { stone: { cut: "roseP", size: 6.0 }, setting: "prong4" },
  { stone: { cut: "bufftop", size: 7.0 }, setting: "bezel" },
  { stone: { cut: "roseFlat", size: 6.0 }, setting: "bezel" },
  { stone: { cut: "round", size: 5.0 }, setting: "prong4", side: { count: 5, setting: "pave", size: 1.6 } },
  { stone: { cut: "round", size: 5.0 }, setting: "prong4", side: { count: 3, setting: "channel", size: 2.0 } },
  { stone: { cut: "oval", size: 6.0 }, setting: "prong4", side: { count: 4, setting: "prong", size: 1.4 } },
  { kind: "signet", signet: { table: "oval", length: 14 } },
  { kind: "signet", signet: { table: "cushion", length: 16 } },
  { kind: "signet", signet: { table: "rect", length: 11 } },
];

for (const z of ZESTAWY) {
  const name = z.kind === "signet"
    ? `sygnet ${z.signet.table} ${z.signet.length}mm`
    : `${CUTS[z.stone.cut].pl} ${z.stone.size}mm ${SETTINGS[z.setting].pl}` +
      (z.side ? ` +${z.side.count}x2 ${z.side.setting}` : "");
  try {
    const r = await buildRing({ innerDia: 17.2, ...z }, { segments: 64 });
    const problems = [];
    if (r.isEmpty) problems.push("BRYLA PUSTA");
    if (r.volumeMm3 <= 0) problems.push("objetosc <= 0");
    // Pierscionek ma dokladnie jedna dziure na palec. Wieksze `genus` znaczy
    // przelot pod kamieniem, co jest poprawne, ale ujemne znaczy rozsypana bryle.
    if (r.genus < 1) problems.push(`genus ${r.genus}, bryla nie trzyma sie kupy`);
    if (!(r.massG > 0.2) || !(r.massG < 60)) problems.push(`masa ${r.massG.toFixed(2)} g poza rozsadkiem`);
    if (problems.length) bad(`${name}: ${problems.join("; ")}`);
    else ok(`${name.padEnd(38)} ${r.volumeMm3.toFixed(1)} mm3, ${r.massG.toFixed(2)} g, genus ${r.genus}`);
    zwolnij(r);
  } catch (e) {
    bad(`${name}: ${e.message}`);
  }
}

// ------------------------------------------------------------
console.log("\n3. Srednica wewnetrzna trafiona");
// ------------------------------------------------------------
for (const dia of [14.0, 16.6, 17.2, 19.1, 23.0]) {
  const r = await buildRing({ innerDia: dia, stone: { cut: "round", size: 5 }, setting: "prong4" },
    { segments: 256, withStones: false });
  // Najmniejszy promien w plaszczyznie pierscionka to jego srednica wewnetrzna.
  const mesh = r.metal.getMesh();
  let min = Infinity;
  for (let i = 0; i < mesh.numVert; i++) {
    const x = mesh.vertProperties[i * 3], y = mesh.vertProperties[i * 3 + 1];
    const rr = Math.hypot(x, y);
    if (rr < min) min = rr;
  }
  const got = min * 2;
  const err = got - dia;
  if (Math.abs(err) <= PROG_SREDNICA) ok(`zadano ${dia.toFixed(1)} mm, zmierzono ${got.toFixed(3)} mm`);
  else bad(`zadano ${dia.toFixed(1)} mm, zmierzono ${got.toFixed(3)} mm, blad ${err.toFixed(3)} mm (prog ${PROG_SREDNICA})`);
  zwolnij(r);
}

// ------------------------------------------------------------
console.log("\n4. Niedozwolone zakucia odrzucone");
// ------------------------------------------------------------
const ZAKAZANE = [
  ["marquise", "prong4",  "markiza w zwyklych lapkach odprysnie na szpicach"],
  ["bufftop",  "prong4",  "bufftop nie ma rondysty, lapka nie ma czego chwycic"],
  ["roseFlat", "prong6",  "rozeta plaska nie ma pawilonu"],
  ["briolette", "bezel",  "brioleta wisi, nie osadza sie w kasecie"],
  ["square",   "prong4",  "kwadrat wymaga lapek naroznych"],
  ["heart",    "corner",  "serce wymaga lapki V na wcieciu"],
];
for (const [cut, setting, why] of ZAKAZANE) {
  try {
    validate({ stone: { cut, size: 6 }, setting });
    bad(`${CUTS[cut].pl} + ${SETTINGS[setting].pl} PRZESZLO, a nie powinno: ${why}`);
  } catch {
    ok(`${(CUTS[cut].pl + " + " + SETTINGS[setting].pl).padEnd(34)} odrzucone`);
  }
}
// Kontrola pozytywna: dozwolone kombinacje maja przechodzic.
for (const [id, c] of Object.entries(CUTS)) {
  for (const s of c.settings) {
    try { validate({ stone: { cut: id, size: 6 }, setting: s }); }
    catch (e) { bad(`${c.pl} + ${SETTINGS[s].pl} odrzucone, a jest dozwolone: ${e.message}`); }
  }
}
ok("wszystkie dozwolone kombinacje szlif + zakucie przechodza");

// ------------------------------------------------------------
console.log("\n5. Kompensacja skurczu wchodzi do wzorca");
// ------------------------------------------------------------
for (const [id, a] of Object.entries(CASTING_ALLOYS)) {
  const r = await buildRing({ innerDia: 17.2, alloy: id, stone: { cut: "round", size: 5 }, setting: "prong4" },
    { segments: 64 });
  const ratio = r.patternVolumeMm3 / r.volumeMm3;
  const want = a.shrink ** 3;
  if (Math.abs(ratio - want) < 1e-9) ok(`${id.padEnd(6)} masa ${r.massG.toFixed(2)} g, wzorzec x${ratio.toFixed(4)} objetosciowo`);
  else bad(`${id}: wzorzec x${ratio.toFixed(4)}, oczekiwano x${want.toFixed(4)}`);
  zwolnij(r);
}


// ------------------------------------------------------------
console.log("\n6. Kamienie osadzone taflą na zewnątrz");
// ------------------------------------------------------------
// Kamien odwrocony wyglada na renderze prawie tak samo, ale gniazdo wycina
// sie wtedy w druga strone, wiec zmienia sie objetosc metalu, a z niej cena.
// Rozroznienie jest jednoznaczne: pawilon konczy sie PUNKTEM (koleta),
// a korona plaska TAFLA. Mierzymy wiec rozrzut prostopadly na obu koncach.
{
  const cases = [
    ["środkowy", { stone: { cut: "round", size: 6.5 }, setting: "prong4" }, 0],
    ["boczne pavé", { stone: { cut: "round", size: 5 }, setting: "prong4",
      side: { count: 3, setting: "pave", size: 1.8 } }, 1],
  ];
  for (const [label, cfg, idx] of cases) {
    const r = await buildRing({ innerDia: 17.2, ...cfg }, { segments: 64 });
    const mesh = r.stones[idx].getMesh();
    const v = mesh.vertProperties, n = mesh.numVert;

    // Kierunek promieniowy liczymy ze srodka ciezkosci kamienia.
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += v[i * 3]; cy += v[i * 3 + 1]; cz += v[i * 3 + 2]; }
    cx /= n; cy /= n; cz /= n;
    const L = Math.hypot(cx, cy) || 1;
    const ux = cx / L, uy = cy / L;

    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = v[i * 3] - cx, y = v[i * 3 + 1] - cy, z = v[i * 3 + 2] - cz;
      pts.push({ proj: x * ux + y * uy, perp: Math.hypot(-x * uy + y * ux, z) });
    }
    pts.sort((p, q) => p.proj - q.proj);
    const k = Math.max(3, Math.round(n * 0.05));
    const spread = (arr) => arr.reduce((s, p) => s + p.perp, 0) / arr.length;
    const wewn = spread(pts.slice(0, k));          // koniec blizej osi pierscionka
    const zewn = spread(pts.slice(-k));            // koniec dalej od osi

    if (zewn > wewn * 1.6) ok(`${label.padEnd(12)} tafla na zewnątrz: rozrzut ${zewn.toFixed(2)} wobec kolety ${wewn.toFixed(2)} mm`);
    else bad(`${label}: kamień ODWROCONY, koleta na zewnątrz (rozrzut zewn. ${zewn.toFixed(2)}, wewn. ${wewn.toFixed(2)} mm)`);
    zwolnij(r);
  }
}

// KOLEJNOSC KAMIENI NA LISCIE jest umowa z podgladem i z eksportem: centralny,
// potem wieniec, potem boczne. Kazdy z tych trzech ma w formularzu wlasny
// material, a rozroznia sie je WYLACZNIE po pozycji na liscie. Przestawienie
// ich nie psuje ani bryly, ani masy, ani topologii: szafirowy soliter po prostu
// rysuje sie barwa cyrkonii z halo i nikt nie wie, dlaczego.
{
  const r = await buildRing({
    innerDia: 17.2, stone: { cut: "oval", size: 7 }, setting: "prong4",
    halo: { on: true, size: 1.4 }, width: 2.6, side: { count: 3, size: 1.4, setting: "pave" },
  }, { segments: 48 });
  const ileHalo = r.stoneVolumesMm3.haloCount || 0;
  const objCentr = r.stones[0].volume();
  const problemy = [];
  if (Math.abs(objCentr / r.stoneVolumesMm3.center - 1) > 0.01) {
    problemy.push(`pierwszy kamien na liscie nie jest centralnym (${objCentr.toFixed(1)} wobec ${r.stoneVolumesMm3.center.toFixed(1)} mm3)`);
  }
  const objHalo = r.stoneVolumesMm3.halo || 0;
  if (r.stones.slice(1, 1 + ileHalo).some((k) => Math.abs(k.volume() / objHalo - 1) > 0.01)) {
    problemy.push("na pozycjach wienca leza kamienie o innej objetosci");
  }
  const boczne = r.stones.length - 1 - ileHalo;
  if (boczne !== 6) problemy.push(`kamieni bocznych ${boczne}, oczekiwano 6`);
  if (problemy.length) bad(`kolejnosc kamieni: ${problemy.join("; ")}`);
  else ok(`kolejność kamieni: centralny, ${ileHalo} w wieńcu, ${boczne} bocznych`);
  zwolnij(r);
}

// ------------------------------------------------------------
// 7. Kolor stopu wchodzi do masy, a nie tylko do renderu
// ------------------------------------------------------------
// Bialy stop bierze gestsze domieszki. Gdyby kolor byl wylacznie kosmetyka,
// biale zloto liczyloby sie jak zolte, a metal jest tu glownym skladnikiem
// ceny, wiec kazdy taki pierscionek bylby wyceniony ponizej kosztu.
console.log("\n7. Kolor stopu zmienia mase");
{
  const baza = { innerDia: 17.2, alloy: "au585", width: 2.2, thickness: 1.6 };
  const masy = {};
  for (const color of ["yellow", "white", "rose"]) {
    const r = await buildRing({ ...baza, color }, { segments: 48 });
    masy[color] = r.massG;
    zwolnij(r);
  }
  const wzrost = (masy.white / masy.yellow - 1) * 100;
  if (wzrost > 8) ok(`białe cięższe od żółtego o ${wzrost.toFixed(1)} procent (${masy.yellow.toFixed(2)} -> ${masy.white.toFixed(2)} g)`);
  else bad(`kolor nie wplywa na mase: żółte ${masy.yellow.toFixed(3)} g, białe ${masy.white.toFixed(3)} g`);

  if (masy.rose < masy.yellow) ok(`różowe lżejsze od żółtego (${masy.rose.toFixed(2)} g)`);
  else bad(`różowe powinno byc lzejsze od zoltego, jest ${masy.rose.toFixed(3)} g`);

  // Srebro ma jeden kolor i nie jest to wybor. Zla nazwa nie moze zmienic masy.
  const ag1 = (await buildRing({ ...baza, alloy: "ag925", color: "yellow" }, { segments: 48 })).massG;
  const ag2 = (await buildRing({ ...baza, alloy: "ag925", color: "rose" }, { segments: 48 })).massG;
  if (Math.abs(ag1 - ag2) < 1e-9) ok("srebro ignoruje kolor, jedna masa niezaleznie od wyboru");
  else bad(`srebro zmienia mase z kolorem: ${ag1} vs ${ag2} g`);

  const zly = validate({ alloy: "au750", color: "fioletowe" });
  if (colorsFor("au750").includes(zly.color)) ok(`nieznany kolor sprowadzony do "${zly.color}"`);
  else bad(`nieznany kolor przeszedl przez validate jako "${zly.color}"`);

  for (const [id, a] of Object.entries(CASTING_ALLOYS)) {
    const brak = colorsFor(id).filter((c) => !METAL_COLORS[c]);
    if (brak.length) bad(`${id}: kolory bez definicji w METAL_COLORS: ${brak.join(", ")}`);
    const gest = colorsFor(id).map((c) => densityFor(id, c));
    if (gest.every((d) => d > 5 && d < 25)) ok(`${id.padEnd(6)} gestosci w zakresie ${gest.map((d) => d.toFixed(2)).join(", ")} g/cm3`);
    else bad(`${id}: gestosc poza rozsadnym zakresem: ${gest.join(", ")}`);
  }
}

// ------------------------------------------------------------
// 8. Kazdy kamien z katalogu ma wlasciwosci optyczne
// ------------------------------------------------------------
// Kamien bez wpisu narysuje sie domyslnym bladym szklem. To wyglada jak
// decyzja projektowa, a jest przeoczeniem, wiec nikt tego nie zglosi.
console.log("\n8. Katalog kamieni pokrywa sie z optyką");
{
  const katalog = GEMSTONES.filter((g) => g.id !== "none").map((g) => g.id);
  const brak = katalog.filter((id) => !GEM_OPTICS[id]);
  if (!brak.length) ok(`${katalog.length} kamieni z katalogu ma zdefiniowaną barwę`);
  else bad(`kamienie bez optyki: ${brak.join(", ")}`);

  const zbedne = Object.keys(GEM_OPTICS).filter((id) => id !== "none" && !katalog.includes(id));
  if (!zbedne.length) ok("optyka nie opisuje kamieni spoza katalogu");
  else bad(`optyka opisuje kamienie, ktorych nie ma w katalogu: ${zbedne.join(", ")}`);

  if (gemOptics("none") === null) ok("brak kamienia nie ma materialu");
  else bad("gemOptics('none') powinno zwrocic null");

  const nieprzezr = ["onyx", "lapis", "turquoise", "tiger_eye"];
  const zle = nieprzezr.filter((id) => gemOptics(id).transmission > 0);
  if (!zle.length) ok("kamienie nieprzezroczyste nie przepuszczaja swiatla");
  else bad(`przezroczyste, a nie powinny: ${zle.join(", ")}`);
}

// ------------------------------------------------------------
// 9. Lapka zagina sie nad kamieniem
// ------------------------------------------------------------
// Prosta lapka, sciecie plaskie na wysokosci korony, niczego nie trzyma:
// kamien wychodzi gora przy pierwszym zaczepieniu. To jest wada WYROBU,
// nie rysunku, wiec musi ja lapac test, a nie oko na zrzucie ekranu.
console.log("\n9. Łapka jest otwarta, czyli da się nią zakuć");
{
  const w = await kernel();
  const prong = prongSolid(w, {
    radius: 3.25, prongR: 0.45, base: -1.0, girdleTop: 0.2, crownH: 1.04,
  });
  const m = prong.getMesh();
  const v = m.vertProperties, n = m.numVert;
  let zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < n; i++) { const z = v[i * 3 + 2]; if (z < zMin) zMin = z; if (z > zMax) zMax = z; }

  // Promien mierzymy przy podstawie i przy koncowce, biorac wierzcholki
  // z dolnej i gornej CZESCI zakresu, a nie z waskiego paska na zadanej
  // wysokosci. Gladki stozek ma wierzcholki tylko na obu koncach i na czubku,
  // wiec pasek wypadal pusty i srednia wychodzila nieliczbą.
  const h = zMax - zMin;
  const srednia = (od, do_) => {
    let s = 0, k = 0;
    for (let i = 0; i < n; i++) {
      const z = v[i * 3 + 2];
      if (z >= od && z <= do_) { s += v[i * 3]; k++; }
    }
    return k ? s / k : NaN;
  };
  const dol = srednia(zMin, zMin + h * 0.3), gora = srednia(zMax - h * 0.3, zMax);

  // Lapka NIE MOZE zamykac sie nad kamieniem, i to jest odwrotnosc tego, czego
  // wymagalismy tu wczesniej. Zagieta lapka wyglada jak gotowy, zakuty
  // pierscionek i jest nie do uzycia: kamienia nie da sie pod nia wlozyc.
  // Model odlewniczy oddaje sie otwarty, a zagiecie jest ostatnia czynnoscia
  // przy stole. Dopuszczamy dziesiate milimetra od zwezenia preta ku gorze.
  if (gora >= dol - 0.12) ok(`łapka otwarta: podstawa ${dol.toFixed(2)}, koniec ${gora.toFixed(2)} mm`);
  else bad(`lapka zamyka sie nad kamieniem o ${(dol - gora).toFixed(2)} mm, wiec kamienia nie da sie wlozyc`);

  // Koniec musi siegac PONAD korone, bo to jest material do zagiecia. Lapka
  // ucieta na wysokosci rondysty nie ma czym objac kamienia.
  if (zMax > 0.2 + 1.04) ok(`koniec sięga ponad koronę, do ${zMax.toFixed(2)} mm`);
  else bad(`koniec konczy sie na ${zMax.toFixed(2)} mm, czyli nie ma czym objac kamienia`);

  if (prong.genus() === 0) ok("łapka jest jedną bryłą, kule zachodzą na siebie");
  else bad(`łapka ma genus ${prong.genus()}, czyli rozpadla sie na paciorki albo ma dziure`);
}

// ------------------------------------------------------------
// 10. Szyna o zmiennym przekroju
// ------------------------------------------------------------
// Siatke szyny skladamy tu recznie, wiec nie chroni nas juz zadna operacja
// jadra. Blad w kolejnosci wierzcholkow albo w skalowaniu daje bryle, ktora
// wyglada poprawnie, a ma inna objetosc, czyli inna mase i inna cene.
//
// Sprawdzamy uogolnionym twierdzeniem Pappusa: objetosc bryly obrotowej
// o zmiennym przekroju to calka z pola przekroju razy promien jego srodka
// ciezkosci. Liczymy ja z samych parametrow, bez udzialu jadra, wiec to jest
// naprawde niezalezna kontrola.
console.log("\n10. Szyna zwężana ma policzalną objętość");
{
  const pole = (pts) => {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      a += x1 * y2 - x2 * y1;
    }
    return Math.abs(a) / 2;
  };
  const srodek = (pts) => {
    let a = 0, cx = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const k = x1 * y2 - x2 * y1;
      a += k; cx += (x1 + x2) * k;
    }
    return cx / (3 * a);
  };

  for (const nazwa of ["tapered", "cathedral", "signet"]) {
    const p = { innerDia: 17.2, width: 2.2, thickness: 1.6, profile: "round", taper: nazwa };
    const bazowy = shankProfile(p);
    const ri = p.innerDia / 2;
    const fn = taperFor({ ...p, kind: "ring" });

    let calka = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const th = ((i + 0.5) / N) * Math.PI * 2;
      const d = Math.abs(((th - Math.PI / 2) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      const k = fn(d / Math.PI);
      const skal = bazowy.map(([r, z]) => [ri + (r - ri) * k.t, z * k.w]);
      calka += pole(skal) * srodek(skal) * ((Math.PI * 2) / N);
    }

    // Sama szyna, bez glowicy i bez kamieni.
    const jadro = buildShank(await kernel(), { ...p, kind: "ring" }, 256).volume();
    const blad = Math.abs(jadro - calka) / calka * 100;
    if (blad < 1.5) ok(`${nazwa.padEnd(10)} calka ${calka.toFixed(1)}, jadro ${jadro.toFixed(1)} mm3, roznica ${blad.toFixed(1)} procent`);
    else bad(`${nazwa}: calka ${calka.toFixed(1)}, jadro ${jadro.toFixed(1)} mm3, roznica ${blad.toFixed(1)} procent`);
  }

  // Otwor na palec MUSI zostac nietkniety, inaczej pierscionek nie wejdzie.
  for (const nazwa of ["none", "tapered", "cathedral", "signet"]) {
    const r = await buildRing({ innerDia: 17.2, taper: nazwa }, { segments: 96, withStones: false });
    const m = r.metal.getMesh();
    const v = m.vertProperties;
    let min = Infinity;
    for (let i = 0; i < m.numVert; i++) {
      const x = v[i * 3], y = v[i * 3 + 1];
      const d = Math.hypot(x, y);
      if (d < min) min = d;
    }
    if (Math.abs(min - 8.6) < 0.05) ok(`${nazwa.padEnd(10)} otwór nienaruszony, promień ${min.toFixed(2)} mm`);
    else bad(`${nazwa}: zwezenie weszlo w otwor, promien ${min.toFixed(2)} zamiast 8.60 mm`);
  }
}

// ------------------------------------------------------------
// 11. Kazdy preset daje sie zbudowac
// ------------------------------------------------------------
// Preset to obietnica zlozona klientowi jednym kliknieciem. Zestaw, ktory
// nie przechodzi przez walidacje albo daje bryle rozsypana na kawalki,
// jest gorszy niz brak presetu, bo psuje sie na oczach kupujacego.
console.log("\n11. Presety budują poprawne bryły");
{
  const start = validate({});
  for (const preset of RING_PRESETS) {
    try {
      const p = applyPreset(preset, start);
      const r = await buildRing(p, { segments: 48 });
      const g = r.metal.genus();
      const spojna = g >= 0;
      const sensowna = r.massG > 0.4 && r.massG < 40;
      if (spojna && sensowna) ok(`${preset.id.padEnd(11)} ${r.massG.toFixed(2)} g, genus ${g}`);
      else bad(`${preset.id}: genus ${g}, masa ${r.massG.toFixed(2)} g`);
      zwolnij(r);
    } catch (e) {
      bad(`${preset.id}: ${e.message}`);
    }
  }

  // WZOR NIE MOZE BYC PO CICHU PRZYCINANY.
  //
  // Trylogia prosila o kamienie boczne 4 mm i dostawala 1,3 mm, bo tyle
  // zostawalo z szyny 2,2 mm po odjeciu dwoch szynek. Bryla byla poprawna,
  // masa policzona, testy zielone, a wzor nazwany "trylogia" pokazywal soliter
  // z dwoma okruszkami. Kontrola granic jest tu nadal potrzebna, ale wzor,
  // ktory sam w nia wpada, jest bledem wzoru, a nie wyborem klienta.
  let przyciete = 0;
  for (const preset of RING_PRESETS) {
    const zadane = preset.params;
    const p = validate(applyPreset(preset, validate({})));
    const rozjazdy = [];
    if (zadane.side?.size && Math.abs(p.side.size - zadane.side.size) > 1e-6) {
      rozjazdy.push(`kamien boczny ${zadane.side.size} -> ${p.side.size.toFixed(2)} mm`);
    }
    if (zadane.band?.size && Math.abs(p.band.size - zadane.band.size) > 1e-6) {
      rozjazdy.push(`kamien obwodu ${zadane.band.size} -> ${p.band.size.toFixed(2)} mm`);
    }
    if (rozjazdy.length) { przyciete++; bad(`${preset.id}: wzor przyciety po cichu (${rozjazdy.join(", ")})`); }
  }
  if (!przyciete) ok(`żaden z ${RING_PRESETS.length} wzorów nie jest po cichu przycinany do granic szyny`);

  // Kazdy wzor musi nalezec do jednej z grup, inaczej po prostu zniknie
  // z interfejsu: lista rysuje wylacznie te, ktore pasuja do otwartej grupy.
  const grupy = new Set(PRESET_GROUPS.map((g) => g.id));
  const bezGrupy = RING_PRESETS.filter((x) => !grupy.has(x.group));
  if (!bezGrupy.length) ok(`wszystkie ${RING_PRESETS.length} wzory należą do znanej grupy`);
  else bad(`wzory bez grupy, niewidoczne w interfejsie: ${bezGrupy.map((x) => x.id).join(", ")}`);

  for (const g of PRESET_GROUPS) {
    const ile = RING_PRESETS.filter((x) => x.group === g.id).length;
    if (ile > 0) ok(`grupa "${g.id}" ma ${ile} wzorów`);
    else bad(`grupa "${g.id}" jest pusta, wiec jej zakladka nic nie pokazuje`);
  }

  // Preset nie moze ruszac metalu ani rozmiaru, bo to wybor klienta, a nie
  // element wzoru. Wyjatkiem jest pinky, ktory z definicji jest na inny palec.
  const moj = validate({ alloy: "au750", color: "rose", innerDia: 19.0 });
  for (const preset of RING_PRESETS) {
    const p = applyPreset(preset, moj);
    const trzyma = p.alloy === "au750" && p.color === "rose"
      && (preset.id === "pinky" || p.innerDia === 19.0);
    if (trzyma) ok(`${preset.id.padEnd(11)} zachowuje metal i rozmiar klienta`);
    else bad(`${preset.id}: nadpisal wybor klienta (${p.alloy}, ${p.color}, ${p.innerDia} mm)`);
  }
}

// ------------------------------------------------------------
// 12. Kamienie boczne trzymaja sie zwezonej szyny
// ------------------------------------------------------------
// Zwezenie sciaga metal do srodka i to o kilka dziesiatych milimetra, czyli
// dokladnie tyle, ile wynosi zaglebienie kuleczki w szynie. Kuleczka liczona
// wzgledem szyny prostej stanelaby OBOK metalu, a suma takich bryl rozpada sie
// na kawalki. Ujemny `genus` mowi o tym od razu, oko na renderze nie.
console.log("\n12. Kamienie boczne trzymają się zwężonej szyny");
{
  for (const taper of ["none", "tapered", "cathedral"]) {
    for (const setting of ["pave", "prong"]) {
      const r = await buildRing(
        { innerDia: 17.2, taper, side: { count: 4, size: 1.5, setting } },
        { segments: 64 },
      );
      const g = r.metal.genus();
      if (g >= 0) ok(`${taper.padEnd(10)} ${setting.padEnd(6)} bryła spójna, genus ${g}`);
      else bad(`${taper} ${setting}: bryla rozsypana, genus ${g}`);
      zwolnij(r);
    }
  }
}

// ------------------------------------------------------------
// 13. Galeria wtapia sie w szyne
// ------------------------------------------------------------
// Luk galerii ma zanurzyc sie w szynie, a nie usiasc na niej. Kula
// postawiona na powierzchni styka sie z nia w punkcie, wiec suma rozpada sie
// na kawalki albo, co gorsza, laczy sie ledwie skorupka i odlew peka w tym
// samym miejscu, w ktorym pekalby bez galerii.
console.log("\n13. Galeria wtapia się w szynę");
{
  const w = await kernel();
  const p = { innerDia: 17.2, width: 2.0, thickness: 1.5, profile: "round", taper: "tapered", kind: "ring" };
  const g = buildGallery(w, p, 1.6);
  const m = g.getMesh(), v = m.vertProperties;

  let min = Infinity, max = -Infinity;
  for (let i = 0; i < m.numVert; i++) {
    const d = Math.hypot(v[i * 3], v[i * 3 + 1]);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  const szyna = p.innerDia / 2 + p.thickness * taperFor(p)(0).t;

  if (g.genus() === 0) ok("łuk jest jedną bryłą");
  else bad(`luk ma genus ${g.genus()}, czyli rozpadl sie na paciorki`);

  if (min < szyna - 0.3) ok(`łuk zanurza się w szynie do ${min.toFixed(2)} mm, przy powierzchni ${szyna.toFixed(2)} mm`);
  else bad(`luk siedzi na powierzchni: siega ${min.toFixed(2)} mm przy szynie ${szyna.toFixed(2)} mm`);

  if (max > szyna) ok(`łuk wznosi się ponad szynę do ${max.toFixed(2)} mm`);
  else bad(`luk nie wznosi sie ponad szyne: ${max.toFixed(2)} mm`);

  // Kaseta ma wlasny trzon siegajacy szyny, wiec galeria bylaby tam naroslem.
  const zKaseta = await buildRing({ innerDia: 17.2, setting: "bezel" }, { segments: 48 });
  const zLapkami = await buildRing({ innerDia: 17.2, setting: "prong4" }, { segments: 48 });
  if (zKaseta.metal.genus() >= 0 && zLapkami.metal.genus() >= 0) ok("kaseta i łapki dają spójne bryły");
  else bad("kaseta albo lapki daja bryle rozsypana");
  zwolnij(zKaseta); zwolnij(zLapkami);
}

// ------------------------------------------------------------
// 14. Plik zawiera te bryle, za ktora klient zaplacil
// ------------------------------------------------------------
// Kwota bierze sie z objetosci policzonej przez jadro, a klient dostaje plik.
// Gdyby eksport gubil trojkaty albo mylil kolejnosc wierzcholkow, dostalby
// bryle o innej objetosci niz ta, ktora wycenilismy, i nikt by tego nie
// zauwazyl: STL otwiera sie normalnie, tylko model jest inny.
//
// Objetosc czytamy z SAMEGO PLIKU, twierdzeniem o dywergencji, czyli sumujac
// objetosci czworoscianow rozpietych na trojkatach i poczatku ukladu. To jest
// pomiar niezalezny od jadra.
console.log("\n14. Plik do pobrania zgadza się z wyceną");
{
  const { ringFiles } = await import("../chat-api/ringExport.js");
  const { unzipSync, strFromU8 } = await import("fflate");

  // Plik BEZ kamieni, zeby porownac go wprost z objetoscia metalu, z ktorej
  // wyszla cena. Z kamieniami plik jest wiekszy i tak ma byc: kamieni sie
  // nie odlewa, ale w modelu do obejrzenia maja prawo byc.
  const params = { innerDia: 17.2, alloy: "au585", taper: "tapered", width: 2.0, thickness: 1.5,
                   casting: { stones: false } };
  const r = await ringFiles(params);
  const stl = r.files.find((f) => f.name.endsWith(".stl")).buffer;

  const n = stl.readUInt32LE(80);
  if (stl.length === 84 + n * 50) ok(`STL spójny: ${n} trójkątów, ${(stl.length / 1024).toFixed(0)} kB`);
  else bad(`STL uszkodzony: deklaruje ${n} trojkatow, a ma ${stl.length} bajtow`);

  let v6 = 0;
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12;
    const p = [];
    for (let k = 0; k < 3; k++) {
      p.push([stl.readFloatLE(o + k * 12), stl.readFloatLE(o + k * 12 + 4), stl.readFloatLE(o + k * 12 + 8)]);
    }
    const [a, b, c] = p;
    v6 += a[0] * (b[1] * c[2] - b[2] * c[1])
        - a[1] * (b[0] * c[2] - b[2] * c[0])
        + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  const zPliku = Math.abs(v6) / 6;

  const wzorzec = await buildRing(params, { segments: 96 });
  const blad = Math.abs(zPliku - wzorzec.volumeMm3) / wzorzec.volumeMm3 * 100;
  if (blad < 0.05) ok(`objętość z pliku ${zPliku.toFixed(1)} mm3 zgodna z wyceną ${wzorzec.volumeMm3.toFixed(1)} mm3`);
  else bad(`plik ma inna objetosc niz wycena: ${zPliku.toFixed(1)} wobec ${wzorzec.volumeMm3.toFixed(1)} mm3, roznica ${blad.toFixed(2)} procent`);

  // 3MF niesie jednostke, STL nie. Brak jednostki to modele wczytane w calach.
  const tmf = r.files.find((f) => f.name.endsWith(".3mf")).buffer;
  const wpisy = unzipSync(new Uint8Array(tmf));
  const model = strFromU8(wpisy["3D/3dmodel.model"] || new Uint8Array());
  if (wpisy["[Content_Types].xml"] && wpisy["_rels/.rels"] && model) ok("3MF ma komplet wpisów");
  else bad(`3MF niekompletny, wpisy: ${Object.keys(wpisy).join(", ")}`);
  if (/unit="millimeter"/.test(model)) ok("3MF deklaruje milimetry");
  else bad("3MF nie deklaruje jednostki, slicer zgadnie skale");

  // Z kamieniami plik MUSI byc wiekszy, inaczej przelacznik niczego nie robi.
  const zKamieniami = await ringFiles({ ...params, casting: { stones: true } });
  if (zKamieniami.triangles > r.triangles) ok(`z kamieniami plik większy: ${zKamieniami.triangles} wobec ${r.triangles} trójkątów`);
  else bad(`przelacznik kamieni nic nie zmienia w pliku: ${zKamieniami.triangles} wobec ${r.triangles}`);
  // Masy nie sa juz identyczne i tak ma byc: plik z kamieniem ma lapki
  // ZAKUTE, a plik bez kamienia otwarte, bo pod zamknieta lapke nie da sie
  // kamienia wlozyc. Rozni je koncowka lapki, czyli ulamek grama, i wlasnie
  // ten rzad wielkosci tu pilnujemy. Kilka procent znaczyloby, ze zmienil sie
  // ksztalt czegos wiekszego niz zakucie.
  const roznicaMas = Math.abs(zKamieniami.massG / r.massG - 1) * 100;
  if (roznicaMas < 3) ok(`masa różni się o ${roznicaMas.toFixed(2)} % (same końcówki łapek)`);
  else bad(`masa rozni sie miedzy plikami o ${roznicaMas.toFixed(2)} procent: ${zKamieniami.massG.toFixed(3)} vs ${r.massG.toFixed(3)} g`);
}

// ------------------------------------------------------------
// 15. Zwezenie po WLASCIWEJ stronie
// ------------------------------------------------------------
// Objetosc bryly nie mowi, ktora strona jest gora, wiec calka z punktu 10
// zgadzala sie idealnie takze wtedy, gdy sylwetka byla odwrocona: sygnet
// gestnial na dole palca zamiast pod tarcza. Blad widac wylacznie na oku
// albo takim pomiarem jak ten.
console.log("\n15. Zwężenie działa od strony głowicy");
{
  const w = await kernel();
  const bok = (taper) => {
    const p = { innerDia: 17.2, width: 3.2, thickness: 2.0, profile: "round", taper, kind: "ring" };
    const mesh = buildShank(w, p, 96).getMesh(), v = mesh.vertProperties;
    let gora = 0, dol = 0;
    for (let i = 0; i < mesh.numVert; i++) {
      const x = v[i * 3], y = v[i * 3 + 1], r = Math.hypot(x, y);
      if (y > 0 && Math.abs(x) < 1.0) gora = Math.max(gora, r);
      if (y < 0 && Math.abs(x) < 1.0) dol = Math.max(dol, r);
    }
    return { gora, dol };
  };

  const oczekiwane = [
    ["signet", "grubsza pod tarczą", (g, d) => g > d + 0.5],
    ["cathedral", "podniesiona przy głowicy", (g, d) => g > d + 0.5],
    ["tapered", "węższa przy głowicy", (g, d) => g < d - 0.1],
    ["none", "równa na całym obwodzie", (g, d) => Math.abs(g - d) < 0.01],
  ];
  for (const [taper, opis, sprawdz] of oczekiwane) {
    const { gora, dol } = bok(taper);
    if (sprawdz(gora, dol)) ok(`${taper.padEnd(10)} ${opis}: głowica ${gora.toFixed(2)}, dół ${dol.toFixed(2)} mm`);
    else bad(`${taper}: sylwetka ODWROCONA, glowica ${gora.toFixed(2)}, dol ${dol.toFixed(2)} mm`);
  }
}

// ------------------------------------------------------------
// 16. Dodatki odlewnicze nie ruszaja wyrobu
// ------------------------------------------------------------
// Kanal wlewowy i kamienie sa w PLIKU, ale nie sa wyrobem. Metal z kanalu
// wraca po odcieciu do tygla, a kamieni sie nie odlewa. Gdyby ktorekolwiek
// z nich weszlo do objetosci metalu, podnioslby sie koszt kruszcu, a z nim
// cena, i to bez zadnego sladu w interfejsie.
//
// Druga rzecz, rownie cicha: kanal ma byc WTOPIONY w odlew. Postawiony obok
// daje plik z dwoma osobnymi przedmiotami, ktory otwiera sie normalnie
// i drukuje jako dwie lezace obok siebie bryly.
console.log("\n16. Dodatki odlewnicze nie ruszają wyrobu");
{
  const baza = { innerDia: 17.2, taper: "tapered", alloy: "au585" };
  const goly = await buildRing(baza, { segments: 64 });

  for (const [opis, casting] of [
    ["sam kanał", { sprues: true }],
    ["kanał i stopka", { sprues: true, button: true }],
    ["kanały wewnętrzne", { sprues: true, innerSprues: true }],
  ]) {
    const r = await buildRing({ ...baza, casting }, { segments: 64 });
    if (Math.abs(r.massG - goly.massG) < 1e-9) ok(`${opis.padEnd(17)} masa wyrobu bez zmian: ${r.massG.toFixed(3)} g`);
    else bad(`${opis}: masa wyrobu zmienila sie na ${r.massG.toFixed(3)} g wobec ${goly.massG.toFixed(3)} g`);
    zwolnij(r);
  }

  // KAMIENIE W MODELU sa jedynym przelacznikiem, ktory MA prawo ruszyc metal,
  // i to jest zmiana swiadoma, a nie usterka.
  //
  // Model bez kamieni to odlew do zakucia i lapki musza byc w nim otwarte,
  // bo pod zamknieta lapke nie da sie wlozyc kamienia. Model z kamieniem
  // pokazuje wyrob gotowy, wiec lapki sa docisniete. To sa dwa rozne ksztalty
  // tej samej lapki i roznia sie objetoscia, bo zagieta jest krotsza.
  //
  // Roznica ma byc MALA: dotyczy koncowek lapek, a nie calego wyrobu. Kilka
  // procent znaczyloby, ze zmienil sie ksztalt czegos wiekszego.
  {
    const otwarte = await buildRing({ ...baza, casting: { stones: false } }, { segments: 64 });
    const roznica = (goly.massG / otwarte.massG - 1) * 100;
    if (Math.abs(roznica) > 3) {
      bad(`stan zakucia zmienia mase o ${roznica.toFixed(1)} procent, czyli o wiecej niz same koncowki lapek`);
    } else if (!(otwarte.massG > goly.massG)) {
      bad(`odlew z otwartymi lapkami powinien byc CIEZSZY od zakutego, a jest ${otwarte.massG.toFixed(3)} wobec ${goly.massG.toFixed(3)} g`);
    } else {
      ok(`otwarte łapki cięższe o ${Math.abs(roznica).toFixed(1)} % (${otwarte.massG.toFixed(3)} wobec ${goly.massG.toFixed(3)} g)`);
    }
    zwolnij(otwarte);
  }

  // Stopka i kanaly wewnetrzne bez kanalu glownego wisialyby w powietrzu.
  const sama = validate({ casting: { button: true, innerSprues: true } });
  if (!sama.casting.button) ok("stopka bez kanału zostaje wyłączona");
  else bad("stopka przeszla bez kanalu, wiec wisialaby w powietrzu");
  if (!sama.casting.innerSprues) ok("kanały wewnętrzne bez głównego zostają wyłączone");
  else bad("kanaly wewnetrzne przeszly bez glownego, wiec nie maja do czego dojsc");

  // Kanaly wewnetrzne musza dodac metalu i zostac czescia jednej bryly.

  // KANAL PRZY SYGNECIE nie moze wyjsc ponad tafle. Tarcza jest powierzchnia
  // pod grawer, a kanal wchodzil w nia promieniowo i przebijal ja na wylot:
  // po odcieciu zostawalby guzek dokladnie tam, gdzie idzie rysunek.
  for (const casting of [{ sprues: true }, { sprues: true, innerSprues: true }]) {
    const r = await buildRing({ kind: "signet", width: 2.8, thickness: 1.8, casting },
      { segments: 48, withStones: false });
    const tafla = r.metal.boundingBox().max[1];
    const zWlewem = r.metal.add(r.casting);
    const gora = zWlewem.boundingBox().max[1];
    const czesci = ileCzesci(zWlewem);
    const opis = casting.innerSprues ? "z kanałami wewnętrznymi" : "sam kanał";
    if (gora > tafla + 0.02) bad(`sygnet ${opis}: uklad wlewowy wychodzi ${(gora - tafla).toFixed(2)} mm PONAD tarcze`);
    else if (czesci !== 1) bad(`sygnet ${opis}: uklad wlewowy nie jest wtopiony, ${czesci} czesci`);
    else ok(`sygnet ${opis.padEnd(22)} kanał w kancie płyty, tafla nietknięta`);
    zWlewem.delete?.();
    zwolnij(r);
  }

  const bezWewn = await buildRing({ ...baza, casting: { sprues: true } }, { segments: 64 });
  const zWewn = await buildRing({ ...baza, casting: { sprues: true, innerSprues: true } }, { segments: 64 });
  // Unie tez sa bryłami i tez zajmuja pamiec jadra, wiec trzymamy je
  // w zmiennych i zwalniamy, zamiast gubic w wyrazeniu.
  const ukladA = bezWewn.metal.add(bezWewn.casting);
  const ukladB = zWewn.metal.add(zWewn.casting);
  const przyrost = ukladB.volume() - ukladA.volume();
  if (przyrost > 5) ok(`kanały wewnętrzne dokładają ${przyrost.toFixed(0)} mm3 układu wlewowego`);
  else bad(`kanaly wewnetrzne nic nie dodaly: ${przyrost.toFixed(1)} mm3`);
  if (ileCzesci(ukladB) === 1) ok("kanały wewnętrzne wtopione w szynę i w kanał główny");
  else bad("kanaly wewnetrzne stoja luzem w swietle pierscionka");
  ukladA.delete?.(); ukladB.delete?.();
  zwolnij(bezWewn); zwolnij(zWewn);

  // Kanal MUSI byc wtopiony w odlew, przy kazdej sylwetce szyny.
  for (const taper of ["none", "tapered", "cathedral", "signet"]) {
    const r = await buildRing({ innerDia: 17.2, taper, casting: { sprues: true, button: true } }, { segments: 64 });
    const razem = r.metal.add(r.casting);
    const czesci = ileCzesci(razem);
    razem.delete?.();
    if (czesci === 1) ok(`${taper.padEnd(10)} kanał wtopiony, plik ma jedną bryłę`);
    else bad(`${taper}: plik ma ${czesci} osobne bryly, kanal stoi obok odlewu`);
    zwolnij(r);
  }

  // KANAL NIE MOZE WYJSC Z KORONY, i to jest regula silniejsza od reguly
  // "najgrubsze miejsce".
  //
  // Bylo tu odwrotnie: strone wybieral pomiar grubosci, wiec przy sylwetce
  // katedralnej, gdzie najgrubsza jest wlasnie glowica, kanal wychodzil
  // klientowi prosto z korony, miedzy lapkami. Takiego kanalu nie da sie
  // odcia bez sladu na widoku i zaden jubiler tak pierscionka nie wiesza.
  // Test to POTWIERDZAL, bo sprawdzal regule, a nie wyrob.
  //
  // Mierzymy wiec rzecz, ktora ma znaczenie w warsztacie: czy uklad wlewowy
  // dotyka czegokolwiek powyzej szyny.
  // Kierunek mierzymy na SAMYM kanale glownym. Kanaly wewnetrzne przechodza
  // przez otwor na wylot, wiec ich srodek ciezkosci lezy blisko zera i zatarlby
  // to, o co tu chodzi.
  const uklad = async (params, wewnetrzne = false) => {
    const r = await buildRing({ innerDia: 17.2, ...params, casting: { sprues: true, innerSprues: wewnetrzne } },
      { segments: 48 });
    const m = r.casting.getMesh(), v = m.vertProperties;
    let y = 0, gora = -Infinity;
    for (let i = 0; i < m.numVert; i++) {
      y += v[i * 3 + 1];
      if (v[i * 3 + 1] > gora) gora = v[i * 3 + 1];
    }
    const wynik = { sredniaY: y / m.numVert, gora, params: r.params };
    zwolnij(r);
    return wynik;
  };

  for (const taper of ["none", "tapered", "cathedral", "signet"]) {
    const wyrob = { taper, stone: { cut: "round", size: 6.5 }, setting: "prong4" };
    const u = await uklad(wyrob);
    const zWew = await uklad(wyrob, true);
    u.gora = Math.max(u.gora, zWew.gora);
    // Powierzchnia szyny na godzinie dwunastej. Wszystko powyzej to korona.
    const roGlowicy = 17.2 / 2 + u.params.thickness * (taperFor(u.params)?.(0)?.t ?? 1);
    if (u.sredniaY >= 0) {
      bad(`${taper}: kanal wchodzi od gory, czyli przez korone (srednie y = ${u.sredniaY.toFixed(1)} mm)`);
    } else if (u.gora > roGlowicy + 0.05) {
      bad(`${taper}: uklad wlewowy siega ${u.gora.toFixed(2)} mm, ponad szyne (${roGlowicy.toFixed(2)} mm)`);
    } else {
      ok(`${taper.padEnd(10)} kanał od dołu, nic nie sięga korony (${u.gora.toFixed(2)} ≤ ${roGlowicy.toFixed(2)} mm)`);
    }
  }

  // SYGNET WIESZA SIE TAK SAMO, za dol szyny. Przez chwile mial wlasna sciezke,
  // kanal wchodzacy poziomo w kant tarczy, i nawet ten test tego pilnowal.
  // Kant tarczy tez jest jednak miejscem, ktore jubiler oglada i poleruje,
  // a tarcze karmia kanaly wewnetrzne, wiec kanal glowny nie ma tam czego
  // szukac. Jedno miejsce wlewu dla wszystkiego, co ma szyne.
  const sygnet = await uklad({ kind: "signet", signet: { table: "oval", length: 14 } });
  const tarcza = sygnet.params.innerDia / 2 + sygnet.params.thickness;
  if (sygnet.sredniaY >= 0) {
    bad(`kanal przy sygnecie wchodzi od gory, czyli przy tarczy (y = ${sygnet.sredniaY.toFixed(1)})`);
  } else if (sygnet.gora > tarcza + 0.05) {
    bad(`uklad wlewowy sygnetu siega ${sygnet.gora.toFixed(2)} mm, czyli w tarcze`);
  } else {
    ok(`sygnet: kanał od dołu szyny jak w pierścionku (średnie y = ${sygnet.sredniaY.toFixed(1)} mm)`);
  }

  // Kanaly wewnetrzne maja PRZECHODZIC przez otwor na palec i dochodzic pod
  // glowice, a nie stercac przy wlewie. Sprawdzamy, ze siegaja przeciwleglej
  // strony otworu.
  {
    const bez = await buildRing({ innerDia: 17.2, taper: "cathedral", stone: { cut: "round", size: 6.5 },
      setting: "prong4", casting: { sprues: true } }, { segments: 48 });
    const zWewn = await buildRing({ innerDia: 17.2, taper: "cathedral", stone: { cut: "round", size: 6.5 },
      setting: "prong4", casting: { sprues: true, innerSprues: true } }, { segments: 48 });
    const gora = (r) => r.casting.boundingBox().max[1];
    // Kanaly wewnetrzne maja PRZEJSC przez otwor na palec: rozwidlaja sie przy
    // wlewie, na dole, a koncza po przeciwnej stronie, pod glowica. Sprawdzamy
    // wiec, ze uklad przekroczyl srodek pierscionka i doszedl do gornej polowy
    // otworu, a nie ze siega samego szczytu: tam wchodzi glowica, nie kanal.
    const ri = 17.2 / 2;
    const zasieg = gora(zWewn) - gora(bez);
    if (gora(zWewn) > ri * 0.5) ok(`kanały wewnętrzne przechodzą przez otwór (y = ${gora(zWewn).toFixed(2)} mm przy promieniu ${ri.toFixed(2)})`);
    else bad(`kanaly wewnetrzne siegaja tylko ${gora(zWewn).toFixed(2)} mm, czyli nie przechodza przez otwor (przyrost ${zasieg.toFixed(2)} mm)`);
    // Rozwidlenie ma byc PRZY WLEWIE, nie przy glowicy: metal idzie z jednego
    // zrodla w dwa miejsca, a nie odwrotnie. Mierzymy szerokosc ukladu tuz nad
    // wlewem i tuz pod glowica.
    const jadro = await kernel();
    const szerokoscNa = (r, y) => {
      const noz = jadro.Manifold.cube([40, 0.4, 40], true).translate([0, y, 0]);
      const pl = r.casting.intersect(noz);
      const b = pl.boundingBox();
      const puste = pl.isEmpty();
      noz.delete?.(); pl.delete?.();
      return puste ? 0 : b.max[0] - b.min[0];
    };
    const przyWlewie = szerokoscNa(zWewn, -ri * 0.6);
    const przyGlowicy = szerokoscNa(zWewn, ri * 0.6);
    if (przyGlowicy > przyWlewie + 1.0) {
      ok(`rozwidlenie przy wlewie: ${przyWlewie.toFixed(1)} mm na dole, ${przyGlowicy.toFixed(1)} mm pod głowicą`);
    } else {
      bad(`litera V stoi do gory nogami: ${przyWlewie.toFixed(1)} mm przy wlewie, ${przyGlowicy.toFixed(1)} mm pod glowica`);
    }
    zwolnij(bez); zwolnij(zWewn);
  }
}

// ------------------------------------------------------------
// 17. Gniazdo daje sie wykonac, a bryla zostaje jedna
// ------------------------------------------------------------
// Gniazdo wycina sie NA WYLOT, wiec kazdy jego milimetr jest metalem, ktorego
// nie ma. Kamien za duzy do szyny zostawia po bokach paski cienkie jak papier,
// a te w odlewie albo sie nie wypelnia, albo odpadaja przy zakuwaniu. Bryla
// rozsypuje sie wtedy na kilkanascie czesci i taki plik drukuje sie jako
// garsc luznych kawalkow.
//
// `genus` tego nie pokaze, bo liczy dziury, a nie czesci. Liczymy czesci.
console.log("\n17. Gniazda nie rozcinają wyrobu");
{
  const uklady = [
    ["soliter", { setting: "prong4" }],
    ["sześć łapek", { setting: "prong6" }],
    ["kaseta", { setting: "bezel" }],
    ["markiza w V", { stone: { cut: "marquise", size: 8 }, setting: "vprong" }],
    ["halo", { halo: { on: true } }],
    ["pavé", { width: 2.4, side: { count: 4, size: 1.5, setting: "pave" } }],
    ["łapki boczne", { width: 3.2, side: { count: 2, size: 1.8, setting: "prong" } }],
    ["eternity", { kind: "band", width: 2.4, band: { coverage: "full" } }],
  ];
  for (const [opis, cfg] of uklady) {
    for (const taper of ["none", "tapered"]) {
      const r = await buildRing({ innerDia: 17.2, taper, ...cfg }, { segments: 64 });
      const czesci = ileCzesci(r.metal);
      if (czesci === 1) ok(`${opis.padEnd(13)} ${taper.padEnd(8)} jedna bryła, ${r.massG.toFixed(2)} g`);
      else bad(`${opis} ${taper}: wyrob rozpadl sie na ${czesci} czesci`);
      zwolnij(r);
    }
  }

  // Kamien szerszy niz szyna minus dwie szynki jest NIEWYKONALNY i musi
  // zostac przyciety, a nie oddany jako bryla w kawalkach.
  const waska = validate({ width: 2.1, side: { count: 4, size: 1.5, setting: "pave" } });
  const zostaje = 2.1 - 2 * SEAT.minRail;
  if (waska.side.size <= zostaje + 1e-9) ok(`w szynie 2,1 mm kamień przycięty do ${waska.side.size.toFixed(2)} mm`);
  else bad(`kamien 1,5 mm przeszedl w szynie 2,1 mm, zostalyby szynki po ${((2.1 - waska.side.size) / 2).toFixed(2)} mm`);

  // Lapka musi stac poza obrysem rondysty, inaczej gniazdo ja przecina.
  // Sprawdza to juz wpis "szesc lapek" powyzej, a kazda kolejna bryla to
  // kilkanascie megabajtow w pamieci WebAssembly, ktorej to jadro samo nie
  // oddaje. Przy czterdziestu bryłach w jednym przebiegu proces sie wywracal.
}

// ------------------------------------------------------------
console.log("\n18. Sygnety: każda tarcza i każda powierzchnia");
// ------------------------------------------------------------
// Komplet sygnetow to jeden korpus i kilkanascie tarcz, wiec bledy nie siedza
// w wyjatkach, tylko w tym, co dotyczy wszystkich naraz: orientacji tarczy,
// spojnosci bryly i sylwetce plyty.
{
  const w = await kernel();

  /**
   * Wymiary SAMEJ TARCZY, a nie calej bryly.
   *
   * Pudelko calego pierscionka jest po obwodzie szerokie na jego srednice,
   * czyli dwadziescia milimetrow niezaleznie od tarczy. Pierwsza wersja tego
   * pomiaru brala wlasnie je i orzekla, ze kazda tarcza lezy w poprzek.
   * Mierzymy wiec plaster wziety z wysokosci plyty.
   */
  const plaster = (metal, y) => {
    const noz = w.Manifold.cube([60, 0.1, 60], true).translate([0, y, 0]);
    const kawalek = metal.intersect(noz);
    const b = kawalek.boundingBox();
    const puste = kawalek.isEmpty();
    const out = { obwod: puste ? 0 : b.max[0] - b.min[0], palec: puste ? 0 : b.max[2] - b.min[2] };
    noz.delete?.(); kawalek.delete?.();
    return out;
  };

  const wymiar = async (sygnet) => {
    const r = await buildRing({ kind: "signet", width: 2.6, thickness: 1.7, signet: sygnet },
      { segments: 48, withStones: false });
    const bb = r.metal.boundingBox();
    const tarcza = plaster(r.metal, bb.max[1] - 0.8);
    // Wysokosc POWIERZCHNI SZYNY przy glowicy. To na niej rozstrzyga sie,
    // czy sygnet jest zrosniety z obraczka, czy postawiony na niej.
    const roGlowicy = 17.2 / 2 + 1.7 * (taperFor({ ...r.params, kind: "signet" })?.(0)?.t ?? 1);
    const ramiona = plaster(r.metal, roGlowicy);
    const dane = { czesci: ileCzesci(r.metal), genus: r.genus, masa: r.massG, gora: bb.max[1], tarcza, ramiona };
    zwolnij(r);
    return dane;
  };

  for (const [id, def] of Object.entries(SIGNET_TABLES)) {
    const t = await wymiar({ table: id, length: 14, face: "flat" });
    const problemy = [];
    if (t.czesci !== 1) problemy.push(`bryla w ${t.czesci} czesciach`);
    if (t.genus !== 1) problemy.push(`genus ${t.genus}`);
    if (!(t.masa > 1) || !(t.masa < 40)) problemy.push(`masa ${t.masa.toFixed(2)} g poza rozsadkiem`);

    // ORIENTACJA. Tarcza poprzeczna ma lezec wzdluz obwodu, a nie wzdluz
    // palca, i odwrotnie. Zamiana osi daje bryle poprawna pod kazdym innym
    // wzgledem, wiec nie zlapie jej ani objetosc, ani topologia, a wyrob
    // jest wtedy po prostu innym wyrobem.
    const wpoprzek = t.tarcza.obwod > t.tarcza.palec;
    if (def.across && !wpoprzek) problemy.push("tarcza poprzeczna lezy wzdluz palca");
    if (!def.across && def.ratio < 0.95 && wpoprzek) problemy.push("tarcza wzdluzna lezy w poprzek");

    // ZROSNIECIE Z SZYNA. To jest cecha, po ktorej poznaje sie sygnet: tarcza
    // ma byc zakonczeniem obraczki, a nie glowica na niej postawiona.
    //
    // Mierzymy szerokosc metalu NA POWIERZCHNI SZYNY przy glowicy i dzielimy
    // przez szerokosc tarczy. Wersja z podcieciem i wkleslym lukiem dawala
    // tu 38 procent, czyli wyrazna szyjke, i tak tez wygladala: pierscionek
    // z korona. Ta sama liczba jest wiec jedynym progiem, jaki ma tu sens,
    // i lapie dokladnie te usterke, ktora zglosil klient.
    const zrosniecie = t.ramiona.palec / t.tarcza.palec;
    if (!(zrosniecie > 0.6)) {
      problemy.push(`tarcza stoi na szyjce: przy szynie ${t.ramiona.palec.toFixed(1)} mm wobec tarczy ${t.tarcza.palec.toFixed(1)} mm (${(zrosniecie * 100).toFixed(0)} %)`);
    }

    if (problemy.length) bad(`sygnet ${id}: ${problemy.join("; ")}`);
    else ok(`sygnet ${id.padEnd(8)} ${t.masa.toFixed(2)} g, tarcza ${t.tarcza.palec.toFixed(1)} x ${t.tarcza.obwod.toFixed(1)} mm, zrośnięcie ${(zrosniecie * 100).toFixed(0)} %`);
  }

  // Wykonczenie powierzchni idzie tym samym kodem dla kazdego obrysu, wiec
  // sprawdzamy je na trzech skrajnych: okraglej, poprzecznej i kwadratowej.
  // Kazda bryla to kilkanascie megabajtow w pamieci jadra, ktorej ono samo
  // nie oddaje, a caly przebieg juz raz o to rozbil sie na ostatniej sekcji.
  for (const id of ["round", "bar", "square"]) {
    const plaska = await wymiar({ table: id, length: 14, face: "flat" });
    const wpust = await wymiar({ table: id, length: 14, face: "recessed" });
    const kopula = await wymiar({ table: id, length: 14, face: "domed" });
    if (wpust.czesci !== 1 || kopula.czesci !== 1) {
      bad(`sygnet ${id}: powierzchnia rozbila bryle (wpust ${wpust.czesci}, kopula ${kopula.czesci})`);
    } else if (!(wpust.masa < plaska.masa - 0.05)) {
      bad(`sygnet ${id}: wpuszczone pole nie ubralo metalu (${wpust.masa.toFixed(2)} wobec ${plaska.masa.toFixed(2)} g)`);
    } else if (!(kopula.masa > plaska.masa + 0.05) || !(kopula.gora > plaska.gora + 0.05)) {
      bad(`sygnet ${id}: kopula nie wystaje ponad plaska tarcze`);
    } else {
      ok(`${id.padEnd(10)} wpust −${(plaska.masa - wpust.masa).toFixed(2)} g, kopuła +${(kopula.masa - plaska.masa).toFixed(2)} g`);
    }
  }
}

// ------------------------------------------------------------
console.log("\n19. Kamień wchodzi do gniazda, siada i nie wypada");
// ------------------------------------------------------------
// To jest sprawdzian WARSZTATOWY, a nie geometryczny, i powstal dlatego, ze
// bryla przechodzila wszystkie poprzednie, a osadzic w niej kamienia sie nie
// dalo. Otwor nad rondysta byl WEZSZY od kamienia o podciecie, wiec kamien
// nie mial jak zjechac do gniazda: siadal na gornych krawedziach lapek,
// poltora milimetra za wysoko. Zadna miara objetosci, masy ani topologii
// tego nie widziala, bo bryla byla poprawna. Byla tylko bezuzyteczna.
//
// Sprawdzamy trzy polozenia kamienia wzgledem metalu:
//   na miejscu   pasuje, czyli styka sie z metalem tylko podcieciem
//   nizej        NIE MIESCI SIE, czyli gniazdo go zatrzymuje
//   wyzej        wychodzi swobodnie, czyli da sie go wlozyc z gory
{
  // Kazdy kamien siedzi pod innym katem, wiec "w dol" znaczy dla niego
  // w strone srodka pierscionka. Kierunek bierzemy ze srodka jego pudelka.
  const wDol = (k) => {
    const b = k.boundingBox();
    const x = (b.min[0] + b.max[0]) / 2, y = (b.min[1] + b.max[1]) / 2;
    const L = Math.hypot(x, y) || 1;
    return [x / L, y / L];
  };
  const kolizja = (metal, k, d) => {
    const [ux, uy] = wDol(k);
    const przesuniety = k.translate([ux * d, uy * d, 0]);
    const wspolne = metal.intersect(przesuniety);
    const v = wspolne.volume();
    przesuniety.delete?.(); wspolne.delete?.();
    return v;
  };

  const UKLADY = [
    ["okrągły 4 łapki", { stone: { cut: "round", size: 6.5 }, setting: "prong4" }],
    ["owal 6 łapek", { stone: { cut: "oval", size: 7 }, setting: "prong6" }],
    ["markiza łapki V", { stone: { cut: "marquise", size: 6 }, setting: "vprong" }],
    ["gruszka łapki V", { stone: { cut: "pear", size: 7 }, setting: "vprong" }],
    ["kwadrat narożne", { stone: { cut: "square", size: 5.5 }, setting: "corner" }],
    ["kaseta", { stone: { cut: "round", size: 6.5 }, setting: "bezel" }],
    ["pavé na szynie", { stone: { cut: "round", size: 5 }, setting: "prong4",
                         width: 2.4, side: { count: 4, size: 1.5, setting: "pave" } }],
    ["halo", { stone: { cut: "oval", size: 7 }, setting: "prong4", halo: { on: true, size: 1.4 } }],
  ];

  for (const [nazwa, cfg] of UKLADY) {
    // Model z kamieniem daje nam BRYLY KAMIENI i ich polozenie. Plik bez
    // kamieni ich nie zawiera, bo nie ma czego pokazywac, wiec bierzemy je
    // stad i przykladamy do jednego i drugiego metalu. Polozenie jest to samo,
    // rozni sie tylko stan lapek.
    const zakuty = await buildRing({ innerDia: 17.2, ...cfg }, { segments: 64 });
    // Plik do ZAKUCIA, czyli bez kamieni: lapki otwarte, kamien wchodzi z gory.
    const r = await buildRing({ innerDia: 17.2, ...cfg, casting: { stones: false } },
      { segments: 64, withStones: false });
    // Przy halo i eternity kamieni sa dziesiatki, a kazde sprawdzenie to trzy
    // bryle w pamieci jadra, ktorej ono samo nie oddaje. Pierwsza szostka
    // wystarczy: wszystkie powstaja tym samym kodem.
    const proba = zakuty.stones.slice(0, 6);
    let objetosc = 0, naMiejscu = 0, nizej = 0, wyzej = 0;
    for (const k of proba) {
      objetosc += k.volume();
      naMiejscu += kolizja(r.metal, k, 0);
      nizej += kolizja(r.metal, k, -0.25);
      wyzej += kolizja(r.metal, k, 0.6);
    }
    const proc = (v) => (v / objetosc) * 100;
    const problemy = [];
    // Podciecie to kilka setnych milimetra na promieniu, wiec przy najmniejszych
    // kamieniach potrafi zajac ponad procent ich objetosci. Powyzej trzech
    // kamien juz nie pasuje do gniazda i trzeba by go dociskac.
    if (proc(naMiejscu) > 3) problemy.push(`kamien nie miesci sie w gniezdzie (${proc(naMiejscu).toFixed(2)} %)`);
    // Opor mierzymy WZGLEDEM luzu na miejscu, bo podciecie jest ulamkiem
    // milimetra i przy kamieniu 1,4 mm zajmuje procent objetosci, a przy
    // 7 mm setna. Bezwzgledny prog musialby wiec byc albo za ostry dla
    // duzych, albo bezuzyteczny dla malych.
    if (!(nizej > naMiejscu * 3) || proc(nizej) < 0.15) {
      problemy.push(`gniazdo NIE ZATRZYMUJE kamienia: po zejsciu o 0,25 mm kolizja ${proc(nizej).toFixed(2)} % wobec ${proc(naMiejscu).toFixed(2)} % na miejscu`);
    }
    if (proc(wyzej) > 0.05) problemy.push(`kamienia nie da sie wlozyc z gory, metal zachodzi na niego (${proc(wyzej).toFixed(2)} %)`);
    // Ten sam uklad Z KAMIENIEM ma zachowywac sie ODWROTNIE od gory: lapki sa
    // docisniete, wiec kamienia nie da sie juz wyjac. Bez tej pary sprawdzian
    // przepuscilby model, w ktorym lapki nigdy sie nie zamykaja.
    let trzymane = 0;
    for (const k of proba) trzymane += kolizja(zakuty.metal, k, 0.6);
    const trzyma = (trzymane / objetosc) * 100;
    if (!(trzyma > 0.3)) {
      problemy.push(`po zakuciu kamien nadal wychodzi gora (kolizja ${trzyma.toFixed(2)} %)`);
    }
    zwolnij(zakuty);

    if (problemy.length) bad(`${nazwa}: ${problemy.join("; ")}`);
    else ok(`${nazwa.padEnd(16)} otwarte: wchodzi i siada (opór ${proc(nizej).toFixed(2)} %); zakute: trzyma (${trzyma.toFixed(2)} %)`);
    zwolnij(r);
  }
}

// ------------------------------------------------------------
console.log("\n20. Kamienie na szynie nie wchodzą w koronę");
// ------------------------------------------------------------
// Pierwszy kamien na szynie stal pod stalym katem 0,34 radiana od godziny
// dwunastej, czyli okolo trzech milimetrow po obwodzie, NIEZALEZNIE od tego,
// co stoi na glowicy. Kamien centralny 6,5 mm ma sam promien rondysty 3,25 mm,
// a kosz jeszcze wiecej, wiec pierwszy kamien z pave siedzial w mocowaniu
// korony. Bryla byla przy tym poprawna: gniazda po prostu wycinaly sie jedno
// w drugim, wiec ani objetosc, ani `genus` niczego nie zglaszaly.
//
// Sprawdzian jest najprostszy z mozliwych i wlasnie dlatego dobry: DWA
// KAMIENIE NIE MOGA ZAJMOWAC TEGO SAMEGO MIEJSCA.
{
  const UKLADY = [
    ["pavé 6,5 mm", { stone: { cut: "round", size: 6.5 }, setting: "prong4",
                      side: { count: 4, size: 1.6, setting: "pave", material: "cz" } }],
    ["trylogia", { stone: { cut: "round", size: 6.5 }, setting: "prong4",
                   side: { count: 1, size: 3.5, setting: "prong", material: "cz" } }],
    ["kanałowa", { stone: { cut: "oval", size: 7 }, setting: "prong6",
                   side: { count: 4, size: 1.6, setting: "channel", material: "cz" } }],
    ["halo z pavé", { stone: { cut: "round", size: 6 }, setting: "prong4",
                      halo: { on: true, size: 1.3, material: "cz" },
                      side: { count: 4, size: 1.4, setting: "pave", material: "cz" } }],
    ["markiza z pavé", { stone: { cut: "marquise", size: 8 }, setting: "vprong",
                         side: { count: 3, size: 1.4, setting: "pave", material: "cz" } }],
  ];

  for (const [nazwa, params] of UKLADY) {
    const r = await buildRing({ innerDia: 17.2, ...params }, { segments: 64 });
    // Kolejnosc listy jest umowa: centralny, potem wieniec, potem boczne.
    const centralny = r.stones[0];
    let najgorsza = 0;
    for (let i = 1; i < r.stones.length; i++) {
      const wspolne = centralny.intersect(r.stones[i]);
      najgorsza = Math.max(najgorsza, wspolne.volume());
      wspolne.delete?.();
    }
    // Rozsuniecie o zero musi wystarczyc: szczelina jest w parametrze `gap`,
    // a nie w nadziei, ze kamien sie zmiesci.
    if (najgorsza > 0.001) {
      bad(`${nazwa}: kamień boczny wchodzi w centralny na ${najgorsza.toFixed(3)} mm3`);
    } else if (ileCzesci(r.metal) !== 1) {
      bad(`${nazwa}: bryla rozpadla sie na kawalki`);
    } else {
      ok(`${nazwa.padEnd(14)} kamienie się nie przenikają, jedna bryła, ${r.massG.toFixed(2)} g`);
    }
    zwolnij(r);
  }

  // Suwak odsuniecia musi cos ROBIC, i to w dobra strone.
  const blisko = await buildRing({ innerDia: 17.2, stone: { cut: "round", size: 6.5 }, setting: "prong4",
    side: { count: 4, size: 1.6, setting: "pave", material: "cz", gap: 0 } }, { segments: 64 });
  const daleko = await buildRing({ innerDia: 17.2, stone: { cut: "round", size: 6.5 }, setting: "prong4",
    side: { count: 4, size: 1.6, setting: "pave", material: "cz", gap: 1.5 } }, { segments: 64 });
  const promien = (r) => {
    const k = r.stones[1].boundingBox();
    return Math.abs((k.min[0] + k.max[0]) / 2);       // odleglosc od osi glowicy po obwodzie
  };
  if (promien(daleko) > promien(blisko) + 1.0) {
    ok(`odsunięcie przesuwa pierwszy kamień z ${promien(blisko).toFixed(2)} na ${promien(daleko).toFixed(2)} mm`);
  } else {
    bad(`suwak odsuniecia nic nie zmienia: ${promien(blisko).toFixed(2)} wobec ${promien(daleko).toFixed(2)} mm`);
  }
  zwolnij(blisko); zwolnij(daleko);
}

// ------------------------------------------------------------
console.log("\n21. Łapka V to DWA pręty, a nie narośl na szpicu");
// ------------------------------------------------------------
// Poprzednia wersja stawiala pret w kazdym punkcie obrysu miedzy szpicem
// a koncem ramienia. Obrys markizy jest tam gesty, wiec przy szpicu ladowalo
// ich kilkanascie, jeden w drugim, i zlewaly sie w jedna narosl. Bryla byla
// poprawna, masa wiarygodna, a zakucie nie do wykonania.
//
// Liczymy slupki na przekroju ponad rondysta: kazde ramie V ma byc osobnym
// pretem, wiec markiza z dwoma szpicami daje CZTERY, a gruszka z jednym DWA.
// Zlanie sie ich w jedno spadnie tu natychmiast.
{
  const w = await kernel();
  for (const [nazwa, cut, size, szpice] of [
    ["markiza", "marquise", 8, 2],
    ["gruszka", "pear", 7, 1],
    ["serce", "heart", 6.5, 1],
  ]) {
    // Mierzymy MODEL ODLEWNICZY, czyli ten z lapkami otwartymi. Lapka zakuta
    // ma sie nad kamieniem schodzic i jej zlanie sie u gory jest wtedy
    // poprawne, wiec ten sam pomiar znaczylby na niej co innego.
    const r = await buildRing(
      { innerDia: 17.2, stone: { cut, size }, setting: "vprong", casting: { stones: false } },
      { segments: 64 });
    const bb = r.metal.boundingBox();
    const roGlowicy = 17.2 / 2 + 1.6;
    let zle = null;
    for (const frac of [0.6, 0.85]) {
      const y = bb.max[1] - (bb.max[1] - roGlowicy) * (1 - frac);
      const noz = w.Manifold.cube([40, 0.08, 40], true).translate([0, y, 0]);
      const plaster = r.metal.intersect(noz);
      const ile = ileCzesci(plaster);
      noz.delete?.(); plaster.delete?.();
      if (ile !== szpice * 2) zle = `na wysokosci ${(frac * 100).toFixed(0)} % korony ${ile} pretow zamiast ${szpice * 2}`;
    }
    if (zle) bad(`${nazwa}: ${zle}`);
    else ok(`${nazwa.padEnd(8)} ${szpice * 2} osobne pręty, po dwa na każdy szpic`);
    zwolnij(r);
  }
}

// ------------------------------------------------------------
console.log("\n22. Układ wlewowy dla KAŻDEGO wzoru z listy");
// ------------------------------------------------------------
// Poprzednie sprawdziany brały kilka sylwetek dobranych ręcznie i przez to
// przepuscily uklad, ktory klient widzi na ekranie: wzor "soliter z pave"
// ma sylwetke katedralna, przy niej najgrubsza jest glowica, a kanal szedl
// w najgrubsze miejsce, wiec wychodzil z korony. Skoro wzory sa lista, to
// sprawdzian tez ma isc po liscie, a nie po moim wyobrazeniu o niej.
{
  for (const preset of RING_PRESETS) {
    const wejscie = applyPreset(preset, { ...DEFAULTS });
    const r = await buildRing(
      { ...wejscie, casting: { sprues: true, innerSprues: true, button: true } },
      { segments: 48 });
    const p = r.params;
    const bb = r.casting.boundingBox();
    const roGlowicy = p.innerDia / 2 + p.thickness * (taperFor(p)?.(0)?.t ?? 1);

    const razem = r.metal.add(r.casting);
    const czesci = ileCzesci(razem);
    razem.delete?.();

    const problemy = [];
    // Sygnet karmi sie od tarczy i tam kanal MA byc wysoko. Pierscionek
    // i obraczka: nic z ukladu wlewowego nie ma prawa siegnac ponad szyne.
    if (p.kind !== "signet" && bb.max[1] > roGlowicy + 0.05) {
      problemy.push(`kanał sięga ${bb.max[1].toFixed(2)} mm, a szyna kończy się na ${roGlowicy.toFixed(2)} mm`);
    }
    if (czesci !== 1) problemy.push(`plik ma ${czesci} osobne bryły`);

    if (problemy.length) bad(`${preset.id}: ${problemy.join("; ")}`);
    else ok(`${String(preset.id).padEnd(14)} ${p.kind.padEnd(6)} kanał poza koroną, plik w jednej bryle`);
    zwolnij(r);
  }
}

// ------------------------------------------------------------
console.log("\n23. Kamień ma fasety, a nie gładki bok");
// ------------------------------------------------------------
// Zglszone dwa razy: "w kamieniach w ogole nie widac szlifu". Za pierwszym
// razem poprawilem CIENIOWANIE, zakladajac, ze fasetki sa, tylko sa wygladzone.
// Nie bylo ich wcale: kamien powstawal z tego samego obrysu co gniazdo, czyli
// z pieciudziesieciu punktow, wiec byl stozkiem o powierzchni ciaglej. Zadne
// cieniowanie nie pokaze fasetki, ktorej nie ma w bryle.
//
// Mierzymy to na wierzcholkach rondysty: kamien fasetowany ma ich tyle, ile
// ma fasetek, a kamien gladki kilkadziesiat.
{
  const w = await kernel();
  for (const [cut, size, gladki] of [
    ["round", 6.5, false], ["oval", 7, false], ["octagon", 7, false],
    ["marquise", 8, false], ["square", 6, false],
    ["bufftop", 7, true],          // kaboszon JEST gladki i ma taki zostac
  ]) {
    const s = stoneSolid(w, cut, size);
    const m = s.solid.getMesh(), v = m.vertProperties;
    // Wierzcholki na wysokosci rondysty, zliczane po polozeniu w rzucie z gory.
    const naRondyscie = new Set();
    for (let i = 0; i < m.numVert; i++) {
      const z = v[i * 3 + 2];
      if (z < -0.001 || z > s.girdleH + 0.001) continue;
      naRondyscie.add(`${v[i * 3].toFixed(3)},${v[i * 3 + 1].toFixed(3)}`);
    }
    const n = naRondyscie.size / 2;          // gora i dol rondysty
    // Prog nie jest przypadkowy: obrys szlifu ma 48 punktow albo wiecej,
    // a kamien fasetowany dostaje ich szesnascie, wiec miedzy jednym a drugim
    // jest przepasc, nie granica na wlos.
    if (gladki) {
      if (n >= 20) ok(`${cut.padEnd(9)} gładki bok, ${n} punktów rondysty, tak ma być`);
      else bad(`${cut}: kaboszon dostal fasety (${n} punktow rondysty)`);
    } else if (n > 18) {
      bad(`${cut}: rondysta ma ${n} punktow, czyli kamien jest gladki i szlifu nie widac`);
    } else if (n < 6) {
      bad(`${cut}: rondysta ma tylko ${n} punktow, obrys szlifu sie rozjechal`);
    } else {
      ok(`${cut.padEnd(9)} ${n} fasetek na obwodzie, ${s.solid.decompose().length} bryła`);
    }
    s.solid.delete?.();
  }
}

// ------------------------------------------------------------
console.log("\n24. Łapka ma na czym stać");
// ------------------------------------------------------------
// "Krapy zawieszone sa tylko na obramowaniu a pozostala czesc wisi
// w powietrzu." Kosz zwezal sie od rondysty w dol, a lapka zaczynala sie tuz
// pod rondysta, wiec przylegala do metalu gornym skrajem i niczym wiecej.
// Przy zakuwaniu cala sila dociskania idzie w to jedno miejsce.
//
// Sprawdzamy to sonda: w osi kazdej lapki, na kolejnych glebokosciach pod
// rondysta, MUSI byc metal.
{
  const w = await kernel();
  for (const [nazwa, cut, size, setting] of [
    ["4 łapki", "round", 6.5, "prong4"],
    ["6 łapek", "oval", 7, "prong6"],
    ["8 łapek", "round", 7, "prong8"],
    ["8 parami", "round", 7, "prong8pair"],
    ["narożne", "square", 6, "corner"],
  ]) {
    const r = await buildRing({ innerDia: 17.2, stone: { cut, size }, setting }, { segments: 64 });
    const wzor = stoneSolid(w, cut, size);
    const basketH = SEAT.aboveGalleryMm + wzor.pavH * 0.45;
    // Plaszczyzna rondysty w ukladzie pierscionka: kamien konczy sie tafla,
    // wiec cofamy sie od gory jego pudelka o korone.
    const bbK = r.stones[0].boundingBox();
    const yRondysta = bbK.max[1] - (wzor.girdleH + wzor.crownH);

    const braki = [];
    for (const deg of prongAngles(CUTS[cut], setting)) {
      const R = Math.max(...outlineFor(cut, size)
        .map(([x, y]) => x * Math.cos(deg * Math.PI / 180) + y * Math.sin(deg * Math.PI / 180)));
      for (const ulamek of [0.3, 0.6, 0.85]) {
        const y = yRondysta - basketH * ulamek;
        const sonda = w.Manifold.sphere(0.18, 8).translate([
          R * Math.cos(deg * Math.PI / 180), y, -R * Math.sin(deg * Math.PI / 180)]);
        const wspolne = r.metal.intersect(sonda);
        const puste = wspolne.isEmpty();
        sonda.delete?.(); wspolne.delete?.();
        if (puste) braki.push(`${deg}° na ${(ulamek * 100).toFixed(0)} % kosza`);
      }
    }
    if (braki.length) bad(`${nazwa}: łapka wisi w powietrzu (${braki.slice(0, 3).join(", ")})`);
    else ok(`${nazwa.padEnd(9)} każda łapka oparta na całej wysokości kosza, ${r.massG.toFixed(2)} g`);
    wzor.solid.delete?.();
    zwolnij(r);
  }
}

// ------------------------------------------------------------
console.log("\n25. Wylot gniazda jest OTWOREM, a nie dziurką po szpilce");
// ------------------------------------------------------------
// `throughPart` pelnil dwie role naraz: opisywal i ostatnia szosta czesc
// GLEBOKOSCI, i szerokosc wylotu. Kamyk halo o srednicy 1,4 mm dostawal wiec
// otwor o srednicy 0,23 mm. Z gory wygladalo to jak gniazdo zaslepione i tak
// tez zostalo zglszone: "brakuje gniazd, sa zamkniete".
//
// Sonda idzie osia gniazda od rondysty w dol. Ma przejsc na wylot.
{
  const w = await kernel();
  const UKLADY = [
    ["halo", { stone: { cut: "round", size: 6 }, setting: "prong4", halo: { on: true, size: 1.4, material: "cz" } }],
    ["pavé na szynie", { width: 2.6, stone: { cut: "round", size: 5 }, setting: "prong4",
                         side: { count: 4, size: 1.6, setting: "pave", material: "cz" } }],
    ["eternity", { kind: "band", width: 2.6, band: { coverage: "full", size: 1.8, setting: "pave", material: "cz" } }],
  ];
  for (const [nazwa, cfg] of UKLADY) {
    const r = await buildRing({ innerDia: 17.2, ...cfg }, { segments: 64 });
    // Kamienie sa w modelu, wiec kazdy z nich pokazuje, GDZIE jest gniazdo
    // i ktoredy biegnie jego os.
    const drobne = r.stones.slice(1);
    // KOLEJNOSC LISTY jest tu potrzebna, a nie wygodna: kamien centralny,
    // potem wieniec, potem boczne. Wieniec jedzie razem z korona, wiec os
    // KAZDEGO jego kamyka wskazuje na godzine dwunasta, a nie na zewnatrz
    // promienia. Sonda puszczona promieniowo szla w takim razie w poprzek
    // gniazda i meldowala zaslepienie tam, gdzie go nie bylo.
    const ileHalo = r.stoneVolumesMm3.haloCount || 0;
    let zaslepione = 0;
    for (const [nr, k] of drobne.entries()) {
      const b = k.boundingBox();
      const sr = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
      const dl = Math.hypot(sr[0], sr[1]) || 1;
      const os = nr < ileHalo ? [0, -1] : [-sr[0] / dl, -sr[1] / dl];
      const promien = Math.max(0.12, (b.max[0] - b.min[0]) * 0.18);
      const sonda = w.Manifold.cylinder(2.5, promien, promien, 12, false)
        .rotate([0, 90, 0])
        .rotate([0, 0, Math.atan2(os[1], os[0]) / (Math.PI / 180)])
        .translate(sr);
      const wspolne = r.metal.intersect(sonda);
      if (wspolne.volume() > 0.02) zaslepione++;
      sonda.delete?.(); wspolne.delete?.();
    }
    if (!drobne.length) bad(`${nazwa}: brak drobnych kamieni do sprawdzenia`);
    else if (zaslepione > drobne.length * 0.15) {
      bad(`${nazwa}: ${zaslepione} z ${drobne.length} gniazd bez przelotu`);
    } else {
      ok(`${nazwa.padEnd(14)} ${drobne.length - zaslepione} z ${drobne.length} gniazd przewiercone na wylot`);
    }
    zwolnij(r);
  }
}

// ------------------------------------------------------------
console.log("\n26. Ramię sygnetu jest KANCIASTE, a nie beczkowate");
// ------------------------------------------------------------
// Rozlanie skalowalo ten sam obrys tarczy od szyny do plyty, wiec sygnet
// owalny mial ramiona owalne od samego dolu: pekaty klosz, na ktorym stoi
// tarcza. Zglszone wprost: korona ma powstawac z rozszerzenia szyny "bardziej
// kwadratowo niz oblo".
//
// Mierzymy WYPELNIENIE prostokata opisanego: elipsa wypelnia go w 79
// procentach, prostokat o zaokraglonych narozach powyzej 85.
{
  const w = await kernel();
  const wypelnienie = (metal, y) => {
    const noz = w.Manifold.cube([60, 0.25, 60], true).translate([0, y, 0]);
    const plaster = metal.intersect(noz);
    const b = plaster.boundingBox();
    const puste = plaster.isEmpty();
    // Objetosc plastra podzielona przez objetosc jego wlasnego pudelka.
    const wynik = puste ? 0
      : plaster.volume() / ((b.max[0] - b.min[0]) * (b.max[2] - b.min[2]) * 0.25);
    noz.delete?.(); plaster.delete?.();
    return wynik;
  };

  for (const table of ["oval", "round", "cushion", "rect"]) {
    const r = await buildRing({ innerDia: 17.2, kind: "signet", width: 2.6, thickness: 1.7,
      signet: { table, length: 14, face: "flat" } }, { segments: 48, withStones: false });
    const bb = r.metal.boundingBox();
    const roGlowicy = 17.2 / 2 + 1.7 * (taperFor(r.params)?.(0)?.t ?? 1);
    // Polowa drogi miedzy powierzchnia szyny a tarcza, czyli sam srodek ramienia.
    // Tuz nad powierzchnia szyny, czyli tam, gdzie ramie wychodzi z obraczki
    // i gdzie widac je najlepiej. Wyzej obrys musi juz przechodzic w tarcze,
    // bo tarcza ma taki ksztalt, jaki ma, wiec pomiar zrobiony pod sama plyta
    // mowilby o plycie, a nie o ramieniu.
    const y = roGlowicy + (bb.max[1] - roGlowicy) * 0.15;
    const w2 = wypelnienie(r.metal, y);
    if (w2 >= 0.83) ok(`sygnet ${table.padEnd(8)} ramię wypełnia ${(w2 * 100).toFixed(0)} % opisanego prostokąta`);
    else bad(`sygnet ${table}: ramie wypelnia tylko ${(w2 * 100).toFixed(0)} %, czyli jest beczkowate`);
    zwolnij(r);
  }
}

console.log(failed ? `\n${failed} bledow\n` : "\nGenerator pierscionkow: wszystko sie zgadza\n");
process.exit(failed ? 1 : 0);
