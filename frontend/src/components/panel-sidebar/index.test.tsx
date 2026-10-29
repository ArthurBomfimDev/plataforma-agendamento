import { describe, expect, it } from 'vitest'

import { OWNER_ONLY_SECTIONS } from '@router/consts'
import { PanelBottomNavigation } from '@components/panel-bottom-navigation'
import { PanelSidebar } from '.'
import { renderToString } from 'react-dom/server'

const sidebar = (hidden: typeof OWNER_ONLY_SECTIONS = []) =>
  renderToString(
    <PanelSidebar
      businessName="Estúdio Duartina"
      activeSection="requests"
      pendingRequests={3}
      hiddenSections={hidden}
      footer={<p>Menu da conta</p>}
    />,
  ).replaceAll('<!-- -->', '')

describe('PanelSidebar', () => {
  it('mostra o estabelecimento, a seção atual, o contador e o rodapé', () => {
    const html = sidebar()

    expect(html).toContain('Estúdio Duartina')
    expect(html).toContain('Painel do estabelecimento')
    expect(html).toMatch(/aria-current="page"[^>]*>.*?Pedidos/)
    expect(html).toContain('3<span class="sr-only"> pendentes</span>')
    expect(html).toContain('Menu da conta')
  })

  it('para o profissional, esconde catálogo, equipe, jornadas, fotos e configurações', () => {
    const html = sidebar(OWNER_ONLY_SECTIONS)

    for (const label of [
      'Serviços',
      'Profissionais',
      'Jornadas e bloqueios',
      'Fotos',
      'Configurações',
    ]) {
      expect(html).not.toContain(label)
    }
    expect(html).toContain('Agenda')
    expect(html).toContain('Pedidos')
  })

  it('não tem item sem tela: Avaliações e Relatórios saíram (Onda 7D)', () => {
    const html = sidebar()

    expect(html).not.toContain('Avaliações')
    expect(html).not.toContain('Relatórios')
    expect(html.match(/<button/g)).toHaveLength(7)
  })
})

describe('PanelBottomNavigation', () => {
  it('marca a aba atual', () => {
    const html = renderToString(
      <PanelBottomNavigation activeItem="agenda" pendingRequests={0} />,
    ).replaceAll('<!-- -->', '')

    expect(html).toMatch(/aria-current="page"[^>]*>.*?Agenda/)
  })

  it('tem Agenda, Pedidos e Mais, sem Relatórios', () => {
    const html = renderToString(
      <PanelBottomNavigation activeItem="more" pendingRequests={0} />,
    ).replaceAll('<!-- -->', '')

    expect(html).toContain('Mais')
    expect(html).not.toContain('Relatórios')
    expect(html).toMatch(/aria-current="page"[^>]*>.*?Mais/)
  })
})
