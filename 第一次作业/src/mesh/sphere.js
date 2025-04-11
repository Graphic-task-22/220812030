import * as THREE from 'three';

var sphereGeometry = new THREE.SphereGeometry(30, 30, 30);

const texLoader = new THREE.TextureLoader();
const texture = texLoader.load('./src/textures/earth.jpg');

var sphereMaterial = new THREE.MeshPhongMaterial({
  // color: 0xff0000,
  // opacity: 0.8,
  // transparent: true,
  map: texture,
});
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

sphere.position.set(-50, 50, 50);
export default sphere; // Path: src/mesh/cube.js
