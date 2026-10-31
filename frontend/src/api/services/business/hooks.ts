import { EMPTY_SEARCH, type SearchFilters, searchArea } from './search'

import { businessService } from '.'
import { queryKeys } from '../query-keys'
import { useQueries } from '@tanstack/react-query'
import { useService } from '@api/base'

/**
 * Busca perto da referência, com os filtros que o backend suporta. Sem referência, não busca. Em "Cidade",
 * manda a cidade da localização escolhida (`searchArea`).
 */
export const useSearchBusinesses = (
  location: { latitude: number; longitude: number; city?: string | null } | null,
  filters: Partial<SearchFilters> = {},
) => {
  const { term, category, maxPriceCents, sortBy, distance } = { ...EMPTY_SEARCH, ...filters }
  const { radiusKm, city } = searchArea(distance, location?.city)
  return useService({
    queryKey: queryKeys.search(location?.latitude ?? 0, location?.longitude ?? 0, {
      ...filters,
      distance,
      city: city ?? null,
    }),
    service: (signal) =>
      businessService.search(
        {
          latitude: location!.latitude,
          longitude: location!.longitude,
          radiusKm,
          city,
          term: term ?? undefined,
          category: category ?? undefined,
          maxPriceCents: maxPriceCents ?? undefined,
          sortBy: sortBy === 'distance' ? undefined : sortBy,
        },
        signal,
      ),
    enabled: location !== null,
  })
}

export const useBusiness = (businessId: string) =>
  useService({
    queryKey: queryKeys.business(businessId),
    service: (signal) => businessService.get(businessId, signal),
    enabled: businessId !== '',
  })

export const useServices = (businessId: string) =>
  useService({
    queryKey: queryKeys.services(businessId),
    service: async (signal) => (await businessService.services(businessId, signal)).items,
    enabled: businessId !== '',
  })

export const useProfessionals = (businessId: string) =>
  useService({
    queryKey: queryKeys.professionals(businessId),
    service: async (signal) => (await businessService.professionals(businessId, signal)).items,
    enabled: businessId !== '',
  })

/** Busca vários estabelecimentos de uma vez (a lista de agendamentos cita vários). */
export const useBusinesses = (businessIds: string[]) =>
  useQueries({
    queries: businessIds.map((businessId) => ({
      queryKey: queryKeys.business(businessId),
      queryFn: ({ signal }: { signal: AbortSignal }) => businessService.get(businessId, signal),
    })),
  })
