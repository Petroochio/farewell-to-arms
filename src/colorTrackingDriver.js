import xs from 'xstream';

export function registerColor(r, g, b, distance, alias) {
  tracking.ColorTracker.registerColor(
    alias,
    (r1, g1, b1) =>
      (((r1 - r) * (r1 - r)) + ((g1 - g) * (g1 - g)) + ((b1 - b) * (b1 - b))) < (distance * distance)
  );

  return 'not yet implemented';
}

// Api might need to change for multiple panes, depends on how I wanna track it
// I could also add a function for splitting the currently tracked camera
export function makeColorTrackingDriver(colors, source) {
  const video = document.querySelector('#video');
  const canvas = document.querySelector('#tracker');
  const ctx = canvas.getContext('2d');

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

  const handleVideo = (stream) => {
    video.src = window.URL.createObjectURL(stream);
  };

  let showCanvas = false;

  document.querySelector('body').addEventListener('click', () => {
    if (showCanvas) {
      canvas.className = 'hidden';
      showCanvas = false;
    } else {
      canvas.className = '';
      showCanvas = true;
    }
  });

  function videoError(e) {
    // do something
  }

  if (navigator.getUserMedia) {
    navigator.getUserMedia({ video: true }, handleVideo, videoError);
  }

  const tracker = new tracking.ColorTracker(colors);
  const triggerTrack = () => {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, -video.width, video.height);
    ctx.restore();
    tracking.track('#tracker', tracker);
    setTimeout(triggerTrack, 70);
  };
  triggerTrack();

  return () => ({
    track: () => {
      const trackProducer = {
        start: (listener) => {
          tracker.on('track', (e) => {
            listener.next(e);
            ctx.strokeStyle = 'white';
            e.data.forEach(({ x, y, width, height }) => {
              ctx.strokeRect(x, y, width, height);
            });
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
