import * as THREE from 'three';
import { prefersReducedMotion } from './motion';

const leafMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#ff66f5'),
  emissive: new THREE.Color('#ff1bc5'),
  emissiveIntensity: 1.5,
  metalness: 0.3,
  roughness: 0.2,
});

const coinMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#fddc5c'),
  emissive: new THREE.Color('#ffae42'),
  emissiveIntensity: 0.6,
  metalness: 0.8,
  roughness: 0.3,
});

export const initLaurelScene = () => {
  const canvas = document.getElementById('laurel-canvas') as HTMLCanvasElement | null;
  if (!canvas || typeof window === 'undefined') return;

  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (error) {
    console.warn('WebGL unavailable, skipping hero animation', error);
    canvas.remove();
    return;
  }

  const getCanvasSize = () => {
    const bounds = canvas.getBoundingClientRect();
    return {
      width: bounds.width || 400,
      height: bounds.height || 400,
    };
  };

  const { width: initialWidth, height: initialHeight } = getCanvasSize();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, initialWidth / initialHeight, 0.1, 50);
  camera.position.z = 8;

  renderer.setSize(initialWidth, initialHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const laurelGroup = new THREE.Group();
  const leafGeometry = new THREE.ConeGeometry(0.14, 0.8, 12);

  for (let i = 0; i < 34; i += 1) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    const angle = (Math.PI * 1.3 * i) / 34 - Math.PI * 0.65;
    const radiusX = 2.3;
    const radiusY = 2.8;
    leaf.position.set(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, 0);
    leaf.rotation.z = angle - Math.PI / 2;
    leaf.scale.set(0.9 + Math.random() * 0.2, 0.9 + Math.random() * 0.2, 1);
    laurelGroup.add(leaf);
  }

  for (let i = 0; i < 34; i += 1) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    const angle = (Math.PI * 1.3 * i) / 34 - Math.PI * 0.65;
    const radiusX = -2.3;
    const radiusY = 2.8;
    leaf.position.set(Math.cos(Math.PI - angle) * radiusX, Math.sin(Math.PI - angle) * radiusY, 0);
    leaf.rotation.z = -(angle - Math.PI / 2);
    laurelGroup.add(leaf);
  }

  const coin = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 32, 100), coinMaterial);
  coin.rotation.x = Math.PI / 2;
  scene.add(coin);

  const glow = new THREE.PointLight('#ff80ff', 15, 25);
  glow.position.set(0, 0, 4);
  scene.add(glow);

  const rim = new THREE.PointLight('#4fd8ff', 10, 20);
  rim.position.set(-4, -2, -4);
  scene.add(rim);

  scene.add(new THREE.AmbientLight('#ffffff', 0.3));
  scene.add(laurelGroup);

  const resize = () => {
    const { width, height } = getCanvasSize();
    renderer?.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  let frameId = 0;

  const animate = () => {
    if (!renderer) return;
    if (!prefersReducedMotion()) {
      laurelGroup.rotation.z += 0.0025;
      coin.rotation.z -= 0.003;
    }
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };

  const handleVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
    } else {
      animate();
    }
  };

  animate();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', handleVisibility);
};
