//管理背景音乐与方块音效的加载与播放

import * as THREE from 'three';
import hal3 from './musics/hal3.ogg';
import * as utils from '../utils/index.js';
const isMobile = utils.isMobile;

// 导入各种方块音效资源
import grass1 from './blocks/grass1.ogg';
import grass2 from './blocks/grass2.ogg';
import grass3 from './blocks/grass3.ogg';
import grass4 from './blocks/grass4.ogg';

import sand1 from './blocks/sand1.ogg';
import sand2 from './blocks/sand2.ogg';
import sand3 from './blocks/sand3.ogg';
import sand4 from './blocks/sand4.ogg';

import stone1 from './blocks/stone1.ogg';
import stone2 from './blocks/stone2.ogg';
import stone3 from './blocks/stone3.ogg';
import stone4 from './blocks/stone4.ogg';

import dirt1 from './blocks/dirt1.ogg';
import dirt2 from './blocks/dirt2.ogg';
import dirt3 from './blocks/dirt3.ogg';
import dirt4 from './blocks/dirt4.ogg';

import tree1 from './blocks/tree1.ogg';
import tree2 from './blocks/tree2.ogg';
import tree3 from './blocks/tree3.ogg';
import tree4 from './blocks/tree4.ogg';

import leaf1 from './blocks/leaf1.ogg';
import leaf2 from './blocks/leaf2.ogg';
import leaf3 from './blocks/leaf3.ogg';
import leaf4 from './blocks/leaf4.ogg';

export default class Audio {
  constructor(camera) {
    this.disabled = false; // 是否禁用音效
    this.sourceSet = [
      [grass1, grass2, grass3, grass4],  // 草地音效
      [sand1, sand2, sand3, sand4],      // 沙地音效
      [tree1, tree2, tree3, tree4],      // 树木音效
      [leaf1, leaf2, leaf3, leaf4],      // 树叶音效
      [dirt1, dirt2, dirt3, dirt4],      // 泥土音效
      [stone1, stone2, stone3, stone4],  // 石头音效
      [stone1, stone2, stone3, stone4],  // 重复使用石头音效
      [tree1, tree2, tree3, tree4],      // 再次使用树木音效
      [stone1, stone2, stone3, stone4],  // 石头音效
      [stone1, stone2, stone3, stone4],  // 石头音效
      [stone1, stone2, stone3, stone4],  // 石头音效
    ];
    this.soundSet = []; // 用于存储加载好的 Audio 实例
    this.index = 0;     // 用于在每类音效中循环播放不同的音频

    // 移动端设备不加载音效
    if (isMobile) return;

    // 创建音频监听器，并添加到相机上
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();
    camera.add(listener);

    // 加载背景音乐
    const bgm = new THREE.Audio(listener);
    bgm.autoplay = false;
    audioLoader.load(hal3, buffer => {
      bgm.setBuffer(buffer);    // 设置音频缓冲区
      bgm.setVolume(0.1);       // 设置音量
      bgm.setLoop(true);        // 设置循环播放
      if (bgm.isPlaying) {
        bgm.pause();
        bgm.play();
      }
    });

    // 监听指针锁定事件，在进入锁定时播放背景音乐，退出时暂停
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement && !bgm.isPlaying && !this.disabled) {
        bgm.play();
      } else {
        bgm.pause();
      }
    });

    // 异步加载所有音效资源到 soundSet 中
    for (const types of this.sourceSet) {
      const audios = [];
      for (const type of types) {
        audioLoader.load(type, buffer => {
          const audio = new THREE.Audio(listener);
          audio.setBuffer(buffer);
          audio.setVolume(0.15);
          audios.push(audio); // 将加载好的 Audio 添加到对应数组中
        });
      }
      this.soundSet.push(audios);
    }
  }

  // 播放对应类型的音效
  playSound(type) {
    if (!this.disabled && !isMobile) {
      this.index = (this.index + 1) % 4; // 循环选择不同的音效，避免重复感
      this.soundSet[type]?.[this.index]?.play(); // 安全调用音效播放
    }
  }
}
