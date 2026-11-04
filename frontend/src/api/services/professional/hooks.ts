import { useMe, useSwitchContext } from '../auth/hooks'
import { useService, useServiceMutation } from '@api/base'

import { professionalService } from '.'
import { queryKeys } from '../query-keys'

/** Página pública do profissional. Sem nova tentativa em 404: perfil inativo não volta sozinho. */
export const useProfessionalPage = (professionalId: string) =>
  useService({
    queryKey: queryKeys.professionalPage(professionalId),
    service: (signal) => professionalService.page(professionalId, signal),
    retry: false,
  })

export const useRequestProfessionalRemoval = () =>
  useServiceMutation({
    service: ({
      professionalId,
      reason,
      contact,
    }: {
      professionalId: string
      reason: string
      contact: string | null
    }) => professionalService.requestRemoval(professionalId, reason, contact),
  })

/**
 * "Sair do estabelecimento": remove o vínculo e volta ao contexto de consumidor (o token do painel não serve mais para
 * este estabelecimento). O perfil sai da vitrine na hora; o histórico de agendamentos permanece.
 */
export const useLeaveBusiness = () => {
  const switchContext = useSwitchContext()
  const me = useMe()

  return useServiceMutation({
    service: async () => {
      await professionalService.leave()
      if (me.data) await switchContext.mutateAsync({ userId: me.data.id, business: null })
    },
  })
}

/** Fila de pedidos de remoção, do Admin. */
export const useAdminProfessionalRemovals = (status: 'Open' | 'Resolved') =>
  useService({
    queryKey: queryKeys.adminProfessionalRemovals(status),
    service: async (signal) => (await professionalService.admin.removals(status, signal)).items,
  })

export const useResolveProfessionalRemoval = () =>
  useServiceMutation({
    service: ({ requestId, note }: { requestId: string; note: string | null }) =>
      professionalService.admin.resolve(requestId, note),
    invalidates: [queryKeys.admin],
  })
