import { describe, expect, it } from 'vitest'

import { ForBusinessesScreen } from '.'
import type { ForBusinessesScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const render = (props: ForBusinessesScreenProps = {}) =>
  renderToString(<ForBusinessesScreen {...props} />).replaceAll('<!-- -->', '')

describe('ForBusinessesScreen', () => {
  it('explica o que é, para quem é e como funciona', () => {
    const html = render()

    expect(html).toContain('Para estabelecimentos')
    expect(html).toContain('Para quem é')
    expect(html).toContain('Clínicas e consultórios de saúde.')
    expect(html).toContain('Como funciona')
    expect(html).toContain('Em saúde, passa por uma análise antes.')
  })

  it('tem o botão de cadastro e o link para quem já tem conta', () => {
    const html = render()

    expect(html).toMatch(/<button[^>]*>Cadastrar meu estabelecimento<\/button>/)
    expect(html).toContain('Já tenho conta:')
    expect(html).toMatch(/<button[^>]*>entrar<\/button>/)
  })

  it('com sessão, o link de entrar some e o cadastro continua', () => {
    const html = render({ signedIn: true })

    expect(html).not.toContain('Já tenho conta:')
    expect(html).toContain('Cadastrar meu estabelecimento')
  })

  it('diz "consumidor" e "estabelecimento", nunca "cliente"', () => {
    const html = render()

    expect(html).toContain('consumidor')
    expect(html).not.toMatch(/cliente/i)
  })
})
