// ============================================================
// PODGLAD PIERSCIONKA
// ============================================================
// Rysuje siatke, ktora przyszla z watku roboczego. Sam niczego nie liczy
// i nie zna parametrow: dostaje wierzcholki i indeksy, a caly ksztalt
// powstal juz wczesniej, w tym samym kodzie, ktory zbuduje kupowany plik.
//
// PULAPKA, na ktora sie nabralem przy pierwszym renderze: manifold oddaje
// same wierzcholki i indeksy, BEZ normalnych. Bryla bez normalnych renderuje
// sie calkowicie czarno pod kazdym oswietlonym materialem, co wyglada jak
// zepsuta geometria, a jest brakiem jednej linijki.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function geometryFrom(pack) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pack.positions, 3));
  g.setIndex(new THREE.BufferAttribute(pack.indices, 1));
  g.computeVertexNormals();
  return g;
}

export default function RingPreview3D({ metal, stones, alloy = "ag925" }) {
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
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 500);
    camera.up.set(0, 0, 1);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.HemisphereLight(0xfff2dd, 0x24190f, 1.0));
    const key = new THREE.DirectionalLight(0xfff4e2, 2.0);
    key.position.set(-20, 30, 24);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8fb4d4, 0.8);
    fill.position.set(18, -10, -16);
    scene.add(fill);

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

    const gold = alloy.startsWith("au");
    group.add(new THREE.Mesh(geometryFrom(metal), new THREE.MeshPhongMaterial({
      color: gold ? 0xe0c079 : 0xd9cfba,
      specular: gold ? 0xfff0c0 : 0xfff6e6,
      shininess: 95,
    })));
    if (stones) {
      group.add(new THREE.Mesh(geometryFrom(stones), new THREE.MeshPhongMaterial({
        color: 0x9fd8f0, specular: 0xffffff, shininess: 160,
        transparent: true, opacity: 0.72,
      })));
    }

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
  }, [metal, stones, alloy]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
