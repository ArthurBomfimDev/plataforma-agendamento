import type { BusinessRole } from '@lib/api/types'

export type Session = {
  accessToken: string
  /** ISO 8601. */
  accessTokenExpiresAt: string
  refreshToken: string
}

/**
 * Painel aberto: o access token da sessão carrega este estabelecimento e o papel. `null` na store =
 * contexto de consumidor (decisão de 22/09, §2.0: conta única com troca explícita).
 */
export type BusinessContext = {
  businessId: string
  businessName: string
  role: BusinessRole
}

export type SessionState = {
  session: Session | null
  context: BusinessContext | null
  /** Sessão nova (entrar, renovar). Não mexe no contexto: quem renova pede o contexto de novo. */
  setSession: (session: Session) => void
  /** Troca o access token pelo do contexto escolhido. */
  setContext: (
    accessToken: string,
    accessTokenExpiresAt: string,
    context: BusinessContext | null,
  ) => void
  clearSession: () => void
}
