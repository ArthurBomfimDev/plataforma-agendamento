import type { ImageSet } from '@lib/api/types'
import type { SearchFilters } from '@lib/api/search'

/** Um estabelecimento da busca, com o serviço em destaque (o que casa com o termo, ou o mais barato). */
export type SearchResult = {
  id: string
  name: string
  distanceKm: number
  neighborhood: string
  verified: boolean
  category: string
  /** Miniatura: o logotipo, ou a capa. */
  image: ImageSet | null
  /** Para o card largo (sem serviço em destaque): a capa, ou o logotipo. */
  cover: ImageSet | null
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
  /**
   * Cidade da localização escolhida, usada em "Cidade". Nula: o provedor não soube dizer (ou a localização foi
   * guardada antes da Onda 7C), e "Cidade" busca no maior raio, com um aviso.
   */
  cityName: string | null
  /** Aplica uma mudança nos filtros (a rota grava na URL). */
  onChange?: (patch: Partial<SearchFilters>) => void
  onBack?: () => void
  onOpen?: (businessId: string) => void
  onChooseLocation?: () => void
}
