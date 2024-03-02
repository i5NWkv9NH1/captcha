// vite.config.ts
import { resolve } from 'path';
import { defineConfig } from 'vite';
import commonjs from 'vite-plugin-commonjs'

import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  base: '/scrollbar/',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      // * for browser variable name
      name: 'Captcha',
      fileName: 'captcha',
      // ? cjs not work with borwser
      formats: ['iife', 'es', 'umd',]
    },
  },
  plugins: [dts(), commonjs()],
});
