import { afterEach, describe, expect, it, vi } from 'vitest'

import dockerfile from '../../../Dockerfile?raw'
import indexHtml from '../../../index.html?raw'
import nginxConf from '../../../nginx.conf?raw'

// A base é lida quando o módulo carrega: cada caso recarrega `@api/base` com o ambiente que quer.
const loadApi = async (baseUrl?: string) => {
  vi.resetModules()
  if (baseUrl !== undefined) vi.stubEnv('VITE_API_BASE_URL', baseUrl)
  const base = await import('@api/base')
  const media = await import('@api/services/media')
  return { ...base, ...media }
}

describe('base da API (Onda 7H)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sem VITE_API_BASE_URL, chama /api e /media na própria origem', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined)
    const { apiBaseUrl, http, mediaUrl } = await loadApi()

    expect(apiBaseUrl).toBe('')
    expect(http.getUri({ url: '/api/health' })).toBe('/api/health')
    expect(mediaUrl('/media/b1/logo-640.webp')).toBe('/media/b1/logo-640.webp')
  })

  it('com VITE_API_BASE_URL, usa a URL absoluta (Capacitor, Tauri, API em outro endereço)', async () => {
    const { apiBaseUrl, http, mediaUrl } = await loadApi('https://api.exemplo.test')

    expect(apiBaseUrl).toBe('https://api.exemplo.test')
    expect(http.getUri({ url: '/api/health' })).toBe('https://api.exemplo.test/api/health')
    expect(mediaUrl('/media/x.webp')).toBe('https://api.exemplo.test/media/x.webp')
    // Mídia em armazenamento externo já vem absoluta.
    expect(mediaUrl('https://cdn.exemplo.test/x.webp')).toBe('https://cdn.exemplo.test/x.webp')
  })

  it('a imagem Docker não embute localhost: o padrão do build arg é vazio', () => {
    expect(dockerfile).toMatch(/^ARG VITE_API_BASE_URL=$/m)
    expect(dockerfile).not.toMatch(/localhost:\d+/)
  })
})

describe('nginx: uma origem só (Onda 7H)', () => {
  it('repassa /api/ e /media/ para a API com o IP e o esquema de quem chamou', () => {
    for (const prefix of ['/api/', '/media/']) {
      const block = nginxConf.match(new RegExp(`location ${prefix} \\{([^}]*)\\}`))?.[1] ?? ''

      expect(block).toContain(`proxy_pass http://api:8080${prefix};`)
      expect(block).toContain('proxy_set_header Host $host;')
      expect(block).toContain('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
      expect(block).toContain('proxy_set_header X-Forwarded-Proto $forwarded_proto;')
    }
  })

  it('os cabeçalhos do site não saem duplicados nas respostas da API e da mídia', () => {
    expect(nginxConf).toMatch(/map \$uri \$is_site \{\s*~\^\/\(api\|media\)\/\s+0;/)
    // Todo add_header usa uma variável, que fica vazia (e não sai) em /api/ e /media/.
    const headers = [...nginxConf.matchAll(/^\s*add_header \S+ (\S+) always;/gm)].map((m) => m[1])

    expect(headers.length).toBeGreaterThanOrEqual(5)
    expect(headers.every((value) => value?.startsWith('$'))).toBe(true)
  })

  it('aceita o envio de imagem (5 MB + envelope) e só põe cache longo no que tem hash', () => {
    const size = Number(nginxConf.match(/client_max_body_size (\d+)m;/)?.[1])

    expect(size).toBeGreaterThanOrEqual(6)
    expect(nginxConf).toMatch(/~\^\/assets\/\s+"public, max-age=31536000, immutable";/)
    expect(nginxConf).toMatch(/default\s+"no-cache";/)
  })

  it('a CSP libera o script inline do tema pelo hash, e a API e as imagens só da mesma origem', async () => {
    const inline = indexHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(inline))
    const hash = btoa(String.fromCharCode(...new Uint8Array(digest)))

    expect(inline).not.toBe('')
    expect(nginxConf).toContain(`script-src 'self' 'sha256-${hash}'`)
    expect(nginxConf).toContain("connect-src 'self';")
    expect(nginxConf).toContain("img-src 'self' data: blob:;")
    expect(nginxConf).toContain("frame-ancestors 'none'")
  })
})
