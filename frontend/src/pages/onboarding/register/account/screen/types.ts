export type OwnerAccountValues = {
  fullName: string
  email: string
  password: string
}

export type OwnerAccountField = keyof OwnerAccountValues | 'terms'

export type OwnerAccountErrors = Partial<Record<OwnerAccountField, string>>

export type OwnerAccountScreenProps = {
  /** Chamado só com todos os campos válidos e os termos aceitos. */
  onSubmit?: (values: OwnerAccountValues) => void
  submitting?: boolean
  /** Erro da tentativa (e-mail já cadastrado, sem conexão…), já em texto para a pessoa. */
  error?: string
  onSignIn?: () => void
}
