import type { InvitationPreviewResponse } from '@api/models'

/** Por que o link não serve. `not_found` inclui o token ausente, truncado ou de outro estabelecimento. */
export type InvitationInvalidReason = 'not_found' | 'expired' | 'revoked' | 'used'

/**
 * Quem está abrindo o link:
 * - `new`: sem sessão e sem conta com o e-mail do convite → cria a conta;
 * - `existing`: sem sessão, mas a conta já existe → entra;
 * - `match`: já está logado com o e-mail do convite → só aceita;
 * - `other`: logado com outro e-mail → precisa sair.
 */
export type InvitationAccess = 'new' | 'existing' | 'match' | 'other'

export type InvitationScreenState = 'loading' | 'error' | 'invalid' | 'ready'

export type CreateAccountValues = { fullName: string; password: string; confirmation: string }

export type CreateAccountErrors = Partial<Record<keyof CreateAccountValues | 'terms', string>>

export type InvitationScreenProps = {
  state: InvitationScreenState
  /** `invalid`: o motivo. */
  reason?: InvitationInvalidReason
  /** `error`: a mensagem (falha de rede, servidor). */
  message?: string
  /** `ready`. */
  preview?: InvitationPreviewResponse
  access?: InvitationAccess
  /** E-mail da sessão aberta (`match` e `other`). */
  currentEmail?: string
  submitting?: boolean
  /** Erro ao aceitar (senha curta, vaga, etc.), em português. */
  error?: string
  onCreateAccount?: (values: { fullName: string; password: string; acceptTerms: boolean }) => void
  onAccept?: (acceptTerms: boolean) => void
  onSignIn?: () => void
  onSignOut?: () => void
  onRetry?: () => void
  onHome?: () => void
}
