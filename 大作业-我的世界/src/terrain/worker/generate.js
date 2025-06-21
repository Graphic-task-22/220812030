// 本文件为Web Worker脚本，负责根据噪声算法和传入参数生成区块内各类方块的实例矩阵，用于地图渲染

import * as THREE from 'three';
import Noise from '../noise/index';

export var BlockType;
(function (BlockType) {
  BlockType[(BlockType['grass'] = 0)] = 'grass';
  BlockType[(BlockType['sand'] = 1)] = 'sand';
  BlockType[(BlockType['tree'] = 2)] = 'tree';
  BlockType[(BlockType['leaf'] = 3)] = 'leaf';
  BlockType[(BlockType['dirt'] = 4)] = 'dirt';
  BlockType[(BlockType['stone'] = 5)] = 'stone';
  BlockType[(BlockType['coal'] = 6)] = 'coal';
  BlockType[(BlockType['wood'] = 7)] = 'wood';
  BlockType[(BlockType['diamond'] = 8)] = 'diamond';
  BlockType[(BlockType['quartz'] = 9)] = 'quartz';
  BlockType[(BlockType['glass'] = 10)] = 'glass';
  BlockType[(BlockType['bedrock'] = 11)] = 'bedrock';
})(BlockType || (BlockType = {}));

const matrix = new THREE.Matrix4(); // 复用矩阵对象，用于设置方块实例位置
const noise = new Noise(); // 噪声生成器实例
const blocks = []; // 存放不同类型方块的InstancedMesh
const geometry = new THREE.BoxGeometry(); // 方块的几何体
let isFirstRun = true; // 标记是否首次运行，首次时初始化方块InstancedMesh

onmessage = (msg) => {
  const {
    distance,      // 视距区块数，控制生成范围
    chunk,         // 当前区块坐标
    noiseSeed,     // 噪声随机种子
    idMap,         // 方块坐标到实例索引的映射
    blocksFactor,  // 各类方块实例数比例因子
    treeSeed,      // 树木噪声种子
    stoneSeed,     // 石头噪声种子
    coalSeed,      // 煤矿噪声种子
    customBlocks,  // 自定义方块数组
    blocksCount,   // 各类方块当前实例数量
    chunkSize,     // 区块尺寸
  } = msg.data;

  // 计算最大实例数，根据视距和区块大小
  const maxCount = Math.pow(distance * chunkSize * 2 + chunkSize, 2) + 500;

  // 首次运行时初始化各类方块InstancedMesh，并根据比例因子分配容量
  if (isFirstRun) {
    for (let i = 0; i < blocksCount.length; i++) {
      const block = new THREE.InstancedMesh(
        geometry,
        new THREE.MeshBasicMaterial(),
        maxCount * blocksFactor[i]
      );
      blocks.push(block);
    }
    isFirstRun = false;
  }

  // 更新噪声种子
  noise.seed = noiseSeed;
  noise.treeSeed = treeSeed;
  noise.stoneSeed = stoneSeed;
  noise.coalSeed = coalSeed;

  // 重新分配实例矩阵缓冲区，清空旧数据
  for (let i = 0; i < blocks.length; i++) {
    blocks[i].instanceMatrix = new THREE.InstancedBufferAttribute(
      new Float32Array(maxCount * blocksFactor[i] * 16),
      16
    );
  }

  // 遍历当前视距区块范围内的x和z坐标
  for (
    let x = -chunkSize * distance + chunkSize * chunk.x;
    x < chunkSize * distance + chunkSize + chunkSize * chunk.x;
    x++
  ) {
    for (
      let z = -chunkSize * distance + chunkSize * chunk.y;
      z < chunkSize * distance + chunkSize + chunkSize * chunk.y;
      z++
    ) {
      const y = 30; // 基础高度
      // 计算地形高度偏移
      const yOffset = Math.floor(noise.get(x / noise.gap, z / noise.gap, noise.seed) * noise.amp);
      matrix.setPosition(x, y + yOffset, z);

      // 计算石头和煤矿噪声偏移
      const stoneOffset = noise.get(x / noise.stoneGap, z / noise.stoneGap, noise.stoneSeed) * noise.stoneAmp;
      const coalOffset = noise.get(x / noise.coalGap, z / noise.coalGap, noise.coalSeed) * noise.coalAmp;

      // 根据噪声阈值决定放置石头或煤矿
      if (stoneOffset > noise.stoneThreshold) {
        if (coalOffset > noise.coalThreshold) {
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.coal]);
          blocks[BlockType.coal].setMatrixAt(blocksCount[BlockType.coal]++, matrix);
        } else {
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.stone]);
          blocks[BlockType.stone].setMatrixAt(blocksCount[BlockType.stone]++, matrix);
        }
      } else {
        // 根据高度放置沙地或草地
        if (yOffset < -3) {
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.sand]);
          blocks[BlockType.sand].setMatrixAt(blocksCount[BlockType.sand]++, matrix);
        } else {
          idMap.set(`${x}_${y + yOffset}_${z}`, blocksCount[BlockType.grass]);
          blocks[BlockType.grass].setMatrixAt(blocksCount[BlockType.grass]++, matrix);
        }
      }

      // 计算树木噪声，满足条件则生成树干和树叶
      const treeOffset = noise.get(x / noise.treeGap, z / noise.treeGap, noise.treeSeed) * noise.treeAmp;
      if (treeOffset > noise.treeThreshold && yOffset >= -3 && stoneOffset < noise.stoneThreshold) {
        // 生成树干（竖直方向）
        for (let i = 1; i <= noise.treeHeight; i++) {
          idMap.set(`${x}_${y + yOffset + i}_${z}`, blocksCount[BlockType.tree]);
          matrix.setPosition(x, y + yOffset + i, z);
          blocks[BlockType.tree].setMatrixAt(blocksCount[BlockType.tree]++, matrix);
        }

        // 生成树叶（立方体周围）
        for (let i = -3; i < 3; i++) {
          for (let j = -3; j < 3; j++) {
            for (let k = -3; k < 3; k++) {
              if (i === 0 && k === 0) continue; // 跳过树干位置
              const leafOffset =
                noise.get((x + i + j) / noise.leafGap, (z + k) / noise.leafGap, noise.leafSeed) * noise.leafAmp;
              if (leafOffset > noise.leafThreshold) {
                idMap.set(`${x + i}_${y + yOffset + noise.treeHeight + j}_${z + k}`, blocksCount[BlockType.leaf]);
                matrix.setPosition(x + i, y + yOffset + noise.treeHeight + j, z + k);
                blocks[BlockType.leaf].setMatrixAt(blocksCount[BlockType.leaf]++, matrix);
              }
            }
          }
        }
      }
    }
  }

  // 处理自定义方块，放置或移除
  for (const block of customBlocks) {
    if (
      block.x > -chunkSize * distance + chunkSize * chunk.x &&
      block.x < chunkSize * distance + chunkSize + chunkSize * chunk.x &&
      block.z > -chunkSize * distance + chunkSize * chunk.y &&
      block.z < chunkSize * distance + chunkSize + chunkSize * chunk.y
    ) {
      if (block.placed) {
        matrix.setPosition(block.x, block.y, block.z);
        blocks[block.type].setMatrixAt(blocksCount[block.type]++, matrix);
      } else {
        // 未放置的方块将其矩阵置空，实现移除效果
        const id = idMap.get(`${block.x}_${block.y}_${block.z}`);
        blocks[block.type].setMatrixAt(
          id,
          new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        );
      }
    }
  }

  // 获取所有方块实例矩阵数据数组，传回主线程用于渲染
  const arrays = blocks.map((block) => block.instanceMatrix.array);

  postMessage({ idMap, arrays, blocksCount });
};
