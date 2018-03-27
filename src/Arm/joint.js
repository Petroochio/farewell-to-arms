import sampleCombine from 'xstream/extra/sampleCombine';
import { __, add, compose, divide, prop, zipWith } from 'ramda';

// Sprint Constants
const K = 400;
const DAMP = 0.3;

function model(actions) {
  const {
    target$,
    frame$,
    fixed,
    startPos$,
  } = actions;

  let position$;

  if (!fixed) {
    // spring math is in here
    position$ = frame$
      .map(compose(divide(__, 1000), prop('delta')))
      .compose(sampleCombine(target$))
      .fold(
        ({ p, v }, [dt, [tx, ty]]) => {
          const [px, py] = p;
          const [vx, vy] = v;

          // Probs need to add a Delta time in here somehow
          const ax = ((tx - px) * K); // This is the important bit
          const ay = ((ty - py) * K);
          const currVX = ((ax * dt) + vx) * DAMP; // so is this
          const currVY = ((ay * dt) + vy) * DAMP;

          const currV = [currVX, currVY];
          const step = [currVX * dt, currVY * dt];

          return {
            p: zipWith(add, p, step),
            v: currV,
          };
        },
        { p: [0, 0], v: [0, 0] }
      ) // Intial position, maybe push some data to the target instead
      .map(prop('p'));
  } else {
    position$ = startPos$;
  }

  return {
    position$,
  };
}

// DO A PROP$
function Joint(sources) {
  const state = model(sources);

  return {
    position$: state.position$,
  };
}

export default Joint;
