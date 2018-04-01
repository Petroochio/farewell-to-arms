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

// registerColor(0, 0, 0, 40, 'shoulder-1'); // cyan // 'shoulder-1'
registerColor(140, 0, 140, 50, 'elbow-1'); // magenta
registerColor(130, 170, 80, 50, 'wrist-1'); // grn

registerColor(180, 90, 30, 40, 'shoulder-2'); // orange
registerColor(135, 135, 45, 40, 'elbow-2'); // yellow
registerColor(120, 0, 30, 40, 'wrist-2'); //  // 'shoulder-1', 'shoulder-2', 'elbow-2', 'wrist-2'

// Figure out how to bisect plane
const drivers = {
  color: makeColorTrackingDriver(['cyan', 'elbow-1', 'wrist-1', 'shoulder-2', 'elbow-2', 'wrist-2'], '#video'),
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
