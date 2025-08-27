// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: true, // 简化 HMR 配置
    watch: {
      usePolling: true,
      interval: 2000, // 增加轮询间隔
    },
  },
  // 确保正确处理静态资源
  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.png'],

  // 关键：解决循环依赖问题
  optimizeDeps: {
    include: [
      'three',
      'three/addons/controls/OrbitControls.js',
      'three/addons/loaders/GLTFLoader.js',
      'three/examples/jsm/loaders/RGBELoader.js',
      'three/examples/jsm/postprocessing/EffectComposer.js',
      'three/examples/jsm/postprocessing/RenderPass.js',
      'three/examples/jsm/postprocessing/OutlinePass.js',
      'three/examples/jsm/postprocessing/OutputPass.js',
      'three/examples/jsm/shaders/FXAAShader.js',
      'three/examples/jsm/postprocessing/ShaderPass.js',
    ],
  },

  // 解决循环依赖
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
