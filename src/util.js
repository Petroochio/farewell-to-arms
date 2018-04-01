import { add, zipWith } from 'ramda';

const K = 400;
const DAMP = 0.3;

export const spring = ({ p, v }, [dt, [tx, ty]]) => {
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
};

export default {};
