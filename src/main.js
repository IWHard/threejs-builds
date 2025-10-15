import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { createScene } from './scene.js';

let scene, camera, renderer, letter, clock, pointLight;

init();
animate();


function init() {
  // === Renderer ===
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // === Scene and Camera ===
  const result = createScene(THREE);
  scene = result.scene;
  camera = result.camera;
  camera.position.set(0, 0, 5);
  pointLight = result.pointLight;

  // === Load Letter A (JSON) ===
  const geometryLoader = new THREE.BufferGeometryLoader();
  geometryLoader.load('models/A.json', (geometry) => {
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
  const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(
    'textures/texture.jpg',
);

texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 1);
  const material = new THREE.MeshStandardMaterial({
    map: texture,metalness: 0.3,
          roughness: 0.6,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 0;
  mesh.scale.set(.7, -.7, .7);
  mesh.geometry.computeVertexNormals();

  letter = mesh;
  scene.add(letter);
});

  // === GUI (Light Controls) ===
  const gui = new GUI();
  const lightFolder = gui.addFolder('Controles de Luz');
  lightFolder.add(pointLight, 'intensity', 0, 100, 0.1).name('Intensidad');
  pointLight.intensity = 100;
  lightFolder
    .addColor({ color: pointLight.color.getHex() }, 'color')
    .name('Color')
    .onChange((value) => pointLight.color.set(value));
  lightFolder.open();

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  if (letter) {
    const radius = 2.0;
    const speed = 1;
    letter.position.x = Math.cos(t * speed) * radius;
    letter.position.z = Math.sin(t * speed) * radius;
    letter.lookAt(0, -letter.position.y, 10);
  }

  renderer.render(scene, camera);
}
