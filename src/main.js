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
import { resourceManager } from './utils/resourceManager.js';

// 在模块顶层声明变量
let camera = null;
let renderer = null;

// 设置加载进度回调
resourceManager.setProgressCallback(progress => {
  window.updateProgress(progress, getLoadingStatus(progress));
});

function getLoadingStatus(progress) {
  if (progress < 30) return '加载场景模型...';
  if (progress < 60) return '加载环境贴图...';
  if (progress < 80) return '初始化渲染器...';
  if (progress < 95) return '加载车辆模型...';
  return '准备就绪...';
}

// 场景初始化
async function initScene() {
  try {
    // 开始按优先级加载资源
    await resourceManager.loadByPriority();

    // 创建场景
    const scene = new THREE.Scene();
    scene.add(mesh);

    const fog = new THREE.FogExp2(0xb0c4de, 0.0005);
    scene.fog = fog;

    // HDR环境贴图
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('./qwantani_moonrise_puresky_2k.hdr', envMap => {
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = envMap;
      scene.environment = envMap;
      scene.environmentIntensity = 0.5;
      fog.color.setHex(0xa0b8d0);
    });

    // 相机和渲染器设置
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 将创建的实例赋值给模块级变量
    camera = new THREE.PerspectiveCamera(60, width / height, 1, 3000);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    document.body.appendChild(renderer.domElement);

    initComposer(renderer, scene);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.minDistance = 10;
    controls.maxDistance = 500;
    camera.position.set(292, 223, 185);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 1.0;

    // 渲染循环
    function render() {
      controls.update();

      if (window.truckAnimation) {
        window.truckAnimation.update();
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      labelRenderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    // 响应式处理
    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
      composer.setSize(width, height);
      const pixelRatio = renderer.getPixelRatio();
      fxaaPass.material.uniforms['resolution'].value.x =
        1 / (width * pixelRatio);
      fxaaPass.material.uniforms['resolution'].value.y =
        1 / (height * pixelRatio);
    });

    // 场景初始化完成，开始渲染
    render();

    // 延迟隐藏loading，确保渲染稳定
    setTimeout(() => {
      window.updateProgress(100, '加载完成');
      setTimeout(() => {
        window.hideLoading();
      }, 500);
    }, 1000);

    return { camera, renderer };
  } catch (error) {
    console.error('场景初始化失败:', error);
    window.updateProgress(100, '加载失败，请刷新重试');
  }
}

// 启动应用
initScene();

// 导出模块级变量
export { camera, renderer };
