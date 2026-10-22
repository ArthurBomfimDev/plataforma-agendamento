import type { SignUpErrors, SignUpValues } from './types'

import { PASSWORD_MIN_LENGTH } from '@features/sign-in/consts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valida no envio. Se o e-mail já tem conta, quem diz é a API, depois da tentativa. */
export const validateSignUp = (values: SignUpValues, today: string): SignUpErrors => {
  const errors: SignUpErrors = {}

  if (values.fullName.trim().length < 2) errors.fullName = 'Informe seu nome'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Informe um e-mail válido'
  if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `A senha tem no mínimo ${PASSWORD_MIN_LENGTH} caracteres`
  }
  // `yyyy-MM-dd` compara como texto na ordem certa.
  if (!values.birthDate || values.birthDate >= today) {
    errors.birthDate = 'Informe sua data de nascimento'
  }

  return errors
}
