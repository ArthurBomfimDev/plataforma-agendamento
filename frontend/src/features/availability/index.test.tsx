import { describe, expect, it } from 'vitest'
import { getMockDayInfo, MOCK_TODAY } from './mock'

import { AvailabilityScreen } from '.'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const screen = (professionalId: string | null) =>
  render(
    <AvailabilityScreen
      businessId="estudio-duartina"
      serviceId="corte-masculino"
      professionalId={professionalId}
      today={MOCK_TODAY}
    />,
  )

describe('AvailabilityScreen', () => {
  it('resume serviço e profissional no cabeçalho', () => {
    expect(screen(null)).toContain('Sem preferência')
    expect(screen('marina-souza')).toContain('Marina Souza')
  })

  it('abre no primeiro dia com horário e mostra o mês e o feriado', () => {
    const html = screen(null)

    expect(html).toContain('Setembro 2026')
    expect(html).toContain('Horários — sexta, 4 de setembro')
    expect(html).toContain('7 · Independência (fechado)')
  })

  it('expõe o estado do dia no nome acessível, não só no marcador', () => {
    expect(screen(null)).toMatch(/aria-label="[^"]*7 de setembro[^"]*, não abre, feriado"/)
  })

  it('mostra o horário ocupado como indisponível e começa sem horário escolhido', () => {
    const html = screen(null)

    expect(html).toContain('aria-label="10:00, indisponível"')
    expect(html).not.toContain('aria-pressed="true"')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Continuar<\/button>/)
  })

  it('cai na 404 com profissional que não é do estabelecimento', () => {
    expect(screen('nao-existe')).toContain('Página não encontrada')
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
