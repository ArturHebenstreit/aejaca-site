#!/usr/bin/env node
// ============================================================
// PODGLAD GENERATORA PIERSCIONKOW
// ============================================================
// Generator jest biblioteka i nie ma jeszcze zadnego ekranu, wiec zeby
// zobaczyc, co naprawde buduje, sklejamy jednoplikowa strone z gotowymi
// modelami i wbudowanym Three.js. Otwiera sie z dysku, bez serwera.
//
//   npm run ring:preview        →  MDs/kreator-podglad.html
//
// Nie wchodzi do builda serwisu.

import { readFileSync, writeFileSync } from "node:fs";
import { buildRing } from "../src/geometry/ring/build.js";

const three = readFileSync("node_modules/three/build/three.cjs", "utf8");

const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString("base64");
const pack = (m) => {
  const mesh = m.getMesh();
  return { p: b64(new Float32Array(mesh.vertProperties)), i: b64(new Uint32Array(mesh.triVerts)) };
};

const CASES = [
  ["Solitaire, 4 łapki",     { stone: { cut: "round", size: 6.5 }, setting: "prong4" }],
  ["Pavé, 5 na stronę",      { stone: { cut: "round", size: 5 }, setting: "prong4", side: { count: 5, setting: "pave", size: 1.6 } }],
  ["Markiza, łapki V",       { stone: { cut: "marquise", size: 7 }, setting: "vprong" }],
  ["Gruszka, łapka V",       { stone: { cut: "pear", size: 7 }, setting: "vprong" }],
  ["Serce, łapka V",         { stone: { cut: "heart", size: 6.5 }, setting: "vprong" }],
  ["Ośmiokąt, kaseta",       { stone: { cut: "octagon", size: 7.5 }, setting: "bezel" }],
  ["Kwadrat, narożne",       { stone: { cut: "square", size: 6 }, setting: "corner" }],
  ["Kanałowa, 4 na stronę",  { stone: { cut: "round", size: 5 }, setting: "prong4", side: { count: 4, setting: "channel", size: 2.0 } }],
  ["Bufftop, kaseta",        { stone: { cut: "bufftop", size: 7 }, setting: "bezel" }],
  ["Sygnet owalny",          { kind: "signet", signet: { table: "oval", length: 14 } }],
  ["Sygnet poduszkowy",      { kind: "signet", signet: { table: "cushion", length: 16 } }],
  ["Obrączka comfort",       { profile: "comfort", width: 5, thickness: 2, stone: { cut: "round", size: 2 }, setting: "prong4" }],
];

const built = [];
for (const [name, p] of CASES) {
  const r = await buildRing({ innerDia: 17.2, ...p }, { segments: 72 });
  let gem = null;
  if (r.stones.length) {
    let s = r.stones[0];
    for (let i = 1; i < r.stones.length; i++) s = s.add(r.stones[i]);
    gem = pack(s);
  }
  built.push({
    name, metal: pack(r.metal), gem,
    v: +r.volumeMm3.toFixed(1), m: +r.massG.toFixed(2), g: r.genus,
    tri: r.metal.getMesh().numTri,
  });
  console.log(`  ${name.padEnd(24)} ${r.massG.toFixed(2)} g, ${r.metal.getMesh().numTri} trojkatow`);
}
const models = JSON.stringify(built);

const HEAD = `<title>Wygenerowane Pierścionki</title>
<style>
  :root{
    --ground:#0a0908; --surface:#141110; --surface-2:#1c1816; --line:#2b2523;
    --ink:#ece6dd; --ink-dim:#a2968a; --ink-faint:#6f645b; --amber:#dfa44f;
    --serif:Georgia,"Iowan Old Style","Times New Roman",serif;
    --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  }
  *{box-sizing:border-box}
  body{ margin:0; background:var(--ground); color:var(--ink); font-family:var(--sans);
    font-size:17px; line-height:1.65; -webkit-font-smoothing:antialiased }
  .wrap{ max-width:1180px; margin:0 auto; padding:0 24px }
  header{ border-bottom:1px solid var(--line); padding:64px 0 34px; margin-bottom:38px }
  .kicker{ font-family:var(--mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase;
    color:var(--amber); margin:0 0 18px }
  h1{ font-family:var(--serif); font-weight:400; font-size:clamp(32px,5.5vw,50px); line-height:1.08;
    margin:0 0 18px; letter-spacing:-.01em; text-wrap:balance }
  .standfirst{ font-size:18px; color:var(--ink-dim); margin:0; max-width:62ch; text-wrap:pretty }
  .meta{ display:flex; flex-wrap:wrap; gap:8px 26px; margin-top:26px;
    font-family:var(--mono); font-size:12px; color:var(--ink-faint) }
  .meta b{ color:var(--ink-dim); font-weight:400 }
  code{ font-family:var(--mono); font-size:.86em; background:var(--surface-2);
    border:1px solid var(--line); border-radius:4px; padding:1px 5px }
  .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(268px,1fr)); gap:16px; margin-bottom:44px }
  .card{ background:var(--surface); border:1px solid var(--line) }
  .stage{ position:relative; aspect-ratio:1; background:#000; cursor:grab; touch-action:none }
  .stage:active{ cursor:grabbing }
  .stage canvas{ display:block; width:100%; height:100% }
  .badge{ position:absolute; right:8px; top:8px; font-family:var(--mono); font-size:9.5px;
    letter-spacing:.08em; color:var(--ink-faint); background:rgba(10,9,8,.7); padding:3px 7px;
    border-radius:2px; pointer-events:none }
  .cap{ padding:12px 14px; border-top:1px solid var(--line) }
  .cap h2{ margin:0 0 7px; font-size:15px; font-weight:600; font-family:var(--sans) }
  .cap dl{ display:flex; flex-wrap:wrap; gap:4px 16px; margin:0;
    font-family:var(--mono); font-size:11.5px; color:var(--ink-faint) }
  .cap dt{ display:inline } .cap dd{ display:inline; margin:0 0 0 4px; color:var(--amber);
    font-variant-numeric:tabular-nums }
  .note{ background:var(--surface); border:1px solid var(--line); border-left:3px solid var(--amber);
    padding:20px 24px; margin:0 0 40px; max-width:70ch }
  .note p{ margin:0 0 14px } .note p:last-child{ margin-bottom:0 }
  .note .tag{ font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--amber); display:block; margin-bottom:9px }
  footer{ border-top:1px solid var(--line); padding:30px 0 64px; color:var(--ink-faint); font-size:14px }
  a{ color:var(--amber); text-decoration:none; border-bottom:1px solid rgba(223,164,79,.35) }
</style>

<header>
  <div class="wrap">
    <p class="kicker">Etap 1, wynik generatora</p>
    <h1>Wygenerowane Pierścionki</h1>
    <p class="standfirst">Żaden z tych modeli nie został narysowany ręcznie. Każdy powstał z parametrów, przez tę samą funkcję, która trafi do kreatora. Chwyć i obróć.</p>
    <div class="meta">
      <span><b>Jądro</b> manifold-3d 3.5.1</span>
      <span><b>Metal</b> Ag 925</span>
      <span><b>Rozmiar</b> 17,2 mm</span>
      <span><b>Segmentów obrotu</b> 72</span>
    </div>
  </div>
</header>

<div class="wrap">
  <div class="note">
    <span class="tag">Czego tu jeszcze nie ma</span>
    <p>To jest <strong>surowe wyjście geometrii</strong>, bez szlifowania proporcji. Łapki są prostymi bolcami, a nie wygiętymi pazurkami zamykającymi się nad kamieniem. Tarcza sygnetu nie ma płynnego przejścia w ramiona. Kamienie renderuję na niebiesko, żeby odróżnić je od metalu, a nie dlatego, że tak wyglądają.</p>
    <p>Dopracowanie proporcji ma sens dopiero przy żywym podglądzie, czyli w etapie 3, gdy będzie je widać przy każdym ruchu suwaka. Teraz liczy się co innego: czy bryła jest zamknięta, czy średnica wewnętrzna się zgadza i czy masa jest prawdziwa, bo z niej wychodzi cena.</p>
  </div>
  <div class="grid" id="grid"></div>
</div>

<footer>
  <div class="wrap">
    <p style="margin:0">AEJaCA, podgląd wewnętrzny. Modele wygenerowane z <code>src/geometry/ring</code>, obracane lokalnie w przeglądarce.</p>
  </div>
</footer>
`;

const APP = `
// ------------------------------------------------------------
// Podglad: jeden renderer na kafelke, wlasna orbita na wskazniku
// ------------------------------------------------------------
const MODELS = ${models};

const dec = (b64) => {
  const bin = atob(b64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
};
function geom(packed) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dec(packed.p)), 3));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(dec(packed.i)), 1));
  // Manifold oddaje same wierzcholki i indeksy, wiec normalne liczymy tutaj.
  // Bez tego cala bryla renderuje sie na czarno, co juz raz zmylilo mnie
  // co do ksztaltu.
  g.computeVertexNormals();
  return g;
}

const grid = document.getElementById("grid");
const views = [];

for (const M of MODELS) {
  const card = document.createElement("div"); card.className = "card";
  const stage = document.createElement("div"); stage.className = "stage";
  const badge = document.createElement("span"); badge.className = "badge";
  badge.textContent = M.tri.toLocaleString("pl-PL") + " trójkątów";
  stage.appendChild(badge); card.appendChild(stage);

  const cap = document.createElement("div"); cap.className = "cap";
  cap.innerHTML = "<h2></h2><dl><dt>masa</dt><dd>" + M.m.toLocaleString("pl-PL") +
    " g</dd><dt>objętość</dt><dd>" + M.v.toLocaleString("pl-PL") +
    " mm³</dd><dt>genus</dt><dd>" + M.g + "</dd></dl>";
  cap.querySelector("h2").textContent = M.name;
  card.appendChild(cap); grid.appendChild(card);

  const rn = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  rn.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.appendChild(rn.domElement);

  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x000000);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.5, 400);
  sc.add(new THREE.AmbientLight(0xffffff, 0.5));
  sc.add(new THREE.HemisphereLight(0xfff2dd, 0x24190f, 1.0));
  const key = new THREE.DirectionalLight(0xfff4e2, 2.0); key.position.set(-20, 30, 24); sc.add(key);
  const fill = new THREE.DirectionalLight(0x8fb4d4, 0.8); fill.position.set(18, -10, -16); sc.add(fill);

  const grp = new THREE.Group(); sc.add(grp);
  grp.add(new THREE.Mesh(geom(M.metal), new THREE.MeshPhongMaterial({
    color: 0xd9cfba, specular: 0xfff6e6, shininess: 95 })));
  if (M.gem) grp.add(new THREE.Mesh(geom(M.gem), new THREE.MeshPhongMaterial({
    color: 0x74b8dc, specular: 0xffffff, shininess: 140, transparent: true, opacity: 0.72 })));

  const box = new THREE.Box3().setFromObject(grp);
  grp.position.sub(box.getCenter(new THREE.Vector3()));
  const R = box.getSize(new THREE.Vector3()).length() / 2;

  views.push({ rn, sc, cam, grp, stage, R, yaw: -0.55, pitch: 0.62, spin: true });
}

// Kamera z katow, zeby jedno przeciagniecie dzialalo tak samo wszedzie.
function place(v) {
  const d = v.R * 3.1;
  v.cam.position.set(
    d * Math.cos(v.pitch) * Math.sin(v.yaw),
    d * Math.cos(v.pitch) * Math.cos(v.yaw) * -1,
    d * Math.sin(v.pitch),
  );
  v.cam.up.set(0, 0, 1);
  v.cam.lookAt(0, 0, 0);
}

for (const v of views) {
  let drag = null;
  v.stage.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY }; v.spin = false;
    v.stage.setPointerCapture(e.pointerId);
  });
  v.stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    v.yaw += (e.clientX - drag.x) * 0.01;
    v.pitch = Math.max(-1.45, Math.min(1.45, v.pitch + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  });
  const stop = () => { drag = null; };
  v.stage.addEventListener("pointerup", stop);
  v.stage.addEventListener("pointercancel", stop);
}

function resize() {
  for (const v of views) {
    const s = v.stage.clientWidth;
    if (!s) continue;
    v.rn.setSize(s, s, false);
    v.cam.aspect = 1; v.cam.updateProjectionMatrix();
  }
}
addEventListener("resize", resize);
resize();

const slow = matchMedia("(prefers-reduced-motion: reduce)").matches;
function frame() {
  for (const v of views) {
    if (v.spin && !slow) v.yaw += 0.0042;
    place(v);
    v.rn.render(v.sc, v.cam);
  }
  requestAnimationFrame(frame);
}
frame();
document.title = "Wygenerowane Pierścionki";
`;

// three.cjs to modul CommonJS, wiec podstawiamy mu `module.exports` i dopiero
// stamtad bierzemy przestrzen nazw. Sklejanie dwoch modulow ESM nie wchodzi
// w gre: `three.core.js` i `three.module.js` deklaruja te same pomocnicze
// nazwy i przegladarka odrzuca caly skrypt.
writeFileSync(
  "MDs/kreator-podglad.html",
  HEAD +
    "\n<script>\nvar module={exports:{}},exports=module.exports;\n" + three +
    "\nwindow.THREE=module.exports;\n<\/script>\n" +
    "<script>\n" + APP + "\n<\/script>\n",
);
console.log(`\nMDs/kreator-podglad.html, ${((HEAD.length + three.length + APP.length) / 1048576).toFixed(1)} MB`);
