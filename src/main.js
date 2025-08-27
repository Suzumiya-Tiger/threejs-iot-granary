// 导入Three.js核心库
import * as THREE from 'three';

// 导入轨道控制器，用于鼠标控制相机
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { labelRenderer } from './utils/tag.js';
// 导入自定义的网格模型
import mesh from './mesh.js';

// 导入后处理系统
import { initComposer, composer, fxaaPass } from './utils/choose.js';

const scene = new THREE.Scene();

scene.add(mesh);
// 使用更细腻的指数雾
const fog = new THREE.FogExp2(0xb0c4de, 0.0005); // 淡蓝灰色
scene.fog = fog;
// 当前使用了环境贴图，如果你需要使用环境光或者直射光源可以替换
/* let ambientLight = new THREE.AmbientLight(0xffffff, 0.15); // 很微弱的环境光
scene.add(ambientLight);

// 光源设置
const directionalLight = new THREE.DirectionalLight(0xfff5e6, 5);
directionalLight.position.set(200, 300, 100);
directionalLight.castShadow = true; */

// HDR环境贴图 - 降低强度
const rgbeLoader = new RGBELoader();
rgbeLoader.load('./qwantani_moonrise_puresky_4k.hdr', envMap => {
  envMap.mapping = THREE.EquirectangularReflectionMapping;

  // 调整HDR环境光强度
  scene.background = envMap;
  scene.environment = envMap;
  scene.environmentIntensity = 0.5; // 减少环境光强度到50%

  // 根据HDR环境调整雾的颜色，让它更融合
  fog.color.setHex(0xa0b8d0); // 调整为与HDR更匹配的颜色
});
/* // 创建坐标轴辅助器，长度为100，用于调试
const helper = new THREE.AxesHelper(250);
scene.add(helper); */

// 获取浏览器窗口尺寸
let width = window.innerWidth;
let height = window.innerHeight;

// 创建透视相机
const camera = new THREE.PerspectiveCamera(60, width / height, 1, 3000);

// 创建WebGL渲染器
const renderer = new THREE.WebGLRenderer({
  antialias: true, // 启用抗锯齿，提升视觉质量
  powerPreference: 'high-performance', // 使用高性能GPU
});

// 设置渲染器尺寸为全屏
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比，避免过度渲染

// 启用阴影渲染功能
renderer.shadowMap.enabled = true;

// 设置阴影类型为PCF软阴影，效果更柔和
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 设置渲染器输出色彩空间
renderer.outputColorSpace = THREE.SRGBColorSpace;

// 将渲染器的DOM元素添加到页面body中
document.body.appendChild(renderer.domElement);

// 初始化后处理系统
initComposer(renderer, scene);

// ========== 优化的相机控制器设置 ==========
const controls = new OrbitControls(camera, renderer.domElement);

// 设置target到立方体中心
controls.target.set(0, 0, 0);
controls.minDistance = 10;
controls.maxDistance = 500;
// 设置相机初始位置
camera.position.set(292, 223, 185);

// 优化流畅度的关键设置
controls.enableDamping = true;
controls.dampingFactor = 0.05; // 降低阻尼系数，减少卡顿

// 旋转和缩放速度优化
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.0;
controls.panSpeed = 1.0;

// 在渲染循环中更新状态显示
function render() {
  // 关键：添加控制器更新 - 这是关键！
  controls.update();

  // 更新卡车动画
  if (window.truckAnimation) {
    window.truckAnimation.update();
  }

  // 使用后处理渲染器替代原来的渲染器
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  labelRenderer.render(scene, camera);
  requestAnimationFrame(render);
}

// 开始渲染循环
render();

// ========== 响应式设计 ==========
window.addEventListener('resize', () => {
  // 更新窗口尺寸
  width = window.innerWidth;
  height = window.innerHeight;

  // 更新相机宽高比
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // 更新渲染器尺寸
  renderer.setSize(width, height);

  // 更新标签渲染器尺寸
  labelRenderer.setSize(width, height);

  composer.setSize(width, height);
  // 更新FXAA 的分辨率
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
});

export { camera, renderer };
