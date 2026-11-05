import type {
  AcceptInvitationNewAccountRequest,
  AcceptedInvitationResponse,
  InvitationPreviewResponse,
  InvitationResponse,
  InviteMemberRequest,
  PagedResult,
  SeatsResponse,
  TeamMemberResponse,
} from '@api/models'
import { authRequest, request } from '@api/base'

import { invitationEndpoints } from './endpoints'

export const invitationService = {
  /** Pendentes do estabelecimento (só o dono). */
  list: (signal?: AbortSignal) =>
    authRequest<PagedResult<InvitationResponse>>({
      url: invitationEndpoints.list,
      params: { pageSize: 50 },
      signal,
    }),
  seats: (signal?: AbortSignal) =>
    authRequest<SeatsResponse>({ url: invitationEndpoints.seats, signal }),
  /** Quem tem conta no estabelecimento, com o papel (só o dono). */
  members: (signal?: AbortSignal) =>
    authRequest<PagedResult<TeamMemberResponse>>({
      url: invitationEndpoints.members,
      params: { pageSize: 50 },
      signal,
    }),
  invite: (data: InviteMemberRequest) =>
    authRequest<InvitationResponse>({ method: 'POST', url: invitationEndpoints.list, data }),
  /** Token novo e prazo novo: o link antigo deixa de valer. */
  resend: (invitationId: string) =>
    authRequest<InvitationResponse>({
      method: 'POST',
      url: invitationEndpoints.resend(invitationId),
    }),
  revoke: (invitationId: string) =>
    authRequest<void>({ method: 'DELETE', url: invitationEndpoints.one(invitationId) }),
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
