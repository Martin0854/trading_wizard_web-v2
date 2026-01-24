import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@trading-wizard/shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
