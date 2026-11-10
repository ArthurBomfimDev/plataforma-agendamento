import { describe, expect, it } from 'vitest'

import { TopBar } from '.'
import { renderToString } from 'react-dom/server'

const render = (props: Parameters<typeof TopBar>[0] = {}) => renderToString(<TopBar {...props} />)

describe('TopBar', () => {
  it('oferece "Para estabelecimentos" quando a tela liga o link', () => {
    const html = render({ onForBusinesses: () => undefined })

    expect(html).toMatch(/<button[^>]*>Para estabelecimentos<\/button>/)
    expect(html).toContain('Meus agendamentos')
  })

  it('sem o link ligado, ele não aparece', () => {
    expect(render()).not.toContain('Para estabelecimentos')
  })

  it('no painel, a barra do consumidor some, inclusive "Para estabelecimentos"', () => {
    const html = render({ onForBusinesses: () => undefined, onOpenPanel: () => undefined })

    expect(html).not.toContain('Para estabelecimentos')
    expect(html).toContain('Voltar ao painel')
  })

  it('sem sessão, "Entrar"; o alternador de tema está sempre na barra', () => {
    const html = render({ signedIn: false })

    expect(html).toMatch(/<button[^>]*>Entrar<\/button>/)
    expect(html).toContain('aria-label="Tema escuro"')
  })
})
