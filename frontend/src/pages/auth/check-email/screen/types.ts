export type CheckEmailScreenProps = {
  /** Endereço usado no cadastro. Nulo quando a tela abre sem ele (recarregou em outra aba). */
  email: string | null
  /** Segundos até poder reenviar. Zero libera o botão. */
  secondsLeft: number
  resending?: boolean
  /** Mensagem depois de um reenvio, para o leitor de tela anunciar. */
  status?: string
  error?: string
  onResend?: () => void
  onUseAnotherEmail?: () => void
  onSignIn?: () => void
}
