// 本文件定义了基于Three.js ImprovedNoise的噪声生成类，用于地形、矿石、树木等自然元素的高度和分布计算

import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

class Noise {
  constructor() {
    // 使用Three.js的ImprovedNoise生成噪声
    this.noise = new ImprovedNoise();

    // 随机种子，保证不同实例噪声不同
    this.seed = Math.random();

    // 地形主参数：格子间隔和振幅
    this.gap = 22;
    this.amp = 8;

    // 石头相关噪声参数：种子，格子间隔，振幅和阈值（用于决定石头出现与否）
    this.stoneSeed = this.seed * 0.4;
    this.stoneGap = 12;
    this.stoneAmp = 8;
    this.stoneThreshold = 3.5;

    // 煤矿相关噪声参数
    this.coalSeed = this.seed * 0.5;
    this.coalGap = 3;
    this.coalAmp = 8;
    this.coalThreshold = 3;

    // 树木相关噪声参数，包括高度和阈值
    this.treeSeed = this.seed * 0.7;
    this.treeGap = 2;
    this.treeAmp = 6;
    this.treeHeight = 10;
    this.treeThreshold = 4;

    // 树叶相关噪声参数
    this.leafSeed = this.seed * 0.8;
    this.leafGap = 2;
    this.leafAmp = 5;
    this.leafThreshold = -0.03;

    /**
     * 计算噪声值
     * @param {number} x x坐标
     * @param {number} y y坐标
     * @param {number} z z坐标
     * @returns {number} 噪声值，范围大致[-1,1]
     */
    this.get = (x, y, z) => {
      return this.noise.noise(x, y, z);
    };
  }
}

export default Noise;
