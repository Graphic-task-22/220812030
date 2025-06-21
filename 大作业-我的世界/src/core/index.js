import * as THREE from 'three'

//Core类：用于初始化Three.js的核心组件：相机、场景、渲染器

class Core {
  constructor() {
    // 创建透视相机
    this.camera = new THREE.PerspectiveCamera();

    // 创建WebGL渲染器
    this.renderer = new THREE.WebGLRenderer();

    // 创建场景
    this.scene = new THREE.Scene();

    // 初始化场景、渲染器和相机
    this.initScene();
    this.initRenderer();
    this.initCamera();
  }


  //初始化相机设置

  initCamera = () => {
    this.camera.fov = 50; // 视野角度
    this.camera.aspect = window.innerWidth / window.innerHeight; // 屏幕宽高比
    this.camera.near = 0.01; // 最近裁剪面
    this.camera.far = 500; // 最远裁剪面
    this.camera.updateProjectionMatrix(); // 更新投影矩阵以应用以上设置

    // 设置初始相机位置
    this.camera.position.set(8, 50, 8);
    this.camera.lookAt(100, 30, 100); // 相机看向某一点

    // 监听窗口大小变化，自动调整相机宽高比
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  };


  // 初始化场景设置

  initScene = () => {
    const backgroundColor = 0x87ceeb; // 天空蓝背景色

    // 设置雾效，使远处物体逐渐消失
    this.scene.fog = new THREE.Fog(backgroundColor, 1, 96);

    // 设置场景背景色
    this.scene.background = new THREE.Color(backgroundColor);

    // 添加主光源（阳光）- 来自一个方向的点光源
    const sunLight = new THREE.PointLight(0xffffff, 0.5);
    sunLight.position.set(500, 500, 500);
    this.scene.add(sunLight);

    // 添加次光源 - 从相反方向照亮场景，避免过暗
    const sunLight2 = new THREE.PointLight(0xffffff, 0.2);
    sunLight2.position.set(-500, 500, -500);
    this.scene.add(sunLight2);

    // 添加环境光，柔和地照亮场景中所有物体
    const reflectionLight = new THREE.AmbientLight(0x404040);
    this.scene.add(reflectionLight);
  };


  // 初始化渲染器设置

  initRenderer = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染区域尺寸
    document.body.appendChild(this.renderer.domElement); // 将渲染器的canvas添加到页面中

    // 监听窗口大小变化，自动调整渲染器尺寸
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };
}

export default Core;
