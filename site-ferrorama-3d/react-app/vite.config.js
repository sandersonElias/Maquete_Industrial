import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // O bundle inclui three.js + drei + framer-motion + gsap, todos necessários.
    // O warning de >600KB é esperado para um site 3D single-page.
    chunkSizeWarningLimit: 1500,
  },
})
