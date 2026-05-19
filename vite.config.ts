import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'content' ? 'content.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
