import xs from 'xstream';
import { compose, filter, isEmpty, not, nth, propEq, subtract, zipWith } from 'ramda';

import Joint from './joint';

////////// EWWWWW
const canvas = document.getElementById('track');
const ctx = canvas.getContext('2d');

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
}

// make a canvas driver that passes in a ctx as it draws everything
function drawJoint([x, y]) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
}
////////// EWWWWW


const centerRect = rect => [rect.x + (rect.width / 2), rect.y + (rect.height / 2)];

function intent(sources) {
  const { color$ } = sources;
  const cyan$ = color$.map(filter(propEq('color', 'cyan')))
    .filter(compose(not, isEmpty))
    .map(compose(centerRect, nth(0)));

  const magenta$ = color$.map(filter(propEq('color', 'magenta')))
    .filter(compose(not, isEmpty))
    .map(compose(centerRect, nth(0)));

  const yellow$ = color$.map(filter(propEq('color', 'yellow')))
    .filter(compose(not, isEmpty))
    .map(compose(centerRect, nth(0)));

  return {
    cyan$,
    magenta$,
    yellow$,
  };
}

// Should return a batch of draw calls, currently it just draws
function draw(joints$) {
  joints$.subscribe({
    next: ([shoulder, elbow, wrist]) => {
      clearCanvas();
      drawJoint(shoulder);
      drawJoint(elbow);
      drawJoint(wrist);
    },
  });
}

function Arm(sources) {
  const actions = intent(sources);
  const { frame$ } = sources;

  // each of these should return a position and a draw$
  const shoulder = Joint({
    frame$,
    fixed: true,
    parent$: xs.empty(),
    target$: actions.cyan$,
    startPos$: xs.of([300, 100]),
  });

  const elbowTarget$ = xs.combine(actions.cyan$, actions.magenta$, shoulder.position$)
    .map(([[x1, y1], [x2, y2], [x3, y3]]) => [x2 - x1 + x3, y2 - y1 + y3]).debug();
  const wristTarget$ = xs.combine(actions.cyan$, actions.yellow$, shoulder.position$)
    .map(([[x1, y1], [x2, y2], [x3, y3]]) => [x2 - x1 + x3, y2 - y1 + y3]).debug();
  const elbow = Joint({
    frame$,
    fixed: false,
    target$: elbowTarget$,
    startPos$: xs.of([300, 100]),
  });
  const wrist = Joint({
    frame$,
    fixed: false,
    target$: wristTarget$,
    startPos$: xs.of([300, 100]),
  });

  draw(xs.combine(shoulder.position$, elbow.position$, wrist.position$));
  // const state =
  // Make this something that returns draw calls
  // draw(state);
}

export default Arm;
