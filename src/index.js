import xs from 'xstream';
import { run } from '@cycle/run';
import { take, prop, propEq, map } from 'ramda';
import { timeDriver } from '@cycle/time';
// Local
import { registerColor, makeColorTrackingDriver } from './colorTrackingDriver';
import Game from './GameWorld';
import Arm from './Arm';

// Pass these to a canvas driver
const canvas = document.getElementById('track');
const ctx = canvas.getContext('2d');

registerColor(40, 70, 120, 20, 'shoulder-1'); // cyan
registerColor(155, 0, 155, 20, 'elbow-1'); // magenta
registerColor(80, 100, 60, 20, 'wrist-1'); // grn

registerColor(145, 55, 5, 30, 'shoulder-2'); // orange
registerColor(135, 135, 45, 30, 'elbow-2'); // yellow
registerColor(120, 10, 20, 30, 'wrist-2'); // red

// Figure out how to bisect plane
const drivers = {
  color: makeColorTrackingDriver(['shoulder-1', 'elbow-1', 'wrist-1', 'shoulder-2', 'elbow-2', 'wrist-2'], '#video'),
  Time: timeDriver,
};

function main(sources) {
  const color$ = sources.color.track().map(prop('data'));
  const frame$ = sources.Time.animationFrames();
  // const arm1 = Arm({ color$, frame$ });
  const game = Game({ frame$, color$ });

  return {};
}

run(main, drivers);
