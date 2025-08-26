// 导入Three.js核心库
import * as THREE from 'three';
// 引入GLTF加载器，用于加载3D模型文件
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { tag } from './utils/tag.js';
import { choose, chooseMesh } from './utils/choose.js';
import { getTag } from './utils/messageTag.js';
import messageData from './mocks/messageData.js';
import { createFlame, stopFlame } from './model/flame.js';
import TruckAnimation from './model/truckAnimation.js';
const group = new THREE.Group();

const loader = new GLTFLoader();
// 创建纹理加载器
const textureLoader = new THREE.TextureLoader();
// 所有粮仓模型的集合
let granaryArr = [];
// 内容需要改变的HTML元素对应的id
let idArr = [
  'granaryName',
  'temperature',
  'grain',
  'grainImg',
  'weight',
  'granaryHeight',
  'grainHeight',
];
// 获取标签
const messageTag = getTag('messageTag');

loader.load('./model.glb', gltf => {
  // 先加载您的地面纹理
  const groundTexture = textureLoader.load('./wispy-grass-meadow_albedo.png');
  groundTexture.wrapS = THREE.MirroredRepeatWrapping;
  groundTexture.wrapT = THREE.MirroredRepeatWrapping;
  groundTexture.repeat.set(4, 4);

  const model = gltf.scene;
  console.log('model', model);

  // getObjectByName能够穿透子对象找到对应的目标模型
  const targetModel = model.getObjectByName('平原');
  if (targetModel) {
    console.log('targetModel', targetModel);

    const targetMesh = targetModel;
    // 如果是Mesh，直接替换材质
    if (targetMesh.type === 'Mesh') {
      targetMesh.material = new THREE.MeshStandardMaterial({
        map: groundTexture,
      });
    }
  }
  const roadModel = model.getObjectByName('马路');
  console.log('roadModel', roadModel);

  const roadPos = new THREE.Vector3();
  roadModel.getWorldPosition(roadPos);
  console.log('道路位置:', roadPos);

  // 创建卡车动画
  const truckAnimation = new TruckAnimation(group, roadPos);

  // 将动画更新函数导出，以便在主渲染循环中调用
  window.truckAnimation = truckAnimation;

  const farmGroup = gltf.scene.getObjectByName('粮仓');
  farmGroup.traverse(obj => {
    if (obj.type === 'Mesh') {
      // 为每个网格克隆独立的材质
      obj.material = obj.material.clone();

      // 收集网格模型
      granaryArr.push(obj);
      const label = tag(obj.name);
      const pos = new THREE.Vector3();

      // 利用pos来获取obj的实际位置
      obj.getWorldPosition(pos);

      if (obj.parent.name === '立筒仓') {
        pos.y += 36;
      } else if (obj.parent.name === '浅圆仓') {
        pos.y += 20;
      } else if (obj.parent.name === '立筒仓') {
        pos.y += 36;
      } else if (obj.parent.name === '平房仓') {
        pos.y += 17;
      }
      label.position.copy(pos);
      group.add(label);
    }
  });
  group.add(model);

  function granaryFlame(name) {
    const granary = gltf.scene.getObjectByName(name);
    if (!granary) {
      console.log(`找不到名为 ${name} 的粮仓模型`);
      return null;
    }

    const pos = new THREE.Vector3();
    // 获取粮仓granary世界坐标设置火焰位置
    granary.getWorldPosition(pos);
    const flame = createFlame();
    flame.position.copy(pos);
    if (granary.parent.name === '立筒仓') {
      flame.position.y += 36;
    } else if (granary.parent.name === '浅圆仓') {
      flame.position.y += 20;
    } else if (granary.parent.name === '平房仓') {
      flame.position.y += 17;
    }
    flame.position.y += -4;
    console.log(`为 ${name} 创建火焰，位置:`, flame.position);

    // 火焰警示标签
    const fireMessageTag = tag('警告⚠️：粮仓' + name + '失火');
    flame.add(fireMessageTag);
    fireMessageTag.position.y += 40;
    flame.tag = fireMessageTag;
    return flame;
  }

  // 随机生成火焰效果
  function createRandomFlames() {
    // 从 granaryArr 中随机选择粮仓
    if (granaryArr.length > 0) {
      // 随机选择1-3个粮仓
      const flameCount = Math.floor(Math.random() * 3) + 1;
      const selectedGranaries = [];
      const flames = [];

      // 随机选择粮仓（避免重复）
      const shuffledGranaries = [...granaryArr].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(flameCount, shuffledGranaries.length); i++) {
        selectedGranaries.push(shuffledGranaries[i]);
      }

      // 为选中的粮仓创建火焰
      selectedGranaries.forEach(granary => {
        const flame = granaryFlame(granary.name);
        if (flame) {
          model.add(flame);
          flames.push(flame);
          console.log(`为粮仓 ${granary.name} 添加火焰效果`);
        }
      });

      // 3秒后移除所有火焰
      setTimeout(() => {
        stopFlame();
        flames.forEach(flame => {
          // 如果火焰有关联的标签，先移除标签
          if (flame.tag) {
            flame.remove(flame.tag);
            console.log('移除火焰标签');
          }
          // 移除火焰本身
          model.remove(flame);
          console.log('移除火焰效果');
        });
        console.log('所有火焰效果已清除');
      }, 3000);
    }
  }

  // 启动随机火焰效果
  createRandomFlames();

  addEventListener('click', function (e) {
    if (chooseMesh) {
      messageTag.element.style.visibility = 'hidden';
    }
    choose(e, messageTag);

    if (chooseMesh) {
      idArr.forEach(function (id) {
        const dom = document.getElementById(id);
        dom.innerHTML = messageData[chooseMesh.name][id];
      });
    }

    messageTag.element.style.visibility = 'visible';
    if (chooseMesh) {
      messageTag.element.style.visibility = 'visible';

      // 使用射线交点的世界坐标
      if (chooseMesh.point) {
        const labelPos = chooseMesh.point.clone();
        labelPos.y += 20; // 在交点上方显示标签
        messageTag.position.copy(labelPos);
        // 关键：确保标签在场景中
        if (!group.children.includes(messageTag)) {
          group.add(messageTag);
        }
      } else {
        // 备用方案：获取模型的世界坐标
        const worldPos = new THREE.Vector3();
        chooseMesh.getWorldPosition(worldPos);
        worldPos.y += 20;
        messageTag.position.copy(worldPos);
      }

      // 数字滚动动画
      const weightDOM = document.getElementById('weight');
      weightDOM.innerHTML = 0;
      const weightMax = messageData[chooseMesh.name]['weight']; //粮仓重量
      let weight = 0; //粮仓初始重量
      const interval = setInterval(function () {
        if (weight < weightMax) {
          weight += Math.floor(weightMax / 50); //重量累加
          document.getElementById('weight').innerHTML = weight;
        } else {
          clearInterval(interval); //一旦达到粮食重量，取消周期性函数interval
        }
      }, 5);
    } else {
      messageTag.element.style.visibility = 'hidden';
    }
  });
});
export { granaryArr };
export default group;
