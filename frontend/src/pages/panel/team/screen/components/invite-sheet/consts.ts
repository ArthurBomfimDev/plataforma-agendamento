import type { InviteDraft } from '../../types'
import { isValidEmail } from '../../consts'

/**
 * Sem papel marcado de início: com "Profissional" pré-selecionado, quem ia ser atendente virava profissional sem perceber,
 * com agenda vazia e perfil público (teste de 05/11).
 */
export const NO_ROLE = ''

export const ROLE_OPTIONS = [
  { value: NO_ROLE, label: 'Escolha o papel' },
  { value: 'Professional', label: 'Profissional — atende e tem agenda própria' },
  {
    value: 'Attendant',
    label: 'Atendente — opera a agenda de todos, sem editar o estabelecimento',
  },
]

/** Mesmo limite da API (`BusinessInvitation.MaxSpecialtyLength`). */
export const SPECIALTY_MAX_LENGTH = 80

export type InviteRoleValue = InviteDraft['role'] | typeof NO_ROLE

export type InviteForm = {
  name: string
  email: string
  role: InviteRoleValue
  specialty: string
  /** Perfil antigo, sem conta, a ligar à conta nova. Vazio: o perfil nasce no aceite. */
  professionalId: string
}

export type InviteErrors = Partial<Record<'name' | 'email' | 'role' | 'specialty', string>>

export const EMPTY_INVITE: InviteForm = {
  name: '',
  email: '',
  role: NO_ROLE,
  specialty: '',
  professionalId: '',
}

/**
 * A especialidade só existe para o profissional. Ligando a conta a um perfil antigo, o perfil já tem a sua, então o
 * campo some; para o atendente, que não tem perfil, também.
 */
export const asksSpecialty = (form: Pick<InviteForm, 'role' | 'professionalId'>) =>
  form.role === 'Professional' && !form.professionalId

export const validateInvite = (form: InviteForm): InviteErrors => {
  const errors: InviteErrors = {}

  if (!form.name.trim()) errors.name = 'Informe o nome de quem você convida.'
  if (!isValidEmail(form.email)) errors.email = 'Informe um e-mail válido.'
  if (form.role === NO_ROLE) errors.role = 'Escolha o papel da pessoa.'

  if (asksSpecialty(form)) {
    const specialty = form.specialty.trim()
    if (!specialty) errors.specialty = 'Informe a especialidade. Ex.: Barbeiro, Manicure.'
    else if (specialty.length > SPECIALTY_MAX_LENGTH) {
      errors.specialty = `A especialidade pode ter até ${SPECIALTY_MAX_LENGTH} caracteres.`
    }
  }

  return errors
}

/** O corpo do convite. Só chama com o formulário válido: o papel já foi escolhido. */
export const toInviteDraft = (form: InviteForm): InviteDraft => {
  const role = form.role as InviteDraft['role']
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    role,
    professionalId: role === 'Professional' && form.professionalId ? form.professionalId : null,
    specialty: asksSpecialty(form) ? form.specialty.trim() : null,
  }
}
