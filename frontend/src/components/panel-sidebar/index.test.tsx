import { describe, expect, it } from 'vitest'

import type { PanelSection } from './types'
import { hiddenSectionsFor } from '@router/paths'
import { BottomNavigation } from '@components/bottom-navigation'
import { PANEL_NAVIGATION_ITEMS } from '@components/bottom-navigation/consts'
import type { PanelBottomItem } from '@components/bottom-navigation/types'
import { PanelSidebar } from '.'
import { renderToString } from 'react-dom/server'

const sidebar = (hidden: ReadonlyArray<PanelSection> = []) =>
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
    const html = sidebar(hiddenSectionsFor('Professional'))

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
    // As folgas e o perfil são do profissional.
    expect(html).toContain('Folgas e bloqueios')
    expect(html).toContain('Meu perfil')
  })

  it('para o atendente, a agenda e as folgas de todos, sem gestão e sem perfil', () => {
    const html = sidebar(hiddenSectionsFor('Attendant'))

    expect(html).toContain('Agenda')
    expect(html).toContain('Pedidos')
    expect(html).toContain('Folgas e bloqueios')
    for (const label of [
      'Serviços',
      'Profissionais',
      'Jornadas e bloqueios',
      'Fotos',
      'Configurações',
      'Meu perfil',
    ]) {
      expect(html).not.toContain(label)
    }
  })

  it('para o dono, as Jornadas já têm os bloqueios e ele não tem perfil de profissional', () => {
    const html = sidebar(hiddenSectionsFor('Owner'))

    expect(html).toContain('Jornadas e bloqueios')
    expect(html).not.toContain('Folgas e bloqueios')
    expect(html).not.toContain('Meu perfil')
  })

  it('mostra o logotipo enviado; sem ele, a ilustração da categoria, nunca o quadrado cinza', () => {
    const logo = {
      small: 'businesses/b1/k-s.webp',
      medium: 'businesses/b1/k-m.webp',
      large: 'businesses/b1/k-l.webp',
    }
    const withLogo = renderToString(
      <PanelSidebar
        businessName="Estúdio"
        logo={logo}
        activeSection="agenda"
        pendingRequests={0}
      />,
    )
    const withoutLogo = renderToString(
      <PanelSidebar
        businessName="Clínica"
        category="Saude"
        activeSection="agenda"
        pendingRequests={0}
      />,
    )

    expect(withLogo).toMatch(/<img[^>]*src="[^"]*businesses\/b1\/k-m\.webp"/)
    expect(withoutLogo).not.toContain('<img')
    expect(withoutLogo).toContain('data-category="Saude"')
    expect(withoutLogo).not.toContain('bg-(--bg-disabled)')
  })

  it('não tem item sem tela: Relatórios saiu (Onda 7D); Avaliações voltou com tela, só para o dono', () => {
    const html = sidebar(hiddenSectionsFor('Owner'))

    expect(html).toContain('Avaliações')
    expect(html).not.toContain('Relatórios')
    expect(html.match(/<button/g)).toHaveLength(8)
    expect(sidebar(hiddenSectionsFor('Attendant'))).not.toContain('Avaliações')
    expect(sidebar(hiddenSectionsFor('Professional'))).not.toContain('Avaliações')
  })
})

const bottomNavigation = (activeItem: PanelBottomItem) => (
  <BottomNavigation
    items={PANEL_NAVIGATION_ITEMS}
    label="Painel do estabelecimento"
    variant="panel"
    activeItem={activeItem}
  />
)

describe('BottomNavigation do painel', () => {
  it('marca a aba atual', () => {
    const html = renderToString(bottomNavigation('agenda')).replaceAll('<!-- -->', '')

    expect(html).toMatch(/aria-current="page"[^>]*>.*?Agenda/)
  })

  it('tem Agenda, Pedidos e Mais, sem Relatórios', () => {
    const html = renderToString(bottomNavigation('more')).replaceAll('<!-- -->', '')

    expect(html).toContain('Mais')
    expect(html).not.toContain('Relatórios')
    expect(html).toMatch(/aria-current="page"[^>]*>.*?Mais/)
  })
})
