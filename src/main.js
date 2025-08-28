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
let scene = null;
let isSceneReady = false;

// 智能进度状态管理
const loadingState = {
  currentPhase: 'initialization',
  phases: {
    initialization: { min: 0, max: 30, status: '初始化系统...' },
    coreLoading: { min: 30, max: 70, status: '加载核心资源...' },
    sceneSetup: { min: 70, max: 85, status: '初始化场景...' },
    finalizing: { min: 85, max: 100, status: '准备就绪...' },
  },
};

// 智能进度更新函数
function updateSmartProgress(progress, phase, phaseProgress) {
  let displayProgress = progress;
  let status = '';

  // 根据当前阶段调整显示进度和状态
  if (progress < 30) {
    // 初始化阶段 - 缓慢增长到30%
    displayProgress = Math.min(progress, 29);
    status = '初始化系统...';
  } else if (progress < 70) {
    // 核心资源加载阶段
    status = '加载场景模型...';
    if (phase === 'high') {
      if (phaseProgress < 33) status = '加载主场景模型...';
      else if (phaseProgress < 66) status = '加载HDR环境贴图...';
      else status = '加载地面纹理...';
    }
  } else if (progress < 85) {
    // 场景设置阶段
    status = '初始化渲染器...';
  } else {
    // 最终准备阶段
    status = '启动应用...';
  }

  // 如果到了临界进度但资源还没加载完，就停在临界点前
  if (progress >= 30 && loadingState.currentPhase === 'initialization') {
    displayProgress = 29;
    status = '等待资源加载...';
  }

  window.updateProgress(displayProgress, status);
}

// 设置资源加载进度回调
resourceManager.setProgressCallback(updateSmartProgress);

// 设置阶段完成回调
resourceManager.setPhaseCompleteCallback(phase => {
  console.log(`✅ 阶段完成: ${phase}`);

  if (phase === 'high') {
    loadingState.currentPhase = 'coreLoading';
    // 核心资源加载完成，可以开始初始化场景
    initializeBaseScene();
  }
});

// 初始化基础场景 (核心资源加载完成后)
async function initializeBaseScene() {
  try {
    console.log('🎬 开始初始化基础场景...');
    updateSmartProgress(75, '', '');

    // 创建场景
    scene = new THREE.Scene();
    scene.add(mesh);

    const fog = new THREE.FogExp2(0xb0c4de, 0.0005);
    scene.fog = fog;

    // 设置HDR环境贴图
    const hdrTexture = resourceManager.getResource(
      './qwantani_moonrise_puresky_2k.hdr'
    );
    if (hdrTexture) {
      hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = hdrTexture;
      scene.environment = hdrTexture;
      scene.environmentIntensity = 0.5;
      fog.color.setHex(0xa0b8d0);
    }

    updateSmartProgress(80, '', '');

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
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    document.body.appendChild(renderer.domElement);

    initComposer(renderer, scene);

    updateSmartProgress(85, '', '');

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

    // 设置垂直旋转限制 - 防止相机低于地面
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // 限制最大极角，稍微高于水平线
    controls.minPolarAngle = Math.PI / 6; // 限制最小极角，不能太向上看

    // 可选：设置水平旋转限制（如果需要的话）
    // controls.minAzimuthAngle = -Math.PI / 2; // 限制水平旋转的最小角度
    // controls.maxAzimuthAngle = Math.PI / 2;  // 限制水平旋转的最大角度

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

    // 场景基础初始化完成，开始渲染
    render();
    isSceneReady = true;

    console.log('✅ 基础场景初始化完成');
    updateSmartProgress(90, '', '');

    // 开始加载中等优先级资源 (延迟1秒)
    setTimeout(async () => {
      await resourceManager.loadMediumResources();
      console.log('🚛 卡车模型已可用');
    }, 1000);

    // 开始加载低优先级资源 (延迟3秒)
    setTimeout(async () => {
      await resourceManager.loadLowResources();
      console.log('🎨 所有装饰性模型已可用');

      // 所有资源加载完成
      finalizeLoading();
    }, 3000);
  } catch (error) {
    console.error('场景初始化失败:', error);
    window.updateProgress(100, '初始化失败，请刷新重试');
  }
}

// 完成加载并隐藏Loading
function finalizeLoading() {
  updateSmartProgress(100, '', '加载完成');

  setTimeout(() => {
    window.hideLoading();
    console.log('🎉 应用完全加载完成');
  }, 800);
}

// 启动应用的主函数
async function startApplication() {
  try {
    console.log('🚀 启动物联网智慧粮仓系统...');

    // 开始完整的资源加载流程
    const loadingResult = await resourceManager.loadAllResources();

    if (loadingResult.coreComplete) {
      console.log('✅ 核心资源加载完成，场景已可用');
      // 注意：场景初始化已经在阶段完成回调中触发
    }
  } catch (error) {
    console.error('应用启动失败:', error);
    window.updateProgress(100, '加载失败，请刷新页面重试');
  }
}

// 启动应用
startApplication();

// 导出模块级变量
export { camera, renderer, scene, isSceneReady };
