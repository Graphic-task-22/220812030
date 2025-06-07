import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import mesh, { animate, getInitialCameraPosition } from './main.js';

const scene = new THREE.Scene();
scene.add(mesh);

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
const initial = getInitialCameraPosition();
camera.position.copy(initial.position);
camera.lookAt(initial.lookAt);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.append(renderer.domElement);

let useOrbitControls = false;
let speed = 1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

function render() {
  if (!useOrbitControls) {
    animate(camera, speed);
  } else {
    controls.update();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    useOrbitControls = !useOrbitControls;
    controls.enabled = useOrbitControls;

    if (useOrbitControls) {
      // 外部观察视角
      camera.position.set(300, 200, 300);
      controls.target.set(0, 0, 150); // 隧道中部
      controls.update();
    } else {
      // 返回隧道内部自动飞行
      const initial = getInitialCameraPosition();
      camera.position.copy(initial.position);
      camera.lookAt(initial.lookAt);
    }
  }

  if (!useOrbitControls) {
    if (e.code === 'ArrowUp') speed = 3;
    if (e.code === 'ArrowDown') speed = 1;
  }
});
