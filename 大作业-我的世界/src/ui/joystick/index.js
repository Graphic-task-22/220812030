// 实现触屏摇杆控制和事件绑定，支持移动端操作和相机视角控制的类

import * as THREE from 'three';
import { Mode } from '../../player';
import { htmlToDom } from '../../utils';
import joystickHtmlRaw from './joystick.html?raw';

export const ActionKey = {
  FRONT: 'front',
  LEFT: 'left',
  RIGHT: 'right',
  BACK: 'back',
  MODE: 'mode',
  JUMP: 'jump',
  UP: 'up',
  DOWN: 'down',
};

class Joystick {
  constructor(control) {
    // 上一次页面X坐标
    this.pageX = 0;
    // 上一次页面Y坐标
    this.pageY = 0;
    // 点击时页面X坐标
    this.clickX = 0;
    // 点击时页面Y坐标
    this.clickY = 0;
    // 长按标识
    this.hold = false;
    // 控制器实例，用于发送控制事件
    this.control = control;
    // 记录相机旋转角度，YXZ顺序欧拉角
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
  }

  // 模拟键盘事件对象，传递按键
  emitKeyboardEvent = (key) => ({ key });

  // 模拟点击事件对象，传递鼠标按钮和阻止默认行为函数
  emitClickEvent = (button) => ({
    button,
    preventDefault: () => {},
  });

  // 初始化单个按钮，绑定pointer事件模拟键盘操作
  initButton = ({ actionKey, key }) => {
    const button = document.querySelector(`#action-${actionKey}`);
    button.addEventListener('pointermove', (e) => {
      e.stopPropagation(); // 阻止事件冒泡，避免冲突
    });
    button.addEventListener('pointerdown', (e) => {
      // 按下时调用控制器设置对应移动事件
      this.control.setMovementHandler(this.emitKeyboardEvent(key));
      e.stopPropagation();
    });
    button.addEventListener('pointerup', (e) => {
      // 抬起时重置移动事件
      this.control.resetMovementHandler(this.emitKeyboardEvent(key));
      e.stopPropagation();
    });

    // 特殊处理“模式”按钮的多键绑定与飞行模式相关UI切换
    if (actionKey === ActionKey.MODE && key === 'q') {
      this.initButton({ actionKey: ActionKey.MODE, key: ' ' }); // 空格键也绑定模式切换
      button.addEventListener('pointerdown', () => {
        if (this.control.player.mode === Mode.flying) {
          document.querySelector('#action-down')?.classList.remove('hidden');
        } else {
          document.querySelector('#action-down')?.classList.add('hidden');
        }
      });
    }
  };

  // 初始化整个摇杆，加载HTML并绑定事件监听
  init = () => {
    // 将摇杆HTML字符串转换为DOM并插入页面
    htmlToDom(joystickHtmlRaw);
    // 初始化各个控制按钮
    this.initButton({ actionKey: ActionKey.FRONT, key: 'w' });
    this.initButton({ actionKey: ActionKey.LEFT, key: 'a' });
    this.initButton({ actionKey: ActionKey.RIGHT, key: 'd' });
    this.initButton({ actionKey: ActionKey.BACK, key: 's' });
    this.initButton({ actionKey: ActionKey.MODE, key: 'q' });
    this.initButton({ actionKey: ActionKey.UP, key: ' ' });
    this.initButton({ actionKey: ActionKey.DOWN, key: 'Shift' });

    // 监听全局指针移动，实现相机视角控制（鼠标拖拽旋转）
    document.addEventListener('pointermove', (e) => {
      if (this.pageX !== 0 || this.pageY !== 0) {
        // 从相机当前四元数转换为欧拉角
        this.euler.setFromQuaternion(this.control.camera.quaternion);
        // 根据指针移动距离修改欧拉角
        this.euler.y -= 0.01 * (e.pageX - this.pageX);
        this.euler.x -= 0.01 * (e.pageY - this.pageY);
        // 限制垂直旋转角度，防止翻转
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        // 将更新后的欧拉角转换回四元数赋给相机
        this.control.camera.quaternion.setFromEuler(this.euler);
      }
      // 记录最新指针位置
      this.pageX = e.pageX;
      this.pageY = e.pageY;
      // 清除点击长按定时器
      this.clickTimeout && clearTimeout(this.clickTimeout);
    });

    // 监听指针按下事件，判断是否为长按
    document.addEventListener('pointerdown', (e) => {
      this.clickX = e.pageX;
      this.clickY = e.pageY;
      this.clickTimeout = setTimeout(() => {
        // 长按判定：指针位置未变化
        if (e.pageX === this.clickX && e.pageY === this.clickY) {
          // 触发控制器鼠标左键按下事件
          this.control.mousedownHandler(this.emitClickEvent(0));
          // 每隔333ms重复触发左键按下事件（持续攻击等动作）
          this.clickInterval = setInterval(() => {
            this.control.mousedownHandler(this.emitClickEvent(0));
          }, 333);
          this.hold = true;
        }
      }, 500); // 长按判定时间500ms
    });

    // 监听指针抬起事件，处理点击与长按结束
    document.addEventListener('pointerup', (e) => {
      // 清除长按检测计时器
      this.clickTimeout && clearTimeout(this.clickTimeout);
      this.clickInterval && clearInterval(this.clickInterval);
      // 如果非长按且指针位置未变化，触发右键点击事件（例如块交互）
      if (!this.hold && e.pageX === this.clickX && e.pageY === this.clickY) {
        this.control.mousedownHandler(this.emitClickEvent(2));
      }
      // 重置状态
      this.hold = false;
      this.pageX = 0;
      this.pageY = 0;
    });
  };
}

export default Joystick;
