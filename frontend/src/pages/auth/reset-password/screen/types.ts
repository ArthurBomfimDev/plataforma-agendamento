/** `form`: escolher a senha nova. `success`: trocada. `invalid`: link vencido, usado ou sem token. */
export type ResetPasswordState = 'form' | 'success' | 'invalid'

export type ResetPasswordValues = { password: string; confirmation: string }

export type ResetPasswordErrors = Partial<Record<keyof ResetPasswordValues, string>>

export type ResetPasswordScreenProps = {
  state: ResetPasswordState
  /** Chamado só com a senha válida e igual à confirmação. */
  onSubmit?: (password: string) => void
  submitting?: boolean
  error?: string
  onSignIn?: () => void
  onRequestNewLink?: () => void
}
