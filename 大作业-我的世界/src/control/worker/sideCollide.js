// 使用 Three.js Raycaster 检测水平方向是否命中实例化方块（InstancedMesh）

import * as THREE from 'three';

// 接收主线程发来的数据
self.onmessage = (msg) => {
  const { position, matrices, count } = msg.data;

  // 构建射线起点：玩家当前位置往下 1 个单位（通常是角色脚下）
  const rayOrigin = new THREE.Vector3(position.x, position.y - 1, position.z);

  // 射线方向：水平向 +X（右侧）方向
  const rayDirection = new THREE.Vector3(1, 0, 0);

  // 创建射线投射器，最大距离为 0.6（适合检测近距离交互，如贴近的方块）
  const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 0.6);

  // 从传入的变换矩阵数组中构建多个 InstancedMesh 对象（一个 mesh 对应一批实例）
  const meshes = matrices.map((matrix) => {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),     // 方块几何体
      new THREE.MeshBasicMaterial(),     // 简单材质（无需渲染，仅用于检测）
      count                              // 每个 InstancedMesh 中实例数量
    );
    mesh.instanceMatrix = matrix;        // 使用传入的实例矩阵（包含所有变换）
    return mesh;
  });

  // 对所有 mesh 进行射线检测，返回命中的交点数组
  const intersects = raycaster.intersectObjects(meshes);

  // 将是否检测到命中的布尔值发回主线程
  self.postMessage(intersects.length > 0);
};
