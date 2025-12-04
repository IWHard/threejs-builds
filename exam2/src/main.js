import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const info = document.getElementById('info');
const canvas = document.getElementById('app');

// === Escena, cámara y renderer ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Luz ===
const light = new THREE.DirectionalLight(0xffffff, 2.0);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// === Controles de camara ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === Cargar modelo OBJ ===
const loader = new OBJLoader();
loader.load(
  '/models/sphere.obj',
  (object) => {
    const mesh = object.children[0];
    mesh.material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.5,
      metalness: 0.1,
    });
    mesh.geometry.computeVertexNormals();

    const geometry = mesh.geometry;
    const pos = geometry.attributes.position;
    const vertexCount = pos.count;
    const triangleCount = vertexCount / 3;

    const triangleCenters = [];

    // Calcular puntos medios de cada triángulo
    for (let i = 0; i < pos.count; i += 3) {
      const vA = new THREE.Vector3().fromBufferAttribute(pos, i);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
      const vC = new THREE.Vector3().fromBufferAttribute(pos, i + 2);

      const center = new THREE.Vector3(
        (vA.x + vB.x + vC.x) / 3,
        (vA.y + vB.y + vC.y) / 3,
        (vA.z + vB.z + vC.z) / 3
      );
      triangleCenters.push(center);
    }

    info.innerHTML = `
      Triángulos: ${triangleCount}<br>
      Vértices: ${vertexCount}<br>
      Puntos medios: ${triangleCenters.length}
    `;

    // === Agregar la esfera ===
    scene.add(mesh);

    // === Mostrar los puntos medios ===
    //const pointsGeom = new THREE.BufferGeometry().setFromPoints(triangleCenters);
    //const pointsMat = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });
    //const points = new THREE.Points(pointsGeom, pointsMat);
    //scene.add(points);
    const linePoints = [];

    const lineLength = 0.5; // longitud de cada línea

    triangleCenters.forEach(center => {
      const dir = center.clone().normalize(); // dirección radial hacia afuera
      const end = center.clone().addScaledVector(dir, lineLength); // punto final

      linePoints.push(center, end);
    });

    // Crear geometría de líneas
    const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lines);
  },
  (xhr) => {
    info.innerHTML = `Cargando: ${(xhr.loaded / xhr.total) * 100}%`;
  },
  (error) => {
    console.error('Error al cargar el modelo:', error);
    info.innerHTML = 'Error al cargar el modelo.';
  }
);

// === Animación ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  scene.rotation.y += 0.0001;
  renderer.render(scene, camera);
}
animate();

// === Ajuste en caso de cambio de tamaño de ventana ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
