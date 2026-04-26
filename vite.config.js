import { defineConfig } from 'vite'

export default defineConfig({
  base: '/SwiftQR/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  }
})
