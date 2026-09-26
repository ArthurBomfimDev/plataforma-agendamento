import type { SearchResultCardProps } from '../../components/search-result-card/types'

export type SearchResult = Omit<SearchResultCardProps, 'onSelectSlot' | 'className'> & {
  id: string
}

export type SearchFilter = {
  id: string
  label: string
}

export type SearchResultsScreenProps = {
  onBack?: () => void
}
