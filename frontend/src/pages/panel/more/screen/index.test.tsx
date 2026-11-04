import { describe, expect, it } from 'vitest'

import type { PanelSection } from '@components/panel-sidebar/types'
import { hiddenSectionsFor } from '@router/paths'
import { PanelMoreScreen } from '.'
import { renderToString } from 'react-dom/server'

const render = (hidden: ReadonlyArray<PanelSection> = hiddenSectionsFor('Owner')) =>
  renderToString(
    <PanelMoreScreen
      businessName="Estúdio Duartina"
      hiddenSections={hidden}
      onNavigate={() => undefined}
      onAccount={() => undefined}
    />,
  ).replaceAll('<!-- -->', '')

describe('PanelMoreScreen', () => {
  it('lista para o dono as seções fora das abas, e a conta', () => {
    const html = render()

    for (const label of [
      'Serviços',
      'Profissionais',
      'Jornadas e bloqueios',
      'Fotos',
      'Configurações',
      'Conta: trocar de contexto ou sair',
    ]) {
      expect(html).toContain(label)
    }
    // Agenda e Pedidos já são abas; Avaliações e Relatórios não existem.
    expect(html).not.toContain('>Agenda<')
    expect(html).not.toContain('Relatórios')
  })

  it('para o profissional, as folgas, o perfil, a conta e o tema', () => {
    const html = render(hiddenSectionsFor('Professional'))

    expect(html).toContain('Folgas e bloqueios')
    expect(html).toContain('Meu perfil')
    expect(html).toContain('Conta: trocar de contexto ou sair')
    expect(html).toContain('aria-label="Tema escuro"')
    // Nenhuma seção de gestão para o profissional: folgas, perfil, conta e o botão do tema.
    expect(html.match(/<button/g)).toHaveLength(4)
  })

  it('para o atendente, as folgas, a conta e o tema (sem perfil)', () => {
    const html = render(hiddenSectionsFor('Attendant'))

    expect(html).toContain('Folgas e bloqueios')
    expect(html).not.toContain('Meu perfil')
    expect(html.match(/<button/g)).toHaveLength(3)
  })

  it('oferece o alternar tema no celular, onde o painel não tem barra superior', () => {
    expect(render()).toContain('aria-label="Tema escuro"')
  })
})
