import xs from 'xstream';
import { compose, filter, isEmpty, not, nth, propEq } from 'ramda';

import Joint from './joint';

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

function Arm(sources) {
  const actions = intent(sources);
  const { frame$ } = sources;

  // each of these should return a position and a draw$
  const shoulder = Joint({
    frame$,
    fixed: true,
    parent$: xs.empty(),
    target$: actions.cyan$,
    startPos$: xs.of([0, 0]),
  });

  // Make relative to shoulder color
  const elbowTarget$ = xs.combine(actions.cyan$, actions.magenta$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1]);
  const wristTarget$ = xs.combine(actions.cyan$, actions.yellow$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1]);

  const elbow = Joint({
    frame$,
    fixed: false,
    target$: elbowTarget$,
    startPos$: xs.of([0, 0]),
  });
  const wrist = Joint({
    frame$,
    fixed: false,
    target$: wristTarget$,
    startPos$: xs.of([0, 0]),
  });

  return {
    positions$: xs.combine(shoulder.position$, elbow.position$, wrist.position$),
  };
}

export default Arm;
