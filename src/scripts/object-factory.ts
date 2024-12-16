import { MAX_SPHERE_COUNT, FLOATS_PER_SPHERE } from "./config.js";

export default function objectFactory(buffer: Float64Array) {
  const objectCount = buffer[0]; // The first slot stores the number of objects
  const objects: Array<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    mass: number;
  }> = [];

  for (let i = 0; i < objectCount; i++) {
    const index = 1 + i * FLOATS_PER_SPHERE; // Start after the metadata

    const obj = {
      x: buffer[index + 0],
      y: buffer[index + 1],
      z: buffer[index + 2],
      vx: buffer[index + 3],
      vy: buffer[index + 4],
      vz: buffer[index + 5],
      mass: buffer[index + 6],
    };

    objects.push(obj);
  }

  return objects;
}
