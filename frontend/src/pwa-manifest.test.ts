import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { BRAND_INK, pwaManifest } from '../pwa.manifest'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

/** Largura e altura do IHDR de um PNG. */
const pngSize = (path: string) => {
  const bytes = readFileSync(resolve(root, 'public', path))
  expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG')
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`
}

describe('manifest do PWA (ADR-035)', () => {
  it('é o Vagoo, em português, abrindo como app', () => {
    expect(pwaManifest.name).toBe('Vagoo')
    expect(pwaManifest.short_name).toBe('Vagoo')
    expect(pwaManifest.lang).toBe('pt-BR')
    expect(pwaManifest.display).toBe('standalone')
  })

  it('só tem caminho relativo (regra 4 de empacotamento)', () => {
    expect(pwaManifest.start_url).toBe('./')
    expect(pwaManifest.scope).toBe('./')
    for (const icon of pwaManifest.icons ?? []) expect(icon.src).not.toMatch(/^(\/|[a-z]+:)/)
  })

  it('as cores são o token --brand-ink, o fundo do ícone', () => {
    expect(BRAND_INK).toBe(
      /--brand-ink:\s*(#[0-9a-f]{6})/i.exec(read('src/styles/tokens.css'))?.[1],
    )
    expect(pwaManifest.theme_color).toBe(BRAND_INK)
    expect(pwaManifest.background_color).toBe(BRAND_INK)
  })

  it('tem ícone 192, 512 e maskable 512, e os arquivos existem com o tamanho declarado', () => {
    const icons = pwaManifest.icons ?? []
    const purposes = icons.map((icon) => `${icon.sizes}:${icon.purpose}`)

    expect(purposes).toEqual(['192x192:any', '512x512:any', '512x512:maskable'])
    for (const icon of icons) expect(pngSize(icon.src)).toBe(icon.sizes)
  })

  it('o index.html aponta a cor da barra para os dois temas', () => {
    const html = read('index.html')

    expect(html).toContain('(prefers-color-scheme: light)')
    expect(html).toContain(`content="${BRAND_INK}" media="(prefers-color-scheme: dark)"`)
  })
})

describe('cache do service worker (LGPD Art. 11)', () => {
  const config = read('vite.config.ts')

  it('/api e /media ficam fora da navegação do service worker', () => {
    expect(config).toContain('navigateFallbackDenylist: [/^\\/api\\//, /^\\/media\\//]')
  })

  it('não há cache de execução: resposta autenticada nunca é guardada', () => {
    expect(config).toContain('runtimeCaching: []')
  })

  it('a atualização é controlada pela pessoa: sem skipWaiting nem clientsClaim', () => {
    expect(config).toContain("registerType: 'prompt'")
    expect(config).not.toMatch(/skipWaiting|clientsClaim/)
  })

  it('nenhum componente chama as APIs de PWA direto (regra 5): só os hooks', () => {
    const forbidden =
      /beforeinstallprompt|serviceWorker\.register|navigator\.standalone|display-mode/
    const owners = ['src/hooks/use-pwa-install/store.ts']

    for (const path of [
      'src/components/pwa-notices/index.tsx',
      'src/components/pwa-notices/view.tsx',
      'src/App.tsx',
    ]) {
      expect(read(path), path).not.toMatch(forbidden)
    }
    expect(read(owners[0]!)).toMatch(forbidden)
  })
})
