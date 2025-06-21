// Control.js
// 该模块负责玩家的输入控制和物理交互，包括键盘事件处理、碰撞检测、移动逻辑和状态管理，基于Three.js实现第一人称视角控制

import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Mode } from '../player/index.js';
import { BlockType } from '../terrain/index.js';
import Block from '../terrain/mesh/block.js';
import { isMobile } from '../utils/index.js';

// 表示六个方向的枚举，便于标识碰撞检测方向
export const Side = {
  front: 0,
  back: 1,
  left: 2,
  right: 3,
  down: 4,
  up: 5,
};

export default class Control {
  /**
   * 构造函数，初始化控制器，绑定场景、相机、玩家、地形和音频模块
   * @param {THREE.Scene} scene - Three.js 场景对象
   * @param {THREE.Camera} camera - 相机对象，用于视角控制
   * @param {Player} player - 玩家实例，管理玩家状态
   * @param {Terrain} terrain - 地形实例，进行碰撞和交互检测
   * @param {Audio} audio - 音频实例，用于空间音效等
   */
  constructor(scene, camera, player, terrain, audio) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.terrain = terrain;
    this.audio = audio;

    // 使用PointerLockControls实现第一人称视角鼠标控制
    this.control = new PointerLockControls(camera, document.body);

    // 主射线投射器，用于检测玩家前方物体交互，最大检测距离8个单位
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 8;

    // 用于碰撞检测的远距离，初始化为玩家高度
    this.far = this.player.body.height;

    // 当前速度向量，x、y、z对应玩家移动速度
    this.velocity = new THREE.Vector3(0, 0, 0);

    // 六个方向的碰撞状态标记，初始默认玩家脚下碰撞有效（站在地面上）
    this.frontCollide = false;
    this.backCollide = false;
    this.leftCollide = false;
    this.rightCollide = false;
    this.downCollide = true;
    this.upCollide = false;

    // 玩家是否正在跳跃
    this.isJumping = false;

    // 控制鼠标滚轮和空格键是否按住状态
    this.wheelGap = false;
    this.mouseHolding = false;
    this.spaceHolding = false;

    // 临时实例化网格，可能用于高效批量渲染方块等
    this.tempMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
      100
    );

    // 用于性能检测的时间戳
    this.p1 = performance.now();
    this.p2 = performance.now();

    // 玩家手持的方块种类列表，支持多种方块，初始持有草方块
    this.holdingBlocks = [
      BlockType.grass,
      BlockType.stone,
      BlockType.tree,
      BlockType.wood,
      BlockType.diamond,
      BlockType.quartz,
      BlockType.glass,
      BlockType.grass,
      BlockType.grass,
      BlockType.grass,
    ];
    // 当前持有方块索引及对应方块类型
    this.holdingIndex = 0;
    this.holdingBlock = this.holdingBlocks[this.holdingIndex];

    // 记录键盘按键状态，用于移动方向判定
    this.downKeys = {
      a: false,
      d: false,
      w: false,
      s: false,
    };

    // 初始化用于不同方向碰撞检测的射线投射器
    this.initRayCaster();

    // 初始化输入事件监听
    this.initEventListeners();
  }

  /**
   * 初始化用于上下左右前后的六个射线投射器，用于玩家周围碰撞检测
   */
  initRayCaster() {
    this.raycasterUp = new THREE.Raycaster();
    this.raycasterDown = new THREE.Raycaster();
    this.raycasterFront = new THREE.Raycaster();
    this.raycasterBack = new THREE.Raycaster();
    this.raycasterLeft = new THREE.Raycaster();
    this.raycasterRight = new THREE.Raycaster();

    // 设定射线方向
    this.raycasterUp.ray.direction.set(0, 1, 0);
    this.raycasterDown.ray.direction.set(0, -1, 0);
    this.raycasterFront.ray.direction.set(1, 0, 0);
    this.raycasterBack.ray.direction.set(-1, 0, 0);
    this.raycasterLeft.ray.direction.set(0, 0, -1);
    this.raycasterRight.ray.direction.set(0, 0, 1);

    // 设置射线检测的最大距离，根据玩家身体大小设定
    this.raycasterUp.far = 1.2;
    this.raycasterDown.far = this.player.body.height;
    this.raycasterFront.far = this.player.body.width;
    this.raycasterBack.far = this.player.body.width;
    this.raycasterLeft.far = this.player.body.width;
    this.raycasterRight.far = this.player.body.width;
  }

  /**
   * 键盘按下事件处理器，根据按键设置移动速度及玩家状态
   * 支持 WASD 移动，空格跳跃，Shift 下蹲，Q 切换飞行模式
   * @param {KeyboardEvent} e 
   */
  setMovementHandler = (e) => {
    if (e.repeat) return; // 忽略按键长按重复事件

    switch (e.key) {
      case 'q':
        // 按 Q 键切换行走和飞行模式
        if (this.player.mode === Mode.walking) {
          this.player.setMode(Mode.flying);
        } else {
          this.player.setMode(Mode.walking);
        }
        this.velocity.set(0, 0, 0); // 切换时清空速度
        break;

      case 'w':
      case 'W':
        this.downKeys.w = true;
        this.velocity.x = this.player.speed; // 向前移动
        break;

      case 's':
      case 'S':
        this.downKeys.s = true;
        this.velocity.x = -this.player.speed; // 向后移动
        break;

      case 'a':
      case 'A':
        this.downKeys.a = true;
        this.velocity.z = -this.player.speed; // 向左移动
        break;

      case 'd':
      case 'D':
        this.downKeys.d = true;
        this.velocity.z = this.player.speed; // 向右移动
        break;

      case ' ':
        // 空格键跳跃逻辑
        if (this.player.mode === Mode.sneaking && !this.isJumping) return; // 下蹲时不允许跳跃
        if (this.player.mode === Mode.walking) {
          if (!this.isJumping) {
            this.velocity.y = 8; // 给予跳跃初速度
            this.isJumping = true; // 标记为跳跃中
            this.downCollide = false; // 取消脚下碰撞，防止卡地面
            this.far = 0; // 临时关闭碰撞检测距离
            setTimeout(() => {
              this.far = this.player.body.height; // 跳跃短暂后恢复检测距离
            }, 300);
          }
        } else {
          this.velocity.y += this.player.speed; // 飞行模式下空格增加上升速度
        }
        // 如果是第一次按下空格，启动连续跳跃计时器
        if (this.player.mode === Mode.walking && !this.spaceHolding) {
          this.spaceHolding = true;
          this.jumpInterval = setInterval(() => {
            this.setMovementHandler(e);
          }, 10);
        }
        break;

      case 'Shift':
        // Shift 键实现下蹲（行走模式）或下降（飞行模式）
        if (this.player.mode === Mode.walking) {
          if (!this.isJumping) {
            this.player.setMode(Mode.sneaking);
            // 根据当前按下的方向键调整速度
            if (this.downKeys.w) this.velocity.x = this.player.speed;
            if (this.downKeys.s) this.velocity.x = -this.player.speed;
            if (this.downKeys.a) this.velocity.z = -this.player.speed;
            if (this.downKeys.d) this.velocity.z = this.player.speed;
            // 下蹲时降低相机高度
            this.camera.position.setY(this.camera.position.y - 0.2);
          }
        } else {
          this.velocity.y -= this.player.speed; // 飞行模式下降速度
        }
        break;

      default:
        break;
    }
  };

  /**
   * 键盘松开事件处理器，根据松开按键停止对应的移动或状态
   * @param {KeyboardEvent} e 
   */
  resetMovementHandler = (e) => {
    if (e.repeat) return; // 忽略长按松开重复事件

    switch (e.key) {
      case 'w':
      case 'W':
        this.downKeys.w = false;
        this.velocity.x = 0; // 停止向前移动
        break;

      case 's':
      case 'S':
        this.downKeys.s = false;
        this.velocity.x = 0; // 停止向后移动
        break;

      case 'a':
      case 'A':
        this.downKeys.a = false;
        this.velocity.z = 0; // 停止向左移动
        break;

      case 'd':
      case 'D':
        this.downKeys.d = false;
        this.velocity.z = 0; // 停止向右移动
        break;

      case ' ':
        // 松开空格键时停止跳跃连击
        if (this.player.mode === Mode.sneaking && !this.isJumping) return;
        this.jumpInterval && clearInterval(this.jumpInterval);
        this.spaceHolding = false;
        if (this.player.mode === Mode.walking) return;
        this.velocity.y = 0; // 飞行模式停止上升
        break;

      case 'Shift':
        // 松开 Shift 恢复行走模式，恢复相机高度
        if (this.player.mode === Mode.sneaking) {
          if (!this.isJumping) {
            this.player.setMode(Mode.walking);
            // 恢复按键速度状态
            if (this.downKeys.w) this.velocity.x = this.player.speed;
            if (this.downKeys.s) this.velocity.x = -this.player.speed;
            if (this.downKeys.a) this.velocity.z = -this.player.speed;
            if (this.downKeys.d) this.velocity.z = this.player.speed;
            this.camera.position.setY(this.camera.position.y + 0.2);
          }
        }
        if (this.player.mode === Mode.walking) return;
        this.velocity.y = 0; // 飞行模式停止下降
        break;

      default:
        break;
    }
  };

  mousedownHandler = (e) => {
    e.preventDefault(); // 阻止默认事件（如文本选中、右键菜单等）

    // 从摄像机视角的中心点(0,0)发射射线
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    // 使用射线检测所有地形块，取第一个被射线碰撞的物体
    const block = this.raycaster.intersectObjects(this.terrain.blocks)[0];

    // 用于存储矩阵数据的变量，复用一个Matrix4实例以减少开销
    const matrix = new THREE.Matrix4();

    switch (e.button) {
      case 0: // 鼠标左键 - 破坏方块操作
        if (block && block.object instanceof THREE.InstancedMesh) {
          // 获取被选中实例块的矩阵，获取块的位置
          block.object.getMatrixAt(block.instanceId, matrix);
          const position = new THREE.Vector3().setFromMatrixPosition(matrix);

          // 如果点击的是基岩（bedrock）则生成相邻方块，不能破坏，直接返回
          if (BlockType[block.object.name] === BlockType.bedrock) {
            this.terrain.generateAdjacentBlocks(position);
            return;
          }

          // 通过将实例矩阵设置为全0矩阵，达到隐藏/移除实例块的效果
          block.object.setMatrixAt(block.instanceId, new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));

          // 播放对应方块破坏的音效
          this.audio.playSound(BlockType[block.object.name]);

          // 创建一个单独的 Mesh 来显示破坏时的动画（缩小消失效果）
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            this.terrain.materials.get(this.terrain.materialType[parseInt(BlockType[block.object.name])])
          );
          mesh.position.copy(position);
          this.scene.add(mesh);

          // 记录动画开始时间
          const time = performance.now();
          let raf = 0;

          // 缩小动画，持续250ms后移除显示的mesh
          const animate = () => {
            if (performance.now() - time > 250) {
              this.scene.remove(mesh);
              cancelAnimationFrame(raf);
              return;
            }
            raf = requestAnimationFrame(animate);
            // 每帧缩小模型几分之一
            mesh.geometry.scale(0.85, 0.85, 0.85);
          };
          animate();

          // 通知Three.js更新实例矩阵
          block.object.instanceMatrix.needsUpdate = true;

          // 维护customBlocks数组：标记当前块为未放置，或新增一条记录
          let existed = false;
          for (const customBlock of this.terrain.customBlocks) {
            if (
              customBlock.x === position.x &&
              customBlock.y === position.y &&
              customBlock.z === position.z
            ) {
              existed = true;
              customBlock.placed = false; // 标记该块已被移除
            }
          }
          if (!existed) {
            this.terrain.customBlocks.push(
              new Block(position.x, position.y, position.z, BlockType[block.object.name], false)
            );
          }

          // 触发相邻方块的生成（如地形动态加载）
          this.terrain.generateAdjacentBlocks(position);
        }
        break;

      case 2: // 鼠标右键 - 放置方块操作
        if (block && block.object instanceof THREE.InstancedMesh) {
          // 获取点击面法线，用于确定放置方块的相邻位置
          const normal = block.face.normal;
          block.object.getMatrixAt(block.instanceId, matrix);
          const position = new THREE.Vector3().setFromMatrixPosition(matrix);

          // 防止放置方块到玩家位置（避免卡住玩家）
          if (
            position.x + normal.x === Math.round(this.camera.position.x) &&
            position.z + normal.z === Math.round(this.camera.position.z) &&
            (position.y + normal.y === Math.round(this.camera.position.y) ||
              position.y + normal.y === Math.round(this.camera.position.y - 1))
          ) {
            return; // 直接返回不放置方块
          }

          // 计算放置方块的新位置矩阵
          matrix.setPosition(normal.x + position.x, normal.y + position.y, normal.z + position.z);

          // 将放置的方块实例写入对应的 InstancedMesh 中
          this.terrain.blocks[this.holdingBlock].setMatrixAt(
            this.terrain.getCount(this.holdingBlock),
            matrix
          );

          // 更新该方块类型的计数
          this.terrain.setCount(this.holdingBlock);

          // 播放放置音效
          this.audio.playSound(this.holdingBlock);

          // 通知Three.js更新实例矩阵
          this.terrain.blocks[this.holdingBlock].instanceMatrix.needsUpdate = true;

          // 记录新放置的方块，状态为已放置
          this.terrain.customBlocks.push(
            new Block(normal.x + position.x, normal.y + position.y, normal.z + position.z, this.holdingBlock, true)
          );
        }
        break;

      default:
        break;
    }

    // 如果非移动设备，且当前未按住鼠标，则开启定时器，实现长按连续破坏/放置效果
    if (!isMobile && !this.mouseHolding) {
      this.mouseHolding = true;
      this.clickInterval = setInterval(() => {
        this.mousedownHandler(e);
      }, 333);
    }
  };

  mouseupHandler = () => {
    // 鼠标松开时清除定时器，停止连续操作
    this.clickInterval && clearInterval(this.clickInterval);
    this.mouseHolding = false;
  };

  changeHoldingBlockHandler = (e) => {
    // 数字键切换当前选中的方块（1~9），0键无效
    if (isNaN(parseInt(e.key)) || e.key === '0') return;
    this.holdingIndex = parseInt(e.key) - 1;
    this.holdingBlock = this.holdingBlocks[this.holdingIndex] ?? BlockType.grass;
  };

  wheelHandler = (e) => {
    // 鼠标滚轮切换当前持有的方块，限制切换频率避免过快触发
    if (!this.wheelGap) {
      this.wheelGap = true;
      setTimeout(() => {
        this.wheelGap = false;
      }, 100);

      if (e.deltaY > 0) {
        this.holdingIndex++;
        if (this.holdingIndex > 9) this.holdingIndex = 0;
      } else if (e.deltaY < 0) {
        this.holdingIndex--;
        if (this.holdingIndex < 0) this.holdingIndex = 9;
      }
      this.holdingBlock = this.holdingBlocks[this.holdingIndex] ?? BlockType.grass;
    }
  };

  initEventListeners() {
    // 监听指针锁定变化，锁定时绑定事件，释放时解绑事件和清理状态
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) {
        document.body.addEventListener('keydown', this.changeHoldingBlockHandler);
        document.body.addEventListener('wheel', this.wheelHandler);
        document.body.addEventListener('keydown', this.setMovementHandler);
        document.body.addEventListener('keyup', this.resetMovementHandler);
        document.body.addEventListener('mousedown', this.mousedownHandler);
        document.body.addEventListener('mouseup', this.mouseupHandler);
      } else {
        document.body.removeEventListener('keydown', this.changeHoldingBlockHandler);
        document.body.removeEventListener('wheel', this.wheelHandler);
        document.body.removeEventListener('keydown', this.setMovementHandler);
        document.body.removeEventListener('keyup', this.resetMovementHandler);
        document.body.removeEventListener('mousedown', this.mousedownHandler);
        document.body.removeEventListener('mouseup', this.mouseupHandler);
        this.velocity.set(0, 0, 0); // 清空移动速度
      }
    });
  }

  moveZ(distance, delta) {
    // 沿Z轴移动摄像机，速度根据玩家速度、delta时间调节
    this.camera.position.z += distance * (this.player.speed / Math.PI) * 2 * delta;
  }

  moveX(distance, delta) {
    // 沿X轴移动摄像机，速度根据玩家速度、delta时间调节
    this.camera.position.x += distance * (this.player.speed / Math.PI) * 2 * delta;
  }

  collideCheckAll(position, noise, customBlocks, far) {
    // 依次对六个方向进行碰撞检测
    this.collideCheck(Side.down, position, noise, customBlocks, far);
    this.collideCheck(Side.front, position, noise, customBlocks);
    this.collideCheck(Side.back, position, noise, customBlocks);
    this.collideCheck(Side.left, position, noise, customBlocks);
    this.collideCheck(Side.right, position, noise, customBlocks);
    this.collideCheck(Side.up, position, noise, customBlocks);
  }

  collideCheck(side, position, noise, customBlocks, far = this.player.body.width) {
    // 该方法针对指定方向检测碰撞，使用临时实例网格 tempMesh 模拟可能碰撞的方块

    const matrix = new THREE.Matrix4();
    let index = 0;

    // 重新初始化临时网格的实例矩阵，最多支持100个实例，每个矩阵16个float
    this.tempMesh.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(100 * 16), 16);

    let removed = false; // 标记当前方块是否被自定义方块替代移除
    let treeRemoved = new Array(this.terrain.noise.treeHeight + 1).fill(false); // 标记树木各层是否被移除

    let x = Math.round(position.x);
    let z = Math.round(position.z);

    // 根据方向调整x,z坐标和对应射线发射点
    switch (side) {
      case Side.front:
        x++;
        this.raycasterFront.ray.origin = position;
        break;
      case Side.back:
        x--;
        this.raycasterBack.ray.origin = position;
        break;
      case Side.left:
        z--;
        this.raycasterLeft.ray.origin = position;
        break;
      case Side.right:
        z++;
        this.raycasterRight.ray.origin = position;
        break;
      case Side.down:
        this.raycasterDown.ray.origin = position;
        this.raycasterDown.far = far;
        break;
      case Side.up:
        this.raycasterUp.ray.origin = new THREE.Vector3().copy(position);
        this.raycasterUp.ray.origin.y--;
        break;
    }

    // 根据噪声函数计算地形高度y
    let y = Math.floor(noise.get(x / noise.gap, z / noise.gap, noise.seed) * noise.amp) + 30;

    // 遍历所有自定义方块，判断是否覆盖、移除或影响树木的生成
    for (const block of customBlocks) {
      if (block.x === x && block.z === z) {
        if (block.placed) {
          // 若自定义方块已放置，写入临时实例矩阵，用于碰撞检测
          matrix.setPosition(block.x, block.y, block.z);
          this.tempMesh.setMatrixAt(index++, matrix);
        } else if (block.y === y) {
          // 若自定义方块未放置但与地面重合，标记为已移除
          removed = true;
        } else {
          // 若是树的某一层被移除，标记对应层数
          for (let i = 1; i <= this.terrain.noise.treeHeight; i++) {
            if (block.y === y + i) {
              treeRemoved[i] = true;
            }
          }
        }
      }
    }

    // 如果没有被移除的方块，则将地形块写入临时网格矩阵
    if (!removed) {
      matrix.setPosition(x, y, z);
      this.tempMesh.setMatrixAt(index++, matrix);
    }

    // 根据树的高度和噪声，动态添加树木实例到临时网格
    for (let i = 1; i <= this.terrain.noise.treeHeight; i++) {
      if (!treeRemoved[i]) {
        let treeOffset = noise.get(x / noise.treeGap, z / noise.treeGap, noise.treeSeed) * noise.treeAmp;
        let stoneOffset = noise.get(x / noise.stoneGap, z / noise.stoneGap, noise.stoneSeed) * noise.stoneAmp;
        // 满足阈值条件才生成树木实例
        if (treeOffset > noise.treeThreshold && y >= 27 && stoneOffset < noise.stoneThreshold) {
          matrix.setPosition(x, y + i, z);
          this.tempMesh.setMatrixAt(index++, matrix);
        }
      }
    }

    // 蹲下状态下允许玩家站立高度低于地面2个单位以下时，放置一个方块防止穿透
    if (
      this.player.mode === Mode.sneaking &&
      y < Math.floor(this.camera.position.y - 2) &&
      side !== Side.down &&
      side !== Side.up
    ) {
      matrix.setPosition(x, Math.floor(this.camera.position.y - 1), z);
      this.tempMesh.setMatrixAt(index++, matrix);
    }

    // 标记实例矩阵需要更新，保证数据生效
    this.tempMesh.instanceMatrix.needsUpdate = true;

    // 定义一个原点，射线检测时用于检测玩家脚下方块等
    const origin = new THREE.Vector3(position.x, position.y - 1, position.z);

    // 根据检测方向，判断是否与临时网格实例发生碰撞
    switch (side) {
      case Side.front: {
        const c1 = this.raycasterFront.intersectObject(this.tempMesh).length;
        this.raycasterFront.ray.origin = origin;
        const c2 = this.raycasterFront.intersectObject(this.tempMesh).length;
        this.frontCollide = c1 || c2 ? true : false;
        break;
      }
      case Side.back: {
        const c1 = this.raycasterBack.intersectObject(this.tempMesh).length;
        this.raycasterBack.ray.origin = origin;
        const c2 = this.raycasterBack.intersectObject(this.tempMesh).length;
        this.backCollide = c1 || c2 ? true : false;
        break;
      }
      case Side.left: {
        const c1 = this.raycasterLeft.intersectObject(this.tempMesh).length;
        this.raycasterLeft.ray.origin = origin;
        const c2 = this.raycasterLeft.intersectObject(this.tempMesh).length;
        this.leftCollide = c1 || c2 ? true : false;
        break;
      }
      case Side.right: {
        const c1 = this.raycasterRight.intersectObject(this.tempMesh).length;
        this.raycasterRight.ray.origin = origin;
        const c2 = this.raycasterRight.intersectObject(this.tempMesh).length;
        this.rightCollide = c1 || c2 ? true : false;
        break;
      }
      case Side.down: {
        const c1 = this.raycasterDown.intersectObject(this.tempMesh).length;
        this.downCollide = c1 ? true : false;
        break;
      }
      case Side.up: {
        const c1 = this.raycasterUp.intersectObject(this.tempMesh).length;
        this.upCollide = c1 ? true : false;
        break;
      }
    }
  }

  // 角色移动
  update() {
    // 记录当前时间戳，用于计算上一帧到当前帧的时间差（秒）
    this.p1 = performance.now();
    const delta = (this.p1 - this.p2) / 1000; // 时间差，单位秒

    // 第一次更新时，执行一次全面碰撞检测，防止刚进入游戏时卡住无法移动
    if (!this.ready) {
      this.collideCheckAll(this.camera.position, this.terrain.noise, this.terrain.customBlocks, this.far);
      this.ready = true; // 标记已准备好，避免重复执行
    }

    // 根据按键状态更新水平方向速度变量
    let moveX = 0; // 前后方向速度分量
    let moveZ = 0; // 左右方向速度分量

    if (this.downKeys.w) moveX += this.player.speed; // 按W，向前加速
    if (this.downKeys.s) moveX -= this.player.speed; // 按S，向后加速
    if (this.downKeys.a) moveZ -= this.player.speed; // 按A，向左加速
    if (this.downKeys.d) moveZ += this.player.speed; // 按D，向右加速

    // 更新角色的水平速度矢量
    this.velocity.x = moveX;
    this.velocity.z = moveZ;

    // 进行一次全方向碰撞检测，确保移动时不穿透地形或方块
    this.collideCheckAll(this.camera.position, this.terrain.noise, this.terrain.customBlocks, this.far);

    // 判断玩家当前模式，区分飞行模式和普通模式的处理
    if (this.player.mode === Mode.flying) {
      // 飞行模式：可以自由移动，不受重力影响
      this.control.moveForward(this.velocity.x * delta); // 根据x方向速度移动
      this.control.moveRight(this.velocity.z * delta);   // 根据z方向速度移动
      this.camera.position.y += this.velocity.y * delta; // y方向自由移动
    } else {
      // 普通模式：受重力影响且碰撞检测更严格

      // 进行下方的碰撞检测，考虑垂直方向速度调整后的检测范围
      this.collideCheckAll(this.camera.position, this.terrain.noise, this.terrain.customBlocks, this.far - this.velocity.y * delta);

      // 模拟重力加速度（-25单位/s²），但只在当前下落速度小于最大下落速度时施加
      if (Math.abs(this.velocity.y) < this.player.falling) {
        this.velocity.y -= 25 * delta; // 逐渐增加向下的速度分量
      }

      // 如果检测到头顶有碰撞（撞到上方），则将y方向速度设为负数，让玩家被推回（防止穿墙）
      if (this.upCollide) {
        this.velocity.y = -225 * delta;
        this.far = this.player.body.height; // 重置检测距离为玩家身体高度
      }

      // 如果检测到脚下有碰撞（站在地面），则y方向速度归零，并且取消跳跃状态
      if (this.downCollide) {
        this.velocity.y = 0;
        this.isJumping = false;
      }

      // 针对每个方向碰撞，按按键状态有选择地清除对应方向速度，避免角色卡死
      if (this.frontCollide && this.downKeys.w) {
        this.velocity.x = 0; // 向前撞墙，停止前进速度
      } else if (this.backCollide && this.downKeys.s) {
        this.velocity.x = 0; // 向后撞墙，停止后退速度
      }

      if (this.leftCollide && this.downKeys.a) {
        this.velocity.z = 0; // 向左撞墙，停止左移速度
      } else if (this.rightCollide && this.downKeys.d) {
        this.velocity.z = 0; // 向右撞墙，停止右移速度
      }

      // 按更新后的速度，移动摄像机位置
      this.control.moveForward(this.velocity.x * delta);
      this.control.moveRight(this.velocity.z * delta);

      // 处理垂直方向移动
      this.camera.position.y += this.velocity.y * delta;

      // 防止玩家掉落地图底部（y坐标低于-100），强制传送回起始高度60
      if (this.camera.position.y < -100) {
        this.camera.position.y = 60;
      }
    }

    // 更新上一帧时间戳，用于下一次计算delta
    this.p2 = this.p1;
  }

}
