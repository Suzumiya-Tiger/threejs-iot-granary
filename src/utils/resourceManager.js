// 资源管理器 - 实现智能渐进式加载
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

    // 智能进度管理
    this.loadProgress = {
      phase: 0, // 当前阶段 (0-3)
      phaseProgress: 0, // 当前阶段进度 (0-100)
      totalProgress: 0, // 总体进度 (0-100)
      resources: {
        high: { loaded: 0, total: 0 },
        medium: { loaded: 0, total: 0 },
        low: { loaded: 0, total: 0 },
      },
    };

    this.onProgress = null;
    this.onPhaseComplete = null;

    // 阶段权重配置
    this.phaseWeights = {
      high: 40, // 核心资源占40%进度
      medium: 30, // 中等资源占30%进度
      low: 30, // 低优先级占30%进度
    };
  }

  // 资源优先级配置
  getResourcePriority() {
    return {
      // 高优先级：场景基础资源 (必须完成才能进入场景)
      high: [
        './model.glb',
        './qwantani_moonrise_puresky_2k.hdr',
        './wispy-grass-meadow_albedo.png',
      ],
      // 中优先级：基础功能 (卡车等基础交通工具)
      medium: ['./truck.glb'],
      // 低优先级：装饰性资源 (豪华车、无人机等)
      low: [
        './tesla_model_x.glb',
        './aston_martin_v8_vantage_v600.glb',
        './dji_fvp.glb',
      ],
    };
  }

  // 设置进度回调
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  // 设置阶段完成回调
  setPhaseCompleteCallback(callback) {
    this.onPhaseComplete = callback;
  }

  // 智能进度更新
  updateProgress(phase, resourceLoaded = false) {
    const phaseConfig = this.loadProgress.resources[phase];

    if (resourceLoaded) {
      phaseConfig.loaded++;
    }

    // 计算当前阶段进度
    const phaseProgress =
      phaseConfig.total > 0
        ? (phaseConfig.loaded / phaseConfig.total) * 100
        : 0;

    // 计算总体进度
    let totalProgress = 0;
    const phases = ['high', 'medium', 'low'];

    for (let i = 0; i < phases.length; i++) {
      const phaseName = phases[i];
      const weight = this.phaseWeights[phaseName];
      const progress = this.loadProgress.resources[phaseName];

      if (progress.total > 0) {
        const phasePercent = (progress.loaded / progress.total) * 100;
        totalProgress += (phasePercent * weight) / 100;
      } else if (i < this.loadProgress.phase) {
        // 已完成的阶段
        totalProgress += weight;
      }
    }

    this.loadProgress.phaseProgress = phaseProgress;
    this.loadProgress.totalProgress = Math.min(totalProgress, 100);

    // 触发进度回调
    if (this.onProgress) {
      this.onProgress(this.loadProgress.totalProgress, phase, phaseProgress);
    }

    // 检查阶段是否完成
    if (phaseProgress >= 100 && this.onPhaseComplete) {
      this.onPhaseComplete(phase);
    }
  }

  // 模拟进度更新 (在资源加载前启动)
  startProgressSimulation() {
    let simulatedProgress = 0;
    const maxProgress = 25; // 最多模拟到25%

    const simulate = () => {
      if (simulatedProgress < maxProgress) {
        simulatedProgress += Math.random() * 2; // 随机增长0-2%
        simulatedProgress = Math.min(simulatedProgress, maxProgress);

        if (
          this.onProgress &&
          this.loadProgress.totalProgress < simulatedProgress
        ) {
          this.onProgress(simulatedProgress, 'simulation', simulatedProgress);
        }

        setTimeout(simulate, 200 + Math.random() * 300); // 200-500ms间隔
      }
    };

    simulate();
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
          this.updateProgress(priority, true);
          console.log(`✅ 模型加载完成: ${url}`);
          resolve(gltf);
        },
        progress => {
          // 细粒度进度更新
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`📦 ${url} 加载进度: ${percent.toFixed(1)}%`);
          }
        },
        error => {
          console.error(`❌ 模型加载失败: ${url}`, error);
          this.updateProgress(priority, true); // 即使失败也要更新进度
          reject(error);
        }
      );
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  // 加载HDR环境贴图
  async loadHDR(url, priority = 'high') {
    if (this.loadedResources.has(url)) {
      return this.loadedResources.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        url,
        texture => {
          this.loadedResources.set(url, texture);
          this.updateProgress(priority, true);
          console.log(`✅ HDR加载完成: ${url}`);
          resolve(texture);
        },
        progress => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`🌅 ${url} 加载进度: ${percent.toFixed(1)}%`);
          }
        },
        error => {
          console.error(`❌ HDR加载失败: ${url}`, error);
          this.updateProgress(priority, true);
          reject(error);
        }
      );
    });

    return promise;
  }

  // 加载纹理
  async loadTexture(url, priority = 'high') {
    if (this.loadedResources.has(url)) {
      return this.loadedResources.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => {
          this.loadedResources.set(url, texture);
          this.updateProgress(priority, true);
          console.log(`✅ 纹理加载完成: ${url}`);
          resolve(texture);
        },
        progress => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`🖼️ ${url} 加载进度: ${percent.toFixed(1)}%`);
          }
        },
        error => {
          console.error(`❌ 纹理加载失败: ${url}`, error);
          this.updateProgress(priority, true);
          reject(error);
        }
      );
    });

    return promise;
  }

  // 阶段1: 加载核心资源
  async loadCoreResources() {
    this.loadProgress.phase = 0;
    const priorities = this.getResourcePriority();

    // 设置资源总数
    this.loadProgress.resources.high.total = priorities.high.length;

    console.log('🚀 阶段1: 开始加载核心资源...');

    const promises = priorities.high.map(url => {
      if (url.endsWith('.glb')) {
        return this.loadGLTF(url, 'high');
      } else if (url.endsWith('.hdr')) {
        return this.loadHDR(url, 'high');
      } else if (url.endsWith('.png')) {
        return this.loadTexture(url, 'high');
      }
    });

    await Promise.all(promises);
    console.log('✅ 阶段1完成: 核心资源加载完成，场景可以初始化');
    return true;
  }

  // 阶段2: 加载中优先级资源
  async loadMediumResources() {
    this.loadProgress.phase = 1;
    const priorities = this.getResourcePriority();

    // 设置资源总数
    this.loadProgress.resources.medium.total = priorities.medium.length;

    console.log('📦 阶段2: 开始加载中优先级资源...');

    const promises = priorities.medium.map(url => this.loadGLTF(url, 'medium'));
    await Promise.all(promises);

    console.log('✅ 阶段2完成: 中优先级资源加载完成');
    return true;
  }

  // 阶段3: 加载低优先级资源
  async loadLowResources() {
    this.loadProgress.phase = 2;
    const priorities = this.getResourcePriority();

    // 设置资源总数
    this.loadProgress.resources.low.total = priorities.low.length;

    console.log('🎨 阶段3: 开始加载装饰性资源...');

    const promises = priorities.low.map(url => this.loadGLTF(url, 'low'));
    await Promise.all(promises);

    console.log('✅ 阶段3完成: 所有资源加载完成');
    return true;
  }

  // 完整的分阶段加载流程
  async loadAllResources() {
    try {
      // 开始进度模拟
      this.startProgressSimulation();

      // 阶段1: 核心资源 (必须完成)
      await this.loadCoreResources();

      // 阶段2和3可以并行或延迟加载
      return {
        coreComplete: true,
        loadMedium: () => this.loadMediumResources(),
        loadLow: () => this.loadLowResources(),
      };
    } catch (error) {
      console.error('资源加载失败:', error);
      throw error;
    }
  }

  // 获取已加载的资源
  getResource(url) {
    return this.loadedResources.get(url);
  }

  // 检查资源是否已加载
  isResourceLoaded(url) {
    return this.loadedResources.has(url);
  }

  // 获取加载进度
  getProgress() {
    return this.loadProgress;
  }
}

export const resourceManager = new ResourceManager();
