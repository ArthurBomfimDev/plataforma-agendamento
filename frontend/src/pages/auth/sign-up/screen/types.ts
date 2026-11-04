export type SignUpValues = {
  fullName: string
  email: string
  password: string
  /** Repetição da senha: só o formulário confere; não vai para a API. */
  passwordConfirmation: string
  /** `yyyy-MM-dd`. */
  birthDate: string
}

export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>

export type SignUpScreenProps = {
  /** Chamado só com todos os campos válidos. */
  onSubmit?: (values: SignUpValues) => void
  submitting?: boolean
  /** Erro da tentativa (e-mail já cadastrado, sem conexão…), já em texto para o consumidor. */
  error?: string
  onSignIn?: () => void
}
