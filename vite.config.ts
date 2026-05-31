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
        entryFileNames: 'index.js',
        assetFileNames: 'index.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
})
