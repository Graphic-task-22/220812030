import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import sphere from './mesh/sphere'; // 贴图球体模块

let renderer, camera, scene, ambientLight;
let stats;

function init() {
  // 创建场景
  scene = new THREE.Scene();

  // 添加球体
  scene.add(sphere);

  // 添加环境光
  ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 1); // 背景色白色
  document.body.appendChild(renderer.domElement);
}

window.onresize = function () {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};

function initHelper() {
  // 坐标轴辅助器
  const axesHelper = new THREE.AxesHelper(50);
  scene.add(axesHelper);

  // 网格地面
  const gridHelper = new THREE.GridHelper(300, 300, 0x004444, 0x004444);
  scene.add(gridHelper);

  // 轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', () => {
    renderer.render(scene, camera);
  });
}

function animate() {
  requestAnimationFrame(animate);

  // 球体旋转
  sphere.rotation.y += 0.01;

  renderer.render(scene, camera);
  stats.update();
}

function initStats() {
  stats = new Stats();
  document.body.appendChild(stats.domElement);
}

function initGUI() {
  const gui = new GUI();

  const settings = {
    posX: sphere.position.x,
    posY: sphere.position.y,
    posZ: sphere.position.z,
  };

  gui.add(settings, 'posX', -100, 100).onChange((val) => {
    sphere.position.x = val;
  });
  gui.add(settings, 'posY', -100, 100).onChange((val) => {
    sphere.position.y = val;
  });
  gui.add(settings, 'posZ', -100, 100).onChange((val) => {
    sphere.position.z = val;
  });
}

// 初始化执行
init();
initHelper();
initStats();
initGUI();
animate();
