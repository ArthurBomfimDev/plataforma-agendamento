import type { ReactNode } from 'react'

export type MobileTopBarProps = {
  signedIn: boolean
  onHome: () => void
  onSignIn: () => void
  onSignUp: () => void
  /** Com sessão, o menu da conta (troca de contexto, minha conta e sair). */
  accountMenu?: ReactNode
  /** Com sessão, o sino de avisos, antes do tema. */
  notifications?: ReactNode
}
