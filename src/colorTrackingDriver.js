import xs from 'xstream';

export function registerColor(r, g, b, distance, alias) {
  tracking.ColorTracker.registerColor(
    alias,
    (r1, g1, b1) => (
      r1 < r + distance && r1 > r - distance &&
      g1 < g + distance && g1 > g - distance &&
      b1 < b + distance && b1 > b - distance
    )
  );

  return 'not yet implemented';
}

// Api might need to change for multiple panes, depends on how I wanna track it
// I could also add a function for splitting the currently tracked camera
export function makeColorTrackingDriver(colors, source) {
  const video = document.querySelector(source);

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

  const handleVideo = (stream) => {
    video.src = window.URL.createObjectURL(stream);
  };

  function videoError(e) {
    // do something
  }

  if (navigator.getUserMedia) {
    navigator.getUserMedia({ video: true }, handleVideo, videoError);
  }

  const tracker = new tracking.ColorTracker(colors);
  tracking.track(source, tracker, { camera: true });

  return () => ({
    track: () => {
      const trackProducer = {
        start: (listener) => {
          tracker.on('track', (e) => {
            listener.next({});
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
