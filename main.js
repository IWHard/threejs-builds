import * as THREE from 'three'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { CameraMovement } from './camara.js';

const container = document.getElementById('app') || document.body;

// =============================================
// Configuración de escena
// =============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0f);

scene.fog = new THREE.FogExp2(0x0b0b0f, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const cameraMovement = new CameraMovement(camera, renderer.domElement);
cameraMovement.setupEventListeners(controls);

// Luces
const ambient = new THREE.AmbientLight(0x404040, 2);
scene.add(ambient);

const mainLight = new THREE.DirectionalLight(0xffffff, 2);
mainLight.position.set(10, 10, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

const rimLight = new THREE.DirectionalLight(0x8a6eff, 2);
rimLight.position.set(-10, 0, -5);
scene.add(rimLight);

// =============================================
// Parámetros fractales
// =============================================
const params = {
  recursionDepth: 2,
  baseScale: 1,
  sphereRadius: 0.3,
  cylinderRadius: 0.15,
  scaleReduction: 0.5, 
  //branchAngle: 45,      
  regenerate: () => regenerate()
};

const gui = new GUI();
gui.add(params, 'recursionDepth', 0, 6, 1).name('Depth').onChange(params.regenerate);
gui.add(params, 'baseScale', 0.5, 3, 0.1).name('Base Size').onChange(params.regenerate);
gui.add(params, 'scaleReduction', 0, 3, 0.001).name('Scale Reduction').onChange(params.regenerate);
//gui.add(params, 'branchAngle', 0, 90, 1).name('Branch Angle (Deg)').onChange(params.regenerate);
gui.add(params, 'sphereRadius', 0, 1.0, 0.01).name('Joint Size').onChange(params.regenerate);
gui.add(params, 'cylinderRadius', 0, 0.5, 0.01).name('Stick Thickness').onChange(params.regenerate);
gui.add(params, 'regenerate').name('Regenerate');

// =============================================
// Geometria base
// =============================================
const hexR = 3;
const baseSpherePositions = [];
for (let i = 0; i < 6; i++) {
  const angle = i * Math.PI / 3 + Math.PI / 2;
  baseSpherePositions.push(new THREE.Vector3(Math.cos(angle) * hexR, Math.sin(angle) * hexR, 0));
}
baseSpherePositions.push(new THREE.Vector3(0, 0, hexR));

const baseEdges = [];
for (let i = 0; i < 6; i++) baseEdges.push([i, (i + 1) % 6]);
for (let i = 5; i <= 6; i++) baseEdges.push([6, i]);


// =============================================
// Materiales
// =============================================
const sphereMat = new THREE.MeshStandardMaterial({ 
  color: 0xffffff, 
  metalness: 0.9, 
  roughness: 0.1,
  emissive: 0x220044
});
const cylMat = new THREE.MeshStandardMaterial({ 
  color: 0x222222, 
  metalness: 0.5, 
  roughness: 0.8 
});

// =============================================
// Variables de instancias
// =============================================
let sphereInstanced = null;
let cylinderInstanced = null;

function makeCylinderMatrix(start, end, radius) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const pos = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0); 
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
  const scale = new THREE.Vector3(radius, length, radius);
  const m = new THREE.Matrix4();
  m.compose(pos, quaternion, scale);
  return m;
}

// =============================================
// Logica de recursividad
// =============================================
function generateFractalMatrices() {
  const sphereMatrices = [];
  const cylinderMatrices = [];
  
  const GROWTH_DIRECTIONS = [];
      for (let i = 1; i < 7; i++) {
          const angle = i * Math.PI / 3;
          
          GROWTH_DIRECTIONS.push(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, angle)));
      }

  function rec(level, parentMatrix, currentScale) {
    
    const scale = params.baseScale * currentScale;

    for (let i = 0; i < baseSpherePositions.length; i++) {
        
        if (level > 0 && i === 6) continue; 

        const localPos = baseSpherePositions[i].clone().multiplyScalar(scale);
        const worldPos = localPos.clone().applyMatrix4(parentMatrix);
        
        const sMat = new THREE.Matrix4();
        const sSize = params.sphereRadius * scale;
        sMat.compose(worldPos, new THREE.Quaternion(), new THREE.Vector3(sSize, sSize, sSize));
        sphereMatrices.push(sMat);
    }

    for (const [a, b] of baseEdges) {
        const pA = baseSpherePositions[a].clone().multiplyScalar(scale).applyMatrix4(parentMatrix);
        const pB = baseSpherePositions[b].clone().multiplyScalar(scale).applyMatrix4(parentMatrix);
        
        const cMat = makeCylinderMatrix(pA, pB, params.cylinderRadius * scale);
        cylinderMatrices.push(cMat);
    }

    if (level < params.recursionDepth) {
        
        for (let i = 0; i < 6; i++) {
            
            const childLocalPos = baseSpherePositions[i].clone().multiplyScalar(scale);
            const childWorldPos = childLocalPos.clone().applyMatrix4(parentMatrix);

            const parentRotQ = new THREE.Quaternion().setFromRotationMatrix(parentMatrix);
            const directionRotQ = GROWTH_DIRECTIONS[i];

            const childRotQ = parentRotQ.clone().multiply(directionRotQ);
            
            const nextScale = currentScale * params.scaleReduction;
            
            const offsetVector = new THREE.Vector3(0, 0, -hexR)
                .multiplyScalar(params.baseScale * nextScale);
                
            offsetVector.applyQuaternion(childRotQ);
            
            childWorldPos.add(offsetVector);

            const childMatrix = new THREE.Matrix4();
            childMatrix.compose(childWorldPos, childRotQ, new THREE.Vector3(1, 1, 1));
            
            rec(level + 1, childMatrix, nextScale);
        }
    }
  }

  const rootMatrix = new THREE.Matrix4();
  rootMatrix.identity(); 
  rec(0, rootMatrix, 1.0);

  return { sphereMatrices, cylinderMatrices };
}


function regenerate() {
  if (sphereInstanced) { scene.remove(sphereInstanced); sphereInstanced.geometry.dispose(); }
  if (cylinderInstanced) { scene.remove(cylinderInstanced); cylinderInstanced.geometry.dispose(); }

  const { sphereMatrices, cylinderMatrices } = generateFractalMatrices();

  const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);

  sphereInstanced = new THREE.InstancedMesh(sphereGeo, sphereMat, sphereMatrices.length);
  cylinderInstanced = new THREE.InstancedMesh(cylinderGeo, cylMat, cylinderMatrices.length);

  for (let i = 0; i < sphereMatrices.length; i++) {
    sphereInstanced.setMatrixAt(i, sphereMatrices[i]);
  }
  sphereInstanced.instanceMatrix.needsUpdate = true;

  for (let i = 0; i < cylinderMatrices.length; i++) {
    cylinderInstanced.setMatrixAt(i, cylinderMatrices[i]);
  }
  cylinderInstanced.instanceMatrix.needsUpdate = true;

  sphereInstanced.castShadow = true;
  sphereInstanced.receiveShadow = true;
  cylinderInstanced.castShadow = true;
  cylinderInstanced.receiveShadow = true;

  scene.add(sphereInstanced);
  scene.add(cylinderInstanced);
}

//const axesHelper = new THREE.AxesHelper(10); 
//scene.add(axesHelper);
// =============================================
// Inicio y bucle
// =============================================
regenerate();

const rootGroup = new THREE.Group();
scene.add(rootGroup);

function animate() {
  requestAnimationFrame(animate);
  if (controls.enabled) {
        controls.update(); 
    }
  cameraMovement.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});