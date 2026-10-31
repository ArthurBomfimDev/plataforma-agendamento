import {
  MAX_SEARCH_RADIUS_KM,
  type SearchCategory,
  type SearchDistance,
  type SearchFilters,
} from '@lib/api/search'

/** Termo, categoria ou preço máximo aplicados: o que "Limpar filtros" tira. */
export const hasNarrowingFilters = (filters: SearchFilters) =>
  filters.term !== null || filters.category !== null || filters.maxPriceCents !== null

/**
 * O que o estado vazio oferece: ampliar para 20 km quando o raio é menor; em 20 km ou em Cidade, só limpar os
 * filtros — e, sem filtro para limpar, trocar a localização (nada de botão que não faz nada).
 */
export const emptyAction = (filters: SearchFilters): 'widen' | 'clear' | 'location' =>
  filters.distance !== 'city' && filters.distance < MAX_SEARCH_RADIUS_KM
    ? 'widen'
    : hasNarrowingFilters(filters)
      ? 'clear'
      : 'location'

/** Onde a busca procurou, para a frase do estado vazio. */
export const areaLabel = (distance: SearchDistance, cityName: string | null) =>
  distance === 'city'
    ? cityName
      ? `em ${cityName}`
      : `a até ${MAX_SEARCH_RADIUS_KM} km`
    : `a até ${distance} km`

/** Rótulo de cada categoria do backend na tela. */
export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  Beleza: 'Beleza',
  Saude: 'Saúde',
}

/** Tetos de preço oferecidos, em centavos. O backend filtra pelo "a partir de" do serviço em destaque. */
export const PRICE_CEILINGS = [5_000, 10_000, 20_000] as const

/** `5000` → `Até R$ 50`. Montado à mão: o `Intl` muda o espaço de ambiente para ambiente. */
export const priceCeilingLabel = (cents: number) => `Até R$ ${Math.round(cents / 100)}`

export const resultsCount = (total: number) =>
  total === 1 ? '1 resultado' : `${total.toLocaleString('pt-BR')} resultados`
