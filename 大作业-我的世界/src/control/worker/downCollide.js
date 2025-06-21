// 用于在子线程中执行地形噪声高度计算和方块射线检测，提高主线程性能

import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

// 噪声函数，用于生成地形高度
const noise = new ImprovedNoise();

// 射线用于从当前位置垂直向下检测是否有方块存在（y 方向为 -1）
const raycaster = new THREE.Raycaster(
  new THREE.Vector3(),          // 起始点（会动态设置）
  new THREE.Vector3(0, -1, 0),  // 方向：向下
  0,                            // 最近检测距离
  1.8                           // 最远检测距离
);

// 接收主线程发来的消息
self.onmessage = (msg) => {
  const { position, far, noiseGap, seed, noiseAmp, blocks } = msg.data;

  // 设置射线的起始点和检测距离
  raycaster.ray.origin.set(position.x, position.y, position.z);
  raycaster.far = far;

  let index = 0;

  // 创建一个用于实例化渲染方块的网格（最多支持 100 个实例）
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),     // 单个方块为 1x1x1
    new THREE.MeshBasicMaterial(),     // 简单材质
    100                                // 最大实例数
  );
  const matrix = new THREE.Matrix4();  // 用于设置每个实例的位置变换

  // 当前玩家位置四舍五入后的坐标
  const x = Math.round(position.x);
  const z = Math.round(position.z);

  // 基于噪声函数计算对应位置的地形高度 y
  const y = Math.floor(noise.noise(x / noiseGap, z / noiseGap, seed) * noiseAmp) + 30;

  let removed = false;

  // 遍历所有的方块信息
  for (const block of blocks) {
    if (block.x === x && block.z === z) {
      if (block.placed) {
        // 如果是放置过的方块，加入实例网格中
        matrix.setPosition(new THREE.Vector3(block.x, block.y, block.z));
        mesh.setMatrixAt(index++, matrix);
      } else if (block.y === y) {
        // 如果是用户移除的方块，标记不要生成默认地形块
        removed = true;
      }
    }
  }

  // 如果此处没有移除地形块，生成默认的地形块（基于噪声）
  if (!removed) {
    matrix.setPosition(new THREE.Vector3(x, y, z));
    mesh.setMatrixAt(index++, matrix);
  }

  // 标记实例矩阵需要更新（否则射线检测不到）
  mesh.instanceMatrix.needsUpdate = true;

  // 执行射线检测，看是否有方块与射线相交
  const intersects = raycaster.intersectObject(mesh);

  // 将是否检测到交点的结果发回主线程
  self.postMessage(intersects.length > 0);
};
