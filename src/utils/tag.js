import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/Addons.js';

function tag(name) {
  const div = document.createElement('div');
  div.innerHTML = name;
  div.classList.add('tag');
  const label = new CSS2DObject(div);
  return label;
}

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

export { tag, labelRenderer };
