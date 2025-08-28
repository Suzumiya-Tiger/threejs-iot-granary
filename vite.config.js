// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // 设置基础路径 - 根据你的部署环境调整
  base: process.env.VITE_BASE_URL || './',

  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: true,
    watch: {
      usePolling: true,
      interval: 2000,
    },
  },

  // 确保正确处理静态资源
  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.png'],

  // 构建优化配置
  build: {
    // 确保资源文件被正确处理
    assetsDir: 'assets',
    // 增加chunk大小限制
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // 代码分割策略
        manualChunks: {
          // 将Three.js相关库分离为单独chunk
          'three-core': ['three'],
          'three-addons': [
            'three/addons/controls/OrbitControls.js',
            'three/addons/loaders/GLTFLoader.js',
            'three/examples/jsm/loaders/RGBELoader.js',
          ],
          'three-postprocessing': [
            'three/examples/jsm/postprocessing/EffectComposer.js',
            'three/examples/jsm/postprocessing/RenderPass.js',
            'three/examples/jsm/postprocessing/OutlinePass.js',
            'three/examples/jsm/postprocessing/OutputPass.js',
            'three/examples/jsm/shaders/FXAAShader.js',
            'three/examples/jsm/postprocessing/ShaderPass.js',
          ],
        },
        // 自定义资源文件命名
        assetFileNames: assetInfo => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          // 根据文件大小采用不同策略
          if (/\.(png|jpe?g|gif|svg|webp)$/.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/\.(glb|hdr)$/.test(assetInfo.name)) {
            return `models/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

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

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
