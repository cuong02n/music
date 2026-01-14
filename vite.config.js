import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/music/', // Base path for GitHub Pages
  build: {
    outDir: 'dist', // Build to dist folder
  },
})
