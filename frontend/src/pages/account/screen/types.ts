import type { ConsentResponse } from '@api/models'

export type MyAccountData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; fullName: string; email: string }

/** Consentimentos da conta (LGPD): os em vigor podem ser revogados aqui. */
export type ConsentsData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; items: ConsentResponse[] }

export type MyAccountScreenProps = {
  data: MyAccountData
  /** Ausente: a tela não mostra a seção. */
  consents?: ConsentsData
  /** Resolve `null` se revogou, senão a mensagem de erro, já em português. */
  onRevokeConsent?: (purpose: string) => Promise<string | null>
  /** As gravações resolvem `null` se deu certo, senão a mensagem de erro, já em português. */
  onSaveName: (fullName: string) => Promise<string | null>
  onChangePassword: (current: string, next: string) => Promise<string | null>
  onSignOut: () => void
  /** A conta tem mais de um contexto: leva à troca (tela da 7A). */
  onSwitchContext?: () => void
  /** A conta é dona ou profissional de algum estabelecimento e está no contexto de consumidor: "Meu painel". */
  onOpenPanel?: () => void
  /** A conta não tem perfil de consumidor: "Completar cadastro de consumidor". */
  onCompleteProfile?: () => void
  /** "Cadastrar meu estabelecimento" (Fase 3). */
  onRegisterBusiness?: () => void
}
