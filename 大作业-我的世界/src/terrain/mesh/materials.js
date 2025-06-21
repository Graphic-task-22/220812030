// 本文件定义了各种方块材质的加载与管理，封装成Materials类供外部获取对应方块的材质

import * as THREE from 'three';

// 导入各类方块纹理贴图
import stoneTexture from '../../static/textures/block/stone.png';
import coalOreTexture from '../../static/textures/block/coal_ore.png';
import ironOreTexture from '../../static/textures/block/iron_ore.png';
import grassBlockSideTexture from '../../static/textures/block/grass_block_side.png';
import grassTopGreenTexture from '../../static/textures/block/grass_top_green.png';
import dirtTexture from '../../static/textures/block/dirt.png';
import oakLogTexture from '../../static/textures/block/oak_log.png';
import oakLogTopTexture from '../../static/textures/block/oak_log_top.png';
import oakLeavesTexture from '../../static/textures/block/oak_leaves.png';
import sandTexture from '../../static/textures/block/sand.png';
import oakPlanksTexture from '../../static/textures/block/oak_planks.png';
import diamondBlockTexture from '../../static/textures/block/diamond_block.png';
import quartzBlockSideTexture from '../../static/textures/block/quartz_block_side.png';
import glassTexture from '../../static/textures/block/glass.png';
import bedrockTexture from '../../static/textures/block/bedrock.png';

// 方块类型常量，方便统一管理和引用
export const MaterialType = {
  grass: 'grass',
  dirt: 'dirt',
  tree: 'tree',
  leaf: 'leaf',
  sand: 'sand',
  stone: 'stone',
  coal: 'coal',
  wood: 'wood',
  diamond: 'diamond',
  quartz: 'quartz',
  glass: 'glass',
  bedrock: 'bedrock',
};

const loader = new THREE.TextureLoader();

// 加载各类纹理贴图
const grassTopMaterial = loader.load(grassTopGreenTexture);
const grassMaterial = loader.load(grassBlockSideTexture);
const treeMaterial = loader.load(oakLogTexture);
const treeTopMaterial = loader.load(oakLogTopTexture);
const dirtMaterial = loader.load(dirtTexture);
const stoneMaterial = loader.load(stoneTexture);
const coalMaterial = loader.load(coalOreTexture);
const ironMaterial = loader.load(ironOreTexture);
const leafMaterial = loader.load(oakLeavesTexture);
const sandMaterial = loader.load(sandTexture);
const woodMaterial = loader.load(oakPlanksTexture);
const diamondMaterial = loader.load(diamondBlockTexture);
const quartzMaterial = loader.load(quartzBlockSideTexture);
const glassMaterial = loader.load(glassTexture);
const bedrockMaterial = loader.load(bedrockTexture);

// 设置所有纹理放大过滤器为 NearestFilter，避免像素模糊，保持像素风格清晰
[
  grassTopMaterial,
  grassMaterial,
  treeMaterial,
  treeTopMaterial,
  dirtMaterial,
  stoneMaterial,
  coalMaterial,
  ironMaterial,
  leafMaterial,
  sandMaterial,
  woodMaterial,
  diamondMaterial,
  quartzMaterial,
  glassMaterial,
  bedrockMaterial,
].forEach((mat) => {
  mat.magFilter = THREE.NearestFilter;
});

class Materials {
  constructor() {
    // 创建对应材质对象，部分方块（如草和树）使用数组来区分不同面的材质
    this.materials = {
      grass: [
        new THREE.MeshStandardMaterial({ map: grassMaterial }), // 左面
        new THREE.MeshStandardMaterial({ map: grassMaterial }), // 右面
        new THREE.MeshStandardMaterial({ map: grassTopMaterial }), // 顶面
        new THREE.MeshStandardMaterial({ map: dirtMaterial }), // 底面
        new THREE.MeshStandardMaterial({ map: grassMaterial }), // 前面
        new THREE.MeshStandardMaterial({ map: grassMaterial }), // 后面
      ],
      dirt: new THREE.MeshStandardMaterial({ map: dirtMaterial }),
      sand: new THREE.MeshStandardMaterial({ map: sandMaterial }),
      tree: [
        new THREE.MeshStandardMaterial({ map: treeMaterial }), // 左右面
        new THREE.MeshStandardMaterial({ map: treeMaterial }),
        new THREE.MeshStandardMaterial({ map: treeTopMaterial }), // 顶底面
        new THREE.MeshStandardMaterial({ map: treeTopMaterial }),
        new THREE.MeshStandardMaterial({ map: treeMaterial }),
        new THREE.MeshStandardMaterial({ map: treeMaterial }),
      ],
      leaf: new THREE.MeshStandardMaterial({
        map: leafMaterial,
        color: new THREE.Color(0, 1, 0), // 绿色调
        transparent: true, // 透明材质
      }),
      stone: new THREE.MeshStandardMaterial({ map: stoneMaterial }),
      coal: new THREE.MeshStandardMaterial({ map: coalMaterial }),
      wood: new THREE.MeshStandardMaterial({ map: woodMaterial }),
      diamond: new THREE.MeshStandardMaterial({ map: diamondMaterial }),
      quartz: new THREE.MeshStandardMaterial({ map: quartzMaterial }),
      glass: new THREE.MeshStandardMaterial({
        map: glassMaterial,
        transparent: true, // 透明材质
      }),
      bedrock: new THREE.MeshStandardMaterial({ map: bedrockMaterial }),
    };
  }

  /**
   * 获取指定类型的材质
   * @param {string} type 方块类型
   * @returns {THREE.Material | THREE.Material[]} 对应的材质或材质数组
   */
  get(type) {
    return this.materials[type];
  }
}

export default Materials;
