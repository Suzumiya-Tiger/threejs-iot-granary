// 资源管理器 - 实现懒加载和优先级加载
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

class ResourceManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.rgbeLoader = new RGBELoader();
    this.textureLoader = new THREE.TextureLoader();

    this.loadedResources = new Map();
    this.loadingPromises = new Map();
    this.loadProgress = { loaded: 0, total: 0 };
    this.onProgress = null;
  }

  // 资源优先级配置
  getResourcePriority() {
    return {
      // 高优先级：场景基础资源
      high: [
        './model.glb',
        './qwantani_moonrise_puresky_4k.hdr',
        './wispy-grass-meadow_albedo.png',
      ],
      // 中优先级：基础车辆
      medium: ['./truck.glb'],
      // 低优先级：装饰性车辆
      low: [
        './tesla_white_car_.glb',
        './aston_martin_v8_vantage_v600.glb',
        './dji_fvp.glb',
      ],
    };
  }

  // 设置进度回调
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  // 更新加载进度
  updateProgress() {
    if (this.onProgress) {
      const progress =
        this.loadProgress.total > 0
          ? (this.loadProgress.loaded / this.loadProgress.total) * 100
          : 0;
      this.onProgress(progress);
    }
  }

  // 加载GLTF模型
  async loadGLTF(url, priority = 'medium') {
    if (this.loadedResources.has(url)) {
      return this.loadedResources.get(url);
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        gltf => {
          this.loadedResources.set(url, gltf);
          this.loadProgress.loaded++;
          this.updateProgress();
          console.log(`✅ 模型加载完成: ${url}`);
          resolve(gltf);
        },
        progress => {
          // 细粒度进度更新
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`📦 ${url} 加载进度: ${percent.toFixed(1)}%`);
        },
        error => {
          console.error(`❌ 模型加载失败: ${url}`, error);
          this.loadProgress.loaded++;
          this.updateProgress();
          reject(error);
        }
      );
    });

    this.loadingPromises.set(url, promise);
    this.loadProgress.total++;
    return promise;
  }

  // 加载HDR环境贴图
  async loadHDR(url) {
    if (this.loadedResources.has(url)) {
      return this.loadedResources.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        url,
        texture => {
          this.loadedResources.set(url, texture);
          this.loadProgress.loaded++;
          this.updateProgress();
          console.log(`✅ HDR加载完成: ${url}`);
          resolve(texture);
        },
        progress => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`🌅 ${url} 加载进度: ${percent.toFixed(1)}%`);
        },
        error => {
          console.error(`❌ HDR加载失败: ${url}`, error);
          reject(error);
        }
      );
    });

    this.loadProgress.total++;
    return promise;
  }

  // 按优先级加载资源
  async loadByPriority() {
    const priorities = this.getResourcePriority();

    // 第一阶段：加载高优先级资源
    console.log('🚀 开始加载核心资源...');
    const highPriorityPromises = priorities.high.map(url => {
      if (url.endsWith('.glb')) {
        return this.loadGLTF(url, 'high');
      } else if (url.endsWith('.hdr')) {
        return this.loadHDR(url);
      }
      // 其他类型资源的处理
    });

    await Promise.all(highPriorityPromises);
    console.log('✅ 核心资源加载完成，场景可以初始化');

    // 第二阶段：加载中优先级资源
    setTimeout(async () => {
      console.log('📦 开始加载中优先级资源...');
      const mediumPromises = priorities.medium.map(url =>
        this.loadGLTF(url, 'medium')
      );
      await Promise.all(mediumPromises);
      console.log('✅ 中优先级资源加载完成');
    }, 1000);

    // 第三阶段：加载低优先级资源
    setTimeout(async () => {
      console.log('🎨 开始加载装饰性资源...');
      const lowPromises = priorities.low.map(url => this.loadGLTF(url, 'low'));
      await Promise.all(lowPromises);
      console.log('✅ 所有资源加载完成');
    }, 3000);
  }

  // 获取已加载的资源
  getResource(url) {
    return this.loadedResources.get(url);
  }
}

export const resourceManager = new ResourceManager();
