import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/sumai-share/',
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        // ハッシュを付けないとデプロイしてもブラウザが古いJSを使い続けるため必須。
        // scripts/build-gas.mjs は dist 内の .js を拡張子で探すのでハッシュ付きでも動く。
        entryFileNames: 'index-[hash].js',
        assetFileNames: 'index-[hash].[ext]',
        inlineDynamicImports: true,
      },
    },
  },
})
