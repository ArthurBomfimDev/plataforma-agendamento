import { describe, expect, it } from 'vitest'

import { RequestProfileRemoval } from '.'
import { renderToString } from 'react-dom/server'

describe('RequestProfileRemoval', () => {
  it('começa fechado: só o botão, sem campo', () => {
    const html = renderToString(<RequestProfileRemoval onSubmit={async () => null} />)

    expect(html).toContain('Solicitar remoção deste perfil')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('role="alert"')
  })
})
