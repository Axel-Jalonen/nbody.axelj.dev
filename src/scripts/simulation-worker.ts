import * as THREE from "three";
import * as CONFIG from "./config";

const G = 6.6743e-11;
// TODO: Fix scaling
const DISTANCE_SCALE = 1 / CONFIG.BOX_SIZE;

onmessage = (event) => {
  const { buffer, timeStep } = event.data;

  while (true) {
    calculateForces(buffer, timeStep, CONFIG.MAX_SPHERE_COUNT);
  }
};

function calculateForces(
  buffer: Float64Array,
  timeStep: number,
  sphereCount: number,
) {
  const objectCount = buffer[0]; // Number of active objects

  for (let i = 0; i < objectCount; i++) {
    const index = 1 + i * CONFIG.FLOATS_PER_SPHERE;

    // Update velocity (example: gravity)
    buffer[index + 4] += -9.8 * timeStep; // vy += gravity

    // Update position based on velocity
    buffer[index + 0] += buffer[index + 3] * timeStep; // x += vx
    buffer[index + 1] += buffer[index + 4] * timeStep; // y += vy
    buffer[index + 2] += buffer[index + 5] * timeStep; // z += vz
  }

  // OLD
  // for (let i = 0; i < spheresBuffer.length / sphereCount; i++) {
  //   const p1 = spheresBuffer[i];
  //   p1.force = new THREE.Vector3(0, 0, 0);

  //   for (let j = 0; j < spheresBuffer.length; j++) {
  //     if (i === j) continue;

  //     const p2 = spheresBuffer[j];

  //     const dx = (p2.sphere.position.x - p1.sphere.position.x) * DISTANCE_SCALE;
  //     const dy = (p2.sphere.position.y - p1.sphere.position.y) * DISTANCE_SCALE;
  //     const dz = (p2.sphere.position.z - p1.sphere.position.z) * DISTANCE_SCALE;

  //     const dist = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);

  //     if (dist === 0) continue;

  //     // TODO: Fix scaling (mass)
  //     const forceMagnitude = (G * p1.mass * p2.mass) / dist ** 2;

  //     const forceVector = new THREE.Vector3(dx, dy, dz)
  //       .normalize()
  //       .multiplyScalar(forceMagnitude);

  //     // This will result in world space force
  //     p1.force.add(forceVector);
  //   }

  //   for (let sphere of spheresBuffer) {
  //     const acceleration = sphere.force.divideScalar(sphere.mass);
  //     sphere.velocity.add(acceleration.multiplyScalar(timeStep));
  //     sphere.sphere.position.add(
  //       sphere.velocity.clone().multiplyScalar(timeStep),
  //     );
  //   }
  // }
  // return spheresBuffer;
}
