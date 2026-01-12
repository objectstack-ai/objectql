import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/studio/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      }
    }
  }
});
