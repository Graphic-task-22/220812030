import * as THREE from 'three';

const texture = new THREE.TextureLoader().load(
  './src/assets/sprites/snowflake1.png'
);

const spriteMaterial = new THREE.SpriteMaterial({
  // color: 0x00ffff, //设置颜色
  rotation: Math.PI / 4, //旋转精灵对象45度，弧度值
  map: texture,
  blending: THREE.AdditiveBlending, //使用饱和度叠加渲染精灵
});

const sprite = new THREE.Sprite(spriteMaterial);

sprite.position.set(2, 5, -2);

export default sprite;
