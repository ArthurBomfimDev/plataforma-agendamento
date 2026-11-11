import type { CompleteProfileErrors, CompleteProfileValues } from './types'

/** Valida no envio. A idade mínima quem diz é a API, depois da tentativa. */
export const validateCompleteProfile = (
  values: CompleteProfileValues,
  today: string,
): CompleteProfileErrors => {
  const errors: CompleteProfileErrors = {}

  // `yyyy-MM-dd` compara como texto na ordem certa.
  if (!values.birthDate || values.birthDate >= today) {
    errors.birthDate = 'Informe sua data de nascimento'
  }

  return errors
}
