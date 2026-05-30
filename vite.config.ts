import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        popup:      resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content:    resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js';
          if (chunk.name === 'content')    return 'content.js';
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
