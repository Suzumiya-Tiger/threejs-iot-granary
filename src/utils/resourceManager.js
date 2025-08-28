// 超简单的资源管理器
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

class SimpleResourceManager {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.hdrLoader = new RGBELoader();
    this.textureLoader = new THREE.TextureLoader();
    this.cache = new Map(); // 缓存已加载的资源

    // 简单的进度跟踪
    this.totalFiles = 0;
    this.loadedFiles = 0;
    this.onProgress = null;

    // 添加模拟进度相关变量
    this.simulatedProgress = 0;
    this.realProgress = 0;
    this.isSimulating = false;
  }

  // 设置进度回调
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  // 开始模拟进度 - 缓慢增长到25%
  startSimulatedProgress() {
    if (this.isSimulating) return;

    this.isSimulating = true;
    this.simulatedProgress = 0;

    const simulate = () => {
      if (this.simulatedProgress < 25) {
        // 每次增长0.5-1.5%，比较缓慢
        this.simulatedProgress += Math.random() * 1 + 0.5;
        this.simulatedProgress = Math.min(this.simulatedProgress, 25);

        // 只有当真实进度还没超过模拟进度时才使用模拟值
        if (this.realProgress < this.simulatedProgress && this.onProgress) {
          this.onProgress(this.simulatedProgress);
        }

        // 间隔300-600ms，让进度条看起来在缓慢移动
        setTimeout(simulate, 300 + Math.random() * 300);
      }
    };

    simulate();
  }

  // 更新真实进度
  updateProgress() {
    if (this.totalFiles > 0) {
      this.realProgress = (this.loadedFiles / this.totalFiles) * 100;

      // 使用真实进度和模拟进度中的较大值
      const displayProgress = Math.max(
        this.realProgress,
        this.simulatedProgress
      );

      if (this.onProgress) {
        this.onProgress(Math.min(displayProgress, 100));
      }
    }
  }

  // 加载GLTF模型
  async loadGLTF(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        gltf => {
          this.cache.set(url, gltf);
          this.loadedFiles++;
          this.updateProgress();
          console.log(`✅ 加载完成: ${url}`);
          resolve(gltf);
        },
        undefined,
        error => {
          console.error(`❌ 加载失败: ${url}`, error);
          this.loadedFiles++; // 即使失败也要更新进度
          this.updateProgress();
          reject(error);
        }
      );
    });
  }

  // 加载HDR
  async loadHDR(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    return new Promise((resolve, reject) => {
      this.hdrLoader.load(
        url,
        texture => {
          this.cache.set(url, texture);
          this.loadedFiles++;
          this.updateProgress();
          console.log(`✅ HDR加载完成: ${url}`);
          resolve(texture);
        },
        undefined,
        error => {
          console.error(`❌ HDR加载失败: ${url}`, error);
          this.loadedFiles++;
          this.updateProgress();
          reject(error);
        }
      );
    });
  }

  // 加载纹理
  async loadTexture(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => {
          this.cache.set(url, texture);
          this.loadedFiles++;
          this.updateProgress();
          console.log(`✅ 纹理加载完成: ${url}`);
          resolve(texture);
        },
        undefined,
        error => {
          console.error(`❌ 纹理加载失败: ${url}`, error);
          this.loadedFiles++;
          this.updateProgress();
          reject(error);
        }
      );
    });
  }

  // 一次性加载所有必需资源
  async loadAllResources() {
    const resources = [
      './model.glb',
      './qwantani_moonrise_puresky_2k.hdr',
      './wispy-grass-meadow_albedo.png',
      './truck.glb',
      './tesla_model_x.glb',
      './aston_martin_v8_vantage_v600.glb',
      './dji_fvp.glb',
    ];

    this.totalFiles = resources.length;
    this.loadedFiles = 0;

    // 开始模拟进度
    this.startSimulatedProgress();

    const promises = resources.map(url => {
      if (url.endsWith('.glb')) {
        return this.loadGLTF(url);
      } else if (url.endsWith('.hdr')) {
        return this.loadHDR(url);
      } else if (url.endsWith('.png')) {
        return this.loadTexture(url);
      }
    });

    await Promise.all(promises);
    console.log('🎉 所有资源加载完成！');
  }

  // 获取资源
  get(url) {
    return this.cache.get(url);
  }
}

export const resourceManager = new SimpleResourceManager();
