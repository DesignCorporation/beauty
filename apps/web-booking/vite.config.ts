import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/beauty/',
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        widget: './src/widget.tsx'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'widget' ? 'dist/widget.js' : 'assets/[name]-[hash].js';
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})