// ============================================================
// PODGLAD PIERSCIONKA
// ============================================================
// Rysuje siatki, ktore przyszly z watku roboczego. Sam niczego nie liczy
// i nie zna parametrow: dostaje wierzcholki i indeksy, a caly ksztalt
// powstal juz wczesniej, w tym samym kodzie, ktory zbuduje kupowany plik.
//
// PULAPKA, na ktora sie nabralem przy pierwszym renderze: manifold oddaje
// same wierzcholki i indeksy, BEZ normalnych. Bryla bez normalnych renderuje
// sie calkowicie czarno pod kazdym oswietlonym materialem, co wyglada jak
// zepsuta geometria, a jest brakiem jednej linijki.
//
// DRUGA rzecz, mniej oczywista: metal nie ma wlasnego koloru w takim sensie,
// w jakim ma go plastik. Powierzchnia metaliczna prawie nic nie rozprasza,
// wiec cala jej barwa i caly blask to ODBITE OTOCZENIE. Pod samymi swiatlami
// punktowymi zloto wychodzi plaska, matowa musztarda, bo nie ma czego odbic.
// Dlatego budujemy tu mape otoczenia: kilka jasnych pasow na ciemnym tle,
// czyli to samo, co fotograf ustawia wokol bizuterii w namiocie bezcieniowym.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { METAL_COLORS, CASTING_ALLOYS } from "../../../data/castingAlloys.js";
import { gemOptics } from "../../../data/gemOptics.js";

function geometryFrom(pack) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pack.positions, 3));
  g.setIndex(new THREE.BufferAttribute(pack.indices, 1));
  g.computeVertexNormals();
  return g;
}

/**
 * Namiot bezcieniowy jako mapa otoczenia, rysowany proceduralnie.
 *
 * Zwykly plik HDR odpadl z dwoch powodow: wazy kilkaset kilobajtow na stronie,
 * na ktorej i tak wieziemy pol megabajta WebAssembly, a do tego polityka
 * bezpieczenstwa nie wpuszcza obrazow z obcych serwerow, wiec musialby lezec
 * u nas. Rysunek na plotnie kosztuje ulamek milisekundy i wystarcza, bo metal
 * odbija ksztalty swiatel, nie ich tresc.
 *
 * Trzy pasy o roznych temperaturach barwowych sa celowe: gdyby wszystkie byly
 * biale, kazdy refleks mialby ten sam odcien i polerowana powierzchnia
 * wygladalaby jak matowa. Roznica temperatur daje krawedziom zycie.
 */
function studioEnvironment(renderer) {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");

  const sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, "#8d8d96");
  sky.addColorStop(0.42, "#43434c");
  sky.addColorStop(0.60, "#22222a");
  sky.addColorStop(1.00, "#101014");
  x.fillStyle = sky;
  x.fillRect(0, 0, W, H);

  // Pasy: [srodek w poziomie, szerokosc, gora, wysokosc, jasnosc, barwa]
  //
  // Jest ich szesc i sa rozlozone dookola celowo. Podglad sam sie obraca, wiec
  // luka w oswietleniu nie jest chwilowa: przy kazdym obrocie ta sama sciana
  // pierscionka wpadalaby w czern i wygladalo to jak dziura w bryle.
  const strips = [
    [0.16, 0.22, 0.04, 0.38, 1.00, "255,247,236"],   // kluczowe, cieple, z gory z lewej
    [0.42, 0.15, 0.08, 0.30, 0.72, "226,238,255"],   // wypelniajace, chlodne
    [0.66, 0.13, 0.06, 0.34, 0.62, "255,250,244"],   // drugie wypelniajace
    [0.88, 0.12, 0.14, 0.32, 0.55, "255,238,214"],   // obrys od tylu
    [0.30, 0.40, 0.70, 0.22, 0.34, "196,204,218"],   // odbicie od blatu, z lewej
    [0.76, 0.36, 0.72, 0.20, 0.28, "196,204,218"],   // odbicie od blatu, z prawej
  ];
  for (const [cx, w, ty, h, a, rgb] of strips) {
    const g = x.createLinearGradient((cx - w / 2) * W, 0, (cx + w / 2) * W, 0);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(0.5, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g;
    x.fillRect((cx - w / 2) * W, ty * H, w * W, h * H);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  // PMREM rozmywa mape wedlug chropowatosci materialu. Bez tego kazde odbicie
  // jest ostre jak lustro i szczotkowany metal wyglada tak samo jak polerowany.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

function metalMaterial(alloyId, color) {
  const isSilver = (CASTING_ALLOYS[alloyId]?.metal) === "silver";
  const tone = isSilver ? METAL_COLORS.white.tone : (METAL_COLORS[color] || METAL_COLORS.yellow).tone;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(tone),
    metalness: 1,
    // Zero dawaloby idealne lustro, w ktorym widac tylko pasy swiatla i nic
    // poza tym. Polerowana bizuteria ma slad drobnych rys po polerce.
    roughness: 0.085,
    envMapIntensity: 1.7,
  });
}

function stoneMaterial(gemId) {
  const o = gemOptics(gemId);
  if (!o) return null;
  const przezroczysty = o.transmission > 0.5;

  // Kamien przezroczysty NIE ma barwy powierzchni. Rubin jest czerwony,
  // bo swiatlo przechodzac przez niego traci reszte barw, i wlasnie dlatego
  // maly rubin jest jasniejszy od duzego. Wpisanie czerwieni w `color` daje
  // efekt odwrotny do zamierzonego: powierzchnia przestaje przepuszczac
  // swiatlo i kamien robi sie ciemna plama, co widac bylo na pierwszym
  // renderze. Barwa idzie wiec do pochlaniania w objetosci, a powierzchnia
  // zostaje bezbarwna.
  //
  // Kamienie nieprzezroczyste, onyks czy lapis, dzialaja odwrotnie: tam cala
  // barwa pochodzi z rozproszenia na powierzchni.
  return new THREE.MeshPhysicalMaterial({
    color: przezroczysty ? new THREE.Color("#ffffff") : new THREE.Color(o.color),
    metalness: 0,
    roughness: o.roughness,
    ior: o.ior,
    transmission: o.transmission,
    // Droga swiatla w kamieniu, w milimetrach. Krotsza daje barwe gleboka
    // i ciemna, dluzsza rozjasnia. Przy szesciu milimetrach rubin wychodzil
    // rozowy, bo swiatlo nie zdazylo stracic zieleni i blekitu.
    thickness: 1.6,
    attenuationColor: new THREE.Color(o.color),
    attenuationDistance: przezroczysty ? 2.2 : Infinity,
    specularIntensity: 1,
    envMapIntensity: 1.9,
  });
}

export default function RingPreview3D({
  metal, stones, sideStones,
  alloy = "ag925", color = "yellow",
  gem = "cz", sideGem = "cz",
}) {
  const hostRef = useRef(null);
  const stateRef = useRef(null);

  // Scena powstaje raz. Kolejne bryly tylko podmieniaja geometrie, bo
  // odtwarzanie renderera przy kazdym ruchu suwaka gubi kontekst WebGL,
  // a przegladarki maja ich ograniczona liczbe na karte.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Bez mapowania tonalnego jasne refleksy scinaja sie do czystej bieli
    // i cala gra swiatla na krawedziach znika.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.environment = studioEnvironment(renderer);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 500);
    camera.up.set(0, 0, 1);

    // Swiatla dokladaja sie do otoczenia, nie zastepuja go: otoczenie robi
    // barwe i refleksy, a te dwa podbijaja krawedzie, zeby bryla nie zlewala
    // sie z tlem tam, gdzie nie ma czego odbic.
    const key = new THREE.DirectionalLight(0xfff4e2, 1.5);
    key.position.set(-20, 30, 24);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fc0e0, 0.75);
    rim.position.set(16, -14, -18);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotateSpeed = 1.4;
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    stateRef.current = { renderer, scene, camera, group, controls, resize };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      scene.environment?.dispose?.();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    if (!st || !metal) return;
    const { group, camera, controls } = st;

    group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
    group.clear();

    group.add(new THREE.Mesh(geometryFrom(metal), metalMaterial(alloy, color)));

    const centre = stones && stoneMaterial(gem);
    if (centre) group.add(new THREE.Mesh(geometryFrom(stones), centre));
    const sides = sideStones && stoneMaterial(sideGem);
    if (sides) group.add(new THREE.Mesh(geometryFrom(sideStones), sides));

    const box = new THREE.Box3().setFromObject(group);
    group.position.sub(box.getCenter(new THREE.Vector3()));
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    // Kamere ustawiamy tylko przy pierwszej bryle. Przy kolejnych klient juz
    // ja obrocil, jak chcial, i cofanie tego przy kazdym ruchu suwaka
    // byloby walka z uzytkownikiem.
    if (!st.framed) {
      camera.position.set(radius * 1.6, -radius * 2.1, radius * 1.5);
      controls.target.set(0, 0, 0);
      st.framed = true;
    }
    controls.minDistance = radius * 1.4;
    controls.maxDistance = radius * 6;
    controls.update();
  }, [metal, stones, sideStones, alloy, color, gem, sideGem]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
