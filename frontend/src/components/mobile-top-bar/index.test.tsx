import { describe, expect, it } from 'vitest'

import { MobileTopBar } from '.'
import { renderToString } from 'react-dom/server'

const noop = () => undefined

describe('MobileTopBar', () => {
  it('sem sessão mostra tema, Entrar e Criar conta, e some a partir de 1024px', () => {
    const html = renderToString(
      <MobileTopBar signedIn={false} onHome={noop} onSignIn={noop} onSignUp={noop} />,
    )

    expect(html).toContain('aria-label="Tema escuro"')
    expect(html).toContain('Entrar')
    expect(html).toContain('Criar conta')
    expect(html).toContain('lg:hidden')
  })

  it('com sessão mostra o menu da conta no lugar de Entrar e Criar conta', () => {
    const html = renderToString(
      <MobileTopBar
        signedIn
        onHome={noop}
        onSignIn={noop}
        onSignUp={noop}
        accountMenu={<button type="button">Conta: Maria</button>}
      />,
    )

    expect(html).toContain('aria-label="Tema escuro"')
    expect(html).toContain('Conta: Maria')
    expect(html).not.toContain('Criar conta')
    expect(html).not.toContain('>Entrar<')
  })
})
