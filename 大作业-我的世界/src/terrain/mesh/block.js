// 本文件定义了方块（Block）类，用于表示三维空间中的单个方块及其属性

export default class Block {
  /**
   * 创建一个方块实例
   * @param {number} x - 方块在X轴的位置
   * @param {number} y - 方块在Y轴的位置（高度）
   * @param {number} z - 方块在Z轴的位置
   * @param {string|number} type - 方块类型（如草方块、石头等）
   * @param {boolean} placed - 标记该方块是否是玩家放置的自定义方块
   */
  constructor(x, y, z, type, placed) {
    this.x = x; // 方块X坐标
    this.y = y; // 方块Y坐标（高度）
    this.z = z; // 方块Z坐标
    this.type = type; // 方块类型
    this.placed = placed; // 是否是玩家放置的方块
  }
}
