import { describe, expect, it } from 'vitest'

import { RatingLabel } from '.'
import { renderToString } from 'react-dom/server'

const render = (node: React.ReactElement) => renderToString(node).replaceAll('<!-- -->', '')

describe('RatingLabel', () => {
  it('mostra a média com uma casa e a contagem, e fala a nota por extenso para o leitor de tela', () => {
    const html = render(<RatingLabel average={4.8} count={12} />)

    expect(html).toContain('4,8 (12)')
    expect(html).toContain('Nota 4,8 de 5, 12 avaliações')
  })

  it('usa o singular com uma avaliação só', () => {
    expect(render(<RatingLabel average={5} count={1} />)).toContain('1 avaliação')
  })

  it('mostra "Novo" quando ainda não há média, sem inventar nota', () => {
    const html = render(<RatingLabel average={null} count={2} />)

    expect(html).toContain('Novo')
    expect(html).not.toMatch(/\d,\d/)
    expect(html).toContain('ainda sem avaliações suficientes')
  })

  it('também trata a média ausente como "Novo"', () => {
    expect(render(<RatingLabel average={undefined} count={0} />)).toContain('Novo')
  })
})
