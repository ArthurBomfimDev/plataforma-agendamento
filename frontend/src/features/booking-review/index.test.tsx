import { describe, expect, it } from 'vitest'

import { BookingReviewScreen } from '.'
import { MOCK_TODAY } from '../availability/mock'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const screen = (overrides: { professionalId?: string | null; date?: Date; time?: string } = {}) =>
  render(
    <BookingReviewScreen
      businessId="estudio-duartina"
      serviceId="corte-masculino"
      professionalId={overrides.professionalId ?? null}
      date={overrides.date ?? new Date(2026, 8, 11)}
      time={overrides.time ?? '09:30'}
      today={MOCK_TODAY}
    />,
  )

describe('BookingReviewScreen', () => {
  it('resume estabelecimento, serviço, data, faixa de horário e valor', () => {
    const html = screen()

    expect(html).toContain('Estúdio Duartina')
    expect(html).toContain('Verificado')
    expect(html).toContain('Corte masculino')
    expect(html).toContain('Sem preferência')
    expect(html).toContain('sex, 11 de setembro')
    expect(html).toContain('09:30 — 10:00')
    expect(html).toContain('45,00')
  })

  it('mostra o profissional escolhido', () => {
    expect(screen({ professionalId: 'carla-nunes' })).toContain('Carla Nunes')
  })

  it('limita a observação e liga o texto de ajuda ao campo', () => {
    const html = screen()

    expect(html).toMatch(/<textarea[^>]*maxLength="200"/)
    expect(html).toMatch(/<textarea[^>]*aria-describedby="booking-note-helper"/)
    expect(html).toContain('id="booking-note-helper"')
  })

  it('cai na 404 quando o horário não está livre', () => {
    expect(screen({ time: '10:00' })).toContain('Página não encontrada')
    expect(screen({ date: new Date(2026, 8, 6) })).toContain('Página não encontrada')
  })
})
