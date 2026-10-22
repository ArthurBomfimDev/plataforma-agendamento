import { describe, expect, it } from 'vitest'

import { BookingReviewScreen } from '.'
import type { BookingReviewScreenProps } from './types'
import { MOCK_BUSINESSES } from '@features/business-detail/mock'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const business = MOCK_BUSINESSES['estudio-duartina']!

const screen = (overrides: Partial<BookingReviewScreenProps> = {}) =>
  render(
    <BookingReviewScreen
      business={{ name: business.name, verified: true }}
      service={business.services[0]!}
      professionalName={null}
      date={new Date(2026, 8, 11)}
      time="09:30"
      cancellationWindowHours={24}
      {...overrides}
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
    expect(screen({ professionalName: 'Carla Nunes' })).toContain('Carla Nunes')
  })

  it('limita a observação e liga o texto de ajuda ao campo', () => {
    const html = screen()

    expect(html).toMatch(/<textarea[^>]*maxLength="200"/)
    expect(html).toMatch(/<textarea[^>]*aria-describedby="booking-note-helper"/)
    expect(html).toContain('id="booking-note-helper"')
  })

  it('mostra a janela de cancelamento do estabelecimento', () => {
    expect(screen({ cancellationWindowHours: 6 })).toContain('Cancelamento gratuito até 6 h antes')
  })

  it('trava o envio enquanto o pedido está indo, para não mandar duas vezes', () => {
    const html = screen({ submitting: true })

    expect(html).toContain('Enviando…')
    expect(html).not.toContain('Enviar pedido')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Enviando…<\/button>/)
  })
})
