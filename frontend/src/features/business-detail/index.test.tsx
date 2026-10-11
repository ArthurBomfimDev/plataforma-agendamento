import { describe, expect, it } from 'vitest'

import { BusinessDetailScreen } from '.'
import { HomeScreen } from '@features/home'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

describe('BusinessDetailScreen', () => {
  it('mostra nome, serviços e preço em reais do estabelecimento conhecido', () => {
    const html = render(<BusinessDetailScreen businessId="estudio-duartina" />)

    expect(html).toContain('Estúdio Duartina')
    expect(html).toContain('Corte masculino')
    expect(html).toContain('R$')
    expect(html).toContain('45,00')
    expect(html).toContain('Aberto hoje até 18:00')
  })

  it('cai na página 404 quando o id não existe', () => {
    const html = render(<BusinessDetailScreen businessId="nao-existe" />)

    expect(html).toContain('Página não encontrada')
    expect(html).not.toContain('Agendar')
  })
})

describe('HomeScreen', () => {
  // O clique em si (`navigate`) não é coberto: exigiria jsdom e Testing Library, que o projeto
  // ainda não tem. Aqui só se confere que cada card expõe um botão acionável.
  it('expõe cada card de estabelecimento como botão', () => {
    const html = render(<HomeScreen />)

    expect(html).toMatch(/<button[^>]*>Estúdio Duartina<\/button>/)
    expect(html).toMatch(/<button[^>]*>Barbearia Norte<\/button>/)
  })
})
