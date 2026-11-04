export type MyAccountData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; fullName: string; email: string }

export type MyAccountScreenProps = {
  data: MyAccountData
  /** As gravações resolvem `null` se deu certo, senão a mensagem de erro, já em português. */
  onSaveName: (fullName: string) => Promise<string | null>
  onChangePassword: (current: string, next: string) => Promise<string | null>
  onSignOut: () => void
  /** A conta tem mais de um contexto: leva à troca (tela da 7A). */
  onSwitchContext?: () => void
}
