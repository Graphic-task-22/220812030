import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();
const geometry = new THREE.PlaneGeometry(300, 300, 200, 200);

const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  flatShading: true,
});

const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.x = -Math.PI / 2;
mesh.castShadow = true;
mesh.receiveShadow = true;

export default mesh;

// 可调参数
export const params = {
  baseHeight: 80,
  detailHeight: 20,
  waveStrength: 5,
  mouseInfluence: 30,
  color: '#ffffff',
};

let mouse = { x: 0, y: 0 };

export function setMouse(mx, my) {
  mouse.x = mx;
  mouse.y = my;
}

export function updatePosition() {
  const pos = geometry.attributes.position;
  const time = Date.now() * 0.0005;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    // 鼠标影响距离计算
    const dx = x - mouse.x;
    const dy = y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const influence = Math.exp(-dist * 0.01) * params.mouseInfluence;

    const base = noise2D(x / 60 + time, y / 60 + time) * params.baseHeight;
    const detail = noise2D(x / 20 + time * 0.5, y / 20 + time * 0.5) * params.detailHeight;
    const wave = Math.sin(time + x * 0.01 + y * 0.01) * params.waveStrength;

    const finalHeight = base + detail + wave + influence;

    pos.setZ(i, finalHeight);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  material.color.set(params.color);
}
