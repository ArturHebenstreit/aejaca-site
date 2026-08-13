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

import { buildRing, shankVolumeFormula, shankVolumeClosedForm, shankProfile, kernel, prongSolid, taperFor, buildShank, buildGallery } from "../src/geometry/ring/build.js";
import { CUTS, SETTINGS, SEAT, SIGNET_TABLES, validate } from "../src/geometry/ring/params.js";

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
  }
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
console.log("\n9. Łapka zagina się nad kamieniem");
{
  const w = await kernel();
  const prong = prongSolid(w, {
    radius: 3.25, prongR: 0.45, base: -1.0, girdleTop: 0.2, crownH: 1.04,
  });
  const m = prong.getMesh();
  const v = m.vertProperties, n = m.numVert;
  let zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < n; i++) { const z = v[i * 3 + 2]; if (z < zMin) zMin = z; if (z > zMax) zMax = z; }

  // Promien mierzymy przy podstawie i przy pazurku.
  const przy = (zc) => {
    let s = 0, k = 0;
    for (let i = 0; i < n; i++) {
      if (Math.abs(v[i * 3 + 2] - zc) < 0.12) { s += v[i * 3]; k++; }
    }
    return k ? s / k : NaN;
  };
  const dol = przy(zMin + 0.25), gora = przy(zMax - 0.25);
  const pochyl = dol - gora;

  if (pochyl > 0.25) ok(`pazurek pochylony do środka o ${pochyl.toFixed(2)} mm wobec podstawy`);
  else bad(`łapka prosta: podstawa na ${dol.toFixed(2)}, pazurek na ${gora.toFixed(2)} mm`);

  if (zMax > 0.2) ok(`pazurek sięga ponad rondystę, do ${zMax.toFixed(2)} mm`);
  else bad(`pazurek konczy sie na ${zMax.toFixed(2)} mm, czyli ponizej rondysty`);

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
  if (Math.abs(zKamieniami.massG - r.massG) < 1e-9) ok("masa wyrobu w obu plikach identyczna");
  else bad(`masa rozni sie miedzy plikami: ${zKamieniami.massG} vs ${r.massG} g`);
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
    ["bez kamieni", { stones: false }],
    ["wszystko naraz", { sprues: true, button: true, stones: false }],
  ]) {
    const r = await buildRing({ ...baza, casting }, { segments: 64 });
    if (Math.abs(r.massG - goly.massG) < 1e-9) ok(`${opis.padEnd(15)} masa wyrobu bez zmian: ${r.massG.toFixed(3)} g`);
    else bad(`${opis}: masa wyrobu zmienila sie na ${r.massG.toFixed(3)} g wobec ${goly.massG.toFixed(3)} g`);
    zwolnij(r);
  }

  // Stopka i kanaly wewnetrzne bez kanalu glownego wisialyby w powietrzu.
  const sama = validate({ casting: { button: true, innerSprues: true } });
  if (!sama.casting.button) ok("stopka bez kanału zostaje wyłączona");
  else bad("stopka przeszla bez kanalu, wiec wisialaby w powietrzu");
  if (!sama.casting.innerSprues) ok("kanały wewnętrzne bez głównego zostają wyłączone");
  else bad("kanaly wewnetrzne przeszly bez glownego, wiec nie maja do czego dojsc");

  // Kanaly wewnetrzne musza dodac metalu i zostac czescia jednej bryly.
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

  // Kanal wchodzi w NAJGRUBSZE miejsce. Przy szynie zwezanej ku glowicy
  // najgrubszy jest dol, przy sygnetowej gora.
  const strona = async (taper) => {
    const r = await buildRing({ innerDia: 17.2, taper, casting: { sprues: true } }, { segments: 48 });
    const m = r.casting.getMesh(), v = m.vertProperties;
    let y = 0;
    for (let i = 0; i < m.numVert; i++) y += v[i * 3 + 1];
    return y / m.numVert;
  };
  const yZwezana = await strona("tapered");
  const ySygnet = await strona("signet");
  if (yZwezana < 0) ok(`przy szynie zwężanej kanał wchodzi od dołu (y = ${yZwezana.toFixed(1)} mm)`);
  else bad(`kanal przy szynie zwezanej wchodzi od gory, gdzie metal jest cienszy (y = ${yZwezana.toFixed(1)})`);
  if (ySygnet > 0) ok(`przy sylwetce sygnetowej kanał wchodzi od głowicy (y = ${ySygnet.toFixed(1)} mm)`);
  else bad(`kanal przy sygnecie wchodzi od dolu, a tam metal jest cienszy (y = ${ySygnet.toFixed(1)})`);
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
    const ramiona = plaster(r.metal, bb.max[1] - 2.8);
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

    // PODCIECIE POD TARCZA. Plyta ma wystawac poza ramiona, bo to cien pod jej
    // krawedzia odrozniA plyte polozona na pierscionku od klina wycietego
    // razem z nim.
    const wystaje = (t.tarcza.palec - t.ramiona.palec) / 2;
    if (!(wystaje > 0.1)) problemy.push(`plyta nie wystaje poza ramiona (${wystaje.toFixed(2)} mm)`);

    if (problemy.length) bad(`sygnet ${id}: ${problemy.join("; ")}`);
    else ok(`sygnet ${id.padEnd(8)} ${t.masa.toFixed(2)} g, tarcza ${t.tarcza.palec.toFixed(1)} x ${t.tarcza.obwod.toFixed(1)} mm, występ ${wystaje.toFixed(2)} mm`);
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

console.log(failed ? `\n${failed} bledow\n` : "\nGenerator pierscionkow: wszystko sie zgadza\n");
process.exit(failed ? 1 : 0);
