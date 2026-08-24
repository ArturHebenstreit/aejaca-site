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
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { appearanceFor } from "../../../data/castingAlloys.js";
import { gemOptics } from "../../../data/gemOptics.js";

/**
 * Siatka z jadra, z normalnymi liczonymi WEDLUG KATA miedzy scianami.
 *
 * `computeVertexNormals` usrednia normalne we wszystkich wierzcholkach, wiec
 * wygladza takze te krawedzie, ktore maja byc ostre. Dla metalu to bylo
 * niegroźne, dla kamienia zabojcze: brylant sklada sie wylacznie z plaskich
 * fasetek, a po usrednieniu wygladal jak polerowany otoczak. Tak tez zostalo
 * zglszone: "w kamieniach w ogole nie widac szlifu".
 *
 * `toCreasedNormals` usrednia tylko tam, gdzie sciany schodza sie plasko.
 * Obrys kamienia ma kilkadziesiat bokow, wiec rondysta zostaje gladka, a
 * fasetki, ktore roznia sie o kilkanascie stopni, zostaja plaskie.
 */
function geometryFrom(pack, katOstry = 35) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pack.positions, 3));
  g.setIndex(new THREE.BufferAttribute(pack.indices, 1));
  const gotowa = toCreasedNormals(g, (katOstry * Math.PI) / 180);
  g.dispose();
  return gotowa;
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
  const wyglad = appearanceFor(alloyId, color);
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(wyglad.tone),
    metalness: 1,
    // Zero dawaloby idealne lustro, w ktorym widac tylko pasy swiatla i nic
    // poza tym. Polerowana bizuteria ma slad drobnych rys po polerce.
    roughness: wyglad.roughness,
    envMapIntensity: 1.7,
  });
}

function stoneMaterial(gemId, sizeMm = 6) {
  const o = gemOptics(gemId);
  if (!o) return null;
  const przezroczysty = o.transmission > 0.5;

  // Kamienie NIEPRZEZROCZYSTE, onyks czy lapis, biora cala barwe
  // z rozproszenia na powierzchni i dlatego ida tu inna droga.
  //
  // POWIERZCHNIA kamienia przezroczystego jest bezbarwna i przepuszcza
  // niemal wszystko. Cala barwa bierze sie z POCHLANIANIA w objetosci, bo
  // stad bierze sie w rzeczywistosci: rubin jest czerwony, bo swiatlo idac
  // przez niego traci reszte barw, i dlatego maly rubin jest jasniejszy
  // od duzego.
  //
  // Wczesniej `transmission` szlo tu wprost z danych, a szafir ma tam 0,70.
  // Pozostale trzydziesci procent rysowalo sie jako BIALE rozproszenie
  // powierzchniowe i kladlo na kamieniu mleczny welon, ktory zjadal barwe.
  // Do tego droga swiatla byla stala, 1,6 mm przy dystansie 2,2 mm, wiec
  // pochlanianie ledwie zaczynalo dzialac. Szafir wychodzil z tego prawie
  // bezbarwny, i tak tez wygladal na renderze.
  //
  // Teraz `transmission` z danych opisuje SILE POCHLANIANIA, a nie mleczność:
  // im mniej kamien przepuszcza, tym krotsza droga do wysycenia barwy.
  // Roznica miedzy brylantem a granatem zostaje, ale idzie tam, gdzie jest
  // naprawde, czyli w gestosc barwy, a nie w matowosc powierzchni.
  //
  // POPRAWKA DO POPRAWKI: pierwsza wersja tego rachunku szla za daleko.
  // Droga swiatla rosla razem z kamieniem, a dystans wysycenia byl z niej
  // wyliczany, wiec wykladnik nie zalezal od rozmiaru, tylko byl staly i za
  // duzy: szmaragd osiem milimetrow przepuszczal szesc procent swiatla, czyli
  // na renderze byl czarny. Zglszone wprost: "wcale nie widac, ze to szmaragd".
  //
  // Dystans wysycenia jest wiec teraz WLASNOSCIA MATERIALU, stala dla danego
  // kamienia, a rozmiar wchodzi wylacznie przez droge swiatla. Dzieki temu
  // wraca zaleznosc, o ktora chodzilo od poczatku: kamyk w halo jest blady,
  // a ten sam material w duzym kamieniu gesty, i zaden nie jest czarny.
  const droga = Math.max(0.8, sizeMm * 0.8);
  const pochlanianie = Math.max(0.04, 1 - o.transmission);
  const ODNIESIENIE = 4.5;                 // kamien, przy ktorym barwa jest "wlasciwa"
  return new THREE.MeshPhysicalMaterial({
    color: przezroczysty ? new THREE.Color("#ffffff") : new THREE.Color(o.color),
    metalness: 0,
    roughness: o.roughness,
    ior: o.ior,
    transmission: przezroczysty ? 0.97 : o.transmission,
    thickness: droga,
    attenuationColor: new THREE.Color(o.color),
    // Droga, na ktorej barwa wysyca sie do wartosci z tabeli. Stala dla
    // materialu: szmaragd 5,9 mm, szafir 6,4 mm, brylant 23 mm.
    attenuationDistance: przezroczysty ? ODNIESIENIE / (2.4 * pochlanianie) : Infinity,
    specularIntensity: 1,
    envMapIntensity: 1.9,
  });
}

export default function RingPreview3D({
  metal, stones, haloStones, sideStones,
  alloy = "ag925", color = "yellow",
  gem = "cz", haloGem = "cz", sideGem = "cz",
  gemSize = 6.5, haloSize = 1.4, sideSize = 1.6,
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

    // Rozmiar wchodzi do materialu, bo pochlanianie zalezy od drogi swiatla:
    // ten sam szafir jest ciemny przy siedmiu milimetrach i blady przy
    // poltora, i wlasnie tak wyglada halo z szafirow wokol duzego kamienia.
    for (const [siatka, kamien, mm] of [
      [stones, gem, gemSize],
      [haloStones, haloGem, haloSize],
      [sideStones, sideGem, sideSize],
    ]) {
      // Kamien dostaje NIZSZY prog niz metal. Sasiednie fasetki rondysty
      // roznia sie o 22 stopnie, wiec przy progu metalu (35) zostalyby
      // wygladzone i caly szlif znowu by zniknal. Przy 18 stopniach fasetki
      // sa plaskie, a kopula kaboszonu, ktorej warstwy roznia sie o 15,
      // zostaje gladka, bo taka jest naprawde.
      const mat = siatka && stoneMaterial(kamien, mm);
      if (mat) group.add(new THREE.Mesh(geometryFrom(siatka, 18), mat));
    }

    const box = new THREE.Box3().setFromObject(group);
    group.position.sub(box.getCenter(new THREE.Vector3()));
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    // Kamery NIE ruszamy przy drobnych zmianach: klient ja obrocil, jak chcial,
    // a cofanie tego przy kazdym ruchu suwaka byloby walka z uzytkownikiem.
    //
    // Skok o cwierc rozmiaru to juz jednak inny wyrob, na przyklad przejscie
    // z solitera na sygnet po kliknieciu wzoru, i wtedy bryla po prostu
    // wychodzi poza kadr. Widac bylo sama szyne, bez glowicy.
    const skok = st.radius ? Math.abs(radius - st.radius) / st.radius : 1;
    if (!st.framed || skok > 0.25) {
      camera.position.set(radius * 1.6, -radius * 2.1, radius * 1.5);
      controls.target.set(0, 0, 0);
      st.framed = true;
    }
    st.radius = radius;
    controls.minDistance = radius * 1.4;
    controls.maxDistance = radius * 6;
    controls.update();
  }, [metal, stones, haloStones, sideStones, alloy, color,
      gem, haloGem, sideGem, gemSize, haloSize, sideSize]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
