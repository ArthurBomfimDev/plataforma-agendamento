import { describe, expect, it } from 'vitest'

import { MembersScreen } from '.'
import type { MembersData } from './types'
import { renderToString } from 'react-dom/server'

const render = (data: MembersData) =>
  renderToString(<MembersScreen data={data} businessName="Estúdio Duartina" />).replaceAll(
    '<!-- -->',
    '',
  )

describe('MembersScreen', () => {
  it('carregando, erro e vazio', () => {
    expect(render({ status: 'loading' })).toContain('Carregando a equipe…')
    expect(
      render({ status: 'error', message: 'Sem conexão.', onRetry: () => undefined }),
    ).toContain('Sem conexão.')
    expect(render({ status: 'ready', members: [] })).toContain('Ninguém na equipe ainda')
  })

  it('lista cada membro com o papel', () => {
    const html = render({
      status: 'ready',
      members: [
        { membershipId: 'm1', name: 'Dona', role: 'Owner' },
        { membershipId: 'm2', name: 'Marcos', role: 'Professional' },
        { membershipId: 'm3', name: 'Rafa', role: 'Attendant' },
      ],
    })

    expect(html).toContain('Marcos')
    expect(html).toContain('Profissional')
    expect(html).toContain('Rafa')
    expect(html).toContain('Atendente')
    expect(html).toContain('Dono')
  })
})
