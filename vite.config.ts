import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['fabric']
  },
  resolve: {
    alias: {
      'fabric': 'fabric'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'fabric': ['fabric'],
          'chart': ['chart.js', 'react-chartjs-2']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
});