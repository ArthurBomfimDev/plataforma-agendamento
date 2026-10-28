/** Categorias que o backend filtra (`BusinessCategory`). */
export const SEARCH_CATEGORIES = ['Beleza', 'Saude'] as const
export type SearchCategory = (typeof SEARCH_CATEGORIES)[number]

/** Raios oferecidos: 5 km ("Até 5 km") ou o padrão da busca, 20 km. */
export const SEARCH_RADII = [5, 20] as const
export const DEFAULT_RADIUS_KM = 20

export type SearchSort = 'distance' | 'price'

/** Filtros da busca, todos com backend (`SearchBusinessesRequest`). */
export type SearchFilters = {
  term: string | null
  category: SearchCategory | null
  /** Em centavos. */
  maxPriceCents: number | null
  sortBy: SearchSort
  radiusKm: number
}

export const EMPTY_SEARCH: SearchFilters = {
  term: null,
  category: null,
  maxPriceCents: null,
  sortBy: 'distance',
  radiusKm: DEFAULT_RADIUS_KM,
}
