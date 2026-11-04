import { managementService } from '.'
import { queryKeys } from '../query-keys'
import { useService } from '@api/base'

/** O perfil de profissional da própria conta. Só o profissional com conta (os outros papéis recebem 403). */
export const useMyProfessionalProfile = (businessId: string, enabled: boolean) =>
  useService({
    queryKey: queryKeys.panelMyProfile(businessId),
    service: (signal) => managementService.myProfile(signal),
    enabled,
    retry: false,
  })

export const usePanelExceptions = (businessId: string) =>
  useService({
    queryKey: queryKeys.panelExceptions(businessId),
    service: async (signal) => (await managementService.exceptions(signal)).items,
  })
