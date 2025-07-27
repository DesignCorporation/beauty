import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/beauty/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        widget: resolve(__dirname, 'src/widget.tsx')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'widget' ? 'widget.js' : '[name]-[hash].js';
        }
      }
    }
  },
  server: {
    port: 5174,
    host: true
  }
});
