import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/addons/renderers/CSS2DRenderer.js';

// 创建一个HTML标签对象
function tag(domID) {
  var dom = document.getElementById(domID);
  //dom元素包装为CSS2模型对象CSS2DObject
  var label = new CSS2DObject(dom);
  dom.style.pointerEvents = 'none'; //避免HTML标签遮挡三维场景的鼠标事件
  // 设置HTML元素标签在three.js世界坐标中位置
  // label.position.set(x, y, z);
  return label; //返回CSS2模型标签
}

// 创建一个CSS2渲染器CSS2DRenderer
var labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
// 相对标签原来位置偏移
labelRenderer.domElement.style.top = '0px'; // 移除偏移
labelRenderer.domElement.style.left = '0px'; // 移除偏移
// //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

export { tag as getTag, labelRenderer as chooseLabelRenderer };
