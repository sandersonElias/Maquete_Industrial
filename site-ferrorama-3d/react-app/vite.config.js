import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // O bundle inclui three.js + drei + framer-motion, todos necessários.
    // O warning de >600KB é esperado para um site 3D single-page; o orçamento
    // real (gzip) está no CLAUDE.md — 165KB iniciais / 330KB no chunk da maquete.
    chunkSizeWarningLimit: 1500,
  },
})
