import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import { run } from '@cycle/run';
import { compose, filter, isEmpty, map, not, nth, prop, propEq, tail, take } from 'ramda';
import { timeDriver } from '@cycle/time';
// Local
import { registerColor, makeColorTrackingDriver } from './colorTrackingDriver';
import { makeSocketDriver } from './socketDriver';
import Game from './GameWorld';

// Pass these to a canvas driver
const canvas = document.getElementById('track');
const ctx = canvas.getContext('2d');

// registerColor(0, 0, 0, 40, 'shoulder-1'); // cyan // 'shoulder-1'
registerColor(170, 0, 140, 50, 'elbow-1'); // magenta
registerColor(130, 170, 80, 30, 'wrist-1'); // grn

registerColor(180, 90, 30, 40, 'shoulder-2'); // orange
registerColor(200, 200, 80, 30, 'elbow-2'); // yellow
registerColor(120, 0, 30, 45, 'wrist-2'); //  // 'shoulder-1', 'shoulder-2', 'elbow-2', 'wrist-2'

// Figure out how to bisect plane
const drivers = {
  color: makeColorTrackingDriver(['cyan', 'elbow-1', 'wrist-1', 'shoulder-2', 'elbow-2', 'wrist-2'], '#video'),
  socket: makeSocketDriver(),
  Time: timeDriver,
};

const centerRect = rect => [rect.x + (rect.width / 2), rect.y + (rect.height / 2)];

function intent(sources) {
  const color$ = sources.color.track().map(prop('data'));
  const frame$ = sources.Time.animationFrames();
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

function main(sources) {
  const actions = intent(sources);
  const elbow1Relative$ = xs.combine(actions.shoulder1$, actions.elbow1$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const elbow1Target$ = actions.frame$
    .compose(sampleCombine(elbow1Relative$))
    .map(nth(1));

  const wrist1Relative$ = xs.combine(actions.elbow1$, actions.wrist1$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const wrist1Target$ = actions.frame$
    .compose(sampleCombine(wrist1Relative$))
    .map(nth(1));

  // 2nd armgbtt
  const elbow2Relative$ = xs.combine(actions.shoulder2$, actions.elbow2$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const elbow2Target$ = actions.frame$
    .compose(sampleCombine(elbow2Relative$))
    .map(nth(1));

  const wrist2Relative$ = xs.combine(actions.elbow2$, actions.wrist2$)
    .map(([[x1, y1], [x2, y2]]) => [x2 - x1, y2 - y1])
    .startWith([10, 10]);

  const wrist2Target$ = actions.frame$
    .compose(sampleCombine(wrist2Relative$))
    .map(nth(1));

  const emit$ = xs.combine(
    xs.of('client-update'),
    xs.combine(elbow1Target$, wrist1Target$, elbow2Target$, wrist2Target$)
  );

  const game = Game({
    frame$: actions.frame$,
    color$: sources.color.track().map(prop('data')),
    arm$: sources.socket.events('server-update'),
    ball$: sources.socket.events('server-ball-update'),
  });

  return {
    socket: xs.merge(game.ballUpdate$, emit$),
  };
}

run(main, drivers);
