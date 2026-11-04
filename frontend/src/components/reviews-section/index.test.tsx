import { describe, expect, it } from 'vitest'
import type { PublicReviewResponse, RatingSummaryResponse } from '@api/models'

import { ReviewsSection } from '.'
import { renderToString } from 'react-dom/server'

const render = (node: React.ReactElement) => renderToString(node).replaceAll('<!-- -->', '')

const review = (patch: Partial<PublicReviewResponse> = {}): PublicReviewResponse => ({
  id: 'r1',
  rating: 5,
  professionalRating: null,
  comment: 'Atendimento ótimo.',
  reviewerName: 'Ana S.',
  serviceName: 'Corte masculino',
  reviewedAt: '2026-11-02T15:00:00Z',
  ...patch,
})

const rated: RatingSummaryResponse = {
  average: 4.7,
  count: 12,
  distribution: [0, 0, 1, 3, 8],
  isNew: false,
}

const ready = (items: PublicReviewResponse[], totalPages = 1, page = 1) => ({
  status: 'ready' as const,
  items,
  page,
  totalPages,
  onPageChange: () => undefined,
})

describe('ReviewsSection', () => {
  it('carregando: avisa a nota e a lista, sem mostrar vazio nem erro', () => {
    const html = render(
      <ReviewsSection
        title="Avaliações"
        summary={{ status: 'loading' }}
        list={{ status: 'loading' }}
      />,
    )

    expect(html).toContain('Carregando a nota')
    expect(html).toContain('Carregando avaliações')
    expect(html).not.toContain('role="alert"')
    expect(html).not.toContain('Ainda não há avaliações')
  })

  it('erro: mostra a mensagem como alerta e oferece tentar de novo', () => {
    const html = render(
      <ReviewsSection
        title="Avaliações"
        summary={{ status: 'error' }}
        list={{
          status: 'error',
          message: 'Sem conexão com o servidor. Tente de novo.',
          onRetry: () => undefined,
        }}
      />,
    )

    expect(html).toContain('role="alert"')
    expect(html).toContain('Sem conexão com o servidor')
    expect(html).toContain('Tentar de novo')
  })

  it('vazio: explica quem pode avaliar e não desenha lista', () => {
    const html = render(
      <ReviewsSection
        title="Avaliações"
        summary={{
          status: 'ready',
          data: { average: null, count: 0, distribution: [0, 0, 0, 0, 0], isNew: true },
        }}
        list={ready([])}
      />,
    )

    expect(html).toContain('Ainda não há avaliações')
    expect(html).toContain('Novo')
    expect(html).toContain('A média aparece a partir de 3 avaliações')
    expect(html).not.toContain('<ul class="flex flex-col gap-(--space-16)">')
  })

  it('com menos de 3 avaliações é "Novo": conta as avaliações, mas não inventa média', () => {
    const html = render(
      <ReviewsSection
        title="Avaliações"
        summary={{
          status: 'ready',
          data: { average: null, count: 2, distribution: [0, 0, 0, 1, 1], isNew: true },
        }}
        list={ready([review()])}
      />,
    )

    expect(html).toContain('Por enquanto, 2 avaliações')
    expect(html).not.toMatch(/\d,\d/)
  })

  it('sucesso: média, distribuição e as avaliações com nome abreviado, data e serviço', () => {
    const html = render(
      <ReviewsSection
        title="Avaliações"
        summary={{ status: 'ready', data: rated }}
        list={ready([
          review(),
          review({ id: 'r2', comment: null, serviceName: null, professionalRating: 4 }),
        ])}
      />,
    )

    expect(html).toContain('4,7')
    expect(html).toContain('12 avaliações')
    expect(html).toContain('Quantidade de avaliações por nota')
    expect(html).toContain('5 estrelas')
    expect(html).toContain('Ana S.')
    expect(html).toContain('2 de nov de 2026')
    expect(html).toContain('Corte masculino')
    expect(html).toContain('Atendimento ótimo.')
    expect(html).toContain('Nota do profissional: 4 de 5')
  })

  it('em Saúde o serviço não vem do servidor e a avaliação não o mostra', () => {
    const html = render(
      <ReviewsSection
        title="Avaliações"
        summary={{ status: 'ready', data: rated }}
        list={ready([review({ serviceName: null })])}
      />,
    )

    expect(html).not.toContain('Corte masculino')
    expect(html).toContain('Atendimento ótimo.')
  })

  it('só desenha a paginação quando há mais de uma página, com "Anteriores" desligado na primeira', () => {
    const one = render(
      <ReviewsSection
        title="Avaliações"
        summary={{ status: 'ready', data: rated }}
        list={ready([review()])}
      />,
    )
    const many = render(
      <ReviewsSection
        title="Avaliações"
        summary={{ status: 'ready', data: rated }}
        list={ready([review()], 3, 1)}
      />,
    )

    expect(one).not.toContain('Páginas de avaliações')
    expect(many).toContain('Página 1 de 3')
    expect(many).toMatch(/disabled=""[^>]*>Anteriores<\/button>/)
    expect(many).not.toMatch(/disabled=""[^>]*>Próximas<\/button>/)
  })
})
