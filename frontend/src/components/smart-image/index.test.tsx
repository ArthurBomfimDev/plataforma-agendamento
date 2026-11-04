import { describe, expect, it } from 'vitest'

import { SmartImage } from '.'
import { mediaUrl } from '@api/services/media'
import { renderToString } from 'react-dom/server'

const image = {
  small: '/media/businesses/b1/abc-s.webp',
  medium: '/media/businesses/b1/abc-m.webp',
  large: '/media/businesses/b1/abc-l.webp',
}

const html = (props: Partial<Parameters<typeof SmartImage>[0]> = {}) =>
  renderToString(
    <SmartImage
      image={image}
      alt="Foto do salão"
      sizes="100vw"
      width={16}
      height={9}
      fallback={<span data-testid="padrao">padrão</span>}
      {...props}
    />,
  )

describe('SmartImage', () => {
  it('três tamanhos no srcSet, carregamento preguiçoso e espaço reservado', () => {
    const page = html()

    expect(page).toContain('-s.webp 160w')
    expect(page).toContain('-m.webp 640w')
    expect(page).toContain('-l.webp 1280w')
    expect(page).toContain('loading="lazy"')
    expect(page).toContain('width="16"')
    expect(page).toContain('height="9"')
    expect(page).toContain('aspect-ratio:16 / 9')
    expect(page).toContain('alt="Foto do salão"')
    expect(page).not.toContain('padrão')
  })

  it('sem imagem, mostra o padrão no mesmo espaço', () => {
    const page = html({ image: null })

    expect(page).toContain('padrão')
    expect(page).not.toContain('<img')
    expect(page).toContain('aspect-ratio:16 / 9')
  })

  it('decorativa tem alt vazio', () => {
    expect(html({ alt: '' })).toContain('alt=""')
  })
})

describe('mediaUrl', () => {
  it('mantém URL absoluta (armazenamento externo) e prefixa a relativa com a API', () => {
    expect(mediaUrl('https://cdn.exemplo.test/a.webp')).toBe('https://cdn.exemplo.test/a.webp')
    expect(mediaUrl('/media/a.webp').endsWith('/media/a.webp')).toBe(true)
  })
})
