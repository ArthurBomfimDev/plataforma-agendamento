import { ApiError, authRequest, request } from '@api/base'
import type { ConsentResponse, ConsentVersionsResponse, PagedResult } from '@api/models'

/** Agendar em Saúde (LGPD, Art. 11). */
export const SENSITIVE_SCHEDULING = 'SensitiveScheduling'

const CONSENTS = '/api/consents'

export const consentService = {
  versions: (signal?: AbortSignal) =>
    request<ConsentVersionsResponse>({ url: `${CONSENTS}/versions`, signal }),
  mine: (signal?: AbortSignal) =>
    authRequest<PagedResult<ConsentResponse>>({ url: CONSENTS, signal }),
  grant: (purpose: string, version: string) =>
    authRequest<ConsentResponse>({ method: 'POST', url: CONSENTS, data: { purpose, version } }),
  revoke: (purpose: string) =>
    authRequest<void>({ method: 'DELETE', url: `${CONSENTS}/${encodeURIComponent(purpose)}` }),
}

/** O servidor recusou o pedido em Saúde por falta de consentimento. */
export const isConsentRequired = (error: unknown) =>
  error instanceof ApiError && error.code === 'compliance.consent_required'

/** Grava o consentimento e só então reenvia o pedido: se gravar falhar, nada é reenviado. */
export const grantAndResend = async (grant: () => Promise<unknown>, resend: () => void) => {
  await grant()
  resend()
}
