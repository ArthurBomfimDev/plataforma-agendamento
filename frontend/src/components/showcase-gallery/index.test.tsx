import { describe, expect, it } from 'vitest'
import { photoAlt, showcasePhotos } from './consts'

import type { ImageSet } from '@api/models'
import { ShowcaseGallery } from '.'
import { renderToString } from 'react-dom/server'

const image = (n: number): ImageSet => ({
  small: `/media/p/${n}-s.webp`,
  medium: `/media/p/${n}-m.webp`,
  large: `/media/p/${n}-l.webp`,
})

const render = (props: Partial<Parameters<typeof ShowcaseGallery>[0]> = {}) =>
  renderToString(<ShowcaseGallery name="Barbearia Pacheco" category="Beleza" {...props} />)

describe('showcasePhotos', () => {
  it('usa a vitrine, no máximo 3', () => {
    expect(showcasePhotos([image(1), image(2), image(3), image(4)], null)).toHaveLength(3)
  })

  it('sem vitrine, cai na capa; sem nada, vazio', () => {
    expect(showcasePhotos(undefined, image(9))).toEqual([image(9)])
    expect(showcasePhotos([], image(9))).toEqual([image(9)])
    expect(showcasePhotos([], null)).toEqual([])
  })
})

describe('photoAlt', () => {
  it('descreve a foto e o lugar dela na vitrine', () => {
    expect(photoAlt('Studio', 0, 1)).toBe('Foto de Studio')
    expect(photoAlt('Studio', 1, 3)).toBe('Foto 2 de 3 de Studio')
  })
})

describe('ShowcaseGallery', () => {
  it('três fotos: três itens, cada um com texto alternativo, e a grade do computador', () => {
    const html = render({ photos: [image(1), image(2), image(3)] })

    expect(html.match(/<li/g)).toHaveLength(3)
    expect(html).toContain('alt="Foto 1 de 3 de Barbearia Pacheco"')
    expect(html).toContain('alt="Foto 3 de 3 de Barbearia Pacheco"')
    expect(html).toContain('lg:grid-rows-2')
    // A primeira ocupa as duas linhas da grade.
    expect(html).toContain('lg:row-span-2')
  })

  it('celular: faixa que rola na horizontal, encaixando foto a foto', () => {
    const html = render({ photos: [image(1), image(2)] })

    expect(html).toContain('overflow-x-auto')
    expect(html).toContain('snap-x')
  })

  it('uma foto só ocupa a largura toda, sem grade', () => {
    const html = render({ photos: [image(1)] })

    expect(html).toContain('w-full')
    expect(html).not.toContain('lg:grid-cols')
    expect(html).toContain('alt="Foto de Barbearia Pacheco"')
  })

  it('estabelecimento antigo, só com capa: a capa aparece', () => {
    expect(render({ cover: image(7) })).toContain('alt="Foto de Barbearia Pacheco"')
  })

  it('sem foto nenhuma, mostra a ilustração padrão e nunca uma área vazia', () => {
    const html = render()

    expect(html).not.toContain('<img')
    expect(html).toContain('<svg')
  })
})
