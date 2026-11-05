import type { CreateAccountErrors, CreateAccountValues, InvitationInvalidReason } from './types'

import type { InvitationRole } from '@api/models'
import { validatePassword } from '@pages/auth/reset-password/screen/consts'

export const ROLE_LABELS: Record<InvitationRole, string> = {
  Professional: 'profissional',
  Attendant: 'atendente',
}

export const INVALID_MESSAGES: Record<InvitationInvalidReason, string> = {
  not_found:
    'Este convite não existe ou o link está incompleto. Peça um novo link ao estabelecimento.',
  expired:
    'Este convite expirou. Os convites valem por 7 dias: peça ao estabelecimento para reenviar.',
  revoked: 'Este convite foi cancelado pelo estabelecimento.',
  used: 'Este convite já foi usado. Se foi você, é só entrar na sua conta.',
}

export const TERMS_REQUIRED_MESSAGE = 'Aceite o termo do profissional para continuar.'

/** Aceite com conta nova: nome, senha de 8 a 128 caracteres igual à confirmação e, para profissional, o termo. */
export const validateCreateAccount = (
  values: CreateAccountValues,
  termsRequired: boolean,
  termsAccepted: boolean,
): CreateAccountErrors => {
  const errors: CreateAccountErrors = {}

  if (!values.fullName.trim()) errors.fullName = 'Informe seu nome'

  const password = validatePassword(values.password)
  if (password) errors.password = password
  if (values.confirmation !== values.password) errors.confirmation = 'As senhas não são iguais'

  if (termsRequired && !termsAccepted) errors.terms = TERMS_REQUIRED_MESSAGE

  return errors
}
