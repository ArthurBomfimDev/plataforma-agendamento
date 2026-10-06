import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// O Bun é gerenciador de pacotes e executor de scripts. O bundler continua sendo o Vite,
// por decisão registrada na ADR-011 — não troque sem novo ADR.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Caminho relativo nos assets gerados. É a regra 4 de empacotamento (CLAUDE.md §3):
  // dentro do shell do Capacitor a origem vira capacitor://localhost, e caminho absoluto
  // como /assets/index.js deixa de resolver.
  base: './',
})
