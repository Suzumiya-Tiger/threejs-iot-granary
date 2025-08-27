// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 3000,
    watch: {
      usePolling: true, // 对于某些系统可能需要
    },
  },
  // 确保正确处理静态资源
  assetsInclude: ['**/*.glb', '**/*.hdr'],
});
