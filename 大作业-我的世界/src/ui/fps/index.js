// 计算并显示页面实时帧率（FPS）的类，实现简单的FPS统计与更新显示

class FPS {
  constructor() {
    // 记录上一帧时间戳
    this.p1 = performance.now();
    // 记录当前帧时间戳
    this.p2 = performance.now();
    // 计时间隔起点，用于统计一秒内帧数
    this.gap = performance.now();
    // 计数器，统计一秒内渲染的帧数
    this.count = 0;
    // 创建显示FPS的DOM元素
    this.fps = document.createElement('div');

    // 给FPS显示元素添加CSS类名
    this.fps.className = 'fps';
    // 初始内容为FPS: 60（假设默认60帧）
    this.fps.innerHTML = `FPS: 60`;
    // 将FPS显示元素添加到页面body中
    document.body.appendChild(this.fps);
  }

  // 更新函数，在每帧调用，统计FPS并更新显示
  update = () => {
    // 当前时间
    this.p1 = performance.now();
    // 累计帧数加一
    this.count++;
    // 判断是否超过一秒时间
    if (performance.now() - this.gap > 1000) {
      // 更新FPS显示内容
      this.fps.innerHTML = `FPS: ${this.count}`;
      // 重置计时起点为当前时间
      this.gap = performance.now();
      // 重置帧计数器
      this.count = 0;
    }
    // 更新上一帧时间戳为当前帧时间戳（可选，未使用）
    this.p2 = this.p1;
  };
}

export default FPS;
