// 本文件用于定义玩家（Player）类及其状态（Mode）和速度（Speed）配置，支持设置不同移动模式。

// 玩家状态模式常量（行走、冲刺、飞行、潜行等）
export const Mode = {
  walking: 'walking',         // 正常步行模式
  sprinting: 'sprinting',     // 冲刺跑步模式
  flying: 'flying',           // 普通飞行模式
  sprintFlying: 'sprintFlying', // 冲刺飞行模式
  sneaking: 'sneaking',       // 潜行（下蹲）模式
};

// 各种移动模式对应的移动速度（单位：米/秒）
export const Speed = {
  walking: 5.612,        // 行走速度
  sprinting: 5.612,      // 冲刺速度（与行走相同，可根据需要调整）
  flying: 21.78,         // 飞行速度
  sprintFlying: 21.78,   // 冲刺飞行速度（可设置更高）
  sneaking: 2.55,        // 潜行速度
};

// 玩家类：用于表示玩家的状态、速度、身体尺寸等属性
export default class Player {
  constructor() {
    this.mode = Mode.walking;        // 默认初始为行走模式
    this.speed = Speed[this.mode];   // 当前移动速度，取决于模式
    this.falling = 38.4;             // 玩家下落时的最大速度（重力影响）
    this.jump = 1.2522;              // 跳跃初速度（用于起跳时的Y轴速度）
    this.body = {
      height: 1.8,                   // 玩家身体高度（米）
      width: 0.5,                    // 玩家身体宽度（米）
    };
  }

  /**
   * 设置玩家的移动模式，并自动更新对应的移动速度
   * @param {string} mode - 玩家要切换到的模式，必须是 Mode 中定义的值
   */
  setMode(mode) {
    this.mode = mode;
    this.speed = Speed[this.mode];
  }
}
