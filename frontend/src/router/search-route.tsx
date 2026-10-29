import { ROUTES, businessPath, readSearchFilters, searchPath } from './consts'
import { type SearchFilters, readStoredDistance, storeDistance } from '@lib/api/search'
import { useNavigate, useSearchParams } from 'react-router'

import { SearchResultsScreen } from '@features/search-results'
import type { SearchResultsState } from '@features/search-results/types'
import { errorMessage } from '@lib/api/errors'
import { toSearchResult } from './adapters'
import { useLocationStore } from '@lib/zustand/location'
import { useEffect } from 'react'
import { useSearchBusinesses } from '@lib/api/queries'

/**
 * `#/search?term=&category=&maxPrice=&sort=&radius=` (Onda 6C). Os filtros moram na URL: voltar no histórico
 * desfaz um filtro, e o link pode ser compartilhado. Nada pessoal vai nela — a localização fica no aparelho.
 *
 * Distância (Onda 7C): a da URL vence e passa a ser a lembrada no aparelho; sem ela na URL, vale a lembrada.
 */
export const SearchRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filters = readSearchFilters(searchParams, readStoredDistance())
  const urlDistance = searchParams.get('radius')
  const location = useLocationStore((state) => state.location)

  // A URL vence: um link com distância (compartilhado, ou o voltar do histórico) passa a ser a lembrada.
  useEffect(() => {
    if (urlDistance !== null) storeDistance(filters.distance)
  }, [urlDistance, filters.distance])
  const openPicker = useLocationStore((state) => state.openPicker)
  const search = useSearchBusinesses(location, filters)

  const results: SearchResultsState = !location
    ? { status: 'no-location' }
    : search.isError
      ? {
          status: 'error',
          message: errorMessage(search.error),
          onRetry: () => void search.refetch(),
        }
      : search.data
        ? {
            status: 'ready',
            total: search.data.totalCount,
            items: search.data.items.map(toSearchResult),
          }
        : { status: 'loading' }

  return (
    <SearchResultsScreen
      filters={filters}
      results={results}
      searching={search.isFetching}
      locationLabel={location?.label ?? null}
      cityName={location?.city ?? null}
      onChange={(patch: Partial<SearchFilters>) =>
        navigate(searchPath({ ...filters, ...patch }), { replace: false })
      }
      onBack={() => navigate(ROUTES.home)}
      onOpen={(businessId) => navigate(businessPath(businessId))}
      onChooseLocation={openPicker}
    />
  )
}
