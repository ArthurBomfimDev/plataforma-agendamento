import { describe, expect, it } from 'vitest'

import { EMPTY_SEARCH } from '@api/services/business/search'
import { SearchResultsScreen } from '.'
import type { SearchResultsScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const html = (props: Partial<SearchResultsScreenProps> = {}) =>
  renderToString(
    <SearchResultsScreen
      filters={EMPTY_SEARCH}
      results={{ status: 'ready', total: 0, items: [] }}
      locationLabel="Centro, Garça"
      cityName="Garça"
      {...props}
    />,
  ).replaceAll('<!-- -->', '')

const ready: SearchResultsScreenProps['results'] = {
  status: 'ready',
  total: 2,
  items: [
    {
      id: 'b1',
      name: 'Estúdio Duartina',
      distanceKm: 1.2,
      neighborhood: 'Centro',
      verified: true,
      category: 'Beleza',
      image: null,
      cover: null,
      service: { name: 'Corte masculino', durationMinutes: 30, fromPriceCents: 4500 },
    },
    {
      id: 'b2',
      name: 'Sem Serviço',
      distanceKm: 2,
      neighborhood: 'Jardim',
      verified: false,
      category: 'Saude',
      image: null,
      cover: null,
      service: null,
    },
  ],
}

describe('SearchResultsScreen', () => {
  it('só mostra filtros com backend: sem "Disponível hoje" nem nota', () => {
    const page = html()

    expect(page).not.toContain('Disponível hoje')
    expect(page).not.toContain('4,5+')
    expect(page).toContain('Até R$ 50')
    expect(page).toContain('Mais perto')
    expect(page).toContain('Menor preço')
  })

  it('o filtro aplicado aparece e pode ser removido', () => {
    const page = html({ filters: { ...EMPTY_SEARCH, category: 'Saude', term: 'corte' } })

    expect(page).toMatch(/aria-label="Filtros aplicados"/)
    expect(page).toContain('aria-label="Remover filtro Saúde"')
    expect(page).toContain('aria-label="Remover filtro “corte”"')
  })

  it('preço e ordenação ligados refletem a URL', () => {
    const page = html({
      filters: { ...EMPTY_SEARCH, maxPriceCents: 10_000, sortBy: 'price', distance: 5 },
    })

    expect(page).toContain('Até 5 km')
    expect(page).toMatch(/aria-pressed="true"[^>]*>Até R\$ 100/)
    expect(page).toMatch(/aria-pressed="true"[^>]*>Menor preço/)
    expect(page).toMatch(/aria-pressed="false"[^>]*>Mais perto/)
  })

  it('resultados: total, "a partir de" e o card inteiro abre o estabelecimento', () => {
    const page = html({ results: ready })

    expect(page).toContain('2 resultados')
    expect(page).toContain('a partir de')
    expect(page).toMatch(/<button[^>]*>Estúdio Duartina<\/button>/)
    expect(page).toMatch(/<button[^>]*>Sem Serviço<\/button>/)
    // Sem horários calculados, o card não afirma que não há horário.
    expect(page).not.toContain('Sem horário')
  })

  it('sem localização: pede uma, sem buscar', () => {
    const page = html({ results: { status: 'no-location' }, locationLabel: null })

    expect(page).toContain('Escolha onde você quer agendar')
    expect(page).toContain('Escolher localização')
  })

  it('buscando: o botão Buscar fica ocupado', () => {
    expect(html({ searching: true })).toMatch(
      /disabled=""[^>]*aria-busy="true"|aria-busy="true"[^>]*disabled=""/,
    )
  })

  it('a busca é um formulário de busca', () => {
    expect(html()).toContain('role="search"')
  })

  it('a distância é só um chip que reabre o seletor de endereço, sem controle duplicado (7CF)', () => {
    const page = html({ filters: { ...EMPTY_SEARCH, distance: 5 } })

    expect(page).toContain('Até 5 km')
    expect(page).toMatch(/aria-haspopup="dialog"[^>]*aria-label="Distância: Até 5 km\. Trocar/)
    expect(page).not.toContain('aria-label="Distância"')
    // Os outros raios ficam no seletor; o "20 km" que aparece é o do estado vazio ("Ampliar para 20 km").
    for (const other of ['>1 km<', '>2 km<', '>10 km<']) expect(page).not.toContain(other)
    expect(html()).toContain('Cidade: Garça')
  })

  it('em Cidade sem cidade conhecida, avisa que busca a até 20 km', () => {
    expect(html({ cityName: null })).toContain('Não sabemos a cidade desta localização')
    expect(html()).not.toContain('Não sabemos a cidade')
  })

  describe('estado vazio', () => {
    it('em raio menor que 20 km, oferece ampliar para 20 km', () => {
      const page = html({ filters: { ...EMPTY_SEARCH, distance: 2 } })

      expect(page).toContain('Nenhum estabelecimento a até 2 km.')
      expect(page).toContain('Ampliar para 20 km')
      expect(page).not.toContain('Limpar filtros')
    })

    it('em 20 km ou em Cidade, com filtro, só oferece limpar os filtros', () => {
      for (const distance of [20, 'city'] as const) {
        const page = html({ filters: { ...EMPTY_SEARCH, distance, category: 'Saude' } })

        expect(page).toContain('Limpar filtros')
        expect(page).toContain('com esses filtros')
        expect(page).not.toContain('Ampliar para')
      }
      expect(html({ filters: { ...EMPTY_SEARCH, term: 'barba' } })).toContain(
        'Nenhum estabelecimento em Garça com esses filtros.',
      )
    })

    it('sem filtro para limpar, oferece trocar a localização, nunca um botão sem efeito', () => {
      const page = html()

      expect(page).toContain('Nenhum estabelecimento em Garça.')
      expect(page).toContain('Trocar localização')
      expect(page).not.toContain('Limpar filtros')
    })
  })
})
