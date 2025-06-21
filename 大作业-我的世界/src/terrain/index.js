// 本文件定义Terrain类，负责管理地形区块的生成、更新与渲染，包括方块实例管理、云层生成、方块交互等逻辑

import * as THREE from "three";
import Materials, { MaterialType } from "./mesh/materials.js";
import Block from "./mesh/block.js";
import Highlight from "./highlight/index.js";
import Noise from "./noise/index.js";
import GenerateWorker from "./worker/generate?worker";

export const BlockType = {
  grass: 0,
  sand: 1,
  tree: 2,
  leaf: 3,
  dirt: 4,
  stone: 5,
  coal: 6,
  wood: 7,
  diamond: 8,
  quartz: 9,
  glass: 10,
  bedrock: 11,
};

class Terrain {
  constructor(scene, camera) {
    // 视距区块数，控制渲染范围
    this.distance = 3;
    // 区块大小（边长）
    this.chunkSize = 24;
    // 当前区块坐标（x,z）
    this.chunk = new THREE.Vector2(0, 0);
    // 记录上一帧区块坐标，用于判断是否需要重新生成区块
    this.previousChunk = new THREE.Vector2(0, 0);
    // 噪声生成实例，用于地形高度及特征生成
    this.noise = new Noise();
    // 材质管理实例
    this.materials = new Materials();
    // 材质类型数组，顺序对应BlockType索引
    this.materialType = [
      MaterialType.grass,
      MaterialType.sand,
      MaterialType.tree,
      MaterialType.leaf,
      MaterialType.dirt,
      MaterialType.stone,
      MaterialType.coal,
      MaterialType.wood,
      MaterialType.diamond,
      MaterialType.quartz,
      MaterialType.glass,
      MaterialType.bedrock,
    ];
    // 存储不同类型方块的InstancedMesh数组
    this.blocks = [];
    // 记录每种方块实例的当前数量
    this.blocksCount = [];
    // 各类方块实例数比例因子，影响实例最大数
    this.blocksFactor = [1, 0.2, 0.1, 0.7, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
    // 自定义放置的方块列表（玩家建造等）
    this.customBlocks = [];
    // 方块坐标字符串到实例索引映射
    this.idMap = new Map();
    // Web Worker，用于异步生成区块方块数据
    this.generateWorker = new GenerateWorker();
    // 云层使用的InstancedMesh，渲染大量云块
    this.cloud = new THREE.InstancedMesh(
      new THREE.BoxGeometry(20, 5, 14),
      new THREE.MeshStandardMaterial({
        transparent: true,
        color: 0xffffff,
        opacity: 0.4,
      }),
      1000
    );
    this.cloudCount = 0;
    this.cloudGap = 5; // 控制云层更新间隔

    // 获取指定类型的当前实例计数
    this.getCount = (type) => this.blocksCount[type];

    // 将指定类型的实例计数加1
    this.setCount = (type) => {
      this.blocksCount[type] = this.blocksCount[type] + 1;
    };

    // 初始化所有类型方块的InstancedMesh实例
    this.initBlocks = () => {
      // 先从场景移除已有方块实例
      for (const block of this.blocks) {
        this.scene.remove(block);
      }
      this.blocks = [];
      const geometry = new THREE.BoxGeometry();
      // 按材质类型初始化InstancedMesh，并加入场景
      for (let i = 0; i < this.materialType.length; i++) {
        let block = new THREE.InstancedMesh(
          geometry,
          this.materials.get(this.materialType[i]),
          this.maxCount * this.blocksFactor[i]
        );
        block.name = Object.keys(BlockType)[i];
        this.blocks.push(block);
        this.scene.add(block);
      }
      // 重置所有方块计数
      this.blocksCount = new Array(this.materialType.length).fill(0);
    };

    // 重置所有InstancedMesh的实例矩阵缓冲区，清空数据
    this.resetBlocks = () => {
      for (let i = 0; i < this.blocks.length; i++) {
        this.blocks[i].instanceMatrix = new THREE.InstancedBufferAttribute(
          new Float32Array(this.maxCount * this.blocksFactor[i] * 16),
          16
        );
      }
    };

    // 触发异步区块生成（调用Worker）
    this.generate = () => {
      // 重置实例计数
      this.blocksCount = new Array(this.blocks.length).fill(0);
      // 向Worker发送当前状态，生成地形方块数据
      this.generateWorker.postMessage({
        distance: this.distance,
        chunk: this.chunk,
        noiseSeed: this.noise.seed,
        treeSeed: this.noise.treeSeed,
        stoneSeed: this.noise.stoneSeed,
        coalSeed: this.noise.coalSeed,
        idMap: new Map(),
        blocksFactor: this.blocksFactor,
        blocksCount: this.blocksCount,
        customBlocks: this.customBlocks,
        chunkSize: this.chunkSize,
      });

      // 云层更新间隔控制，降低性能压力
      if (this.cloudGap++ > 5) {
        this.cloudGap = 0;
        this.cloud.instanceMatrix = new THREE.InstancedBufferAttribute(
          new Float32Array(1000 * 16),
          16
        );
        this.cloudCount = 0;

        // 遍历云层区域坐标，随机放置云块实例
        for (
          let x = -this.chunkSize * this.distance * 3 + this.chunkSize * this.chunk.x;
          x <
          this.chunkSize * this.distance * 3 +
            this.chunkSize +
            this.chunkSize * this.chunk.x;
          x += 20
        ) {
          for (
            let z = -this.chunkSize * this.distance * 3 + this.chunkSize * this.chunk.y;
            z <
            this.chunkSize * this.distance * 3 +
              this.chunkSize +
              this.chunkSize * this.chunk.y;
            z += 20
          ) {
            const matrix = new THREE.Matrix4();
            // 云块高度随机波动
            matrix.setPosition(x, 80 + (Math.random() - 0.5) * 30, z);
            // 20%概率生成云块
            if (Math.random() > 0.8) {
              this.cloud.setMatrixAt(this.cloudCount++, matrix);
            }
          }
        }
        this.cloud.instanceMatrix.needsUpdate = true;
      }
    };

    // 根据指定方块位置，生成其相邻的方块
    this.generateAdjacentBlocks = (position) => {
      const { x, y, z } = position;
      const noise = this.noise;
      // 计算地形高度偏移
      const yOffset = Math.floor(noise.get(x / noise.gap, z / noise.gap, noise.seed) * noise.amp);
      if (y > 30 + yOffset) return;

      const stoneOffset = noise.get(x / noise.stoneGap, z / noise.stoneGap, noise.stoneSeed) * noise.stoneAmp;
      let type;
      // 根据高度及石头偏移确定方块类型
      if (stoneOffset > noise.stoneThreshold || y < 23) {
        type = BlockType.stone;
      } else {
        if (yOffset < -3) {
          type = BlockType.sand;
        } else {
          type = BlockType.dirt;
        }
      }

      // 在六个方向放置方块
      this.buildBlock(new THREE.Vector3(x, y - 1, z), type);
      this.buildBlock(new THREE.Vector3(x, y + 1, z), type);
      this.buildBlock(new THREE.Vector3(x - 1, y, z), type);
      this.buildBlock(new THREE.Vector3(x + 1, y, z), type);
      this.buildBlock(new THREE.Vector3(x, y, z - 1), type);
      this.buildBlock(new THREE.Vector3(x, y, z + 1), type);
      this.blocks[type].instanceMatrix.needsUpdate = true;
    };

    // 在指定位置构建方块，类型由参数确定
    this.buildBlock = (position, type) => {
      const noise = this.noise;
      // 计算地形高度偏移
      const yOffset = Math.floor(
        noise.get(position.x / noise.gap, position.z / noise.gap, noise.seed) * noise.amp
      );
      // 超出地形高度或低于0不构建
      if (position.y >= 30 + yOffset || position.y < 0) return;

      // 地面最低层为基岩
      if (position.y === 0) type = BlockType.bedrock;

      // 避免重复构建自定义方块
      for (const block of this.customBlocks) {
        if (block.x === position.x && block.y === position.y && block.z === position.z) return;
      }

      // 添加自定义方块
      this.customBlocks.push(new Block(position.x, position.y, position.z, type, true));

      // 计算矩阵并设置实例位置
      const matrix = new THREE.Matrix4();
      matrix.setPosition(position);
      this.blocks[type].setMatrixAt(this.getCount(type), matrix);
      this.blocks[type].instanceMatrix.needsUpdate = true;
      this.setCount(type);
    };

    // 每帧更新方法，检测玩家区块变化，更新区块数据并更新高亮
    this.update = () => {
      // 计算当前所在区块坐标
      this.chunk.set(
        Math.floor(this.camera.position.x / this.chunkSize),
        Math.floor(this.camera.position.z / this.chunkSize)
      );

      // 区块坐标变化时重新生成区块数据
      if (this.chunk.x !== this.previousChunk.x || this.chunk.y !== this.previousChunk.y) {
        this.generate();
      }

      this.previousChunk.copy(this.chunk);
      this.highlight.update();
    };

    this.scene = scene;
    this.camera = camera;
    // 最大实例数，基于视距和区块尺寸计算
    this.maxCount = Math.pow(this.distance * this.chunkSize * 2 + this.chunkSize, 2) + 500;
    // 高亮显示实例
    this.highlight = new Highlight(scene, camera, this);
    this.scene.add(this.cloud);

    // 监听Worker消息，接收生成的方块数据并更新InstancedMesh矩阵
    this.generateWorker.onmessage = (msg) => {
      this.resetBlocks();
      this.idMap = msg.data.idMap;
      this.blocksCount = msg.data.blocksCount;
      for (let i = 0; i < msg.data.arrays.length; i++) {
        this.blocks[i].instanceMatrix = new THREE.InstancedBufferAttribute(msg.data.arrays[i], 16);
      }
      for (const block of this.blocks) {
        block.instanceMatrix.needsUpdate = true;
      }
    };
  }
}

export default Terrain;
