import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) return 'antd';
          if (id.includes('node_modules/@refinedev')) return 'refine';
          if (id.includes('node_modules/react-dom')) return 'react';
        },
      },
    },
  },
});
