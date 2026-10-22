/** Quem está entrando. `Owner` e `Professional` entram pelo mesmo lado: "estabelecimento". */
export type SignInRole = 'customer' | 'business'

export type SignInValues = {
  role: SignInRole
  email: string
  password: string
}

export type SignInErrors = Partial<Record<'email' | 'password', string>>

export type SignInScreenProps = {
  /** Chamado só com e-mail e senha válidos. */
  onSubmit?: (values: SignInValues) => void
  onForgotPassword?: () => void
  onCreateAccount?: () => void
}
