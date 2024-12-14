const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";

const canvasWidth = window.innerWidth * 2;
const canvasHeight = window.innerHeight * 2;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

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
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "white";
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
    drawCircle(this.x, this.y, 3);
  }
}

const points = [];

function render() {
  const dt = 0.01; // Define a time step
  const G = 6.6743e-11; // Gravitational constant (adjust as needed)

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const point1 = points[i];
      const point2 = points[j];
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      const r = Math.sqrt(dx ** 2 + dy ** 2);

      if (r === 0) continue; // Avoid division by zero

      const force = (G * point1.mass * point2.mass) / r ** 2;
      const theta = Math.atan2(dy, dx);
      const fx = force * Math.cos(theta);
      const fy = force * Math.sin(theta);

      points[i].fx += fx;
      points[i].fy += fy;
      points[j].fx -= fx; // Newton's third law
      points[j].fy -= fy;
    }
  }

  for (let i = 0; i < points.length; i++) {
    points[i].x += (points[i].fx / points[i].mass) * dt;
    points[i].y += (points[i].fy / points[i].mass) * dt;
  }

  points.forEach((point) => {
    point.draw();
    console.log(point.x);
  });
}

document.addEventListener("click", (event) => {
  points.push(
    new Point(0, 0, ...screenToWorld(event.clientX, event.clientY), 100),
  );
});

function animate() {
  ctx.fillStyle = "black";
  drawRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "white";
  render();
  window.requestAnimationFrame(animate);
}

animate();
