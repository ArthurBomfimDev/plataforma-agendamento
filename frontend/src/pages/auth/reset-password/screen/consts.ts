import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@pages/auth/sign-in/screen/consts'
import type { ResetPasswordErrors, ResetPasswordValues } from './types'

/** As mesmas regras do backend (`PasswordRules`): de 8 a 128 caracteres. */
export const validatePassword = (password: string): string | undefined => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha tem no mínimo ${PASSWORD_MIN_LENGTH} caracteres`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `A senha tem no máximo ${PASSWORD_MAX_LENGTH} caracteres`
  }
  return undefined
}

export const validateResetPassword = (values: ResetPasswordValues): ResetPasswordErrors => {
  const errors: ResetPasswordErrors = {}

  const password = validatePassword(values.password)
  if (password) errors.password = password
  if (values.confirmation !== values.password) errors.confirmation = 'As senhas não são iguais'

  return errors
}
