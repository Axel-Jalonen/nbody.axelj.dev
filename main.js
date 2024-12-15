import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, camera, renderer, points, backgroundColor, foreground;
let width;
let height;
let aspectRatio;

const BOX_SIZE = 20;
const SPAWN_AREA_SIZE = 5;
let DELTA_TIME = 0.001;

function calculateScreenSpaceVars() {
  width = window.innerWidth;
  height = window.innerHeight;
  aspectRatio = width / height;
}

function init() {
  calculateScreenSpaceVars();
  // Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xff0000, 0.01, 15);
  foreground = 0x000000; // Black points
  scene.background = new THREE.Color(0x00000);

  // Add grid
  const createGridHelper = (
    size,
    divisions,
    color,
    xRotation = 0,
    yTranslation = 0,
    zRotation = 0,
  ) => {
    const grid = new THREE.GridHelper(size, divisions, color, color);
    grid.rotation.x = xRotation;
    grid.rotation.z = zRotation;
    grid.translateY(yTranslation);
    return grid;
  };

  scene.add(createGridHelper(BOX_SIZE, 10, 0x808080, Math.PI / 2, 10));
  scene.add(
    createGridHelper(BOX_SIZE, 10, 0x808080, Math.PI / 2, 10, Math.PI / 2),
  );
  scene.add(createGridHelper(BOX_SIZE, 10, 0x808080, 0, -10));

  // Camera setup
  camera = new THREE.PerspectiveCamera(70, aspectRatio, 0.1, 1000);
  // Middle of box
  camera.position.z = 10;

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1; // Set minimum zoom distance
  controls.maxDistance = 500; // Set maximum zoom distance

  // Points array
  points = [];

  // Event listeners
  document.getElementById("dt").addEventListener("input", () => {
    DELTA_TIME = parseFloat(document.getElementById("dt").value);
  });
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("keydown", (e) => {
    if (e.key === "n") {
      createPoint();
    }
  });

  animate(controls);
}

function onWindowResize() {
  calculateScreenSpaceVars();
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function createPoint() {
  const mass = Math.random() * 10 + 1; // Random mass between 1 and 11
  const geometry = new THREE.SphereGeometry(Math.log2(mass) / 50, 32, 32); // Ensure minimum size
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    metalness: 1,
    emissiveIntensity: 5,
    roughness: 0.01,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(
    (Math.random() - 0.5) * SPAWN_AREA_SIZE, // Random x position within the box
    (Math.random() - 0.5) * SPAWN_AREA_SIZE, // Random y position within the box
    (Math.random() - 0.5) * SPAWN_AREA_SIZE, // Random z position within the box
  );

  const velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.01, // Small random velocity in X
    (Math.random() - 0.5) * 0.01, // Small random velocity in Y
    (Math.random() - 0.5) * 0.01, // Small random velocity in Z
  );

  points.push({ sphere, mass, velocity });
  scene.add(sphere);
}

function calculateForces() {
  const gravitationalConstant = 6.6743e-2; // Adjusted for visualization
  const distanceScale = 1; // Simplify scale for intuitive distances

  for (let i = 0; i < points.length; i++) {
    const point1 = points[i];
    point1.force = new THREE.Vector3(0, 0, 0);

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;

      const point2 = points[j];
      const dx = point2.sphere.position.x - point1.sphere.position.x;
      const dy = point2.sphere.position.y - point1.sphere.position.y;
      const dz = point2.sphere.position.z - point1.sphere.position.z;
      const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2) * distanceScale;

      if (distance === 0) continue;

      const forceMagnitude =
        (gravitationalConstant * point1.mass * point2.mass) / distance ** 2;
      const forceVector = new THREE.Vector3(dx, dy, dz)
        .normalize()
        .multiplyScalar(forceMagnitude);

      point1.force.add(forceVector);
    }
  }

  for (let point of points) {
    const acceleration = point.force.divideScalar(point.mass);
    point.velocity.add(acceleration.multiplyScalar(DELTA_TIME));
    point.sphere.position.add(
      point.velocity.clone().multiplyScalar(DELTA_TIME),
    );
  }
}

function animate(controls) {
  requestAnimationFrame(() => animate(controls));

  controls.update();
  calculateForces();
  renderer.render(scene, camera);
}

init();
