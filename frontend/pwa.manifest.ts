import type { ManifestOptions } from 'vite-plugin-pwa'

/** `--brand-ink` de src/styles/tokens.css: o fundo do ícone, para a abertura do app sair sem emenda. */
export const BRAND_INK = '#070b14'

/**
 * Manifest do PWA (ADR-035). Todo caminho é relativo (regra 4 de empacotamento): `start_url` e `scope` em `./`, ícones
 * sem barra inicial. Os ícones vêm de `scripts/pwa-icons.ts`, a partir do símbolo da marca.
 */
export const pwaManifest: Partial<ManifestOptions> = {
  name: 'Vagoo',
  short_name: 'Vagoo',
  description: 'Agende, escolha e vá: o agendamento do seu estabelecimento, no celular.',
  lang: 'pt-BR',
  dir: 'ltr',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: BRAND_INK,
  background_color: BRAND_INK,
  categories: ['business', 'lifestyle'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: 'icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}
