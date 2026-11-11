import { describe, expect, it } from 'vitest'

import { BusinessDetailScreen } from '.'
import type { HomeEstablishment } from '@pages/customer/home/screen/types'
import { HomeScreen } from '@pages/customer/home/screen'
import { MOCK_BUSINESSES } from './fixtures'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// O mock da Home saiu na Onda 6C; o teste traz os próprios estabelecimentos.
const HOME_NEARBY_ESTABLISHMENTS: HomeEstablishment[] = [
  { id: 'estudio-duartina', name: 'Estúdio Duartina', distanceKm: 1.2, neighborhood: 'Centro' },
  { id: 'barbearia-norte', name: 'Barbearia Norte', distanceKm: 2.6, neighborhood: 'Jardim' },
]

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

  it('serviço com foto mostra a foto; sem foto, o ícone padrão da categoria', () => {
    const photo = { small: 'b/s-s.webp', medium: 'b/s-m.webp', large: 'b/s-l.webp' }
    const [first, ...others] = business.services
    const html = render(
      <BusinessDetailScreen
        business={{
          ...business,
          services: [{ ...first!, photo }, ...others.map((s) => ({ ...s, photo: null }))],
        }}
      />,
    )

    expect(html).toContain('b/s-m.webp')
    // Os outros serviços não têm foto: ficam com o ícone (decorativo), sem <img> a mais.
    expect(html.match(/<img/g)?.length ?? 0).toBeGreaterThanOrEqual(1)
    expect(html).toContain('aria-hidden="true"')
  })

  it('não inventa nota quando ainda não há avaliações', () => {
    const withoutReviews = { ...business, rating: undefined, reviewCount: undefined }
    const html = render(<BusinessDetailScreen business={withoutReviews} />)

    expect(html).not.toContain('Nota ')
  })

  it('com a nota lida mas sem média (menos de 3 avaliações), o cabeçalho diz "Novo"', () => {
    const html = render(
      <BusinessDetailScreen business={{ ...business, rating: undefined, reviewCount: 2 }} />,
    )

    expect(html).toContain('Novo')
    expect(html).not.toContain('Nota 4,8')
  })

  // O painel de uma aba que não é a inicial não entra no HTML do servidor; o conteúdo da aba (carregando, erro, vazio e
  // sucesso) é coberto em `components/reviews-section`. Aqui só se confere que a aba existe e a tela monta com a nota.
  it('a aba Avaliações existe, com e sem a nota carregada, e a tela não quebra em nenhum dos estados', () => {
    const states = [
      { summary: { status: 'loading' as const }, list: { status: 'loading' as const } },
      {
        summary: { status: 'error' as const },
        list: { status: 'error' as const, message: 'Algo deu errado.' },
      },
      {
        summary: {
          status: 'ready' as const,
          data: { average: 4.8, count: 128, distribution: [1, 2, 5, 40, 80], isNew: false },
        },
        list: {
          status: 'ready' as const,
          items: [],
          page: 1,
          totalPages: 1,
          onPageChange: () => undefined,
        },
      },
    ]

    for (const reviews of states) {
      expect(render(<BusinessDetailScreen business={business} reviews={reviews} />)).toMatch(
        /role="tab"[^>]*>Avaliações<\/button>/,
      )
    }
    expect(render(<BusinessDetailScreen business={business} />)).toMatch(
      /role="tab"[^>]*>Avaliações<\/button>/,
    )
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
