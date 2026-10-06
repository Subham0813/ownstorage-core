import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts:["graceful-cornea-crummiest.ngrok-free.dev"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('zustand')) {
              return 'vendor-zustand';
            }
            if (id.includes('clsx')) {
              return 'vendor-clsx';
            }
          }
        },
      },
    },
  },
});
