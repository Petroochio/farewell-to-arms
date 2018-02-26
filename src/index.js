import * as THREE from 'three';

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
const directional = new THREE.DirectionalLight(0xffffff, 0.5);
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

// Create Leg Base
const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 20), material);
// Add parts to leg
const thigh = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 15, 20), material);
hipJoint.add(thigh);
thigh.position.y = -7

scene.add(hipJoint);
scene.add(directional);

// This renders stuff... Duh
function render() {
  renderer.render(scene, camera);
}

// Serial port test
SerialPort.list((err, ports) => {
  console.log('ports', ports);
});

// Set up connection to arduino
const port = new SerialPort('/dev/tty.usbmodem1411', {
  baudRate: 9600
});

port.open((err) => {
  if (err) {
    return console.log(err);
  }
});

// Data stream
port.on('data', d => {
  console.log(d);
  // Get some angle out of data and map it
  const angleX = 0;
  const angleY = 0;

  hipJoint.rotateX(angleX);
  hipJoint.rotateY(angleY);

  render();
});
