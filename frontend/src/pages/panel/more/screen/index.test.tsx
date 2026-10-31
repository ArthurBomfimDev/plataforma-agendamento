import { describe, expect, it } from 'vitest'

import { OWNER_ONLY_SECTIONS } from '@router/paths'
import { PanelMoreScreen } from '.'
import { renderToString } from 'react-dom/server'

const render = (hidden: typeof OWNER_ONLY_SECTIONS = []) =>
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

  it('para o profissional, só a conta', () => {
    const html = render(OWNER_ONLY_SECTIONS)

    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('Conta: trocar de contexto ou sair')
  })
})
