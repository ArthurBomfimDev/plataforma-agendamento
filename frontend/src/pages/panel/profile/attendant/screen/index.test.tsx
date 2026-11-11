import { describe, expect, it } from 'vitest'

import { AttendantProfileScreen } from '.'
import type { AttendantProfileScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const render = (data: AttendantProfileScreenProps['data']) =>
  renderToString(
    <AttendantProfileScreen
      data={data}
      businessName="Estúdio Duartina"
      onSaveName={async () => null}
      onChangePassword={async () => null}
      onSignOut={() => undefined}
    />,
  ).replaceAll('<!-- -->', '')

describe('AttendantProfileScreen', () => {
  it('carregando e erro', () => {
    expect(render({ status: 'loading' })).toContain('Carregando a conta…')
    expect(
      render({ status: 'error', message: 'Sem conexão.', onRetry: () => undefined }),
    ).toContain('Sem conexão.')
  })

  it('só nome, e-mail, senha e sair', () => {
    const html = render({ status: 'ready', fullName: 'Pessoa Teste', email: 'pessoa@example.com' })

    expect(html).toContain('value="Pessoa Teste"')
    expect(html).toContain('pessoa@example.com')
    expect(html).toContain('Trocar a senha')
    expect(html).toContain('Sair')
  })

  it('não tem foto, página pública nem campo de profissional', () => {
    const html = render({ status: 'ready', fullName: 'Pessoa Teste', email: 'pessoa@example.com' })

    for (const text of ['sem foto', 'Foto', 'página pública', 'Especialidade', 'Apresentação']) {
      expect(html).not.toContain(text)
    }
  })
})
