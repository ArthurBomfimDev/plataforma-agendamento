import { describe, expect, it } from 'vitest'

import { SignInScreen } from '.'
import { renderToString } from 'react-dom/server'
import { validateSignIn } from './consts'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const html = () => renderToString(<SignInScreen />).replaceAll('<!-- -->', '')

describe('SignInScreen', () => {
  it('mostra o título, as duas opções de conta e o consumidor escolhido por padrão', () => {
    const page = html()

    expect(page).toContain('<h1')
    expect(page).toContain('Bem-vindo de volta!')
    expect(page).toContain('Sou consumidor')
    expect(page).toContain('Sou estabelecimento')
    expect(page).toMatch(/aria-pressed="true"[^>]*>Sou consumidor/)
  })

  it('liga rótulo e campo e pede ao navegador o preenchimento certo', () => {
    const page = html()

    expect(page).toContain('for="sign-in-email"')
    expect(page).toContain('for="sign-in-password"')
    // O HTML do servidor escreve `autoComplete` em camelCase; o navegador não diferencia caixa.
    expect(page).toMatch(/id="sign-in-email"[^>]*autocomplete="email"/i)
    expect(page).toMatch(
      /id="sign-in-password" type="password"[^>]*autocomplete="current-password"/i,
    )
  })

  it('o texto de ajuda fica ligado ao campo por aria-describedby', () => {
    expect(html()).toContain('aria-describedby="sign-in-email-helper"')
  })
})

describe('validateSignIn', () => {
  const valid = { role: 'customer' as const, email: 'voce@exemplo.com', password: '12345678' }

  it('aceita e-mail e senha válidos', () => {
    expect(validateSignIn(valid)).toEqual({})
  })

  it('recusa e-mail sem domínio ou vazio', () => {
    expect(validateSignIn({ ...valid, email: 'voce@exemplo' }).email).toBe(
      'Informe um e-mail válido',
    )
    expect(validateSignIn({ ...valid, email: '' }).email).toBeDefined()
  })

  it('exige no mínimo 8 caracteres na senha', () => {
    expect(validateSignIn({ ...valid, password: '1234567' }).password).toBeDefined()
    expect(validateSignIn({ ...valid, password: '12345678' }).password).toBeUndefined()
  })
})
