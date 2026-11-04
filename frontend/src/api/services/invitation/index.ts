import type {
  AcceptInvitationNewAccountRequest,
  AcceptedInvitationResponse,
  InvitationPreviewResponse,
} from '@api/models'
import { authRequest, request } from '@api/base'

import { invitationEndpoints } from './endpoints'

export const invitationService = {
  preview: (token: string, signal?: AbortSignal) =>
    request<InvitationPreviewResponse>({
      method: 'POST',
      url: invitationEndpoints.preview,
      data: { token },
      signal,
    }),
  /** Quem já tem conta e está logado com o e-mail do convite. */
  accept: (token: string, acceptTerms: boolean) =>
    authRequest<AcceptedInvitationResponse>({
      method: 'POST',
      url: invitationEndpoints.accept,
      data: { token, acceptTerms },
    }),
  /** Cria a conta (e-mail do convite, já confirmado) e aceita. Depois, o login usa as mesmas credenciais. */
  acceptWithNewAccount: (data: AcceptInvitationNewAccountRequest) =>
    request<AcceptedInvitationResponse>({
      method: 'POST',
      url: invitationEndpoints.acceptNewAccount,
      data,
    }),
}
