import type { SearchFilter, SearchResult } from './types'

/**
 * Dados PROVISÓRIOS, copiados do wireframe "02 · Resultados da busca" do Figma.
 * Não são dado real. Saem quando existir a busca em `src/lib/api`.
 */
export const SEARCH_QUERY = 'corte de cabelo'

/** Total da busca, não o tamanho da página: o wireframe mostra 3 de 18. */
export const SEARCH_RESULTS_TOTAL: number = 18

export const SEARCH_FILTERS: SearchFilter[] = [
  { id: 'available-today', label: 'Disponível hoje' },
  { id: 'up-to-5-km', label: 'Até 5 km' },
  { id: 'rating-4-5', label: '★ 4,5+' },
  { id: 'price', label: 'Preço' },
]

export const SEARCH_INITIAL_FILTERS = ['available-today']

export const SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'estudio-duartina',
    name: 'Estúdio Duartina',
    serviceName: 'Corte masculino',
    durationMinutes: 30,
    priceCents: 4500,
    distanceKm: 1.2,
    availability: { dayLabel: 'Hoje', slots: ['14:30', '15:00', '16:00'] },
  },
  {
    id: 'barbearia-norte',
    name: 'Barbearia Norte',
    serviceName: 'Corte + barba',
    durationMinutes: 60,
    priceCents: 8000,
    distanceKm: 2.6,
    availability: { dayLabel: 'Amanhã', slots: ['09:00', '10:30'] },
  },
  {
    id: 'salao-vila-rica',
    name: 'Salão Vila Rica',
    serviceName: 'Corte feminino',
    durationMinutes: 45,
    priceCents: 7000,
    distanceKm: 3.1,
    availability: null,
  },
]
