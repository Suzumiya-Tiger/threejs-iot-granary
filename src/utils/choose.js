import * as THREE from 'three';
import { camera } from '../main.js';
import { granaryArr } from '../mesh.js';
// 引入后期处理
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// 目标拾取对象
let chooseMesh = null;

// 后处理相关变量
let composer = null;
let outlinePass = null;
let fxaaPass = null;
let isComposerInitialized = false;

// 初始化后处理系统
function initComposer(renderer, scene) {
  if (isComposerInitialized) return;

  /* 后处理流程 */
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 创建OutlinePass通道
  const v2 = new THREE.Vector2(window.innerWidth, window.innerHeight);
  outlinePass = new OutlinePass(v2, scene, camera);

  outlinePass.visibleEdgeColor.set(0xffa500);
  outlinePass.edgeThickness = 4;
  outlinePass.edgeStrength = 6;
  composer.addPass(outlinePass);

  // FXAA抗锯齿通道
  fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x =
    1 / (window.innerWidth * pixelRatio);
  fxaaPass.material.uniforms['resolution'].value.y =
    1 / (window.innerHeight * pixelRatio);
  composer.addPass(fxaaPass);

  // 添加OutputPass
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  isComposerInitialized = true;
}

function choose(event, messageTag) {
  // 恢复上一次选中对象的原始颜色
  if (chooseMesh) {
    // 清除轮廓效果
    if (outlinePass) {
      outlinePass.selectedObjects = [];
    }
  }

  const px = event.clientX;
  const py = event.clientY;

  const x = (px / window.innerWidth) * 2 - 1;
  const y = -(py / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const intersects = raycaster.intersectObjects(granaryArr);

  if (intersects.length > 0) {
    chooseMesh = intersects[0].object;

    // 设置轮廓高亮
    if (outlinePass) {
      outlinePass.selectedObjects = [chooseMesh];
    }

    chooseMesh.point = intersects[0].point;
  } else {
    chooseMesh = null;
    // 清除轮廓效果
    if (outlinePass) {
      outlinePass.selectedObjects = [];
    }
  }
}

export { choose, chooseMesh, initComposer, composer, fxaaPass };
