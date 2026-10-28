import { describe, expect, it } from 'vitest'
import { readSearchFilters, searchPath } from './consts'

import { EMPTY_SEARCH } from '@lib/api/search'
import { HOME_CATEGORIES } from '@features/home/consts'

describe('filtros da busca na URL', () => {
  it('omite o padrão e escreve só o que foi escolhido', () => {
    expect(searchPath({})).toBe('/search')
    expect(searchPath({ category: 'Beleza' })).toBe('/search?category=Beleza')
    expect(
      searchPath({ term: '  corte ', maxPriceCents: 5000, sortBy: 'price', radiusKm: 5 }),
    ).toBe('/search?term=corte&maxPrice=5000&sort=price&radius=5')
  })

  it('lê de volta o que escreveu', () => {
    const filters = {
      ...EMPTY_SEARCH,
      term: 'barba',
      category: 'Saude' as const,
      maxPriceCents: 10000,
    }
    const path = searchPath(filters)

    expect(readSearchFilters(new URLSearchParams(path.split('?')[1]))).toEqual(filters)
  })

  it('ignora o que o backend não aceita, em vez de virar erro', () => {
    const params = new URLSearchParams('category=Academia&maxPrice=-3&sort=nota&radius=7')

    expect(readSearchFilters(params)).toEqual(EMPTY_SEARCH)
  })
})

describe('tiles da Home', () => {
  it('Beleza e Saúde filtram por categoria; os demais buscam por termo', () => {
    const byLabel = Object.fromEntries(
      HOME_CATEGORIES.map((tile) => [tile.label, searchPath(tile.search)]),
    )

    expect(byLabel['Beleza']).toBe('/search?category=Beleza')
    expect(byLabel['Saúde']).toBe('/search?category=Saude')
    expect(byLabel['Cabelo']).toBe('/search?term=corte')
    expect(byLabel['Barbearia']).toBe('/search?term=barba')
    expect(byLabel['Unhas']).toBe('/search?term=unha')
  })
})
