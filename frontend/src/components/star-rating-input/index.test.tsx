import { describe, expect, it } from 'vitest'

import { StarRatingInput } from '.'
import { renderToString } from 'react-dom/server'

const render = (value: number | null) =>
  renderToString(
    <StarRatingInput label="Nota do atendimento" value={value} onValueChange={() => undefined} />,
  ).replaceAll('<!-- -->', '')

describe('StarRatingInput', () => {
  it('é um grupo de opções exclusivas com nome, e cada estrela se lê "N estrelas"', () => {
    const html = render(null)

    expect(html).toContain('role="radiogroup"')
    expect(html).toContain('aria-label="Nota do atendimento"')
    expect(html).toContain('aria-label="1 estrela"')
    expect(html).toContain('aria-label="2 estrelas"')
    expect(html).toContain('aria-label="5 estrelas"')
    expect(html.match(/role="radio"/g)).toHaveLength(5)
  })

  it('sem nota escolhida, nenhuma estrela fica marcada', () => {
    expect(render(null)).not.toContain('aria-checked="true"')
  })

  it('marca só a estrela da nota escolhida, também para quem não vê a cor', () => {
    const html = render(4)

    expect(html.match(/aria-checked="true"/g)).toHaveLength(1)
    expect(html).toMatch(
      /aria-checked="true"[^>]*aria-label="4 estrelas"|aria-label="4 estrelas"[^>]*aria-checked="true"/,
    )
  })

  it('cada estrela tem alvo de toque de 44 px', () => {
    expect(render(3)).toContain('size-(--size-touch-min)')
  })
})
