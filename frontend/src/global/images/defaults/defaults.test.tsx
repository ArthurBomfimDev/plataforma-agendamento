import { describe, expect, it } from 'vitest'

import { BusinessIllustration } from './business-illustration'
import { InitialsAvatar } from './initials'
import { ServiceIcon } from './service-icon'
import { initialsOf } from './initials-of'
import { renderToString } from 'react-dom/server'

describe('padrões visuais sem imagem', () => {
  it('ilustração por categoria, decorativa e pintada só com tokens', () => {
    const beauty = renderToString(<BusinessIllustration category="Beleza" />)
    const health = renderToString(<BusinessIllustration category="Saude" />)

    expect(beauty).toContain('data-category="Beleza"')
    expect(health).toContain('data-category="Saude"')
    expect(beauty).not.toEqual(health)
    for (const svg of [beauty, health]) {
      expect(svg).toContain('aria-hidden="true"')
      // Nada de cor solta: todo fill e stroke vem de um token da R5.
      expect(svg).not.toMatch(/(fill|stroke)="#/)
      expect(svg).toMatch(/fill="var\(--/)
    }
  })

  it('iniciais do profissional', () => {
    expect(initialsOf('Ana Souza')).toBe('AS')
    expect(initialsOf('Maria da Silva')).toBe('MS')
    expect(initialsOf('ana')).toBe('AN')
    expect(initialsOf('  ')).toBe('?')
    expect(renderToString(<InitialsAvatar name="Bia Lima" />)).toMatch(
      /aria-hidden="true"[^>]*>BL</,
    )
  })

  it('ícone de serviço muda com a categoria', () => {
    expect(renderToString(<ServiceIcon category="Saude" />)).toContain('heart-pulse')
    expect(renderToString(<ServiceIcon category="Beleza" />)).toContain('sparkles')
  })
})
