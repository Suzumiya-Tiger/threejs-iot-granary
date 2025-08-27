# TruckAnimation 卡车动画代码流程详解

## 整体流程概述

卡车动画的执行流程：

1. **初始化** → 2. **计算路径** → 3. **加载模型** → 4. **创建动画** → 5. **循环播放**

## calculateRoadPath() 核心计算流程

### 道路分析算法

```typescript
calculateRoadPath() {
  if (this.roadModel) {
    // 第1步：获取道路模型的3D边界框
    const box = new THREE.Box3().setFromObject(this.roadModel);
    const size = box.getSize(new THREE.Vector3());
    
    // 第2步：判断道路的主要延伸方向
    if (size.x > size.z) {
      // 道路沿X轴延伸（东西向道路）
    } else {
      // 道路沿Z轴延伸（南北向道路）
    }
  }
}
```

### 关键计算逻辑

**1. 边界框计算：**

```javascript
const box = new THREE.Box3().setFromObject(this.roadModel);
// box.min: 道路模型的最小坐标点
// box.max: 道路模型的最大坐标点
// size: 道路在各轴向的尺寸
```

**2. 方向判断：**

```javascript
if (size.x > size.z) {
  // X轴尺寸大于Z轴 → 道路是水平方向的
  this.roadPath = [
    { x: box.min.x + size.x * 0.1, z: this.roadPosition.z - 4 }, // 起点：左侧10%位置
    { x: this.roadPosition.x, z: this.roadPosition.z - 4 },      // 中点：道路中心
    { x: box.max.x - size.x * 0.1, z: this.roadPosition.z - 4 } // 终点：右侧90%位置
  ];
}
```

**3. 路径点计算细节：**

| 路径点 | X坐标计算                | Z坐标设置          | 含义              |
| ------ | ------------------------ | ------------------ | ----------------- |
| 起点   | box.min.x + size.x * 0.1 | roadPosition.z - 4 | 道路左端向内10%处 |
| 中点   | this.roadPosition.x      | roadPosition.z - 4 | 道路中心位置      |
| 终点   | box.max.x - size.x * 0.1 | roadPosition.z - 4 | 道路右端向内10%处 |



## 动画系统原理

### 关键帧动画实现

```javascript
createMovementAnimation() {
  // 创建位置关键帧轨道
  const positionKeyframes = new THREE.VectorKeyframeTrack(
    '.position',                                    // 目标属性
    [0, this.animationDuration / 2, this.animationDuration], // 时间轴
    [
      // 起点坐标 (t=0s)
      this.roadPath[0].x, this.roadPosition.y + 5, this.roadPath[0].z - 4,
      // 中点坐标 (t=5s)  
      this.roadPath[1].x, this.roadPosition.y + 5, this.roadPath[0].z - 4,
      // 终点坐标 (t=10s)
      this.roadPath[2].x, this.roadPosition.y + 5, this.roadPath[0].z - 4,
    ]
  );
}
```

### 动画循环机制

```javascript
// 动画完成回调
this.mixer.addEventListener('finished', () => {
  setTimeout(() => {
    this.resetTruckPosition(); // 5秒后重置位置
  }, this.waitTime * 1000);
});

// 重置并重新开始
resetTruckPosition() {
  // 重置到起点
  this.truck.position.set(/* 起点坐标 */);
  this.isAnimating = false;
  this.startAnimationLoop(); // 重新开始动画
}
```

## 代码中的问题分析

### 潜在问题1：Z坐标固定

```javascript
// 问题代码：
this.roadPath[0].z - 4,  // 起点Z
this.roadPath[0].z - 4,  // 中点Z  
this.roadPath[0].z - 4,  // 终点Z
```

**问题：** 所有关键帧的Z坐标都使用 `roadPath[0].z - 4`，这意味着：

- 卡车始终在道路南侧4个单位的平行线上移动
- 没有沿着道路的实际中心线行驶

**修正建议：**

```javascript
// 应该使用各自的Z坐标
this.roadPath[0].z,  // 起点Z
this.roadPath[1].z,  // 中点Z
this.roadPath[2].z,  // 终点Z
```

### 潜在问题2：南北向道路处理

```javascript
// 南北向道路的情况
else {
  this.roadPath = [
    { x: this.roadPosition.x, z: box.min.z + size.z * 0.1 },
    { x: this.roadPosition.x, z: this.roadPosition.z },
    { x: this.roadPosition.x, z: box.max.z - size.z * 0.1 },
  ];
}
```

但在关键帧中仍然使用了 `this.roadPath[0].z - 4`，这对南北向道路是不合理的。

## 总结

这个卡车动画系统的设计思路是：

1. **智能路径计算**：根据道路模型自动计算最佳行驶路径
2. **关键帧动画**：使用Three.js的AnimationMixer实现平滑移动
3. **循环播放**：动画完成后自动重置并重新开始

核心算法是通过分析道路模型的边界框来确定道路的主要方向，然后在道路的10%-90%范围内设置行驶路径，避免卡车驶出道路边界。