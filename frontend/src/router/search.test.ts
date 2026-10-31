import { DEMO_LOCATION, mergePersistedLocation, useLocationStore } from '@lib/zustand/location'
import { EMPTY_SEARCH, distanceChipLabel, distanceSync, searchArea } from '@lib/api/search'
import { describe, expect, it } from 'vitest'
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

describe('distância no seletor de endereço (7CF)', () => {
  it('é guardada junto do endereço, e um valor antigo ou estranho volta para Cidade', () => {
    const current = useLocationStore.getState()

    expect(mergePersistedLocation({ location: DEMO_LOCATION, distance: 5 }, current)).toMatchObject(
      {
        location: DEMO_LOCATION,
        distance: 5,
      },
    )
    // Guardado antes da 7CF: só o endereço.
    expect(mergePersistedLocation({ location: DEMO_LOCATION }, current).distance).toBe('city')
    expect(mergePersistedLocation({ location: null, distance: 7 }, current).distance).toBe('city')
    // Nada guardado (aba anônima, armazenamento bloqueado): o padrão.
    expect(mergePersistedLocation(undefined, current)).toMatchObject({
      location: null,
      distance: 'city',
    })
  })

  it('a URL vence quando foi ela que mudou; o seletor, quando foi ele', () => {
    // Abrir um link com radius=2, com o seletor em Cidade: o seletor recebe o 2.
    expect(distanceSync({ url: 2, picker: 'city' }, { url: 2, picker: 'city' })).toBe('take-url')
    // Voltar no histórico para radius=10.
    expect(distanceSync({ url: 2, picker: 2 }, { url: 10, picker: 2 })).toBe('take-url')
    // Tocar em 5 km no seletor com radius=2 na URL: a URL se atualiza.
    expect(distanceSync({ url: 2, picker: 2 }, { url: 2, picker: 5 })).toBe('write-url')
    // URL sem distância: só escreve quando o seletor muda.
    expect(distanceSync({ url: null, picker: 'city' }, { url: null, picker: 'city' })).toBe('none')
    expect(distanceSync({ url: null, picker: 'city' }, { url: null, picker: 20 })).toBe('write-url')
    expect(distanceSync({ url: 5, picker: 5 }, { url: 5, picker: 5 })).toBe('none')
  })

  it('o chip da busca diz a distância e a cidade', () => {
    expect(distanceChipLabel('city', 'Garça')).toBe('Cidade: Garça')
    expect(distanceChipLabel('city', null)).toBe('Cidade')
    expect(distanceChipLabel(5, 'Garça')).toBe('Até 5 km')
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
