import {
  EMPTY_INVITE,
  type InviteForm,
  NO_ROLE,
  ROLE_OPTIONS,
  SPECIALTY_MAX_LENGTH,
  asksSpecialty,
  toInviteDraft,
  validateInvite,
} from './consts'
import { describe, expect, it } from 'vitest'

// A gaveta abre num portal, que o `renderToString` não desenha: as regras do formulário são funções puras, testadas aqui,
// e a gaveta aberta é conferida no navegador (docs/verificacao-final-2026-11-10.md).

const professional = (patch: Partial<InviteForm> = {}): InviteForm => ({
  ...EMPTY_INVITE,
  name: 'Rafa',
  email: 'rafa@exemplo.com',
  role: 'Professional',
  specialty: 'Barbeiro',
  ...patch,
})

describe('papel do convite', () => {
  it('nenhum papel vem marcado: a primeira opção é pedir a escolha', () => {
    expect(ROLE_OPTIONS[0]).toEqual({ value: NO_ROLE, label: 'Escolha o papel' })
    expect(EMPTY_INVITE.role).toBe(NO_ROLE)
  })

  it('oferece só os papéis convidáveis', () => {
    expect(ROLE_OPTIONS.map(({ value }) => value)).toEqual([NO_ROLE, 'Professional', 'Attendant'])
  })
})

describe('especialidade no convite', () => {
  it('é pedida só para o profissional', () => {
    expect(asksSpecialty(professional())).toBe(true)
    expect(asksSpecialty(professional({ role: 'Attendant' }))).toBe(false)
    expect(asksSpecialty(professional({ role: NO_ROLE }))).toBe(false)
  })

  it('ligando a um perfil antigo, o campo some: o perfil já tem a sua especialidade', () => {
    expect(asksSpecialty(professional({ professionalId: 'perfil-1' }))).toBe(false)
  })

  it('profissional sem especialidade não passa; o erro diz o que fazer', () => {
    expect(validateInvite(professional({ specialty: '   ' })).specialty).toBe(
      'Informe a especialidade. Ex.: Barbeiro, Manicure.',
    )
  })

  it('o limite é de 80 caracteres, como na API', () => {
    expect(SPECIALTY_MAX_LENGTH).toBe(80)
    expect(validateInvite(professional({ specialty: 'a'.repeat(80) })).specialty).toBeUndefined()
    expect(validateInvite(professional({ specialty: 'a'.repeat(81) })).specialty).toBe(
      'A especialidade pode ter até 80 caracteres.',
    )
  })

  it('atendente não precisa de especialidade e o corpo a descarta', () => {
    const form = professional({ role: 'Attendant', specialty: 'Barbeiro' })

    expect(validateInvite(form)).toEqual({})
    expect(toInviteDraft(form).specialty).toBeNull()
  })

  it('profissional: o corpo leva a especialidade sem espaços nas pontas', () => {
    expect(toInviteDraft(professional({ specialty: '  Manicure ' }))).toEqual({
      name: 'Rafa',
      email: 'rafa@exemplo.com',
      role: 'Professional',
      professionalId: null,
      specialty: 'Manicure',
    })
  })

  it('ligado a um perfil antigo, o corpo leva o perfil e nenhuma especialidade', () => {
    const draft = toInviteDraft(professional({ professionalId: 'perfil-1', specialty: 'x' }))

    expect(draft.professionalId).toBe('perfil-1')
    expect(draft.specialty).toBeNull()
  })
})

describe('validação do convite (vazio)', () => {
  it('formulário vazio: um erro por campo', () => {
    expect(validateInvite(EMPTY_INVITE)).toEqual({
      name: 'Informe o nome de quem você convida.',
      email: 'Informe um e-mail válido.',
      role: 'Escolha o papel da pessoa.',
    })
  })

  it('dados completos: nenhum erro', () => {
    expect(validateInvite(professional())).toEqual({})
  })

  it('e-mail sem domínio é recusado', () => {
    expect(validateInvite(professional({ email: 'rafa@exemplo' })).email).toBeDefined()
  })
})
