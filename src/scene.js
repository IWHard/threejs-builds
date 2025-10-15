export function createScene(THREE) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  // === Camera ===
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.2, 6);

  // === Lights ===
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 2);
  pointLight.position.set(2, 3, 3);
  pointLight.castShadow = true;
  scene.add(pointLight);

  // === Floor ===
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x404040,
    roughness: 0.9,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1;
  floor.receiveShadow = true;
  scene.add(floor);

  return { scene, camera, pointLight };
}
