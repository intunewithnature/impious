import * as THREE from 'three';
import { prefersReducedMotion } from './motion';

const GOLD = 0xffd700;
const NEON_PINK = 0xff00ff;
const NEON_CYAN = 0x00ffff;

export const initLaurelScene = () => {
  const canvas = document.getElementById('laurel-canvas') as HTMLCanvasElement | null;
  if (!canvas || typeof window === 'undefined') return;

  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance' 
    });
  } catch (error) {
    console.warn('WebGL unavailable', error);
    canvas.remove();
    return;
  }

  const getCanvasSize = () => {
    const bounds = canvas.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  };

  const { width, height } = getCanvasSize();
  const scene = new THREE.Scene();
  
  // Camera setup
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 12;

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- MATERIALS ---
  const wireframeMaterial = new THREE.MeshBasicMaterial({ 
    color: NEON_PINK, 
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.2,
    metalness: 1.0,
    emissive: 0x332200
  });

  // --- OBJECTS ---

  // 1. The Null Oracle (Central Icosahedron)
  const oracleGeo = new THREE.IcosahedronGeometry(2.5, 1);
  const oracle = new THREE.Mesh(oracleGeo, wireframeMaterial);
  scene.add(oracle);

  // 2. Inner Core (Solid)
  const coreGeo = new THREE.OctahedronGeometry(1.2, 0);
  const core = new THREE.Mesh(coreGeo, goldMaterial);
  scene.add(core);

  // 3. Floating Laurels (Instanced for performance)
  const leafGeo = new THREE.ConeGeometry(0.1, 0.6, 4);
  const leafCount = 60;
  const laurelMesh = new THREE.InstancedMesh(leafGeo, goldMaterial, leafCount);
  const dummy = new THREE.Object3D();

  // Arrange leaves in a circle
  const radius = 4.5;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    // Spiral offset
    const zOffset = Math.sin(angle * 2) * 0.5; 
    
    dummy.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      zOffset
    );
    dummy.lookAt(0, 0, 0);
    dummy.rotation.x += Math.PI / 2; // Point inward
    dummy.updateMatrix();
    laurelMesh.setMatrixAt(i, dummy.matrix);
  }
  scene.add(laurelMesh);

  // --- LIGHTS ---
  const pointLight = new THREE.PointLight(NEON_CYAN, 50, 20);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(NEON_PINK, 50, 20);
  pointLight2.position.set(-5, -5, 2);
  scene.add(pointLight2);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  // --- ANIMATION ---
  let time = 0;

  const resize = () => {
    const s = getCanvasSize();
    renderer?.setSize(s.width, s.height, false);
    camera.aspect = s.width / s.height;
    camera.updateProjectionMatrix();
  };

  const animate = () => {
    if (!renderer) return;
    
    if (!prefersReducedMotion()) {
      time += 0.005;

      // Rotate Oracle
      oracle.rotation.y += 0.002;
      oracle.rotation.x = Math.sin(time * 0.5) * 0.2;

      // Pulse Core
      const scale = 1 + Math.sin(time * 2) * 0.1;
      core.scale.set(scale, scale, scale);
      core.rotation.y -= 0.01;

      // Spin Laurels
      laurelMesh.rotation.z += 0.001;
      
      // Gentle camera sway
      camera.position.x = Math.sin(time * 0.2) * 0.5;
      camera.position.y = Math.cos(time * 0.3) * 0.5;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  window.addEventListener('resize', resize);
  animate();
};
