import { describe, expect, it } from 'vitest'

import { BusinessDetailScreen } from '.'
import { HOME_NEARBY_ESTABLISHMENTS } from '@features/home/mock'
import { HomeScreen } from '@features/home'
import { MOCK_BUSINESSES } from './mock'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (element: React.ReactElement) =>
  renderToString(<MemoryRouter>{element}</MemoryRouter>).replaceAll('<!-- -->', '')

const business = MOCK_BUSINESSES['estudio-duartina']!

describe('BusinessDetailScreen', () => {
  it('mostra nome, serviços e preço em reais', () => {
    const html = render(<BusinessDetailScreen business={business} />)

    expect(html).toContain('Estúdio Duartina')
    expect(html).toContain('Corte masculino')
    expect(html).toContain('R$')
    expect(html).toContain('45,00')
    expect(html).toContain('Aberto hoje até 18:00')
  })

  it('não inventa nota quando ainda não há avaliações', () => {
    const withoutReviews = { ...business, rating: undefined, reviewCount: undefined }
    const html = render(<BusinessDetailScreen business={withoutReviews} />)

    expect(html).not.toContain('Nota ')
  })

  it('mostra os próximos horários livres e o prazo de confirmação do estabelecimento', () => {
    const html = render(
      <BusinessDetailScreen
        business={{ ...business, confirmationHours: 6 }}
        nextFreeSlots={['09:00', '09:15']}
      />,
    )

    expect(html).toContain('Próximos horários livres')
    expect(html).toContain('09:15')
    expect(html).toContain('confirma em até 6 h')
  })
})

describe('HomeScreen', () => {
  // O clique em si (`navigate`) não é coberto: exigiria jsdom e Testing Library, que o projeto
  // ainda não tem. Aqui só se confere que cada card expõe um botão acionável.
  it('expõe cada card de estabelecimento como botão', () => {
    const html = render(
      <HomeScreen
        locationLabel="Garça, SP"
        nearby={{ status: 'ready', items: HOME_NEARBY_ESTABLISHMENTS }}
      />,
    )

    expect(html).toMatch(/<button[^>]*>Estúdio Duartina<\/button>/)
    expect(html).toMatch(/<button[^>]*>Barbearia Norte<\/button>/)
    expect(html).toContain('Garça, SP')
  })

  it('avisa enquanto busca e quando não há estabelecimento perto', () => {
    expect(
      render(<HomeScreen locationLabel="Garça, SP" nearby={{ status: 'loading' }} />),
    ).toContain('Buscando estabelecimentos…')
    expect(
      render(<HomeScreen locationLabel="Garça, SP" nearby={{ status: 'ready', items: [] }} />),
    ).toContain('Nenhum estabelecimento perto de Garça, SP ainda.')
  })
})
