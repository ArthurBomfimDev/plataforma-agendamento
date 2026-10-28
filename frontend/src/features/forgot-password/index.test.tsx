import { describe, expect, it } from 'vitest'

import { ForgotPasswordScreen } from '.'
import { renderToString } from 'react-dom/server'

const html = (props: Parameters<typeof ForgotPasswordScreen>[0] = {}) =>
  renderToString(<ForgotPasswordScreen {...props} />).replaceAll('<!-- -->', '')

describe('ForgotPasswordScreen', () => {
  it('pede o e-mail com o preenchimento certo', () => {
    const page = html()

    expect(page).toContain('for="forgot-password-email"')
    expect(page).toMatch(/id="forgot-password-email"[^>]*autocomplete="email"/i)
    expect(page).toMatch(/type="submit"[^>]*>Enviar link<\/button>/)
  })

  it('enviado: resposta neutra, sem dizer se a conta existe', () => {
    const page = html({ sent: true })

    expect(page).toContain('Se houver uma conta com esse e-mail')
    expect(page).not.toContain('forgot-password-email')
  })
})
