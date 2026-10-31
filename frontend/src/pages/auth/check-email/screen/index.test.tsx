import { describe, expect, it } from 'vitest'
import { formatCountdown, secondsUntilResend } from './consts'

import { CheckEmailScreen } from '.'
import { renderToString } from 'react-dom/server'

const html = (props: Partial<Parameters<typeof CheckEmailScreen>[0]> = {}) =>
  renderToString(
    <CheckEmailScreen email="ana@exemplo.com" secondsLeft={0} {...props} />,
  ).replaceAll('<!-- -->', '')

describe('CheckEmailScreen', () => {
  it('mostra o endereço usado e as duas saídas', () => {
    const page = html()

    expect(page).toContain('Confira seu e-mail')
    expect(page).toContain('ana@exemplo.com')
    expect(page).toContain('Reenviar e-mail')
    expect(page).toContain('Usar outro e-mail')
  })

  it('durante a contagem o reenvio fica desligado e diz quanto falta', () => {
    const page = html({ secondsLeft: 45 })

    expect(page).toMatch(/disabled=""[^>]*aria-describedby="check-email-countdown"/)
    expect(page).toContain('Você pode reenviar em 0:45.')
  })

  it('terminada a contagem, o reenvio liga', () => {
    const page = html({ secondsLeft: 0 })

    expect(page).not.toContain('Você pode reenviar em')
    expect(page).not.toMatch(/disabled=""[^>]*>Reenviar e-mail/)
  })

  it('anuncia o resultado do reenvio numa região viva', () => {
    expect(html({ status: 'Enviamos um novo link.' })).toMatch(
      /aria-live="polite"[^>]*>Enviamos um novo link\./,
    )
  })

  it('sem o endereço, não oferece reenvio', () => {
    const page = html({ email: null })

    expect(page).toContain('o e-mail do cadastro')
    expect(page).toMatch(/disabled=""[^>]*>Reenviar e-mail/)
  })
})

describe('contagem do reenvio', () => {
  it('conta 60 s a partir do envio e não fica negativa', () => {
    expect(secondsUntilResend(0, 0)).toBe(60)
    expect(secondsUntilResend(0, 15_500)).toBe(45)
    expect(secondsUntilResend(0, 61_000)).toBe(0)
  })

  it('formata em minutos e segundos', () => {
    expect(formatCountdown(60)).toBe('1:00')
    expect(formatCountdown(9)).toBe('0:09')
    expect(formatCountdown(-3)).toBe('0:00')
  })
})
