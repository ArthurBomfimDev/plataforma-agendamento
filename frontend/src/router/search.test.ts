import { EMPTY_SEARCH, readStoredDistance, searchArea, storeDistance } from '@lib/api/search'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readSearchFilters, searchPath } from './consts'

import { HOME_CATEGORIES } from '@features/home/consts'

describe('filtros da busca na URL', () => {
  it('omite o padrão e escreve só o que foi escolhido', () => {
    expect(searchPath({})).toBe('/search')
    expect(searchPath({ category: 'Beleza' })).toBe('/search?category=Beleza')
    expect(
      searchPath({ term: '  corte ', maxPriceCents: 5000, sortBy: 'price', distance: 5 }),
    ).toBe('/search?term=corte&maxPrice=5000&sort=price&radius=5')
  })

  it('a distância dada vai sempre para a URL, inclusive Cidade', () => {
    expect(searchPath({ distance: 'city' })).toBe('/search?radius=city')
    expect(searchPath({ ...EMPTY_SEARCH })).toBe('/search?radius=city')
  })

  it('lê de volta o que escreveu', () => {
    const filters = {
      ...EMPTY_SEARCH,
      term: 'barba',
      category: 'Saude' as const,
      maxPriceCents: 10000,
      distance: 10 as const,
    }
    const path = searchPath(filters)

    expect(readSearchFilters(new URLSearchParams(path.split('?')[1]))).toEqual(filters)
  })

  it('ignora o que o backend não aceita, em vez de virar erro', () => {
    const params = new URLSearchParams('category=Academia&maxPrice=-3&sort=nota&radius=7')

    expect(readSearchFilters(params)).toEqual(EMPTY_SEARCH)
  })

  it('a URL vence a distância lembrada; sem ela na URL, vale a lembrada; sem as duas, Cidade', () => {
    expect(readSearchFilters(new URLSearchParams('radius=2'), 10).distance).toBe(2)
    expect(readSearchFilters(new URLSearchParams('radius=city'), 10).distance).toBe('city')
    expect(readSearchFilters(new URLSearchParams(''), 10).distance).toBe(10)
    expect(readSearchFilters(new URLSearchParams('radius=7'), 10).distance).toBe(10)
    expect(readSearchFilters(new URLSearchParams('')).distance).toBe('city')
  })
})

describe('área da busca', () => {
  it('Cidade manda a cidade e nenhum raio; um raio manda só o raio', () => {
    expect(searchArea('city', 'Garça')).toEqual({
      radiusKm: undefined,
      city: 'Garça',
      cityKnown: true,
    })
    expect(searchArea(5, 'Garça')).toEqual({ radiusKm: 5, city: undefined, cityKnown: true })
  })

  it('Cidade sem cidade conhecida busca no maior raio e avisa', () => {
    expect(searchArea('city', null)).toEqual({ radiusKm: 20, city: undefined, cityKnown: false })
  })
})

describe('distância lembrada no aparelho', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('guarda e lê de volta', () => {
    const memory = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    })

    expect(readStoredDistance()).toBeNull()
    storeDistance(10)
    expect(readStoredDistance()).toBe(10)
    storeDistance('city')
    expect(readStoredDistance()).toBe('city')
  })

  it('com o armazenamento bloqueado, não quebra: só não lembra', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('bloqueado', 'SecurityError')
      },
      setItem: () => {
        throw new DOMException('bloqueado', 'SecurityError')
      },
    })

    expect(() => storeDistance(5)).not.toThrow()
    expect(readStoredDistance()).toBeNull()
  })
})

describe('tiles da Home', () => {
  it('Beleza e Saúde filtram por categoria; os demais buscam por termo', () => {
    const byLabel = Object.fromEntries(
      HOME_CATEGORIES.map((tile) => [tile.label, searchPath(tile.search)]),
    )

    // Sem distância no link: a busca usa a lembrada no aparelho.
    expect(byLabel['Beleza']).toBe('/search?category=Beleza')
    expect(byLabel['Saúde']).toBe('/search?category=Saude')
    expect(byLabel['Cabelo']).toBe('/search?term=corte')
    expect(byLabel['Barbearia']).toBe('/search?term=barba')
    expect(byLabel['Unhas']).toBe('/search?term=unha')
  })
})
