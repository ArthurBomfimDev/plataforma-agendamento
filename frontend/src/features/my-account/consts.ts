/** Mesma regra do backend (`PasswordRules`): de 8 a 128 caracteres. */
export const PASSWORD_LIMITS = { min: 8, max: 128 } as const

export type PasswordErrors = Partial<Record<'current' | 'next' | 'confirm', string>>

/** O que o cliente confere antes de enviar; a senha atual só o servidor confere. */
export const validatePasswordChange = (current: string, next: string, confirm: string) => {
  const errors: PasswordErrors = {}
  if (!current) errors.current = 'Informe a senha atual.'
  if (next.length < PASSWORD_LIMITS.min || next.length > PASSWORD_LIMITS.max)
    errors.next = `A senha nova precisa ter entre ${PASSWORD_LIMITS.min} e ${PASSWORD_LIMITS.max} caracteres.`
  else if (next === current) errors.next = 'A senha nova precisa ser diferente da atual.'
  if (confirm !== next) errors.confirm = 'As duas senhas novas não são iguais.'
  return errors
}
