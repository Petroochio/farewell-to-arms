import xs from 'xstream';

export function registerColor(r, g, b, distance, alias) {
  tracking.ColorTracker.registerColor(
    alias,
    (r1, g1, b1) => false
  );

  return 'not yet implemented';
}

// Api might need to change for multiple panes, depends on how I wanna track it
// I could also add a function for splitting the currently tracked camera
export function makeColorTrackingDriver(colors, source) {
  const tracker = new tracking.ColorTracker(colors);
  tracking.track(source, tracker, { camera: true });

  return () => ({
    track: () => {
      const trackProducer = {
        start: (listener) => {
          tracker.on('track', (e) => {
            listener.next(e);
          });
        },
        stop: () => {
          console.log('stop');
        },
      };

      return xs.create(trackProducer);
    },
  });
}

export default makeColorTrackingDriver;
