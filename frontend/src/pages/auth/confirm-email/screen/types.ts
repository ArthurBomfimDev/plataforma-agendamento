/** `loading`: conferindo o link. `success`: conta ativa. `invalid`: vencido, usado ou incompleto. */
export type ConfirmEmailState = 'loading' | 'success' | 'invalid'

export type ConfirmEmailScreenProps = {
  state: ConfirmEmailState
  onSignIn?: () => void
  /** Pedido de um link novo, no estado `invalid`. Chamado só com e-mail válido. */
  onResend?: (email: string) => void
  resending?: boolean
  /** Depois do reenvio: a resposta é a mesma exista a conta ou não. */
  resent?: boolean
  resendError?: string
}
