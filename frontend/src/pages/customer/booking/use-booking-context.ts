import { useBusiness, useProfessionals, useServices } from '@api/services/business/hooks'

import type { BusinessProfessional } from './choose-professional/screen/types'
import type { PublicBusinessResponse } from '@api/models'
import type { PublicServiceResponse } from '@api/models'
import { isNotFound } from '@api/base'
import { toProfessional } from '../adapters'

export type BookingContext =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; error: unknown; retry: () => void }
  | {
      status: 'ready'
      business: PublicBusinessResponse
      service: PublicServiceResponse
      /** Só quem executa o serviço, na ordem da vitrine. */
      professionals: BusinessProfessional[]
    }

/**
 * Estabelecimento, serviço e profissionais habilitados: o que toda tela do fluxo de agendamento
 * precisa. As três consultas ficam em cache, então ir e voltar entre as telas não refaz a busca.
 */
export const useBookingContext = (businessId: string, serviceId: string): BookingContext => {
  const business = useBusiness(businessId)
  const services = useServices(businessId)
  const professionals = useProfessionals(businessId)

  const queries = [business, services, professionals]
  const failed = queries.find((query) => query.isError)

  if (failed) {
    if (isNotFound(failed.error)) return { status: 'not-found' }
    return {
      status: 'error',
      error: failed.error,
      retry: () => queries.forEach((query) => void query.refetch()),
    }
  }

  if (!business.data || !services.data || !professionals.data) return { status: 'loading' }

  const service = services.data.find(({ id }) => id === serviceId)
  if (!service) return { status: 'not-found' }

  const enabled = new Set(service.professionals.map(({ professionalId }) => professionalId))

  return {
    status: 'ready',
    business: business.data,
    service,
    professionals: professionals.data.filter(({ id }) => enabled.has(id)).map(toProfessional),
  }
}
