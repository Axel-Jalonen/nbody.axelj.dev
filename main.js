import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, threeCamera, threeRenderer, width, height, ar;
let points = [];
let dt = 0.001;

const BOX_SIZE = 20;
const SPAWN_AREA_SIZE = BOX_SIZE / 2;
const SPHERE_RESOLUTION = 8;
const INITIAL_VELOCITY = 0.01;
const FOV = 70;
const GRID_COLOR = 0x808080;
const GRID_DIVISIONS = 10;
const SPHERE_EMISSIONS_COLOR = 0xffffff;

function calculateScreenSpace() {
  width = window.innerWidth;
  height = window.innerHeight;
  ar = width / height;
}

function init() {
  calculateScreenSpace();

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x00000);
  scene.fog = new THREE.Fog(0xff0000, 0.01, 15);

  addGridToScene(scene);

  threeCamera = new THREE.PerspectiveCamera(FOV, ar, 0.1, 1000);
  threeCamera.position.z = BOX_SIZE / 2;

  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(width, height);

  document.body.appendChild(threeRenderer.domElement);

  const threeControls = new OrbitControls(
    threeCamera,
    threeRenderer.domElement,
  );

  // Zoom parameters
  threeControls.minDistance = 1;
  threeControls.maxDistance = 500;

  initializeEventListeners();

  animate(threeControls);
}

function initializeEventListeners() {
  document.getElementById("dt").addEventListener("input", (event) => {
    dt = parseFloat(event.target.value);
  });

  window.addEventListener("resize", onWindowResize);

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "n") {
      createSphere();
    }
  });

  document.getElementById("add-body").addEventListener("click", createSphere);
}

function addGridToScene(scene) {
  const halfPi = Math.PI / 2;
  function createGridHelper(xRot = 0, yTrans = 0, zRot = 0) {
    const g = new THREE.GridHelper(
      BOX_SIZE,
      GRID_DIVISIONS,
      GRID_COLOR,
      GRID_COLOR,
    );
    g.rotation.x = xRot;
    g.rotation.z = zRot;
    g.translateY(yTrans);
    return g;
  }
  scene.add(createGridHelper(halfPi, GRID_DIVISIONS));
  scene.add(createGridHelper(halfPi, GRID_DIVISIONS, halfPi));
  scene.add(createGridHelper(0, -GRID_DIVISIONS));
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

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      // TODO: This is just a magic number, fix this with a proper formula
      Math.log2(sphereMass) / 30,
      SPHERE_RESOLUTION,
      SPHERE_RESOLUTION,
    ),
    new THREE.MeshStandardMaterial({ emissive: SPHERE_EMISSIONS_COLOR }),
  );

  sphere.position.set(
    (Math.random() - 0.5) * SPAWN_AREA_SIZE,
    (Math.random() - 0.5) * SPAWN_AREA_SIZE,
    (Math.random() - 0.5) * SPAWN_AREA_SIZE,
  );

  const velocity = new THREE.Vector3(
    (Math.random() - 0.5) * INITIAL_VELOCITY,
    (Math.random() - 0.5) * INITIAL_VELOCITY,
    (Math.random() - 0.5) * INITIAL_VELOCITY,
  );

  points.push({ sphere, mass: sphereMass, velocity });
  scene.add(sphere);
}

function calculateForces() {
  const G = 6.6743e-11;
  // TODO: Fix scaling
  const DISTANCE_SCALE = 1 / BOX_SIZE;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    p1.force = new THREE.Vector3(0, 0, 0);

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;

      const p2 = points[j];

      const dx = (p2.sphere.position.x - p1.sphere.position.x) * DISTANCE_SCALE;
      const dy = (p2.sphere.position.y - p1.sphere.position.y) * DISTANCE_SCALE;
      const dz = (p2.sphere.position.z - p1.sphere.position.z) * DISTANCE_SCALE;

      const dist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);

      if (dist === 0) continue;

      // TODO: Fix scaling (mass)
      const forceMagnitude = (G * p1.mass * p2.mass) / dist ** 2;

      const forceVector = new THREE.Vector3(dx, dy, dz)
        .normalize()
        .multiplyScalar(forceMagnitude);

      p1.force.add(forceVector);
    }
  }

  for (let point of points) {
    const acceleration = point.force.divideScalar(point.mass);
    point.velocity.add(acceleration.multiplyScalar(dt));
    point.sphere.position.add(point.velocity.clone().multiplyScalar(dt));
  }
}

function animate(controls) {
  requestAnimationFrame(() => animate(controls));

  controls.update();
  calculateForces();
  threeRenderer.render(scene, threeCamera);
}

init();
