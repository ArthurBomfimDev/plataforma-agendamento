import { describe, expect, it } from 'vitest'

import { ResetPasswordScreen } from '.'
import type { ResetPasswordScreenProps } from './types'
import { renderToString } from 'react-dom/server'
import { validateResetPassword } from './consts'

const html = (props: ResetPasswordScreenProps) =>
  renderToString(<ResetPasswordScreen {...props} />).replaceAll('<!-- -->', '')

describe('ResetPasswordScreen', () => {
  it('formulário: senha nova e confirmação, as duas com mostrar senha', () => {
    const page = html({ state: 'form' })

    expect(page).toContain('for="reset-password-new"')
    expect(page).toContain('for="reset-password-confirmation"')
    expect(page.match(/aria-label="Mostrar senha"/g)).toHaveLength(2)
    expect(page).toMatch(/id="reset-password-new"[^>]*autocomplete="new-password"/i)
  })

  it('formulário com erro da API: mensagem em alerta', () => {
    expect(html({ state: 'form', error: 'Sem conexão com o servidor.' })).toMatch(
      /role="alert"[^>]*>Sem conexão com o servidor\./,
    )
  })

  it('sucesso: pede para entrar com a senha nova', () => {
    const page = html({ state: 'success' })

    expect(page).toContain('Senha alterada')
    expect(page).toMatch(/<button[^>]*>Entrar<\/button>/)
  })

  it('inválido: oferece pedir um novo link', () => {
    const page = html({ state: 'invalid' })

    expect(page).toContain('expirou ou já foi usado')
    expect(page).toContain('Pedir novo link')
  })
})

describe('validateResetPassword', () => {
  it('aceita senha de 8 a 128 caracteres igual à confirmação', () => {
    expect(validateResetPassword({ password: '12345678', confirmation: '12345678' })).toEqual({})
  })

  it('recusa curta, longa e confirmação diferente', () => {
    expect(validateResetPassword({ password: '1234567', confirmation: '1234567' }).password).toBe(
      'A senha tem no mínimo 8 caracteres',
    )
    const long = 'a'.repeat(129)
    expect(validateResetPassword({ password: long, confirmation: long }).password).toBe(
      'A senha tem no máximo 128 caracteres',
    )
    expect(
      validateResetPassword({ password: '12345678', confirmation: '12345679' }).confirmation,
    ).toBe('As senhas não são iguais')
  })
})
