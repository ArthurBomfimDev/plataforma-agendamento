import { AutoAwesomeIcon, EcgHeartIcon, type IconComponent } from '@assets/icons'
import { describe, expect, it } from 'vitest'

import type { ReactElement } from 'react'

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
    const svgOf = (node: ReactElement) => renderToString(node).match(/<svg[\s\S]*<\/svg>/)?.[0]
    const icon = (Icon: IconComponent) => renderToString(<Icon className="size-5" />)

    expect(svgOf(<ServiceIcon category="Saude" />)).toBe(icon(EcgHeartIcon))
    expect(svgOf(<ServiceIcon category="Beleza" />)).toBe(icon(AutoAwesomeIcon))
  })
})
