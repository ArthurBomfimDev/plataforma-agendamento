import { describe, expect, it } from 'vitest'

import { ConfirmEmailScreen } from '.'
import type { ConfirmEmailScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const html = (props: ConfirmEmailScreenProps) =>
  renderToString(<ConfirmEmailScreen {...props} />).replaceAll('<!-- -->', '')

describe('ConfirmEmailScreen', () => {
  it('carregando: anuncia que está conferindo, sem ação além do tema', () => {
    const page = html({ state: 'loading' })

    expect(page).toContain('Confirmando seu e-mail')
    expect(page).toMatch(/role="status"[^>]*>.*Conferindo o link…/s)
    expect(page).not.toContain('Entrar')
    expect(page).not.toContain('Reenviar')
  })

  it('sucesso: conta ativa e botão Entrar', () => {
    const page = html({ state: 'success' })

    expect(page).toContain('E-mail confirmado')
    expect(page).toContain('Sua conta está ativa')
    expect(page).toMatch(/<button[^>]*>Entrar<\/button>/)
  })

  it('inválido: explica e pede o e-mail para reenviar', () => {
    const page = html({ state: 'invalid' })

    expect(page).toContain('Link inválido')
    expect(page).toMatch(/role="alert"[^>]*>.*expirou ou já foi usado/s)
    expect(page).toContain('for="confirm-email-address"')
    expect(page).toMatch(/type="submit"[^>]*>Reenviar<\/button>/)
  })

  it('inválido, depois do reenvio: resposta neutra, sem dizer se a conta existe', () => {
    const page = html({ state: 'invalid', resent: true })

    expect(page).toContain('Se houver uma conta esperando confirmação')
    expect(page).not.toContain('confirm-email-address')
  })
})
