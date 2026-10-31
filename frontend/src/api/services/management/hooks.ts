import { managementService } from '.'
import { queryKeys } from '../query-keys'
import { useService } from '@api/base'

export const usePanelExceptions = (businessId: string) =>
  useService({
    queryKey: queryKeys.panelExceptions(businessId),
    service: async (signal) => (await managementService.exceptions(signal)).items,
  })
