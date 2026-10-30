import { MOCK_TODAY, getMockDayInfo, getMockDaySlots } from './mock'
import { describe, expect, it } from 'vitest'

import { AvailabilityScreen } from '.'
import type { AvailabilityScreenProps } from './types'
import { MOCK_BUSINESSES } from '@features/business-detail/mock'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const business = MOCK_BUSINESSES['estudio-duartina']!
const firstDay = new Date(2026, 8, 4)

const screen = (overrides: Partial<AvailabilityScreenProps> = {}) =>
  render(
    <AvailabilityScreen
      businessName={business.name}
      service={business.services[0]!}
      professionalName={null}
      today={MOCK_TODAY}
      monthsAhead={2}
      confirmationHours={12}
      getDayInfo={(date) => getMockDayInfo(date, MOCK_TODAY)}
      selectedDate={firstDay}
      onSelectDate={() => {}}
      slots={getMockDaySlots(firstDay, MOCK_TODAY)}
      {...overrides}
    />,
  )

describe('AvailabilityScreen', () => {
  it('resume serviço e profissional no cabeçalho', () => {
    expect(screen()).toContain('Sem preferência')
    expect(screen({ professionalName: 'Marina Souza' })).toContain('Marina Souza')
  })

  it('mostra o dia escolhido, o mês e o feriado', () => {
    const html = screen()

    expect(html).toContain('Setembro 2026')
    expect(html).toContain('Horários — sexta, 4 de setembro')
    expect(html).toContain('7 · Independência (fechado)')
  })

  it('expõe o estado do dia no nome acessível, não só no marcador', () => {
    expect(screen()).toMatch(/aria-label="[^"]*7 de setembro[^"]*, não abre, feriado"/)
  })

  it('mostra o horário ocupado como indisponível e começa sem horário escolhido', () => {
    const html = screen()

    expect(html).toContain('aria-label="10:00, indisponível"')
    expect(html).not.toContain('aria-pressed="true"')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Continuar<\/button>/)
  })

  it('avisa enquanto os horários do dia carregam e quando o dia não tem horário', () => {
    expect(screen({ slots: null })).toContain('Carregando horários…')
    expect(screen({ slots: { morning: [], afternoon: [], evening: [] } })).toContain(
      'Sem horários livres neste dia.',
    )
  })

  it('usa o prazo de confirmação do estabelecimento', () => {
    expect(screen({ confirmationHours: 6 })).toContain('confirma em até 6 h')
  })
})

describe('getMockDayInfo', () => {
  it('distingue passado, fechado, lotado e disponível', () => {
    expect(getMockDayInfo(new Date(2026, 8, 3), MOCK_TODAY).status).toBe('past')
    expect(getMockDayInfo(new Date(2026, 8, 6), MOCK_TODAY).status).toBe('closed')
    expect(getMockDayInfo(new Date(2026, 8, 9), MOCK_TODAY).status).toBe('no-slots')
    expect(getMockDayInfo(new Date(2026, 8, 11), MOCK_TODAY).status).toBe('available')
  })
})
