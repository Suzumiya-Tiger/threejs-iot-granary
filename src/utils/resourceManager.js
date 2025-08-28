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
  }

  // 设置进度回调
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  // 更新进度
  updateProgress() {
    if (this.onProgress && this.totalFiles > 0) {
      const progress = (this.loadedFiles / this.totalFiles) * 100;
      this.onProgress(Math.min(progress, 100));
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
