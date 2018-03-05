import * as THREE from 'three';
import { take, is } from 'ramda';

// Threejs setup
const viewContainer = document.querySelector('#view');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
viewContainer.appendChild(renderer.domElement);

// Now we get into some stuff
const light1 = new THREE.DirectionalLight(0xffffff, 0.6);
light1.position.set(5, 5, 1);
const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
light2.position.set(5, 2, 5);
const light3 = new THREE.AmbientLight(0xffffff, 0.2);

const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
const mat2 = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

// Create Leg Base
const hipObj = new THREE.Object3D();
const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 20), mat2);
// Add parts to leg
const thigh = new THREE.Mesh(new THREE.CylinderGeometry(5, 3, 15, 20), mat2);
hipJoint.add(thigh);
thigh.position.y = -7.5;
// Knee/foot
const knee = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 20), mat2);
thigh.add(knee);
knee.position.y = -8;

const calf = new THREE.Mesh(new THREE.CylinderGeometry(3, 2, 7, 20), mat2);
knee.add(calf);
calf.position.y = -4;
knee.rotation.y = 0.4

const foot = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 7, 20), mat2);
foot.position.y = -4;
foot.position.z = 2;
foot.position.x = -1
foot.rotation.z = Math.PI / 2;
foot.rotation.y = Math.PI / 3;
calf.add(foot);

hipObj.add(hipJoint);

scene.add(hipObj);
scene.add(light1);
scene.add(light2);
scene.add(light3);

// This renders stuff... Duh
function render() {
  renderer.render(scene, camera);
}

render();

// Serial port test
SerialPort.list((err, ports) => {
  console.log('ports', ports);
});

// Set up connection to arduino
const port = new SerialPort('/dev/tty.usbserial-DN03FK64', {
  baudRate: 115200
});
const parser = new SerialPort.parsers.Readline({ delimiter: '\n;' });
console.log(parser);
// port.pipe(parser);

port.open((err) => {
  if (err) {
    return console.log(err);
  }
});

function lerp(range1, range2, value) {
  const [x0, x1] = range1;
  const [y0, y1] = range2;

  const perc = (x1 - value) / (x1 - x0); //= (y1 - value2) / (y1 - y0);
  return y1 - (perc * (y1 - y0));
}

// Data stream
port.on('data', d => {
  const data = d.toString().split(',')

  if (data.length >= 2) {
    const x = parseInt(data[0]);
    const y = parseInt(take(data[1].split('').length - 2, data[1].split('')).join(''));

    if (!isNaN(x) && !isNaN(y)) {
      // Get some angle out of data and map it
      const angleX = lerp([0, 2000], [-Math.PI, Math.PI], x);
      const angleY = lerp([0, 2000], [0, Math.PI], y);

      hipJoint.rotation.x = angleX;
      hipObj.rotation.y = angleY;

      render();
    }
  }
});

// port.on('readable', function () {
//   console.log('Data:', port.read());
// });
