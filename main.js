const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let backgroundColor = "black";
let foreground = "white";

window.addEventListener("keydown", (event) => {
  if (event.key === "a") {
    backgroundColor = backgroundColor === "black" ? "white" : "black";
    foreground = foreground === "white" ? "black" : "white";
  }
});

let canvasWidth = window.innerWidth * 2;
let canvasHeight = window.innerHeight * 2;

function initCanvasSize() {
  canvasWidth = window.innerWidth * 2;
  canvasHeight = window.innerHeight * 2;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
}

initCanvasSize();

window.addEventListener("resize", initCanvasSize);

ctx.fillRect(0, 0, canvasWidth, canvasHeight);

// Accepts 0 <= x, y <= 1
function worldToScreen(x, y) {
  if (x > 1 || y > 1) {
    throw new Error("x and y must be between 0 and 1");
  }
  return [x * canvasWidth, y * canvasHeight];
}

function screenToWorld(x, y) {
  if (x > canvasWidth || y > canvasHeight) {
    throw new Error("x and y must be between 0 and canvas width/height");
  }
  return [(x / canvasWidth) * 2, (y / canvasHeight) * 2];
}

function drawRect(x, y, sx, sy) {
  ctx.fillRect(...worldToScreen(x, y), sx, sy);
}

function drawCircle(x, y, r) {
  ctx.beginPath();
  ctx.arc(...worldToScreen(x, y), r, 0, 2 * Math.PI);
  ctx.fillStyle = foreground;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = foreground;
  ctx.stroke();
}

class Point {
  x;
  y;
  fx;
  fy;
  mass;

  constructor(fx, fy, x, y, mass) {
    this.fx = fx;
    this.fy = fy;
    this.x = x;
    this.y = y;
    this.mass = mass;
  }

  draw() {
    if (this.x > 1 || this.x < 0 || this.y > 1 || this.y < 0) {
      return;
    }
    const size = Math.log2(this.mass); // Size proportional to mass
    drawCircle(this.x, this.y, size);
  }
}

const points = [];

function render() {
  const dt = 0.5; // Time step
  const G = 6.6743e-11; // Gravitational constant
  const distanceScale = 4.5e9;
  const massScale = 1.9e29;

  // Force calculation loop
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const point1 = points[i];
      const point2 = points[j];
      const dx = (point2.x - point1.x) * distanceScale;
      const dy = (point2.y - point1.y) * distanceScale;
      const r = Math.sqrt(dx ** 2 + dy ** 2);

      if (r === 0) continue;

      const force =
        (G * point1.mass * massScale * point2.mass * massScale) / r ** 2;
      const theta = Math.atan2(dy, dx);
      const fx = force * Math.cos(theta);
      const fy = force * Math.sin(theta);

      points[i].fx += fx;
      points[i].fy += fy;
      points[j].fx -= fx;
      points[j].fy -= fy;
    }
  }

  // Update positions loop
  for (let i = 0; i < points.length; i++) {
    points[i].x +=
      (points[i].fx / (points[i].mass * massScale) / distanceScale) * dt;
    points[i].y +=
      (points[i].fy / (points[i].mass * massScale) / distanceScale) * dt;

    if (
      points[i].x > 1 ||
      points[i].x < 0 ||
      points[i].y > 1 ||
      points[i].y < 0
    ) {
      points.splice(i, 1);
      i--;
    }
  }

  points.forEach((point) => {
    point.draw();
    console.log(point.x + " ");
  });
}

document.addEventListener("click", (event) => {
  // Random number that is 100 times 1 over the inverse of the uniform between 0-1
  let mass = 1 / Math.random();
  points.push(
    new Point(0, 0, ...screenToWorld(event.clientX, event.clientY), mass),
  );
});

function animate() {
  ctx.fillStyle = backgroundColor;
  drawRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = foreground;
  render();
  window.requestAnimationFrame(animate);
}

animate();
