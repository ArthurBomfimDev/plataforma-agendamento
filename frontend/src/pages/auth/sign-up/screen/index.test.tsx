import { describe, expect, it } from 'vitest'

import { SignUpScreen } from '.'
import { renderToString } from 'react-dom/server'
import { validateSignUp } from './consts'

const html = () => renderToString(<SignUpScreen />).replaceAll('<!-- -->', '')

describe('SignUpScreen', () => {
  it('pede a senha duas vezes, as duas com mostrar senha', () => {
    const page = html()

    expect(page).toContain('for="sign-up-password"')
    expect(page).toContain('for="sign-up-password-confirmation"')
    expect(page.match(/aria-label="Mostrar senha"/g)).toHaveLength(2)
    expect(page).toMatch(/id="sign-up-password-confirmation"[^>]*autocomplete="new-password"/i)
  })
})

describe('validateSignUp', () => {
  const today = '2026-10-28'
  const valid = {
    fullName: 'Ana Souza',
    email: 'ana@exemplo.com',
    password: '12345678',
    passwordConfirmation: '12345678',
    birthDate: '1995-05-10',
  }

  it('aceita um cadastro completo', () => {
    expect(validateSignUp(valid, today)).toEqual({})
  })

  it('recusa confirmação diferente da senha', () => {
    expect(validateSignUp({ ...valid, passwordConfirmation: '12345679' }, today)).toEqual({
      passwordConfirmation: 'As senhas não são iguais',
    })
  })

  it('recusa senha acima de 128 caracteres, como o backend', () => {
    const long = 'a'.repeat(129)
    expect(
      validateSignUp({ ...valid, password: long, passwordConfirmation: long }, today).password,
    ).toBe('A senha tem no máximo 128 caracteres')
  })
})
