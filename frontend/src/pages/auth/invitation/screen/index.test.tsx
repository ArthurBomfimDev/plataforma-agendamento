import { describe, expect, it } from 'vitest'

import { InvitationScreen } from '.'
import type { InvitationPreviewResponse } from '@api/models'
import type { InvitationScreenProps } from './types'
import { renderToString } from 'react-dom/server'
import { validateCreateAccount } from './consts'

const html = (props: InvitationScreenProps) =>
  renderToString(<InvitationScreen {...props} />).replaceAll('<!-- -->', '')

const preview = (patch: Partial<InvitationPreviewResponse> = {}): InvitationPreviewResponse => ({
  businessName: 'Estúdio Duartina',
  inviterName: 'Dona Duartina',
  inviteeName: 'Ana Souza',
  email: 'ana@example.com',
  role: 'Professional',
  accountExists: false,
  termsVersion: 'profissional-2026-11-rascunho',
  termsRequired: true,
  ...patch,
})

describe('InvitationScreen', () => {
  it('carregando: avisa que está abrindo o convite', () => {
    expect(html({ state: 'loading' })).toContain('Carregando o convite')
  })

  it('erro: mostra a mensagem e oferece tentar de novo', () => {
    const page = html({ state: 'error', message: 'Sem conexão com o servidor.' })

    expect(page).toMatch(/role="alert"[^>]*>Sem conexão com o servidor\./)
    expect(page).toContain('Tentar de novo')
  })

  it.each([
    ['not_found', 'não existe ou o link está incompleto'],
    ['expired', 'expirou'],
    ['revoked', 'foi cancelado pelo estabelecimento'],
    ['used', 'já foi usado'],
  ] as const)('inválido (%s): diz o motivo em português', (reason, text) => {
    expect(html({ state: 'invalid', reason })).toContain(text)
  })

  it('inválido por já usado: oferece entrar', () => {
    expect(html({ state: 'invalid', reason: 'used' })).toMatch(/<button[^>]*>Entrar<\/button>/)
    expect(html({ state: 'invalid', reason: 'expired' })).not.toMatch(
      /<button[^>]*>Entrar<\/button>/,
    )
  })

  it('conta nova: estabelecimento, quem convidou, formulário e o termo do profissional', () => {
    const page = html({ state: 'ready', access: 'new', preview: preview() })

    expect(page).toContain('Dona Duartina')
    expect(page).toContain('Estúdio Duartina')
    expect(page).toContain('como profissional')
    expect(page).toContain('for="invitation-name"')
    expect(page.match(/aria-label="Mostrar senha"/g)).toHaveLength(2)
    expect(page).toContain('Li e aceito o termo do profissional')
    expect(page).toContain('Criar conta e aceitar')
    expect(page).toContain('Já tenho conta: Entrar')
  })

  it('atendente: sem termo de profissional', () => {
    const page = html({
      state: 'ready',
      access: 'new',
      preview: preview({ role: 'Attendant', termsRequired: false }),
    })

    expect(page).toContain('como atendente')
    expect(page).not.toContain('termo do profissional')
  })

  it('conta existente sem sessão: só entrar', () => {
    const page = html({
      state: 'ready',
      access: 'existing',
      preview: preview({ accountExists: true }),
    })

    expect(page).toContain('Já existe uma conta com este e-mail')
    expect(page).not.toContain('for="invitation-name"')
  })

  it('logado com o e-mail do convite: aceitar', () => {
    const page = html({
      state: 'ready',
      access: 'match',
      preview: preview(),
      currentEmail: 'ana@example.com',
    })

    expect(page).toContain('Aceitar convite')
    expect(page).toContain('Li e aceito o termo do profissional')
  })

  it('logado com outro e-mail: avisa e oferece sair', () => {
    const page = html({
      state: 'ready',
      access: 'other',
      preview: preview(),
      currentEmail: 'outra@example.com',
    })

    expect(page).toContain('outra@example.com')
    expect(page).toContain('ana@example.com')
    expect(page).toContain('Sair e entrar com outra conta')
    expect(page).not.toContain('Aceitar convite')
  })

  it('erro da API ao aceitar: mensagem em alerta', () => {
    expect(
      html({
        state: 'ready',
        access: 'match',
        preview: preview({ termsRequired: false }),
        error: 'Esta equipe está completa.',
      }),
    ).toMatch(/role="alert"[^>]*>Esta equipe está completa\./)
  })
})

describe('validateCreateAccount', () => {
  const ok = { fullName: 'Ana', password: '12345678', confirmation: '12345678' }

  it('aceita nome, senha de 8 a 128 caracteres igual à confirmação e o termo', () => {
    expect(validateCreateAccount(ok, true, true)).toEqual({})
    expect(validateCreateAccount(ok, false, false)).toEqual({})
  })

  it('recusa nome vazio, senha curta, confirmação diferente e termo não aceito', () => {
    const errors = validateCreateAccount(
      { fullName: ' ', password: '123', confirmation: '124' },
      true,
      false,
    )

    expect(errors.fullName).toBe('Informe seu nome')
    expect(errors.password).toBe('A senha tem no mínimo 8 caracteres')
    expect(errors.confirmation).toBe('As senhas não são iguais')
    expect(errors.terms).toBe('Aceite o termo do profissional para continuar.')
  })
})
