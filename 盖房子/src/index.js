// 场景、相机、渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// 地面
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 房子（墙体）
const houseGroup = new THREE.Group();
const wallGeo = new THREE.BoxGeometry(6, 4, 6);
const wallMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // 将用于修改颜色
const walls = new THREE.Mesh(wallGeo, wallMat);
walls.position.y = 2;
walls.castShadow = true;
houseGroup.add(walls);

// 屋顶
const roofGeo = new THREE.ConeGeometry(5, 3, 4);
const roofMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
const roof = new THREE.Mesh(roofGeo, roofMat);
roof.position.y = 5.5;
roof.rotation.y = Math.PI / 4;
roof.castShadow = true;
houseGroup.add(roof);

// 门
const doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.2);
const doorMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
const door = new THREE.Mesh(doorGeo, doorMat);
door.position.set(0, 1.25, 3.1);
houseGroup.add(door);

// 窗户
const windowGeo = new THREE.PlaneGeometry(1.5, 1.5);
const windowMat = new THREE.MeshPhongMaterial({
  color: 0x87CEFA,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide
});

const window1 = new THREE.Mesh(windowGeo, windowMat);
window1.position.set(-2, 2.5, 3.01);
houseGroup.add(window1);

const window2 = new THREE.Mesh(windowGeo, windowMat);
window2.position.set(2, 2.5, 3.01);
houseGroup.add(window2);

// 烟囱
const chimneyGeo = new THREE.BoxGeometry(0.6, 2, 0.6);
const chimneyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
chimney.position.set(-1.5, 6, -1.5);
houseGroup.add(chimney);

scene.add(houseGroup);

// 树木
function createTree(x, z) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 2, 8),
    new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  );
  trunk.position.y = 1;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 3, 8),
    new THREE.MeshLambertMaterial({ color: 0x006400 })
  );
  leaves.position.y = 3;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  tree.castShadow = true;
  scene.add(tree);
}

createTree(10, 5);
createTree(-10, -5);
createTree(5, -8);

// 雪人
function createSnowman(x, z) {
  const snowman = new THREE.Group();

  const bottom = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  bottom.position.y = 1;
  snowman.add(bottom);

  const middle = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 16),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  middle.position.y = 2.5;
  snowman.add(middle);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  head.position.y = 3.6;
  snowman.add(head);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.5, 8),
    new THREE.MeshLambertMaterial({ color: 0xffa500 })
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 3.6, 0.5);
  snowman.add(nose);

  snowman.position.set(x, 0, z);
  snowman.castShadow = true;
  scene.add(snowman);
}

createSnowman(4, 6);

// 雪花效果
const snowCount = 200;
const snowflakes = [];

const snowGeo = new THREE.SphereGeometry(0.05, 8, 8);
const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

for (let i = 0; i < snowCount; i++) {
  const snowflake = new THREE.Mesh(snowGeo, snowMat);
  snowflake.position.set(
    (Math.random() - 0.5) * 50,
    Math.random() * 30 + 10,
    (Math.random() - 0.5) * 50
  );
  scene.add(snowflake);
  snowflakes.push(snowflake);
}

// GUI 控制
const settings = {
  snowSpeed: 0.1,
  wallColor: '#ffffff'
};

const gui = new dat.GUI();
gui.add(settings, 'snowSpeed', 0, 1).step(0.01).name('雪花速度');
gui.addColor(settings, 'wallColor').name('墙体颜色').onChange(value => {
  wallMat.color.set(value);
});

// 相机位置
camera.position.set(10, 10, 15);
camera.lookAt(scene.position);

// 自适应
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  snowflakes.forEach(snowflake => {
    snowflake.position.y -= settings.snowSpeed;
    if (snowflake.position.y < 0) {
      snowflake.position.y = Math.random() * 30 + 10;
      snowflake.position.x = (Math.random() - 0.5) * 50;
      snowflake.position.z = (Math.random() - 0.5) * 50;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();
