# 物联网智慧粮仓实时监控系统

## 📋 项目立项背景

本项目是一个基于Web3D技术的**物联网智慧粮仓实时监控系统**，旨在通过三维可视化技术模拟现代农业物联网监控场景。

### 🎯 核心功能
- **实时环境监控**：模拟粮仓温度、湿度、粮食重量等关键指标的实时监测
- **无人机巡检系统**：集成FPV无人机模型，模拟空中巡检和监控功能
- **火灾预警系统**：三维可视化展示火灾险情，提供直观的报警效果
- **交互式信息查询**：点击粮仓可实时查看粮食作物类型、重量、仓储状态等详细信息
- **智能运输监控**：模拟粮食运输车辆的路径追踪和状态监控

### 🌾 应用场景
适用于大型粮食储备基地、农业合作社、粮食加工企业等需要进行粮仓集中管理和监控的场景。

---

## 🛠 技术栈与运行环境

### 核心技术栈
- **前端框架**: Vanilla JavaScript (ES6+)
- **3D图形库**: Three.js v0.179.1
- **构建工具**: Vite v5.4.0
- **开发环境**: Node.js + pnpm

### 依赖详情
```json
{
  "dependencies": {
    "three": "^0.179.1"
  },
  "devDependencies": {
    "@types/three": "^0.179.0",
    "vite": "^5.4.0"
  }
}
```

### 🚀 快速启动

#### 环境要求
- Node.js >= 16.0.0
- pnpm (推荐) 或 npm

#### 安装与运行
```bash
# 1. 克隆项目
git clone <repository-url>
cd farm-iot

# 2. 安装依赖
pnpm install
# 或使用 npm install

# 3. 启动开发服务器
pnpm dev
# 或使用 npm run dev

# 4. 访问应用
# 默认地址: http://localhost:3000
```

#### 构建生产版本
```bash
pnpm build
pnpm preview
```

---

## 🏗 项目架构详解

### 📁 目录结构
```
farm-iot/
├── public/ # 静态资源目录
│ ├── .glb # 3D模型文件
│ ├── .hdr # HDR环境贴图
│ └── .png # 纹理贴图
├── src/
│ ├── assets/ # 项目资源
│ │ ├── 信息背景.png
│ │ ├── 温度.png
│ │ ├── 火焰.png
│ │ └── 豆子/ # 粮食作物图标
│ ├── main.js # 🔥 主入口文件
│ ├── mesh.js # 场景网格和模型管理
│ ├── model/ # 3D模型控制器
│ │ ├── flame.js # 火焰效果系统
│ │ ├── fvp.js # 无人机动画
│ │ └── truckAnimation.js # 卡车运输动画
│ ├── utils/ # 工具模块
│ │ ├── choose.js # 对象选择和后处理
│ │ ├── messageTag.js # 信息标签管理
│ │ └── tag.js # CSS2D标签系统
│ └── mocks/
│ └── messageData.js # 模拟数据
├── index.html # HTML入口
└── vite.config.js # Vite配置
```

### 🎮 主文件架构 (main.js)

#### 核心初始化流程
```mermaid
graph TD
    A[导入Three.js核心库] --> B[创建场景Scene]
    B --> C[设置光照系统]
    C --> D[加载HDR环境贴图]
    D --> E[创建相机和渲染器]
    E --> F[初始化轨道控制器]
    F --> G[设置后处理系统]
    G --> H[启动渲染循环]
```

#### 关键代码模块

**1. 场景基础设置**
```javascript
// 创建Three.js场景
const scene = new THREE.Scene();

// 添加指数雾效果，营造大气感
const fog = new THREE.FogExp2(0xb0c4de, 0.0005);
scene.fog = fog;

// 导入主要的网格模型群组
scene.add(mesh);
```

**2. 光照系统配置**
```javascript
// 环境光：提供基础照明
let ambientLight = new THREE.AmbientLight(0xffffff, 0.15);

// 方向光：模拟太阳光，支持阴影
const directionalLight = new THREE.DirectionalLight(0xfff5e6, 0.4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
```

**3. HDR环境贴图**
```javascript
const rgbeLoader = new RGBELoader();
rgbeLoader.load('./qwantani_moonrise_puresky_4k.hdr', envMap => {
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = envMap;
  scene.environment = envMap;
  scene.environmentIntensity = 0.3;
});
```

**4. 渲染循环优化**
```javascript
function render() {
  controls.update();                    // 更新相机控制器
  
  if (window.truckAnimation) {          // 更新卡车动画
    window.truckAnimation.update();
  }
  
  if (composer) {                       // 后处理渲染
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
  
  labelRenderer.render(scene, camera);  // CSS2D标签渲染
  requestAnimationFrame(render);        // 递归调用
}
```

---

## 🎯 核心模型系统详解

### 🔥 火焰预警系统 (flame.js)

#### 触发方式
- **自动触发**：系统启动3秒后开始持续随机生成火焰报警
- **随机间隔**：每3-8秒随机在1-2个粮仓出现火焰
- **持续时间**：每次火焰持续0-5秒随机时长

#### Three.js技术实现
```javascript
// 1. 精灵材质 + 帧动画
const fireTexture = textureLoader.load('./src/assets/火焰.png');
fireTexture.repeat.set(1/15, 1); // 15帧火焰动画

// 2. 平面几何体 + 透明材质
const fireGeometry = new THREE.PlaneGeometry(w, h);
const fireMaterial = new THREE.MeshBasicMaterial({
  map: fireTexture,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide
});

// 3. 帧动画循环
function animateFlame() {
  fireTexture.offset.x += 1/15; // 切换到下一帧
  if (fireTexture.offset.x >= 1) {
    fireTexture.offset.x = 0;   // 循环播放
  }
}
```

#### 核心特性
- **智能定位**：自动获取粮仓世界坐标，根据粮仓类型调整火焰高度
- **避重机制**：同一粮仓不会同时出现多个火焰
- **动态标签**：火焰出现时自动生成警告标签

### 🚁 无人机巡检系统 (fvp.js)

#### 触发方式
- **自动启动**：场景加载完成后自动开始圆形巡航
- **持续运行**：24/7不间断巡检模式

#### Three.js技术实现
```javascript
// 1. GLTF模型加载
const loader = new GLTFLoader();
loader.load('./dji_fvp.glb', gltf => {
  const fvp = gltf.scene.clone();
  fvp.scale.set(5, 5, 5);
});

// 2. 圆形路径动画
const R = 150; // 巡航半径
const H = 60;  // 巡航高度

function updateDronePosition() {
  const angle = (Date.now() * 0.001) % (Math.PI * 2);
  plane.position.x = Math.cos(angle) * R;
  plane.position.z = Math.sin(angle) * R;
  plane.position.y = H;
  
  // 无人机朝向运动方向
  plane.lookAt(
    Math.cos(angle + 0.1) * R,
    H,
    Math.sin(angle + 0.1) * R
  );
}
```

#### 技术特点
- **路径规划**：圆形航线，覆盖整个粮仓区域
- **姿态控制**：动态调整无人机朝向，模拟真实飞行
- **高度管理**：保持恒定巡航高度，避免碰撞

### 🚛 智能运输系统 (truckAnimation.js)

#### 触发方式
- **自动循环**：动画完成后等待5秒自动重新开始
- **路径智能**：根据道路模型自动计算最优行驶路径

#### Three.js技术实现
```javascript
// 1. 路径分析算法
calculateRoadPath() {
  const box = new THREE.Box3().setFromObject(this.roadModel);
  const size = box.getSize(new THREE.Vector3());
  
  if (size.x > size.z) {
    // 东西向道路
    this.roadPath = [
      { x: box.min.x + size.x * 0.1, z: this.roadPosition.z },
      { x: this.roadPosition.x, z: this.roadPosition.z },
      { x: box.max.x - size.x * 0.1, z: this.roadPosition.z }
    ];
  }
}

// 2. 关键帧动画系统
createMovementAnimation() {
  const positionKeyframes = new THREE.VectorKeyframeTrack(
    '.position',
    [0, this.animationDuration / 2, this.animationDuration],
    [/* 起点，中点，终点坐标 */]
  );
  
  const clip = new THREE.AnimationClip('move', this.animationDuration, [positionKeyframes]);
  const action = this.mixer.clipAction(clip);
}
```

### 🏷️ 交互标签系统 (tag.js & choose.js)

#### 触发方式
- **点击触发**：鼠标点击粮仓模型时显示详细信息
- **实时更新**：信息面板显示数字滚动动画

#### Three.js技术实现
```javascript
// 1. CSS2D标签渲染器
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.pointerEvents = 'none';

// 2. 射线拾取系统
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function choose(event, messageTag) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(granaryArr);
}

// 3. 后处理高亮效果
const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.selectedObjects = [selectedMesh];
```

#### 技术特性
- **精确拾取**：基于射线检测的精确模型选择
- **视觉反馈**：OutlinePass实现选中物体高亮边框
- **信息同步**：点击后同步更新HTML信息面板
- **动画效果**：数字滚动动画提升用户体验

---

## 🎨 视觉效果技术

### 后处理管道
- **FXAA抗锯齿**：消除模型边缘锯齿
- **OutlinePass**：选中物体高亮边框
- **EffectComposer**：多通道渲染流水线

### 材质与光照
- **PBR材质**：物理真实感渲染
- **HDR环境映射**：真实环境反射
- **动态阴影**：PCF软阴影算法

### 性能优化
- **LOD系统**：根据距离调整模型精度
- **纹理压缩**：优化模型加载速度
- **渲染优化**：限制像素比，避免过度渲染

---

## 🔧 开发指南

### 自定义配置
- 修改 `vite.config.js` 调整开发服务器设置
- 编辑 `messageData.js` 更新粮仓数据
- 调整 `main.js` 中的光照和雾效参数

### 扩展功能
- 添加新的3D模型到 `public/` 目录
- 在 `model/` 目录创建新的动画控制器
- 扩展 `utils/` 工具模块

---

## 📝 更新日志

### v1.0.0
- ✅ 基础3D场景搭建
- ✅ 粮仓模型交互系统
- ✅ 火焰预警效果
- ✅ 无人机巡检动画
- ✅ 卡车运输模拟
- ✅ 信息标签系统

---

## TruckAnimation 卡车动画代码流程详解

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

## 🔥 火焰预警系统深度技术解析

### 系统架构设计

火焰预警系统采用**分层管理**架构，包含以下核心组件：

1. **火焰生成器** (`flame.js`) - 负责单个火焰效果的创建和动画
2. **火焰管理器** (`mesh.js`) - 负责全局火焰的调度和生命周期管理  
3. **活跃火焰追踪器** - 防止同一粮仓重复创建火焰

### 🎬 火焰动画技术原理

#### 精灵帧动画实现
```javascript
// 火焰贴图的帧动画系统
const fireTexture = textureLoader.load('./src/assets/火焰.png');
let nums = 15; // 总帧数

// 纹理重复设置：水平方向1/15，垂直方向1
fireTexture.repeat.set(1 / nums, 1);

function updateLoop() {
  t += 0.1; // 动画速度控制
  if (t > nums) t = 0; // 循环播放
  
  // 关键：通过偏移量实现帧切换
  fireTexture.offset.x = Math.floor(t) / nums;
  requestAnimationFrame(updateLoop);
}
```

**技术要点：**
- 使用 `texture.offset.x` 实现水平帧切换
- `Math.floor(t)` 确保整数帧索引，避免插值模糊
- `requestAnimationFrame` 保证60FPS流畅播放

#### 3D火焰几何体构造
```javascript
// 创建四个不同角度的火焰平面
const flame = new THREE.Group();
const model = new THREE.Mesh(fireGeometry, fireMaterial);

flame.add(
  model,                                    // 0度
  model.clone().rotateY(Math.PI / 2),      // 90度
  model.clone().rotateY(Math.PI / 4),      // 45度  
  model.clone().rotateY((Math.PI / 4) * 3) // 135度
);
```

**设计理念：**
- **多角度观察**：四个平面确保从任意角度都能看到火焰效果
- **立体感增强**：交叉排列的平面营造3D火焰体积感
- **性能优化**：使用 `clone()` 复用几何体和材质

### 🎯 智能火焰调度系统

#### 粮仓类型适配算法
```javascript
function granaryFlame(name) {
  const granary = gltf.scene.getObjectByName(name);
  const pos = new THREE.Vector3();
  granary.getWorldPosition(pos);
  
  // 根据粮仓类型调整火焰高度
  if (granary.parent.name === '立筒仓') {
    flame.position.y += 36;      // 高层粮仓
  } else if (granary.parent.name === '浅圆仓') {
    flame.position.y += 20;      // 中层粮仓
  } else if (granary.parent.name === '平房仓') {
    flame.position.y += 17;      // 低层粮仓
  }
  
  flame.position.y += -4; // 微调至合适视觉位置
}
```

#### 防重复机制
```javascript
// 使用Map数据结构追踪活跃火焰
let activeFlames = new Map();

// 过滤算法：排除已有火焰的粮仓
const availableGranaries = granaryArr.filter(
  granary => !activeFlames.has(granary.name)
);

// 火焰创建时注册
activeFlames.set(granary.name, flame);

// 火焰销毁时注销
activeFlames.delete(granaryName);
```

### 🔄 持续监控调度算法

#### 递归调度器
```javascript
function startFlameSystem() {
  function scheduleNextFlame() {
    // 随机间隔算法：3-8秒正态分布
    const nextInterval = Math.random() * 5000 + 3000;
    
    setTimeout(() => {
      createRandomFlames();
      scheduleNextFlame(); // 尾递归实现持续调度
    }, nextInterval);
  }
  
  scheduleNextFlame();
}
```

**调度策略：**
- **随机性**：避免规律性，提升真实感
- **负载均衡**：最多同时2个火焰，防止性能压力
- **优雅退出**：通过 `flameSystemRunning` 标志控制系统停止

---

## 🚁 无人机巡检系统深度技术解析

### 飞行控制算法

#### 圆形轨道数学模型
```javascript
// 巡航参数设计
const R = 150; // 巡航半径(米)
const H = 60;  // 巡航高度(米)

function loop() {
  angle += 0.01; // 角速度：0.01弧度/帧 ≈ 0.57°/帧
  
  // 圆形轨道参数方程
  const x = R * Math.cos(angle);
  const z = R * Math.sin(angle);
  
  plane.position.set(x, H, z);
}
```

**轨道设计考量：**
- **覆盖范围**：150米半径覆盖整个粮仓区域
- **安全高度**：60米高度避免建筑物碰撞
- **巡航速度**：约36秒完成一圈，适合监控频率

#### 智能姿态控制系统

##### 方向向量计算
```javascript
// 无人机默认朝向（模型坐标系）
const defaultDirection = new THREE.Vector3(-1, 0, 0);

// 目标指向中心的方向向量
const target = new THREE.Vector3(0, H, 0);
const b = target.clone().sub(plane.position).normalize();
```

##### 四元数姿态融合
```javascript
// 1. 基础朝向四元数：使无人机朝向中心
const q = new THREE.Quaternion().setFromUnitVectors(defaultDirection, b);

// 2. 侧偏四元数：模拟真实飞行姿态
const rollQuaternion = new THREE.Quaternion();

// X轴旋转：机身下压30度
rollQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 6);

// Z轴旋转：机身侧倾18度
rollQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 10);

// 3. 四元数复合变换
const newQ = q0.clone().multiply(q).multiply(rollQuaternion);
plane.quaternion.copy(newQ);
```

**姿态控制技术点：**
- **向量归一化**：确保方向向量长度为1，避免缩放影响
- **四元数乘法**：按顺序应用旋转变换
- **插值平滑**：防止姿态突变，提升视觉效果

### 🎮 模型加载与优化

#### GLTF模型处理流程
```javascript
loader.load('./dji_fvp.glb', 
  gltf => {
    const fvp = gltf.scene.clone(); // 深拷贝避免原模型污染
    fvp.scale.set(5, 5, 5);        // 统一缩放
    plane.add(fvp);                // 添加到飞行组
  },
  progress => {
    // 加载进度监控
    console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
  },
  error => {
    // 错误处理与降级方案
    console.error('模型加载失败:', error);
    createFallbackDrone(); // 创建简单几何体替代
  }
);
```

#### 性能优化策略
```javascript
// 初始旋转优化：预设无人机朝向
plane.rotation.y = -Math.PI / 2;

// 组合变换：减少每帧计算量
const q0 = plane.quaternion.clone(); // 缓存初始四元数

// 批量更新：一次性更新位置和旋转
plane.position.set(x, H, z);
plane.quaternion.copy(newQ);
```

### 🔬 数学原理深度解析

#### 角速度与线速度关系

```tcl
角速度 ω = 0.01 rad/frame
线速度 v = ω × R = 0.01 × 150 = 1.5 m/frame
帧率 = 60 FPS
实际速度 = 1.5 × 60 = 90 m/s ≈ 324 km/h
```

#### 四元数旋转合成数学

最终旋转 = Q₀ × Q_direction × Q_roll

其中：

- Q₀: 初始姿态四元数

- Q_direction: 朝向目标的旋转

- Q_roll: 飞行姿态修正

### 🛡️ 安全与容错机制

#### 边界检测
```javascript
// 高度限制
if (plane.position.y < 30) plane.position.y = 30;
if (plane.position.y > 100) plane.position.y = 100;

// 半径限制
const distance = Math.sqrt(x² + z²);
if (distance > 200) {
  // 强制拉回安全区域
  plane.position.x = x * (200 / distance);
  plane.position.z = z * (200 / distance);
}
```

#### 模型加载容错
```javascript
function createFallbackDrone() {
  // 简单几何体替代方案
  const geometry = new THREE.ConeGeometry(2, 8, 4);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const fallbackDrone = new THREE.Mesh(geometry, material);
  plane.add(fallbackDrone);
}
```

---

## 🔧 系统集成与协同工作

### 火焰与无人机的协同机制

#### 优先级调度
```javascript
// 无人机检测到火焰时的响应行为
function detectFlameResponse() {
  if (activeFlames.size > 0) {
    // 降低巡航高度，靠近火焰区域
    H = 40; 
    // 减慢巡航速度，增加监控精度
    angle += 0.005;
    // 发送警报信号
    triggerAlarmSystem();
  }
}
```

#### 性能协调
```javascript
// 当火焰数量增多时，适当降低无人机渲染精度
if (activeFlames.size >= 2) {
  // 降低无人机模型LOD等级
  fvp.scale.set(3, 3, 3);
  // 减少姿态更新频率
  if (frameCount % 2 === 0) updateDroneAttitude();
}
```

这样的深度技术解析为开发者提供了完整的实现思路和优化方向，同时也便于后续的功能扩展和性能调优。