import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class TruckAnimation {
  constructor(scene, roadPosition) {
    this.scene = scene;
    this.roadPosition = roadPosition.clone();
    this.truck = null;
    this.mixer = null;
    this.isAnimating = false;
    this.clock = new THREE.Clock();

    // 动画参数
    this.animationDuration = 10; // 10秒完成一次移动
    this.waitTime = 5; // 5秒等待时间

    // 道路路径点（需要根据实际道路调整）
    this.roadPath = [
      { x: this.roadPosition.x - 100, z: this.roadPosition.z }, // 起点
      { x: this.roadPosition.x, z: this.roadPosition.z }, // 中点
      { x: this.roadPosition.x + 100, z: this.roadPosition.z }, // 终点
    ];

    this.loadTruck();
  }

  loadTruck() {
    const loader = new GLTFLoader();
    loader.load(
      './truck.glb',
      gltf => {
        this.truck = gltf.scene;

        // 调整卡车大小和初始位置
        this.truck.scale.set(2, 2, 2); // 根据需要调整大小
        this.truck.position.set(
          this.roadPath[0].x,
          this.roadPosition.y + 1, // 稍微抬高避免与地面重叠
          this.roadPath[0].z
        );

        // 设置初始朝向（朝向道路终点）
        this.truck.lookAt(
          this.roadPath[2].x,
          this.roadPosition.y,
          this.roadPath[2].z
        );

        this.scene.add(this.truck);
        console.log('卡车模型加载完成');

        // 开始动画循环
        this.startAnimationLoop();
      },
      undefined,
      error => {
        console.error('卡车模型加载失败:', error);
      }
    );
  }

  startAnimationLoop() {
    if (!this.truck || this.isAnimating) return;

    this.isAnimating = true;
    console.log('开始卡车动画');

    // 创建关键帧动画
    this.createMovementAnimation();
  }

  createMovementAnimation() {
    // 创建位置关键帧
    const positionKeyframes = new THREE.VectorKeyframeTrack(
      '.position',
      [0, this.animationDuration / 2, this.animationDuration], // 时间点
      [
        // 起点
        this.roadPath[0].x,
        this.roadPosition.y + 1,
        this.roadPath[0].z,
        // 中点
        this.roadPath[1].x,
        this.roadPosition.y + 1,
        this.roadPath[1].z,
        // 终点
        this.roadPath[2].x,
        this.roadPosition.y + 1,
        this.roadPath[2].z,
      ]
    );

    // 创建动画剪辑
    const clip = new THREE.AnimationClip(
      'truckMovement',
      this.animationDuration,
      [positionKeyframes]
    );

    // 创建动画混合器
    this.mixer = new THREE.AnimationMixer(this.truck);
    const action = this.mixer.clipAction(clip);

    // 设置动画只播放一次
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;

    // 动画完成后的回调
    this.mixer.addEventListener('finished', () => {
      console.log('卡车到达终点，等待5秒后重新开始');
      setTimeout(() => {
        this.resetTruckPosition();
      }, this.waitTime * 1000);
    });

    // 开始播放动画
    action.play();
  }

  resetTruckPosition() {
    if (!this.truck) return;

    // 重置卡车到起点
    this.truck.position.set(
      this.roadPath[0].x,
      this.roadPosition.y + 1,
      this.roadPath[0].z
    );

    // 重置朝向
    this.truck.lookAt(
      this.roadPath[2].x,
      this.roadPosition.y,
      this.roadPath[2].z
    );

    this.isAnimating = false;

    // 重新开始动画循环
    this.startAnimationLoop();
  }

  // 更新动画（需要在渲染循环中调用）
  update() {
    if (this.mixer) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }
  }

  // 停止动画
  stop() {
    this.isAnimating = false;
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    if (this.truck && this.scene) {
      this.scene.remove(this.truck);
    }
  }

  // 更新道路路径（如果需要自定义路径）
  setRoadPath(pathPoints) {
    this.roadPath = pathPoints;
  }
}

export default TruckAnimation;
