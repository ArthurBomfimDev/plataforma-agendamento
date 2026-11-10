export type ForBusinessesScreenProps = {
  /** Com sessão, "Já tenho conta: entrar" não faz sentido e some. */
  signedIn?: boolean
  onRegister?: () => void
  onSignIn?: () => void
}
