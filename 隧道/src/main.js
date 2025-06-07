// src/mesh.js
import * as THREE from 'three';

const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-150, 0, 0),
  new THREE.Vector3(-100, 50, 50),
  new THREE.Vector3(-50, -50, 100),
  new THREE.Vector3(0, 50, 150),
  new THREE.Vector3(50, -50, 200),
  new THREE.Vector3(100, 50, 250),
  new THREE.Vector3(150, 0, 300)
]);

const loader = new THREE.TextureLoader();
const texture = loader.load('./src/textures/1.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;

const pathLength = path.getLength();
texture.repeat.set(pathLength / 10, 1);
texture.colorSpace = THREE.SRGBColorSpace;

const geometry = new THREE.TubeGeometry(path, 200, 3, 32, false);

const material = new THREE.MeshBasicMaterial({
  side: THREE.BackSide,
  map: texture,
});

const mesh = new THREE.Mesh(geometry, material);

const tubePoints = path.getSpacedPoints(1000);
let i = 0;

function animate(camera, speed = 1) {
  if (i < tubePoints.length - speed - 1) {
    camera.position.copy(tubePoints[i]);
    camera.lookAt(tubePoints[i + speed]);
    i += speed;
  } else {
    i = 0;
  }
}

function getInitialCameraPosition() {
  return {
    position: tubePoints[0],
    lookAt: tubePoints[1],
  };
}

export default mesh;
export { animate, getInitialCameraPosition };
