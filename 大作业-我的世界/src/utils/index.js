// 将一段 HTML 字符串转换成 DOM 元素并插入到页面中，同时检测当前设备是否为移动端

/**
 * 将 HTML 字符串转换为 DOM 元素，并将其内容添加到 document.body 中
 * @param {string} html - 需要转换的 HTML 字符串
 */
export const htmlToDom = (html) => {
  // 创建一个 <template> 元素，template 元素可以包含任意 HTML 结构但不会立即渲染
  const templateDom = document.createElement('template');
  
  // 将传入的 HTML 字符串赋值给 template 元素的 innerHTML，浏览器会自动解析成 DOM 结构
  templateDom.innerHTML = html;
  
  // 将 template 的内容（DocumentFragment）追加到页面的 body 中，完成插入操作
  document.body.appendChild(templateDom.content);
};

/**
 * 判断当前运行环境是否为移动端设备
 * 通过检测 navigator.userAgent 中是否包含常见移动设备标识实现
 */
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
