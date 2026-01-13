import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/music/' : '/', // Only use /music/ for production build
  build: {
    outDir: '.', // Build to root folder for GitHub Pages
    emptyOutDir: false, // Don't delete other files in root
  },
}))
