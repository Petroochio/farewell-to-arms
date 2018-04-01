import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import { Engine, Body, Bodies, World, Composite, Constraint } from 'matter-js';
import { compose, filter, isEmpty, not, nth, propEq, tail } from 'ramda';

// Render stuff, move dis
const canvas = document.getElementById('track');
const ctx = canvas.getContext('2d');

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
}

// World setup, move dis as well
const defaultCategory = 0x0001;
const creatureCategory = 0x0002;
const limbCategory = 0x0006;
const ghostCategory = 0x0004;
const nullCategory = 0x0008;

function createCreature(elbow1Target$, wrist1Target$, elbow2Target$, wrist2Target$) {
  const props = {
    collisionFilter: {
      category: creatureCategory,
      mask: defaultCategory,
    },
    density: 10,
  };

  const ghostProps = {
    label: 'ghost',
    isStatic: true,
    collisionFilter: {
      category: ghostCategory,
      mask: nullCategory,
    },
  };

  const jointProps = {
    label: 'ghost',
    collisionFilter: {
      category: ghostCategory,
      mask: defaultCategory,
    },
  };

  const limbProps = {
    collisionFilter: {
      category: ghostCategory,
      maks: nullCategory,
    },
  };

  const creature = Composite.create();
  const base = Bodies.rectangle(120, 120, 100, 70, props);
  Composite.add(creature, base);

  const createArm = (offset, elbow$, wrist$) => {
    const upperArm = Bodies.rectangle(195, 120, 50, 20, props);
    const forearm = Bodies.rectangle(235, 120, 30, 15, props);

    // Targets for joints
    const shoulderGhost = Bodies.circle(170, 120, 15, jointProps);
    const elbowGhost = Bodies.circle(220, 120, 10, ghostProps);
    const wristGhost = Bodies.circle(265, 130, 5, ghostProps);

    // Constraints
    const shoulderJoint = Constraint.create({
      bodyA: base,
      pointA: { x: offset, y: 0 },
      bodyB: upperArm,
      pointB: { x: -25, y: 0 },
      length: 0,
      stiffness: 0.05,
    });

    const elbowJoint1 = Constraint.create({
      bodyA: upperArm,
      pointA: { x: 25, y: 0 },
      bodyB: elbowGhost,
      pointB: { x: 0, y: 0 },
      length: 10,
      stiffness: 0.05,
    });

    const elbowJoint2 = Constraint.create({
      bodyA: forearm,
      pointA: { x: -20, y: 0 },
      bodyB: elbowGhost,
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: 0.05,
    });

    const wristJoint = Constraint.create({
      bodyA: forearm,
      pointA: { x: 20, y: 0 },
      bodyB: wristGhost,
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: 0.05,
    });

    const shoulderGhostJoint = Constraint.create({
      bodyA: base,
      pointA: { x: offset, y: 0 },
      bodyB: shoulderGhost,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0,
    });

    // Hook up joints to motion tracking
    elbow$
      .map(([x, y]) => ({
        x: shoulderGhost.position.x + (x / 2),
        y: shoulderGhost.position.y + (y / 2),
        length: Math.sqrt((x * x) + (y * y)) / 2,
      }))
      .subscribe({
        next: ({ x, y, length }) => {
          Body.setPosition(elbowGhost, { x, y });
        },
      });

    wrist$
      .map(([x, y]) => ({
        x: elbowGhost.position.x + (x / 2),
        y: elbowGhost.position.y + (y / 2),
        length: Math.sqrt((x * x) + (y * y)) / 2,
      }))
      .subscribe({
        next: ({ x, y, length }) => {
          wristJoint.length = length;
          Body.setPosition(wristGhost, { x, y });
        },
      });

    Composite.add(creature, shoulderGhost);
    Composite.add(creature, shoulderGhostJoint);
    Composite.add(creature, shoulderJoint);
    Composite.add(creature, upperArm);
    Composite.add(creature, forearm);
    Composite.add(creature, elbowJoint1);
    Composite.add(creature, elbowJoint2);
    Composite.add(creature, elbowGhost);
    Composite.add(creature, wristJoint);
    Composite.add(creature, wristGhost);
  };

  createArm(50, elbow1Target$, wrist1Target$);
  // createArm(-50, elbow2Target$, wrist2Target$);
  return creature;
}

const centerRect = rect => [rect.x + (rect.width / 2), rect.y + (rect.height / 2)];

function intent(sources) {
  const { frame$, color$ } = sources;
  const getColorStream = id => color$.map(filter(propEq('color', id)))
    .filter(compose(not, isEmpty))
    .map(compose(centerRect, nth(0)));

  const shoulder1$ = getColorStream('cyan');
  const elbow1$ = getColorStream('elbow-1');
  const wrist1$ = getColorStream('wrist-1');
  const shoulder2$ = getColorStream('shoulder-2');
  const elbow2$ = getColorStream('elbow-2');
  const wrist2$ = getColorStream('wrist-2');


  return {
    shoulder1$,
    elbow1$,
    wrist1$,
    shoulder2$,
    elbow2$,
    wrist2$,
    frame$,
  };
}

function draw(bodies) {
  clearCanvas();

  bodies.forEach(({ vertices, label }) => {
    ctx.strokeStyle = label === 'ghost' ? '#f00' : '#fff';
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    tail(vertices).forEach(({ x, y }) => ctx.lineTo(x, y));
    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.closePath();
    ctx.stroke();
  });
}

function GameWorld(sources) {
  const actions = intent(sources);

  const wallProps = {
    isStatic: true,
    collisionFilter: {
      category: defaultCategory,
      mask: creatureCategory,
    },
  };

  // Target relative to shoulder
  const elbow1Relative$ = xs.combine(actions.shoulder1$, actions.elbow1$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const elbow1Target$ = sources.frame$
    .compose(sampleCombine(elbow1Relative$))
    .map(nth(1));

  const wrist1Relative$ = xs.combine(actions.elbow1$, actions.wrist1$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const wrist1Target$ = sources.frame$
    .compose(sampleCombine(wrist1Relative$))
    .map(nth(1));

  // 2nd armgbtt
  const elbow2Relative$ = xs.combine(actions.shoulder2$, actions.elbow2$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const elbow2Target$ = sources.frame$
    .compose(sampleCombine(elbow2Relative$))
    .map(nth(1));

  const wrist2Relative$ = xs.combine(actions.elbow2$, actions.wrist2$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const wrist2Target$ = sources.frame$
    .compose(sampleCombine(wrist2Relative$))
    .map(nth(1));

  const engine = Engine.create();
  const creature = createCreature(elbow1Target$, wrist1Target$, elbow2Target$, wrist2Target$);
  const floor = Bodies.rectangle(300, 700, 600, 500, wallProps);
  const left = Bodies.rectangle(-100, 225, 200, 450, wallProps);
  const right = Bodies.rectangle(700, 225, 200, 450, wallProps);
  const top = Bodies.rectangle(300, 0, 600, -10, wallProps);

  World.add(engine.world, [creature, floor, left, right, top]);

  sources.frame$
    // .map(compose(divide(__, 60), prop('delta')))
    // .map(prop('delta'))
    .subscribe({
      next: () => {
        Engine.update(engine, 1000 / 30); // this ain't actual dt, wtf
        draw(Composite.allBodies(engine.world));
      },
    });
}

export default GameWorld;
