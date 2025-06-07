import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import mesh, { updatePosition, params, setMouse } from './main.js';
import GUI from 'dat.gui';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcce0ff, 300, 1000);
scene.background = new THREE.Color(0xaaccff);

// 山体地形
scene.add(mesh);

// 灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(100, 300, 200);
dirLight.castShadow = true;
scene.add(dirLight);

// 相机 & 控制
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set(300, 250, 300);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// 鼠标交互
renderer.domElement.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth) * 300 - 150;
  const y = (event.clientY / window.innerHeight) * 300 - 150;
  setMouse(x, y);
});

// GUI 面板
const gui = new GUI.GUI();
gui.add(params, 'baseHeight', 0, 150).name('基础起伏');
gui.add(params, 'detailHeight', 0, 100).name('细节起伏');
gui.add(params, 'waveStrength', 0, 20).name('波动强度');
gui.add(params, 'mouseInfluence', 0, 100).name('鼠标影响');
gui.addColor(params, 'color').name('地形颜色');

// ❄️ 雪花粒子系统
const snowCount = 1000;
const snowGeometry = new THREE.BufferGeometry();
const snowPositions = new Float32Array(snowCount * 3);

for (let i = 0; i < snowCount; i++) {
  snowPositions[i * 3] = Math.random() * 600 - 300;
  snowPositions[i * 3 + 1] = Math.random() * 400 + 100;
  snowPositions[i * 3 + 2] = Math.random() * 600 - 300;
}
snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

const snowMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 2,
  transparent: true,
  opacity: 0.8,
});

const snowPoints = new THREE.Points(snowGeometry, snowMaterial);
scene.add(snowPoints);

// 渲染循环
function render() {
  updatePosition();

  // 雪花下落动画
  const pos = snowGeometry.attributes.position;
  for (let i = 0; i < snowCount; i++) {
    let y = pos.getY(i);
    y -= 0.8 + Math.random() * 0.2; // 下落速度
    if (y < 0) y = 400; // 重置
    pos.setY(i, y);
  }
  pos.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();

// 响应窗口大小
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
