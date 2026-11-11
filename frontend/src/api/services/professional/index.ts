import type {
  PagedResult,
  ProfessionalPageResponse,
  ProfessionalRemovalResponse,
} from '@api/models'
import { authRequest, request } from '@api/base'

import { professionalEndpoints } from './endpoints'

export const professionalService = {
  page: (professionalId: string, signal?: AbortSignal) =>
    request<ProfessionalPageResponse>({ url: professionalEndpoints.page(professionalId), signal }),
  /** Sem login. 204. Contato é dado pessoal: só vai ao dono e ao Admin. */
  requestRemoval: (professionalId: string, reason: string, contact: string | null) =>
    request<void>({
      method: 'POST',
      url: professionalEndpoints.removalRequest(professionalId),
      data: { reason, contact },
    }),
  leave: () => authRequest<void>({ method: 'POST', url: professionalEndpoints.leave }),
  admin: {
    removals: (status: 'Open' | 'Resolved', signal?: AbortSignal) =>
      authRequest<PagedResult<ProfessionalRemovalResponse>>({
        url: professionalEndpoints.admin.removals,
        params: { status, pageSize: 100 },
        signal,
      }),
    resolve: (requestId: string, note: string | null) =>
      authRequest<ProfessionalRemovalResponse>({
        method: 'POST',
        url: professionalEndpoints.admin.resolve(requestId),
        data: { note },
      }),
  },
}
