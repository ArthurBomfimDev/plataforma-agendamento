import { describe, expect, it } from 'vitest'

import { LeaveBusiness } from '.'
import { renderToString } from 'react-dom/server'

describe('LeaveBusiness', () => {
  it('explica o efeito e oferece o botão, sem erro nem diálogo aberto', () => {
    const html = renderToString(
      <LeaveBusiness businessName="Estúdio Duartina" onLeave={async () => null} />,
    ).replaceAll('<!-- -->', '')

    expect(html).toContain('Você deixa a equipe de Estúdio Duartina')
    expect(html).toContain('sai da página pública na hora')
    expect(html).toContain('histórico')
    expect(html).toContain('novo convite')
    expect(html).toMatch(/<button[^>]*>Sair do estabelecimento<\/button>/)
    expect(html).not.toContain('role="alert"')
    expect(html).not.toContain('Ficar na equipe')
  })
})
