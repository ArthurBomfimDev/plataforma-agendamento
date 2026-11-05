import { describe, expect, it } from 'vitest'

import { PasswordField } from '.'
import { renderToString } from 'react-dom/server'

const html = (props: Partial<Parameters<typeof PasswordField>[0]> = {}) =>
  renderToString(<PasswordField id="senha" label="Senha" {...props} />).replaceAll('<!-- -->', '')

describe('PasswordField', () => {
  it('começa escondida, com o alternador desligado ligado ao campo', () => {
    const page = html()

    expect(page).toMatch(/id="senha"[^>]*type="password"/)
    expect(page).toMatch(/<button type="button" aria-label="Mostrar senha" aria-pressed="false"/)
    expect(page).toContain('aria-controls="senha"')
    expect(page).toContain('for="senha"')
  })

  it('o botão não envia o formulário e o ícone é decorativo', () => {
    const page = html()

    expect(page).toContain('type="button"')
    expect(page).toMatch(/<svg[^>]*aria-hidden="true"/)
  })

  it('liga o erro ao campo e marca o campo inválido', () => {
    const page = html({ error: 'A senha tem no mínimo 8 caracteres' })

    expect(page).toContain('aria-invalid="true"')
    expect(page).toContain('aria-describedby="senha-helper"')
    expect(page).toContain('A senha tem no mínimo 8 caracteres')
  })

  it('desliga o alternador junto com o campo', () => {
    expect(html({ disabled: true })).toMatch(/aria-label="Mostrar senha"[^>]*disabled=""/)
  })
})
