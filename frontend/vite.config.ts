import Icons from 'unplugin-icons/vite'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const src = (folder = '') => path.resolve(import.meta.dirname, 'src', folder)

// O Bun é gerenciador de pacotes e executor de scripts. O bundler continua sendo o Vite,
// por decisão registrada na ADR-011 — não troque sem novo ADR.
export default defineConfig(({ mode }) => ({
  // Sem `VITE_API_BASE_URL`, o app chama `/api` na própria origem (como atrás do nginx). No `bun run dev`, quem
  // atende `/api` e `/media` é este proxy: `DEV_API_PROXY` no `.env.local`, ou a API do `dotnet run`.
  server: {
    proxy: Object.fromEntries(
      ['/api', '/media'].map((prefix) => [
        prefix,
        {
          target: loadEnv(mode, import.meta.dirname, '').DEV_API_PROXY || 'http://localhost:5167',
          changeOrigin: true,
        },
      ]),
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    // Material Symbols em SVG, compilados no build (ver `src/assets/icons`). 24px por atributo, como o lucide
    // fazia: a classe `size-*` de quem usa continua mandando.
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      iconCustomizer: (_collection, _icon, props) => {
        props.width = '24'
        props.height = '24'
      },
    }),
  ],
  resolve: {
    // Um alias por pasta de topo de `src`, para não encadear `../../`. Espelhado em `paths` no
    // tsconfig.json e no tsconfig.app.json — mudou aqui, mude lá. O `@` sozinho fica para o shadcn.
    alias: {
      '@api': src('api'),
      '@assets': src('assets'),
      '@components': src('components'),
      '@hooks': src('hooks'),
      '@layouts': src('layouts'),
      '@lib': src('lib'),
      '@pages': src('pages'),
      '@router': src('router'),
      '@store': src('store'),
      '@styles': src('styles'),
      '@utils': src('utils'),
      '@': src(),
    },
  },
  // Caminho relativo nos assets gerados. É a regra 4 de empacotamento (CLAUDE.md §3):
  // dentro do shell do Capacitor a origem vira capacitor://localhost, e caminho absoluto
  // como /assets/index.js deixa de resolver.
  base: './',
}))
