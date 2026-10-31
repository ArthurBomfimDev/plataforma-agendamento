import { ROUTES, businessPath, readSearchFilters, searchPath } from '@router/paths'
import { type SearchFilters, distanceSync, parseDistance } from '@api/services/business/search'
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { SearchResultsScreen } from './screen'
import type { SearchResultsState } from './screen/types'
import { errorMessage } from '@api/base'
import { toSearchResult } from '../adapters'
import { useLocationStore } from '@store/location'
import { useSearchBusinesses } from '@api/services/business/hooks'

/**
 * `#/search?term=&category=&maxPrice=&sort=&radius=` (Onda 6C). Os filtros moram na URL: voltar no histórico
 * desfaz um filtro, e o link pode ser compartilhado. Nada pessoal vai nela — a localização fica no aparelho.
 *
 * Distância (7CF): escolhida no seletor de endereço e guardada com ele; a tela só a lê e mostra num chip que
 * reabre o seletor. Na URL também; quando as duas divergem, `distanceSync` decide quem cede.
 */
export const SearchRoute = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocationStore((state) => state.location)
  const pickerDistance = useLocationStore((state) => state.distance)
  const setDistance = useLocationStore((state) => state.setDistance)
  const urlDistance = parseDistance(searchParams.get('radius'))
  const filters = readSearchFilters(searchParams, pickerDistance)

  const previous = useRef({ url: urlDistance, picker: pickerDistance })
  useEffect(() => {
    const next = { url: urlDistance, picker: pickerDistance }
    const action = distanceSync(previous.current, next)
    previous.current = next
    if (action === 'take-url' && urlDistance !== null) setDistance(urlDistance)
    if (action === 'write-url') {
      navigate(searchPath({ ...readSearchFilters(searchParams), distance: pickerDistance }), {
        replace: true,
      })
    }
  }, [urlDistance, pickerDistance, setDistance, navigate, searchParams])
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
