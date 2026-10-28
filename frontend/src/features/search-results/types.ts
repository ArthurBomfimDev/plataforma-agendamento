import type { SearchFilters } from '@lib/api/search'

/** Um estabelecimento da busca, com o serviço em destaque (o que casa com o termo, ou o mais barato). */
export type SearchResult = {
  id: string
  name: string
  distanceKm: number
  neighborhood: string
  verified: boolean
  service: { name: string; durationMinutes: number; fromPriceCents: number } | null
}

export type SearchResultsState =
  | { status: 'no-location' }
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry?: () => void }
  | { status: 'ready'; total: number; items: SearchResult[] }

export type SearchResultsScreenProps = {
  /** Os filtros aplicados, lidos da URL. */
  filters: SearchFilters
  results: SearchResultsState
  /** Nova busca em andamento com resultados antigos na tela. */
  searching?: boolean
  locationLabel: string | null
  /** Aplica uma mudança nos filtros (a rota grava na URL). */
  onChange?: (patch: Partial<SearchFilters>) => void
  onBack?: () => void
  onOpen?: (businessId: string) => void
  onChooseLocation?: () => void
}
