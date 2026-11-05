import { describe, expect, it } from 'vitest'
import type { MyReviewResponse } from '@api/models'

import { ReviewForm } from '.'
import { renderToString } from 'react-dom/server'

const render = (props: Partial<Parameters<typeof ReviewForm>[0]> = {}) =>
  renderToString(
    <ReviewForm
      businessName="Barbearia do Zé"
      sensitive={false}
      existing={null}
      onSubmit={async () => null}
      onCancel={() => undefined}
      {...props}
    />,
  ).replaceAll('<!-- -->', '')

const mine: MyReviewResponse = {
  id: 'r1',
  appointmentId: 'a1',
  businessId: 'b1',
  professionalId: 'p1',
  rating: 4,
  professionalRating: 5,
  comment: 'Gostei muito.',
  serviceName: 'Corte',
  reviewedAt: '2026-11-02T15:00:00Z',
  editedAt: null,
  canEdit: true,
}

describe('ReviewForm', () => {
  it('nova avaliação: as duas notas, o comentário com contador e o aviso de que é público', () => {
    const html = render()

    expect(html).toContain('Como foi o atendimento em Barbearia do Zé?')
    expect(html).toContain('aria-label="Nota do atendimento"')
    expect(html).toContain('aria-label="Nota do profissional"')
    expect(html).toContain('0/500 caracteres')
    expect(html).toContain('maxLength="500"')
    expect(html).toContain('Sua avaliação é pública')
    expect(html).toContain('inicial do sobrenome')
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Enviar avaliação<\/button>/)
    expect(html).not.toContain('role="alert"')
    expect(html).not.toContain('Não avaliar o profissional')
  })

  it('fora da Saúde, não faz o aviso de dado de saúde', () => {
    expect(render()).not.toContain('Não escreva dados de saúde')
  })

  it('em Saúde, avisa para não escrever dado de saúde e que o serviço não aparece', () => {
    const html = render({ sensitive: true })

    expect(html).toContain('Não escreva dados de saúde')
    expect(html).toContain('O serviço que você fez também não aparece')
  })

  it('editando: traz as notas e o comentário de antes, explica a edição única e muda o botão', () => {
    const html = render({ existing: mine })

    expect(html).toContain('aria-label="Editar avaliação"')
    expect(html).toContain('Gostei muito.')
    expect(html).toContain('13/500 caracteres')
    expect(html).toContain('Você pode editar a avaliação uma única vez')
    expect(html).toContain('Salvar alterações')
    expect(html).toContain('Não avaliar o profissional')
    expect(html.match(/aria-checked="true"/g)).toHaveLength(2)
  })
})
