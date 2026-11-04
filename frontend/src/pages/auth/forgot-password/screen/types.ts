export type ForgotPasswordScreenProps = {
  /** Chamado só com e-mail válido. */
  onSubmit?: (email: string) => void
  submitting?: boolean
  /** Pedido enviado: a resposta é a mesma exista a conta ou não. */
  sent?: boolean
  error?: string
  onBack?: () => void
}
