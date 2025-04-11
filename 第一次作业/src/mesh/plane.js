import * as THREE from 'three';

const geometry = new THREE.PlaneGeometry(200, 200, 100, 100);

const texLoader = new THREE.TextureLoader();
const texture = texLoader.load('./src/assets/people01.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;// uv两个方向纹理重复数量
texture.repeat.set(12,12);//注意选择合适的阵列数量

// 设置纹理贴图：Texture对象作为材质map属性的属性值
const material = new THREE.MeshPhongMaterial({
  map: texture,
  side: THREE.DoubleSide,
});



const plane = new THREE.Mesh(geometry, material);

plane.position.z = -50;
plane.rotateX(-Math.PI / 2);

export default plane;
