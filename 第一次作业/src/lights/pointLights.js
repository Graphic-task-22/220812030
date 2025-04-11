import * as THREE from 'three';

//点光源：两个参数分别表示光源颜色和光照强度
// 参数1：0xffffff是纯白光,表示光源颜色
// 参数2：1.0,表示光照强度，可以根据需要调整
const pointLight = new THREE.PointLight(0xffffff, 1.0);

pointLight.intensity = 1.0; //光照强度
pointLight.decay = 0.0; //设置光源不随距离衰减

//点光源位置
pointLight.position.set(100, 100, 100); //点光源放在x轴上

export default pointLight;
