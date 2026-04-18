import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function STLViewer({ triangles, bbox }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !triangles?.length) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

    // Center model at origin
    geom.computeBoundingBox();
    const box = geom.boundingBox;
    const center = new THREE.Vector3();
    box.getCenter(center);
    mesh.position.sub(center);

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

    // Grid
    const gridSize = maxDim * 2;
    const grid = new THREE.GridHelper(gridSize, 20, 0x334155, 0x1e293b);
    grid.position.y = box.min.y - center.y;
    scene.add(grid);

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

    stateRef.current = { renderer, animId, ro };

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      geom.dispose();
      mat.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [triangles, bbox]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden bg-[#0c1222] border border-white/5"
      style={{ height: "220px" }}
    />
  );
}
