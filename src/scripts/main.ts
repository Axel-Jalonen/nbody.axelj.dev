import * as THREE from "three";
import * as CONFIG from "./config.js";
import objectFactory from "./object-factory.js";

let scene: THREE.Scene,
  threeCamera: THREE.PerspectiveCamera,
  threeRenderer: THREE.WebGLRenderer,
  width: number,
  height: number,
  ar: number;

let sphereObjectList: THREE.Mesh[] = [];
let dt = 0.001;

const sharedSphereDataBuffer: Float64Array = new Float64Array(
  new SharedArrayBuffer(
    (1 + CONFIG.MAX_SPHERE_COUNT * CONFIG.FLOATS_PER_SPHERE) *
      Float64Array.BYTES_PER_ELEMENT,
  ),
);

sharedSphereDataBuffer[0] = 0; // Object count
let writeIndex = 0; // Tracks the next position to write

// Function to add a new body
function addBodyToSharedBuffer(object: {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mass: number;
}) {
  const index =
    1 + (writeIndex % CONFIG.MAX_SPHERE_COUNT) * CONFIG.FLOATS_PER_SPHERE; // Circular write position

  // Write the new body data
  sharedSphereDataBuffer[index + 0] = object.x;
  sharedSphereDataBuffer[index + 1] = object.y;
  sharedSphereDataBuffer[index + 2] = object.z;
  sharedSphereDataBuffer[index + 3] = object.vx;
  sharedSphereDataBuffer[index + 4] = object.vy;
  sharedSphereDataBuffer[index + 5] = object.vz;
  sharedSphereDataBuffer[index + 6] = object.mass;

  // Update metadata
  if (sharedSphereDataBuffer[0] < CONFIG.MAX_SPHERE_COUNT) {
    sharedSphereDataBuffer[0]++; // Increment count if not full
  }

  writeIndex++; // Move to the next position
}

function calculateScreenSpace() {
  width = window.innerWidth;
  height = window.innerHeight;
  ar = width / height;
}

function init() {
  const worker = new Worker(
    new URL("./simulation-worker.ts", import.meta.url),
    {
      type: "module",
    },
  );
  worker.postMessage({ sharedSphereDataBuffer, dt });
  calculateScreenSpace();

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x00000);
  scene.fog = new THREE.Fog(0xff0000, 0.01, 15);

  addGridToScene(scene);

  threeCamera = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV, ar, 0.1, 1000);
  threeCamera.position.z = CONFIG.BOX_SIZE / 2;

  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(width, height);

  document.body.appendChild(threeRenderer.domElement);

  const threeControls = new THREE.OrbitControls(
    threeCamera,
    threeRenderer.domElement,
  );

  // Zoom parameters
  threeControls.minDistance = 1;
  threeControls.maxDistance = 500;

  initializeEventListeners();

  animate(threeControls);
}

function getElementById(id: string) {
  const e = document.getElementById(id);
  if (e === null) {
    throw new Error(`Element with id ${id} not found`);
  }
  return e;
}

function initializeEventListeners() {
  const dtE = getElementById("dt") as HTMLInputElement;
  dtE.addEventListener("input", (event) => {
    if (event.target) {
      dt = parseFloat(dtE.value);
    }
  });

  window.addEventListener("resize", onWindowResize);

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "n") {
      createSphere();
    }
  });

  (getElementById("add-body") as HTMLInputElement).addEventListener(
    "click",
    createSphere,
  );
}

function addGridToScene(scene: THREE.Scene) {
  const halfPi = Math.PI / 2;
  function createGridHelper(xRot = 0, yTrans = 0, zRot = 0) {
    const g = new THREE.GridHelper(
      CONFIG.BOX_SIZE,
      CONFIG.GRID_DIVISIONS,
      CONFIG.GRID_COLOR,
      CONFIG.GRID_COLOR,
    );
    g.rotation.x = xRot;
    g.rotation.z = zRot;
    g.translateY(yTrans);
    return g;
  }
  scene.add(createGridHelper(halfPi, CONFIG.GRID_DIVISIONS));
  scene.add(createGridHelper(halfPi, CONFIG.GRID_DIVISIONS, halfPi));
  scene.add(createGridHelper(0, -CONFIG.GRID_DIVISIONS));
}

function onWindowResize() {
  calculateScreenSpace();
  threeCamera.aspect = ar;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(width, height);
}

function createSphere() {
  // TODO: Figure out mass scaling
  const sphereMass = 1 / Math.random();

  const sphere: THREE.Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      // TODO: This is just a magic number, fix this with a proper formula
      Math.log2(sphereMass) / 30,
      CONFIG.SPHERE_RESOLUTION,
      CONFIG.SPHERE_RESOLUTION,
    ),
    new THREE.MeshStandardMaterial({ emissive: CONFIG.SPHERE_EMISSION_COLOR }),
  );

  const positionComponents = Array(3)
    .fill(0)
    .map(() => (Math.random() - 0.5) * CONFIG.SPAWN_AREA_SIZE);

  sphere.position.set(...positionComponents);

  const velocity = new THREE.Vector3(
    (Math.random() - 0.5) * CONFIG.INITIAL_VELOCITY,
    (Math.random() - 0.5) * CONFIG.INITIAL_VELOCITY,
    (Math.random() - 0.5) * CONFIG.INITIAL_VELOCITY,
  );

  scene.add(sphere);
  sphereObjectList.push(sphere);
  addBodyToSharedBuffer({
    ...positionComponents,
    ...velocity,
    sphereMass,
  });
}

function updateThreeSphereObjects() {
  const objects = objectFactory(sharedSphereDataBuffer);

  objects.forEach((obj, i) => {
    const sphere = sphereObjectList[i];
    sphere.position.set(obj.x, obj.y, obj.z);
  });
}

function animate(controls: THREE.controls.OrbitControls) {
  requestAnimationFrame(() => animate(controls));
  updateThreeSphereObjects();
  controls.update();
  threeRenderer.render(scene, threeCamera);
}

// Start
init();
