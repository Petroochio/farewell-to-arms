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
const ghostCategory = 0x0004;
const nullCategory = 0x0008;

function createCreature(arm$) {
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

  const baseProps = {
    collisionFilter: {
      category: ghostCategory,
      mask: nullCategory,
    },
    isStatic: true,
  };

  const creature = Composite.create();
  const base = Bodies.rectangle(300, 420, 200, 70, baseProps);
  Composite.add(creature, base);

  const createArm = (offset, elbow$, wrist$) => {
    const upperArm = Bodies.rectangle(195, 120, 60, 20, props);
    const forearm = Bodies.rectangle(235, 120, 60, 15, props);

    // Targets for joints
    const shoulderGhost = Bodies.circle(170, 120, 15, jointProps);
    const elbowGhost = Bodies.circle(220, 120, 10, ghostProps);
    const wristGhost = Bodies.circle(265, 130, 5, ghostProps);

    // Constraints
    const shoulderJoint = Constraint.create({
      bodyA: base,
      pointA: { x: 100 * offset, y: 0 },
      bodyB: upperArm,
      pointB: { x: -25, y: 0 },
      length: 0,
      stiffness: 0.05,
    });

    const shoulderGhostJoint = Constraint.create({
      bodyA: base,
      pointA: { x: offset * 100, y: 0 },
      bodyB: shoulderGhost,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0,
    });

    const elbowJoint1 = Constraint.create({
      bodyA: upperArm,
      pointA: { x: 30, y: 0 },
      bodyB: elbowGhost,
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: 0.05,
    });

    const elbowJoint2 = Constraint.create({
      bodyA: forearm,
      pointA: { x: -30, y: 0 },
      bodyB: elbowGhost,
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: 0.05,
    });

    const wristJoint = Constraint.create({
      bodyA: wristGhost,
      pointA: { x: 0, y: 0 },
      bodyB: forearm,
      pointB: { x: 30, y: 0 },
      length: 0,
      stiffness: 0.05,
    });

    // Hook up joints to motion tracking
    elbow$
      .map(([x, y]) => ({
        x: shoulderGhost.position.x + (x / 2),
        y: shoulderGhost.position.y + (y / 2),
      }))
      .subscribe({
        next: ({ x, y }) => {
          Body.setPosition(elbowGhost, { x, y });
        },
      });

    wrist$
      .map(([x, y]) => ({
        x: elbowGhost.position.x + (x / 2),
        y: elbowGhost.position.y + (y / 2),
      }))
      .subscribe({
        next: ({ x, y }) => {
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

  createArm(1, arm$.map(nth(0)), arm$.map(nth(1)));
  createArm(-1, arm$.map(nth(2)), arm$.map(nth(3)));
  createArm(0.5, arm$.map(nth(4)), arm$.map(nth(5)));
  createArm(-0.5, arm$.map(nth(6)), arm$.map(nth(7)));
  return creature;
}

function draw(bodies) {
  clearCanvas();

  bodies.forEach(({ vertices, label }) => {
    ctx.strokeStyle = label === 'ghost' ? '#f00' : '#fff';
    ctx.fillStyle = label === 'ghost' ? '#f00' : '#fff';
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    tail(vertices).forEach(({ x, y }) => ctx.lineTo(x, y));
    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.closePath();

    if (label !== 'ghost') {
      ctx.fill();
    }
  });
}

function GameWorld(sources) {
  const wallProps = {
    isStatic: true,
    collisionFilter: {
      category: defaultCategory,
      // mask: creatureCategory,
    },
  };

  const engine = Engine.create();
  engine.world.gravity.y = 0.01;
  const creature = createCreature(sources.arm$);
  const floor = Bodies.rectangle(300, 700, 600, 500, wallProps);
  const left = Bodies.rectangle(-100, 225, 200, 450, wallProps);
  const right = Bodies.rectangle(700, 225, 200, 450, wallProps);
  const top = Bodies.rectangle(300, 0, 600, -10, wallProps);

  const ballProps = {
    collisionFilter: {
      category: defaultCategory,
    },
    density: 1,
  };
  const balls = [
    Bodies.circle(300, 101, 50, ballProps),
    Bodies.circle(301, 102, 50, ballProps),
    Bodies.circle(302, 103, 50, ballProps),
    Bodies.circle(303, 104, 50, ballProps),
    Bodies.circle(304, 105, 50, ballProps),
    Bodies.circle(305, 106, 50, ballProps),
    Bodies.circle(306, 107, 50, ballProps),
    Bodies.circle(307, 108, 50, ballProps),
    Bodies.circle(308, 100, 50, ballProps),
  ];

  World.add(engine.world, [creature, floor, left, right, top, ...balls]);

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
