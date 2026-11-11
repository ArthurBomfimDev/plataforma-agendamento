import { describe, expect, it } from 'vitest'

import { PanelTopBar } from '.'
import { renderToString } from 'react-dom/server'

const render = (logo: Parameters<typeof PanelTopBar>[0]['logo'] = null) =>
  renderToString(<PanelTopBar businessName="Estúdio Duartina" logo={logo} category="Beleza" />)

describe('PanelTopBar', () => {
  it('mostra o estabelecimento e o alternador de tema, só abaixo do desktop', () => {
    const html = render()

    expect(html).toContain('Estúdio Duartina')
    expect(html).toContain('aria-label="Tema escuro"')
    expect(html).toContain('lg:hidden')
  })

  it('sem logotipo, a ilustração da categoria; com ele, a imagem', () => {
    expect(render()).toContain('data-category="Beleza"')
    expect(render({ small: 'b/k-s.webp', medium: 'b/k-m.webp', large: 'b/k-l.webp' })).toMatch(
      /<img[^>]*b\/k-/,
    )
  })
})
