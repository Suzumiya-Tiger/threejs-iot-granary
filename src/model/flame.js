import * as THREE from 'three';
const textureLoader = new THREE.TextureLoader();
let stopAnimationFrame;

function createFlame() {
  /* 火焰模型 */
  const w = 20; //火焰宽度
  const h = 1.6 * w; //火焰高度

  // 正确创建平面几何体
  const fireGeometry = new THREE.PlaneGeometry(w, h);
  fireGeometry.translate(0, h / 2, 0);

  // 加载火焰效果 - 修正路径
  const fireTexture = textureLoader.load('./src/assets/火焰.png');

  // 火焰贴图的帧数，每一帧都有不同的对应效果静止截图
  let nums = 15;
  // 1/nums:从图像上截取一帧的火焰截图，总共15个帧数对应的状态截图
  fireTexture.repeat.set(1 / nums, 1);

  const fireMaterial = new THREE.MeshBasicMaterial({
    map: fireTexture,
    // png透明
    transparent: true,
    // 是否对深度缓冲区产生影响
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0.8, // 提高透明度让火焰更明显
  });

  const model = new THREE.Mesh(fireGeometry, fireMaterial);
  const flame = new THREE.Group();
  flame.add(
    model,
    model.clone().rotateY(Math.PI / 2),
    model.clone().rotateY(Math.PI / 4),
    model.clone().rotateY((Math.PI / 4) * 3)
  );

  let t = 0;

  function updateLoop() {
    t += 0.1;
    if (t > nums) {
      t = 0;
    }
    fireTexture.offset.x = Math.floor(t) / nums;
    stopAnimationFrame = window.requestAnimationFrame(updateLoop);
  }
  updateLoop();

  // 添加调试信息
  console.log('火焰创建成功:', flame);
  console.log('火焰位置:', flame.position);

  return flame;
}

// 停止火焰
function stopFlame() {
  if (stopAnimationFrame) {
    window.cancelAnimationFrame(stopAnimationFrame);
    console.log('火焰动画已停止');
  }
}

export { createFlame, stopFlame };
