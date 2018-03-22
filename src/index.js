import * as THREE from 'three';
import { take, is, filter, propEq, map } from 'ramda';

// This renders stuff... Duh
function render() {
  renderer.render(scene, camera);
}

const canvas = document.getElementById('track');
const ctx = canvas.getContext('2d');
// render();
// Tracking test
tracking.ColorTracker.registerColor(
  'test',
  (r, g, b) => (
    r < 50 && r > 20 &&
    g < 70 && g > 50 &&
    b < 150 && b > 110
  )
);

const joints = new tracking.ColorTracker(['yellow', 'cyan', 'magenta']);

tracking.track('#video', joints, { camera: true });

function drawJoint([x, y]) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
}

joints.on('track', (e) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';

  const centerRects = map(rect => [rect.x + (rect.width / 2), rect.y + (rect.height / 2)]);
  // add code to handle multiple
  const shoulder = centerRects(filter(propEq('color', 'cyan'), e.data));
  const elbow = centerRects(filter(propEq('color', 'magenta'), e.data));
  const wrist = centerRects(filter(propEq('color', 'yellow'), e.data));

  shoulder.forEach(drawJoint);
  elbow.forEach(drawJoint);
  wrist.forEach(drawJoint);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  // draw bones
  if (shoulder.length > 0 && elbow.length > 0) {
    const [x1, y1] = shoulder[0];
    const [x2, y2] = elbow[0];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  }

  if (elbow.length > 0 && wrist.length > 0) {
    const [x1, y1] = elbow[0];
    const [x2, y2] = wrist[0];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  }
});
