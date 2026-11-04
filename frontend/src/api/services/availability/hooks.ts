import type { AvailabilityTarget } from './types'
import { availabilityService } from '.'
import { queryKeys } from '../query-keys'
import { useQueries } from '@tanstack/react-query'

/** Calendário de um ou mais profissionais: uma consulta por profissional, todas em paralelo. */
export const useAvailabilityCalendars = (
  { businessId, serviceId, professionalIds }: AvailabilityTarget,
  from: string,
  to: string,
) =>
  useQueries({
    queries: professionalIds.map((professionalId) => ({
      queryKey: queryKeys.calendar(businessId, serviceId, professionalId, from, to),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        availabilityService.calendar(businessId, { serviceId, professionalId, from, to }, signal),
    })),
  })

export const useDaySlots = (
  { businessId, serviceId, professionalIds }: AvailabilityTarget,
  date: string | null,
) =>
  useQueries({
    queries: professionalIds.map((professionalId) => ({
      queryKey: queryKeys.day(businessId, serviceId, professionalId, date ?? ''),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        availabilityService.day(businessId, { serviceId, professionalId, date: date! }, signal),
      enabled: date !== null,
    })),
  })
