export type CompleteProfileValues = {
  /** `yyyy-MM-dd`. */
  birthDate: string
  /** Opcional; vazio vira `null` na API. */
  socialName: string
}

export type CompleteProfileErrors = Partial<Record<keyof CompleteProfileValues, string>>

/** O que a tela sabe da conta: carregando, erro ao carregar, ou pronta (com ou sem perfil já criado). */
export type CompleteProfileData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; fullName: string; alreadyComplete: boolean }

export type CompleteProfileScreenProps = {
  data: CompleteProfileData
  /** Chamado só com os campos válidos. */
  onSubmit?: (values: CompleteProfileValues) => void
  submitting?: boolean
  /** Erro da tentativa (menor de idade, sem conexão…), já em texto para o consumidor. */
  error?: string
  /** Conta que já tem perfil (estado vazio) ou que acabou de completá-lo: segue para o destino. */
  onContinue?: () => void
}
