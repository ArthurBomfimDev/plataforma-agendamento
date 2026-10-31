import { describe, expect, it } from 'vitest'

import { ChooseProfessionalScreen } from '.'
import { MOCK_BUSINESSES } from '@features/business-detail/mock'
import { MOCK_PROFESSIONALS } from './mock'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const business = MOCK_BUSINESSES['estudio-duartina']!
const professionals = MOCK_PROFESSIONALS['estudio-duartina']!

const screen = (list = professionals) =>
  render(
    <ChooseProfessionalScreen
      businessName={business.name}
      service={business.services[0]!}
      professionals={list}
    />,
  )

describe('ChooseProfessionalScreen', () => {
  it('resume o serviço e lista "Sem preferência" antes dos profissionais', () => {
    const html = screen()

    expect(html).toContain('Corte masculino · 30 min · R$')
    expect(html).toContain('45,00')
    expect(html.indexOf('Sem preferência')).toBeLessThan(html.indexOf('Marina Souza'))
    expect(html).toContain('Colorimetria · 6 anos')
    expect(html).toContain('★ 4,8 · ver perfil')
  })

  it('expõe cada opção como botão', () => {
    const html = screen()

    // Celular: voltar + 4 opções da lista. Desktop: "Sem preferência" + 3 cards (a trilha só vira
    // botão com `onBack`). As duas versões vão no HTML; o breakpoint esconde uma delas.
    expect(html.match(/<button[^>]*type="button"/g)).toHaveLength(9)
    expect(html).toContain('aria-label="Ver horários sem preferência de profissional"')
    expect(html).toContain('aria-label="Ver horários com Marina Souza"')
  })

  it('mostra a trilha do desktop com o estabelecimento e o serviço', () => {
    const html = screen()

    expect(html).toMatch(/<nav aria-label="Trilha de navegação"[^>]*>.*Estúdio Duartina/)
    expect(html).toContain('aria-current="page"')
  })

  // Sem consentimento do profissional, a vitrine pública só tem o nome (ADR-004).
  it('mostra só o nome quando o perfil público não está liberado', () => {
    const html = screen([{ id: 'p1', name: 'Marcos Lima' }])

    expect(html).toContain('Marcos Lima')
    expect(html).not.toContain('ver perfil')
    expect(html).not.toContain('anos')
  })
})
