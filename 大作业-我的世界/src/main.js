// 这是一个三维场景应用的主入口脚本，负责初始化各个模块（核心渲染、玩家、地形、控制、UI 和音频），并开启动画循环进行渲染和更新

// 导入各个功能模块
import Core from './core/index.js';        // 核心模块，包含场景、相机和渲染器
import Control from './control/index.js';  // 控制模块，处理用户输入和交互逻辑
import Player from './player/index.js';    // 玩家模块，管理玩家状态和行为
import Terrain from './terrain/index.js';  // 地形模块，负责地形生成和更新
import UI from './ui/index.js';             // 用户界面模块，显示交互界面
import Audio from './audio/index.js';       // 音频模块，负责环境音效和音乐
import './style.css';                       // 样式表导入，应用全局样式

// 初始化核心模块，创建场景、相机和渲染器实例
const core = new Core();
const camera = core.camera;
const scene = core.scene;
const renderer = core.renderer;

// 创建玩家实例
const player = new Player();

// 创建音频系统，并将相机传入以实现空间音效定位
const audio = new Audio(camera);

// 创建地形实例，并将场景和相机传入以便渲染和视角控制
const terrain = new Terrain(scene, camera);

// 创建控制模块，传入场景、相机、玩家、地形和音频，用于处理用户交互与逻辑更新
const control = new Control(scene, camera, player, terrain, audio);

// 创建 UI 界面，传入地形和控制模块以便展示状态和交互控件
const ui = new UI(terrain, control);

// 启动动画循环
(function animate() {
  // 请求浏览器下一帧动画时调用自身，实现递归的渲染循环
  requestAnimationFrame(animate);

  // 每帧更新控制逻辑（如玩家输入和状态）
  control.update();

  // 更新地形的状态和渲染内容
  terrain.update();

  // 更新 UI 界面状态和显示
  ui.update();

  // 渲染当前场景和相机视角，输出到画布
  renderer.render(scene, camera);
})();
