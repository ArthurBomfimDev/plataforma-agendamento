import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const src = (folder = '') => path.resolve(import.meta.dirname, 'src', folder)

// O Bun é gerenciador de pacotes e executor de scripts. O bundler continua sendo o Vite,
// por decisão registrada na ADR-011 — não troque sem novo ADR.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Um alias por pasta de topo de `src`, para não encadear `../../`. Espelhado em `paths` no
    // tsconfig.json e no tsconfig.app.json — mudou aqui, mude lá. O `@` sozinho fica para o shadcn.
    alias: {
      '@components': src('components'),
      '@features': src('features'),
      '@global': src('global'),
      '@hooks': src('hooks'),
      '@lib': src('lib'),
      '@router': src('router'),
      '@styles': src('styles'),
      '@': src(),
    },
  },
  // Caminho relativo nos assets gerados. É a regra 4 de empacotamento (CLAUDE.md §3):
  // dentro do shell do Capacitor a origem vira capacitor://localhost, e caminho absoluto
  // como /assets/index.js deixa de resolver.
  base: './',
})
