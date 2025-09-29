import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devProxyTarget = process.env.VITE_DEV_SERVER_PROXY || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: devProxyTarget,
        changeOrigin: true
      }
    }
  }
});
