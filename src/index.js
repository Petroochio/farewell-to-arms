import xs from 'xstream';
import { run } from '@cycle/run';
import { take, prop, propEq, map } from 'ramda';
import { timeDriver } from '@cycle/time';
// Local
import { makeColorTrackingDriver } from './colorTrackingDriver';
import Arm from './Arm';

const canvas = document.getElementById('track');
const ctx = canvas.getContext('2d');

// Figure out how to bisect plane
const drivers = {
  color: makeColorTrackingDriver(['yellow', 'cyan', 'magenta'], '#video'),
  Time: timeDriver,
};

function main(sources) {
  const color$ = sources.color.track().map(prop('data'));

  const frame$ = sources.Time.animationFrames();
  const arm1 = Arm({ color$, frame$ });

  return {};
}

run(main, drivers);
