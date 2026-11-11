import { describe, expect, it } from 'vitest'

import { DemoBannerView } from './view'
import { demoBannerText } from './text'
import { renderToString } from 'react-dom/server'

describe('demoBannerText', () => {
  it('sem variável ou só com espaço, não há aviso', () => {
    expect(demoBannerText(undefined)).toBe('')
    expect(demoBannerText('')).toBe('')
    expect(demoBannerText('   ')).toBe('')
  })

  it('tira os espaços das pontas e guarda o texto como veio', () => {
    expect(demoBannerText('  Ambiente de demonstração — dados fictícios ')).toBe(
      'Ambiente de demonstração — dados fictícios',
    )
  })
})

describe('DemoBannerView', () => {
  it('vazio: sem texto, não desenha nada (uso local e produção)', () => {
    expect(renderToString(<DemoBannerView text="" />)).toBe('')
  })

  it('sucesso: mostra o texto configurado, como nota', () => {
    const page = renderToString(
      <DemoBannerView text="Ambiente de demonstração — dados fictícios" />,
    )

    expect(page).toContain('role="note"')
    expect(page).toContain('Ambiente de demonstração')
    expect(page).toContain('dados fictícios')
  })

  it('não é interativo e respeita a área segura do topo', () => {
    const page = renderToString(<DemoBannerView text="Demonstração" />)

    expect(page).not.toMatch(/<(button|a)[\s>]/)
    expect(page).toContain('env(safe-area-inset-top)')
  })
})
