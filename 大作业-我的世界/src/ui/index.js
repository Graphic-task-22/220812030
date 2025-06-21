// 负责游戏UI界面管理，包括菜单控制、FPS显示、背包、摇杆初始化、设置调整及用户交互逻辑的类

import FPS from './fps';
import Bag from './bag';
import { Mode } from '../player';
import Joystick from './joystick';
import { isMobile } from '../utils';
import * as THREE from 'three';

class UI {
  constructor(terrain, control) {
    // 获取各种页面元素
    this.menu = document.querySelector('.menu');
    this.crossHair = document.createElement('div'); // 中心准星
    this.play = document.querySelector('#play'); // 开始/继续按钮
    this.control = document.querySelector('#control'); // 控制按钮（未使用）
    this.setting = document.querySelector('#setting'); // 设置按钮
    this.feature = document.querySelector('#feature'); // 功能按钮
    this.back = document.querySelector('#back'); // 返回按钮
    this.exit = document.querySelector('#exit'); // 退出按钮
    this.save = document.querySelector('#save'); // 保存按钮
    this.saveModal = document.querySelector('.save-modal'); // 保存弹窗
    this.loadModal = document.querySelector('.load-modal'); // 加载弹窗
    this.settings = document.querySelector('.settings'); // 设置面板
    this.features = document.querySelector('.features'); // 功能面板
    this.github = document.querySelector('.github'); // GitHub链接
    this.distance = document.querySelector('#distance'); // 渲染距离文字显示
    this.distanceInput = document.querySelector('#distance-input'); // 渲染距离输入
    this.fov = document.querySelector('#fov'); // 视野角度文字显示
    this.fovInput = document.querySelector('#fov-input'); // 视野角度输入
    this.music = document.querySelector('#music'); // 音乐开关文字显示
    this.musicInput = document.querySelector('#music-input'); // 音乐开关输入
    this.settingBack = document.querySelector('#setting-back'); // 设置面板返回按钮

    // 实例化FPS显示、背包和摇杆控件
    this.fps = new FPS();
    this.bag = new Bag();
    this.joystick = new Joystick(control);

    // 创建准星DOM，添加到页面
    this.crossHair.className = 'cross-hair';
    this.crossHair.innerHTML = '+';
    document.body.appendChild(this.crossHair);

    // 定义按键与中文说明对应表，方便界面显示中文按键提示
    const keyNameMap = {
      'w': '前进 (W)',
      'a': '左移 (A)',
      's': '后退 (S)',
      'd': '右移 (D)',
      'q': '模式切换 (Q)',
      ' ': '跳跃 (空格)',
      'Shift': '下蹲 (Shift)',
      'e': '释放鼠标 (E)',
      'f': '切换全屏 (F)',
    };

    // 将对应按钮ID的文本替换为中文提示
    function setButtonText(id, text) {
      const btn = document.querySelector(id);
      if (btn) {
        btn.innerText = text;
      }
    }
    setButtonText('#action-front', keyNameMap['w']);
    setButtonText('#action-left', keyNameMap['a']);
    setButtonText('#action-back', keyNameMap['s']);
    setButtonText('#action-right', keyNameMap['d']);
    setButtonText('#action-mode', keyNameMap['q']);
    setButtonText('#action-up', keyNameMap[' ']);
    setButtonText('#action-down', keyNameMap['Shift']);

    // 进入游戏时的界面状态更新
    this.onPlay = () => {
      if (isMobile) this.joystick.init(); // 移动端初始化摇杆
      this.menu?.classList.add('hidden'); // 隐藏菜单
      this.menu?.classList.remove('start'); // 移除开始状态
      if (this.play) this.play.innerHTML = '继续'; // 按钮文字改为继续
      this.crossHair.classList.remove('hidden'); // 显示准星
      this.github?.classList.add('hidden'); // 隐藏GitHub链接
      this.feature?.classList.add('hidden'); // 隐藏功能按钮
    };

    // 暂停时的界面状态更新
    this.onPause = () => {
      this.menu?.classList.remove('hidden'); // 显示菜单
      this.crossHair.classList.add('hidden'); // 隐藏准星
      if (this.save) this.save.innerHTML = '保存并退出'; // 保存按钮文字变更
      this.github?.classList.remove('hidden'); // 显示GitHub链接
    };

    // 退出游戏时的界面状态更新
    this.onExit = () => {
      this.menu?.classList.add('start'); // 显示开始菜单
      if (this.play) this.play.innerHTML = '开始游戏'; // 按钮文字改回开始游戏
      if (this.save) this.save.innerHTML = '加载游戏'; // 保存按钮改成加载游戏
      this.feature?.classList.remove('hidden'); // 显示功能按钮
    };

    // 显示保存成功提示弹窗
    this.onSave = () => {
      this.saveModal?.classList.remove('hidden');
      setTimeout(() => this.saveModal?.classList.add('show'));
      setTimeout(() => this.saveModal?.classList.remove('show'), 1000);
      setTimeout(() => this.saveModal?.classList.add('hidden'), 1350);
    };

    // 显示加载成功提示弹窗
    this.onLoad = () => {
      this.loadModal?.classList.remove('hidden');
      setTimeout(() => this.loadModal?.classList.add('show'));
      setTimeout(() => this.loadModal?.classList.remove('show'), 1000);
      setTimeout(() => this.loadModal?.classList.add('hidden'), 1350);
    };

    // 每帧调用更新FPS显示
    this.update = () => {
      this.fps.update();
    };

    // 点击“开始游戏”按钮事件处理
    this.play?.addEventListener('click', () => {
      if (this.play?.innerHTML === '开始游戏') {
        this.onPlay(); // 切换UI状态
        // 重置噪声种子，生成全新地形
        terrain.noise.seed = Math.random();
        terrain.noise.stoneSeed = Math.random();
        terrain.noise.treeSeed = Math.random();
        terrain.noise.coalSeed = Math.random();
        terrain.noise.leafSeed = Math.random();
        terrain.customBlocks = [];
        terrain.initBlocks();
        terrain.generate();
        terrain.camera.position.y = 40; // 设置摄像机高度
        control.player.setMode(Mode.walking); // 设置玩家行走模式
      }
      if (!isMobile) control.control.lock(); // 非移动端请求锁定指针
    });

    // 点击“保存”或“加载”按钮事件处理
    this.save?.addEventListener('click', () => {
      if (this.save?.innerHTML === '保存并退出') {
        // 保存当前游戏数据到localStorage
        window.localStorage.setItem('block', JSON.stringify(terrain.customBlocks));
        window.localStorage.setItem('seed', JSON.stringify(terrain.noise.seed));
        window.localStorage.setItem('position', JSON.stringify({
          x: terrain.camera.position.x,
          y: terrain.camera.position.y,
          z: terrain.camera.position.z,
        }));
        this.onExit(); // 切换UI为退出状态
        this.onSave(); // 显示保存提示
      } else {
        // 读取存档数据，恢复游戏状态
        terrain.noise.seed = Number(window.localStorage.getItem('seed')) ?? Math.random();
        const customBlocks = JSON.parse(window.localStorage.getItem('block') || 'null') ?? [];
        terrain.customBlocks = customBlocks;
        terrain.initBlocks();
        terrain.generate();
        const position = JSON.parse(window.localStorage.getItem('position') || 'null');
        if (position) {
          terrain.camera.position.x = position.x;
          terrain.camera.position.y = position.y;
          terrain.camera.position.z = position.z;
        }
        this.onPlay();
        this.onLoad();
        if (!isMobile) control.control.lock();
      }
    });

    // 点击“功能”按钮显示功能面板
    this.feature?.addEventListener('click', () => {
      this.features?.classList.remove('hidden');
    });

    // 点击功能面板的“返回”按钮隐藏功能面板
    this.back?.addEventListener('click', () => {
      this.features?.classList.add('hidden');
    });

    // 点击“设置”按钮显示设置面板
    this.setting?.addEventListener('click', () => {
      this.settings?.classList.remove('hidden');
    });

    // 设置面板“返回”按钮隐藏设置面板
    this.settingBack?.addEventListener('click', () => {
      this.settings?.classList.add('hidden');
    });

    // 渲染距离滑动条输入事件，更新文本显示
    this.distanceInput?.addEventListener('input', (e) => {
      if (this.distance && e.target instanceof HTMLInputElement) {
        this.distance.innerHTML = `渲染距离: ${e.target.value}`;
      }
    });

    // 视野角度滑动条输入事件，更新文本和摄像机FOV
    this.fovInput?.addEventListener('input', (e) => {
      if (this.fov && e.target instanceof HTMLInputElement) {
        this.fov.innerHTML = `视野角度: ${e.target.value}`;
        control.camera.fov = parseInt(e.target.value);
        control.camera.updateProjectionMatrix();
      }
    });

    // 音乐开关滑动条事件，控制音乐播放状态和文本
    this.musicInput?.addEventListener('input', (e) => {
      if (this.music && e.target instanceof HTMLInputElement) {
        const disabled = e.target.value === '0';
        control.audio.disabled = disabled;
        this.music.innerHTML = `音乐: ${disabled ? '关闭' : '开启'}`;
      }
    });

    // 点击设置面板“返回”时，应用渲染距离变化，重新生成地形并调整雾效
    this.settingBack?.addEventListener('click', () => {
      if (this.distanceInput instanceof HTMLInputElement) {
        terrain.distance = parseInt(this.distanceInput.value);
        terrain.maxCount = Math.pow((terrain.distance * terrain.chunkSize * 2 + terrain.chunkSize), 2) + 500;
        terrain.initBlocks();
        terrain.generate();
        terrain.scene.fog = new THREE.Fog(0x87ceeb, 1, terrain.distance * 24 + 24);
      }
    });

    // 键盘按下事件，支持释放鼠标指针和切换全屏
    document.body.addEventListener('keydown', (e) => {
      if (e.key === 'e' && document.pointerLockElement) {
        if (!isMobile) control.control.unlock();
      }
      if (e.key === 'f') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.body.requestFullscreen();
        }
      }
    });

    // 点击退出按钮，触发退出操作
    this.exit?.addEventListener('click', () => {
      this.onExit();
    });

    // 监听指针锁定状态变化，自动切换UI显示状态
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) {
        this.onPlay();
      } else {
        this.onPause();
      }
    });

    // 阻止右键菜单弹出
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 点击canvas画布时锁定指针（非移动端）
    document.querySelector('canvas')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isMobile) control.control.lock();
    });
  }
}

export default UI;
