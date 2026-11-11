import { describe, expect, it } from 'vitest'

import { MemoryRouter } from 'react-router'
import { OwnerReviewsScreen, type OwnerReviewsData } from '.'
import type { OwnerReviewResponse } from '@api/models'
import { renderToString } from 'react-dom/server'

const render = (data: OwnerReviewsData) =>
  renderToString(
    <MemoryRouter>
      <OwnerReviewsScreen data={data} onReport={async () => null} />
    </MemoryRouter>,
  ).replaceAll('<!-- -->', '')

const review = (patch: Partial<OwnerReviewResponse> = {}): OwnerReviewResponse => ({
  id: 'r1',
  rating: 2,
  professionalRating: 3,
  comment: 'Demorou demais.',
  reviewerName: 'Ana S.',
  serviceName: 'Corte',
  reviewedAt: '2026-11-02T15:00:00Z',
  reported: false,
  ...patch,
})

const ready = (items: OwnerReviewResponse[], totalPages = 1): OwnerReviewsData => ({
  status: 'ready',
  items,
  page: 1,
  totalPages,
  onPageChange: () => undefined,
})

describe('OwnerReviewsScreen', () => {
  it('carregando', () => {
    expect(render({ status: 'loading' })).toContain('Carregando as avaliações')
  })

  it('erro: mostra a mensagem e oferece tentar de novo', () => {
    const html = render({ status: 'error', message: 'Sem conexão.', onRetry: () => undefined })

    expect(html).toContain('Sem conexão.')
    expect(html).toContain('Tentar de novo')
  })

  it('vazio: explica quando as avaliações aparecem', () => {
    expect(render(ready([]))).toContain('Ainda não há avaliações')
  })

  it('sucesso: nota, nome abreviado, comentário e o botão de denunciar', () => {
    const html = render(ready([review()]))

    expect(html).toContain('2 de 5 · Ana S.')
    expect(html).toContain('Demorou demais.')
    expect(html).toContain('Nota do profissional: 3 de 5')
    expect(html).toContain('aria-label="Denunciar a avaliação de Ana S."')
  })

  it('já denunciada: avisa que a decisão é da administração e não oferece denunciar de novo', () => {
    const html = render(ready([review({ reported: true })]))

    expect(html).toContain('Denúncia enviada')
    expect(html).not.toContain('aria-label="Denunciar')
  })

  it('não oferece apagar nem responder', () => {
    const html = render(ready([review()]))

    expect(html).not.toContain('Apagar')
    expect(html).not.toContain('Responder')
  })

  it('pagina só quando há mais de uma página', () => {
    expect(render(ready([review()]))).not.toContain('Páginas de avaliações')
    expect(render(ready([review()], 2))).toContain('Página 1 de 2')
  })
})
