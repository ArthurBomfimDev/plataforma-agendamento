import type { OwnerAccountErrors, OwnerAccountField, OwnerAccountValues } from './types'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@pages/auth/sign-in/screen/consts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** A ordem em que a tela leva o foco ao primeiro campo com erro. */
export const OWNER_ACCOUNT_FIELD_ORDER: OwnerAccountField[] = [
  'fullName',
  'email',
  'password',
  'terms',
]

/** As mesmas regras do cadastro comum (nome, e-mail, senha de 8 a 128 caracteres), mais o aceite dos termos. */
export const validateOwnerAccount = (
  values: OwnerAccountValues,
  termsAccepted: boolean,
): OwnerAccountErrors => {
  const errors: OwnerAccountErrors = {}

  if (values.fullName.trim().length < 2) errors.fullName = 'Informe seu nome completo'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Informe um e-mail válido'
  if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `A senha tem no mínimo ${PASSWORD_MIN_LENGTH} caracteres`
  } else if (values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `A senha tem no máximo ${PASSWORD_MAX_LENGTH} caracteres`
  }
  if (!termsAccepted) errors.terms = 'Aceite os termos para continuar'

  return errors
}
