import { describe, expect, it } from 'vitest'

import { BookingReviewScreen } from '.'
import type { BookingReviewScreenProps } from './types'
import { cancellationPolicyText } from './consts'
import { MOCK_BUSINESSES } from '@pages/customer/business-detail/screen/fixtures'
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
  it('sem consentimento pendente, não há bloco e "Enviar pedido" aparece', () => {
    const html = screen()

    expect(html).not.toContain('Dar consentimento e continuar')
    expect(html).toContain('Enviar pedido')
  })

  it('consentimento pendente: mostra o bloco e tira "Enviar pedido", que seria recusado', () => {
    const html = screen({
      consent: {
        text: { status: 'ready', value: 'Autorizo o tratamento dos dados.' },
        busy: false,
        onAccept: () => undefined,
      },
    })

    expect(html).toContain('Autorizo o tratamento dos dados.')
    expect(html).toContain('Dar consentimento e continuar')
    expect(html).not.toContain('Enviar pedido')
  })

  it('mostra o logotipo do estabelecimento; sem ele, a ilustração da categoria (7CF)', () => {
    const logo = {
      small: 'businesses/b1/k-s.webp',
      medium: 'businesses/b1/k-m.webp',
      large: 'businesses/b1/k-l.webp',
    }

    expect(screen({ business: { name: 'Estúdio', image: logo } })).toMatch(
      /<img[^>]*src="[^"]*businesses\/b1\/k-m\.webp"/,
    )
    const without = screen({ business: { name: 'Clínica', category: 'Saude', image: null } })
    expect(without).toContain('data-category="Saude"')
    expect(without).not.toContain('bg-(--bg-disabled)')
  })

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

  it('depois do prazo, manda falar com o estabelecimento: não promete uma aprovação que não existe', () => {
    const html = screen({ cancellationWindowHours: 6 })

    expect(html).toContain(
      'Cancelamento gratuito até 6 h antes. Depois disso, fale com o estabelecimento.',
    )
    expect(html).not.toContain('só com aprovação')
    expect(html).not.toContain('aprovação do estabelecimento')
  })

  it('usa o prazo de cada estabelecimento, sem 24 fixo', () => {
    expect(screen({ cancellationWindowHours: 48 })).toContain('gratuito até 48 h antes')
    expect(screen({ cancellationWindowHours: 48 })).not.toContain('até 24 h')
    expect(cancellationPolicyText(1)).toBe(
      'Cancelamento gratuito até 1 h antes. Depois disso, fale com o estabelecimento.',
    )
  })

  it('prazo zero: o cancelamento vale até o horário marcado', () => {
    expect(cancellationPolicyText(0)).toBe(
      'Cancelamento gratuito até o horário marcado. Depois disso, fale com o estabelecimento.',
    )
    expect(screen({ cancellationWindowHours: 0 })).not.toContain('até 0 h')
  })

  it('diz "estabelecimento", não "empresa", ao falar de quem aprova o pedido', () => {
    const html = screen()

    expect(html).toContain('O pedido fica pendente até o estabelecimento aprovar.')
    expect(html).not.toContain('empresa')
  })

  it('trava o envio enquanto o pedido está indo, para não mandar duas vezes', () => {
    const html = screen({ submitting: true })

    expect(html).toContain('Enviando…')
    expect(html).not.toContain('Enviar pedido')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Enviando…<\/button>/)
  })
})
