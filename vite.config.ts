import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['fabric']
  },
  css: {
    postcss: './postcss.config.js'
  },
  resolve: {
    alias: {
      'fabric': 'fabric'
    }
  },
  build: {
    target: 'esnext', // Enable top-level await support
    rollupOptions: {
      output: {
        manualChunks: {
          'fabric': ['fabric'],
          'chart': ['chart.js', 'react-chartjs-2'],
          'vendor': ['react', 'react-dom', 'zustand', '@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173
    }
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  },
});