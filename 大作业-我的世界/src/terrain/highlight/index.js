// 本文件用于实现方块高亮显示功能，根据玩家视角检测选中的方块并显示半透明框

import * as THREE from 'three';

export default class BlockHighlight {
  constructor(scene, camera, terrain) {
    this.block = null; // 当前选中的方块信息
    this.geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01); // 高亮框几何体，稍微比方块大一点
    this.material = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.25, // 半透明效果
    });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(), this.material); // 当前显示的高亮网格体
    this.index = 0; // 用于实例化方块计数
    this.instanceMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial(),
      1000 // 最大实例数
    );
    this.camera = camera; // 摄像机，用于射线检测
    this.scene = scene; // 场景，用于添加高亮网格
    this.terrain = terrain; // 地形数据，包含噪声和自定义方块信息
    this.raycaster = new THREE.Raycaster(); // 射线投射器
    this.raycaster.far = 8; // 射线最大距离
  }

  update() {
    // 每帧更新方块高亮状态

    this.scene.remove(this.mesh); // 移除旧的高亮框
    this.index = 0;
    // 重置实例矩阵数据
    this.instanceMesh.instanceMatrix = new THREE.InstancedBufferAttribute(
      new Float32Array(1000 * 16),
      16
    );

    const position = this.camera.position; // 摄像机位置
    const matrix = new THREE.Matrix4();
    const idMap = new Map(); // 记录每个方块对应的实例索引，便于更新
    const noise = this.terrain.noise; // 噪声函数，用于计算地形高度等

    let xPos = Math.round(position.x);
    let zPos = Math.round(position.z);

    // 以摄像机为中心，范围 -8 到 +8 遍历X、Z轴的方块位置
    for (let i = -8; i < 8; i++) {
      for (let j = -8; j < 8; j++) {
        let x = xPos + i;
        let z = zPos + j;
        // 计算地形高度y值
        let y = Math.floor(
          noise.get(x / noise.gap, z / noise.gap, noise.seed) * noise.amp
        ) + 30;

        // 记录方块对应索引
        idMap.set(`${x}_${y}_${z}`, this.index);
        matrix.setPosition(x, y, z);
        this.instanceMesh.setMatrixAt(this.index++, matrix);

        // 计算石头和树的偏移，决定是否生成树干
        let stoneOffset =
          noise.get(x / noise.stoneGap, z / noise.stoneGap, noise.stoneSeed) *
          noise.stoneAmp;
        let treeOffset =
          noise.get(x / noise.treeGap, z / noise.treeGap, noise.treeSeed) *
          noise.treeAmp;

        // 若满足树的阈值条件，叠加树干高度的方块
        if (
          treeOffset > noise.treeThreshold &&
          y - 30 >= -3 &&
          stoneOffset < noise.stoneThreshold
        ) {
          for (let t = 1; t <= noise.treeHeight; t++) {
            idMap.set(`${x}_${y + t}_${z}`, this.index);
            matrix.setPosition(x, y + t, z);
            this.instanceMesh.setMatrixAt(this.index++, matrix);
          }
        }
      }
    }

    // 处理自定义方块（玩家放置或移除的方块）
    for (const block of this.terrain.customBlocks) {
      if (block.placed) {
        matrix.setPosition(block.x, block.y, block.z);
        this.instanceMesh.setMatrixAt(this.index++, matrix);
      } else {
        // 移除方块时，设置对应实例矩阵为零矩阵隐藏该实例
        if (idMap.has(`${block.x}_${block.y}_${block.z}`)) {
          let id = idMap.get(`${block.x}_${block.y}_${block.z}`);
          this.instanceMesh.setMatrixAt(
            id,
            new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
          );
        }
      }
    }

    // 通过射线从摄像机视角中心发射，检测实例化网格体的交点
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    this.block = this.raycaster.intersectObject(this.instanceMesh)[0];

    // 如果检测到方块，获取对应位置并在场景中显示半透明高亮框
    if (
      this.block &&
      this.block.object instanceof THREE.InstancedMesh &&
      typeof this.block.instanceId === 'number'
    ) {
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      let matrix = new THREE.Matrix4();
      this.block.object.getMatrixAt(this.block.instanceId, matrix);
      const position = new THREE.Vector3().setFromMatrixPosition(matrix);
      this.mesh.position.set(position.x, position.y, position.z);
      this.scene.add(this.mesh);
    }
  }
}
