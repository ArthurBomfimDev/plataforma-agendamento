/** Categorias que o backend filtra (`BusinessCategory`). */
export const SEARCH_CATEGORIES = ['Beleza', 'Saude'] as const
export type SearchCategory = (typeof SEARCH_CATEGORIES)[number]

/** Raios oferecidos, em km (Onda 7C). O backend aceita de 0,1 a 50. */
export const SEARCH_RADII = [1, 2, 5, 10, 20] as const
export type SearchRadius = (typeof SEARCH_RADII)[number]

/** O maior raio oferecido: o estado vazio sugere ampliar até ele. */
export const MAX_SEARCH_RADIUS_KM: SearchRadius = 20

/**
 * Distância da busca: um raio, ou `city` — só a cidade da localização escolhida (o backend compara sem acento,
 * entre os candidatos a até 50 km). `city` é o padrão.
 */
export type SearchDistance = SearchRadius | 'city'
export const DEFAULT_DISTANCE: SearchDistance = 'city'

export type SearchSort = 'distance' | 'price'

/** Filtros da busca, todos com backend (`SearchBusinessesRequest`). */
export type SearchFilters = {
  term: string | null
  category: SearchCategory | null
  /** Em centavos. */
  maxPriceCents: number | null
  sortBy: SearchSort
  distance: SearchDistance
}

export const EMPTY_SEARCH: SearchFilters = {
  term: null,
  category: null,
  maxPriceCents: null,
  sortBy: 'distance',
  distance: DEFAULT_DISTANCE,
}

/** `"city"`, `"5"` → a distância; qualquer outra coisa (link editado à mão) → `null`. */
export const parseDistance = (value: string | null): SearchDistance | null => {
  if (value === 'city') return 'city'
  const radius = Number(value)
  return SEARCH_RADII.find((r) => r === radius) ?? null
}

/**
 * Raio e cidade que vão para a API. Com `city` e sem cidade conhecida (localização antiga, ou o provedor não
 * soube dizer), busca no maior raio oferecido — `cityKnown` falso avisa a tela.
 */
export const searchArea = (distance: SearchDistance, city: string | null | undefined) =>
  distance === 'city'
    ? city
      ? { radiusKm: undefined, city, cityKnown: true }
      : { radiusKm: MAX_SEARCH_RADIUS_KM, city: undefined, cityKnown: false }
    : { radiusKm: distance, city: undefined, cityKnown: true }

/**
 * Os chips do seletor de endereço (7CF): Cidade primeiro, que é o padrão, e os raios em ordem. A distância fica no
 * seletor, junto do endereço (`useLocationStore`); a busca só a lê.
 */
export const DISTANCE_OPTIONS: ReadonlyArray<{ value: SearchDistance; label: string }> = [
  { value: 'city', label: 'Cidade' },
  ...SEARCH_RADII.map((km) => ({ value: km, label: `${km} km` })),
]

/**
 * Quem cede quando a URL e o seletor divergem na tela de busca (7CF). A URL vence quando foi ela que mudou — link
 * aberto, voltar no histórico — e o seletor recebe o valor dela (`take-url`). Se foi o seletor que mudou (a pessoa
 * tocou num chip lá), a URL é que se atualiza (`write-url`), também quando ainda não tinha distância. Iguais,
 * nada a fazer.
 */
export const distanceSync = (
  previous: { url: SearchDistance | null; picker: SearchDistance },
  next: { url: SearchDistance | null; picker: SearchDistance },
): 'none' | 'take-url' | 'write-url' => {
  const pickerChanged = next.picker !== previous.picker
  if (next.url === null) return pickerChanged ? 'write-url' : 'none'
  if (next.url === next.picker) return 'none'
  const urlChanged = next.url !== previous.url
  return pickerChanged && !urlChanged ? 'write-url' : 'take-url'
}

/** O chip da busca que reabre o seletor: "Cidade: Garça", "Até 5 km". */
export const distanceChipLabel = (distance: SearchDistance, city: string | null | undefined) =>
  distance === 'city' ? (city ? `Cidade: ${city}` : 'Cidade') : `Até ${distance} km`
