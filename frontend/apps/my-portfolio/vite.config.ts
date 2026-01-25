import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/portfolio/',
  plugins: [react()],
  server: {
    port: 3002,
    strictPort: true,
  },
  preview: {
    port: 3002,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
