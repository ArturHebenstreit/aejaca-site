import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/** Bok kwadratowej miniatury zapisywanej przy zamowieniu */
const THUMB_PX = 320;

/**
 * Kwadratowy kadr z podgladu, przeskalowany i skompresowany.
 *
 * Zrzut prosto z plotna WebGL potrafi wazyc kilkaset kilobajtow, a Safari
 * nie umie zapisac WEBP i po cichu oddaje PNG, czyli jeszcze wiecej. Stad
 * przerysowanie na male plotno 2D i jawny zapas w postaci JPEG.
 *
 * @param {HTMLCanvasElement} gl plotno renderera
 * @returns {string} data URL gotowy do wyslania
 */
function snapshot(gl) {
  const c = document.createElement("canvas");
  c.width = THUMB_PX;
  c.height = THUMB_PX;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0c1222";
  ctx.fillRect(0, 0, THUMB_PX, THUMB_PX);

  // Kadr kwadratowy ze srodka, zeby model nie zostal sciety z boku.
  const side = Math.min(gl.width, gl.height);
  ctx.drawImage(gl, (gl.width - side) / 2, (gl.height - side) / 2, side, side, 0, 0, THUMB_PX, THUMB_PX);

  const webp = c.toDataURL("image/webp", 0.8);
  return webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/jpeg", 0.82);
}

/**
 * Podglad siatki trojkatow. Mimo nazwy nie jest juz zwiazany z STL,
 * karmimy go tez OBJ i 3MF.
 *
 * @param {object} props
 * @param {number[][][]} props.triangles
 * @param {number} [props.height] wysokosc ramki w pikselach
 * @param {(dataUrl: string) => void} [props.onSnapshot] wolane raz, gdy model
 *        sie ustabilizuje, dostaje miniature do pokazania w koszyku
 * @param {boolean} [props.grid] podloga pomocnicza. Domyslnie wylaczona, bo
 *        przy wgranym modelu klienta rozprasza zamiast pomagac
 */
export default function STLViewer({ triangles, bbox, height = 220, onSnapshot, grid = false, scale = null }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const snapRef = useRef(onSnapshot);
  snapRef.current = onSnapshot;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !triangles?.length) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    // preserveDrawingBuffer jest potrzebny, zeby dalo sie zczytac klatke
    // do miniatury. Bez niego toDataURL zwraca pusty obraz.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!snapRef.current });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 10000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    // Build geometry from parsed triangles
    const positions = new Float32Array(triangles.length * 9);
    for (let i = 0; i < triangles.length; i++) {
      const [v1, v2, v3] = triangles[i];
      const o = i * 9;
      positions[o] = v1[0]; positions[o+1] = v1[1]; positions[o+2] = v1[2];
      positions[o+3] = v2[0]; positions[o+4] = v2[1]; positions[o+5] = v2[2];
      positions[o+6] = v3[0]; positions[o+7] = v3[1]; positions[o+8] = v3[2];
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      metalness: 0.15,
      roughness: 0.45,
      flatShading: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    // Srodkujemy GEOMETRIE, a nie polozenie siatki.
    //
    // To nie jest kosmetyka. Skala nierownomierna z suwaka wymiarow ustawia
    // `mesh.scale`, a skalowanie idzie wzgledem lokalnego srodka ukladu. Gdyby
    // model byl srodkowany przesunieciem siatki (`mesh.position`), kazde
    // rozciagniecie odsuwaloby go od srodka kadru tym mocniej, im dalej od zera
    // lezala geometria w pliku. Po przesunieciu SAMEJ geometrii srodek bryly
    // lezy w zerze i skala dziala wokol niego.
    geom.computeBoundingBox();
    const surowyBox = geom.boundingBox;
    const center = new THREE.Vector3();
    surowyBox.getCenter(center);
    geom.translate(-center.x, -center.y, -center.z);
    geom.computeBoundingBox();
    const box = geom.boundingBox;

    // Fit camera
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.position.set(dist * 0.8, dist * 0.6, dist * 1.0);
    camera.near = maxDim * 0.001;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.copy(camera.position);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-dist, -dist * 0.5, -dist * 0.3);
    scene.add(fillLight);

    // Podloga pomocnicza, tylko na zyczenie
    let gridHelper = null;
    if (grid) {
      gridHelper = new THREE.GridHelper(maxDim * 2, 20, 0x334155, 0x1e293b);
      gridHelper.position.y = box.min.y;
      scene.add(gridHelper);
    }

    // Miniatura z ujecia trzy czwarte, po chwili obrotu, zeby nie zlapac
    // modelu ustawionego plasko do kamery.
    let snapTimer = null;
    if (snapRef.current) {
      snapTimer = setTimeout(() => {
        try {
          snapRef.current?.(snapshot(renderer.domElement));
        } catch (err) {
          // Zrzut jest wygoda, nie warunkiem zamowienia, wiec nie przerywamy.
          console.warn("[viewer] zrzut modelu nie powiodl sie:", err?.message);
        }
      }, 900);
    }

    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      controls.update();
      dirLight.position.copy(camera.position);
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    function onResize() {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    stateRef.current = { renderer, animId, ro, mesh, camera, controls, maxDim };

    return () => {
      cancelAnimationFrame(animId);
      if (snapTimer) clearTimeout(snapTimer);
      ro.disconnect();
      controls.dispose();
      gridHelper?.geometry?.dispose();
      renderer.dispose();
      geom.dispose();
      mat.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [triangles, bbox, height, grid]);

  // ZNIEKSZTALCENIE W PODGLADZIE. Skala idzie osobnym efektem, a nie zaleznoscia
  // glownego: przebudowa sceny przy kazdym wpisanym znaku gasilaby obrot
  // i mrugala plotnem. Tutaj tylko ustawiamy skale siatki i odsuwamy kamere,
  // zeby powiekszony model nie wyszedl poza kadr.
  useEffect(() => {
    const st = stateRef.current;
    if (!st?.mesh) return;
    const sx = Number(scale?.x) > 0 ? Number(scale.x) : 1;
    const sy = Number(scale?.y) > 0 ? Number(scale.y) : 1;
    const sz = Number(scale?.z) > 0 ? Number(scale.z) : 1;
    // Osie mapujemy jeden do jednego, bo gabaryt w polach wymiarow liczymy
    // z TYCH SAMYCH trojkatow, ktore tu rysujemy. Zamiana osi byla by bledem
    // widocznym dopiero na wydruku.
    st.mesh.scale.set(sx, sy, sz);
    const najwiekszy = Math.max(sx, sy, sz);
    const dist = (st.maxDim * najwiekszy) / (2 * Math.tan((st.camera.fov * Math.PI) / 360));
    const kier = st.camera.position.clone().normalize();
    st.camera.position.copy(kier.multiplyScalar(dist * 1.35));
    st.camera.far = st.maxDim * najwiekszy * 100;
    st.camera.updateProjectionMatrix();
    st.controls.update();
  }, [scale?.x, scale?.y, scale?.z]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden bg-[#0c1222] border border-white/5"
      style={{ height: `${height}px` }}
    />
  );
}
