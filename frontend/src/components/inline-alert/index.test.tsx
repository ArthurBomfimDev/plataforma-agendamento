import { describe, expect, it } from 'vitest'

import { InlineAlert } from '.'
import { renderToString } from 'react-dom/server'

describe('InlineAlert', () => {
  it('o erro é o padrão e é anunciado na hora', () => {
    const page = renderToString(<InlineAlert>Confira e tente de novo.</InlineAlert>)

    expect(page).toContain('role="alert"')
    expect(page).toContain('Confira e tente de novo.')
    expect(page).toContain('--status-rejected-bg')
  })

  it('o sucesso não interrompe o leitor de tela', () => {
    const page = renderToString(<InlineAlert tone="success">Tudo certo.</InlineAlert>)

    expect(page).toContain('role="status"')
    expect(page).not.toContain('role="alert"')
    expect(page).toContain('--status-confirmed-bg')
  })

  it('o ícone é decorativo', () => {
    expect(renderToString(<InlineAlert>Texto</InlineAlert>)).toMatch(/<svg[^>]*aria-hidden="true"/)
  })
})
