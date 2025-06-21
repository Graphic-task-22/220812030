// 本文件定义Bag类，实现游戏背包UI及快捷栏切换功能，包括键盘数字键选择与鼠标滚轮切换

import grassIcon from "../../static/block-icon/grass.png";
import stoneIcon from "../../static/block-icon/stone.png";
import treeIcon from "../../static/block-icon/tree.png";
import woodIcon from "../../static/block-icon/wood.png";
import diamondIcon from "../../static/block-icon/diamond.png";
import quartzIcon from "../../static/block-icon/quartz.png";
import glassIcon from "../../static/block-icon/glass.png";
import { isMobile } from "../../utils";

class Bag {
  constructor() {
    // 防止鼠标滚轮事件触发过快的节流标志
    this.wheelGap = false;
    // 当前选中快捷栏索引
    this.current = 0;
    // 背包图标资源数组
    this.icon = [grassIcon, stoneIcon, treeIcon, woodIcon, diamondIcon, quartzIcon, glassIcon];
    // 图标索引，用于初始化每个格子中的图标
    this.iconIndex = 0;
    this.y = 0;
    // 创建背包容器div元素
    this.bag = document.createElement("div");

    // 创建10个快捷栏格子，每个格子内放置对应图标（如有）
    this.items = new Array(10).fill(null).map(() => {
      let item = document.createElement("div");
      item.className = "item";
      let img = document.createElement("img");
      if (this.icon[this.iconIndex]) {
        img.className = "icon";
        img.alt = "block";
        img.src = this.icon[this.iconIndex++];
        item.appendChild(img);
      }
      return item;
    });

    // 如果是移动端，不渲染背包UI（可能用其他交互方式）
    if (isMobile) return;

    this.bag.className = "bag";
    // 默认选中第一个格子
    this.items[0].classList.add("selected");
    // 将格子添加到背包容器中
    for (let i = 0; i < this.items.length; i++) {
      this.bag.appendChild(this.items[i]);
    }
    // 将背包容器添加到页面body中
    document.body.appendChild(this.bag);

    // 监听键盘按键事件，实现数字键1-9快速选中对应格子
    document.body.addEventListener("keydown", (e) => {
      // 忽略非数字键和数字0
      if (isNaN(parseInt(e.key)) || e.key === "0") {
        return;
      }
      // 移除所有格子的选中样式
      for (let i = 0; i < this.items.length; i++) {
        this.items[i].classList.remove("selected");
      }
      // 当前选中格子索引（数字键减1）
      this.current = parseInt(e.key) - 1;
      this.items[this.current].classList.add("selected");
    });

    // 监听鼠标滚轮事件，实现快捷栏格子的循环切换
    document.body.addEventListener("wheel", (e) => {
      // 节流，防止滚轮滚动太快导致快速切换
      if (!this.wheelGap) {
        this.wheelGap = true;
        setTimeout(() => {
          this.wheelGap = false;
        }, 100);

        // 向下滚动，索引加1，超过9回绕0
        if (e.deltaY > 0) {
          this.current++;
          if (this.current > 9) this.current = 0;
        }
        // 向上滚动，索引减1，小于0回绕9
        else if (e.deltaY < 0) {
          this.current--;
          if (this.current < 0) this.current = 9;
        }
        // 移除所有选中状态
        for (let i = 0; i < this.items.length; i++) {
          this.items[i].classList.remove("selected");
        }
        // 给当前选中格子添加选中样式
        this.items[this.current].classList.add("selected");
      }
    });
  }
}

export default Bag;
