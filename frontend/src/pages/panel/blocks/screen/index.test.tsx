import { describe, expect, it } from 'vitest'

import type { BlocksScreenProps } from './types'
import { BlocksScreen } from '.'
import { MOCK_EXCEPTIONS } from '@pages/panel/schedules/screen/fixtures'
import { renderToString } from 'react-dom/server'

const team = [
  { id: 'p1', name: 'Marina Souza' },
  { id: 'p2', name: 'Rafael Lima' },
]

const render = (overrides: Partial<BlocksScreenProps> = {}) =>
  renderToString(
    <BlocksScreen
      businessName="Estúdio Duartina"
      today="2026-09-11"
      professionals={{ status: 'ready', items: team }}
      allowWholeBusiness
      exceptions={{ status: 'ready', items: MOCK_EXCEPTIONS }}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('BlocksScreen', () => {
  it('carregando: avisa que está carregando e não mostra o formulário', () => {
    const html = render({ professionals: { status: 'loading' } })

    expect(html).toContain('Carregando')
    expect(html).not.toContain('Bloquear')
  })

  it('erro: mostra a mensagem e "Tentar de novo"', () => {
    const html = render({
      professionals: {
        status: 'error',
        message: 'Sem conexão com o servidor.',
        onRetry: () => undefined,
      },
    })

    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })

  it('vazio: sem profissional ativo, explica em vez de mostrar o formulário', () => {
    const html = render({ professionals: { status: 'ready', items: [] } })

    expect(html).toContain('Nenhum profissional ativo')
    expect(html).not.toContain('Estabelecimento inteiro')
  })

  it('vazio da lista: diz que não há bloqueio daqui para frente', () => {
    expect(render({ exceptions: { status: 'ready', items: [] } })).toContain(
      'Nenhum bloqueio daqui para frente.',
    )
  })

  it('erro da lista de bloqueios: mostra a mensagem dentro do cartão', () => {
    const html = render({
      exceptions: {
        status: 'error',
        message: 'Não foi possível carregar.',
        onRetry: () => undefined,
      },
    })

    expect(html).toContain('Não foi possível carregar.')
  })

  it('sucesso (atendente): escolhe o profissional, bloqueia o estabelecimento inteiro e lista os próximos', () => {
    const html = render()

    expect(html).toContain('Folgas e bloqueios')
    expect(html).toContain('Marina Souza')
    expect(html).toContain('Rafael Lima')
    expect(html).toContain('Estabelecimento inteiro')
    expect(html).toContain('Próximos bloqueios')
    expect(html).toContain('Férias de setembro')
    expect(html).toContain('Remover')
  })

  it('sucesso (profissional): só ele mesmo, sem escolher outro e sem bloquear o estabelecimento todo', () => {
    const html = render({
      professionals: { status: 'ready', items: [{ id: 'p1', name: 'Marina Souza' }] },
      allowWholeBusiness: false,
      // A lista pode citar "Estabelecimento inteiro" (bloqueio do atendente); o que não existe é a opção no formulário.
      exceptions: { status: 'ready', items: [] },
    })

    expect(html).not.toContain('Estabelecimento inteiro')
    expect(html).not.toContain('Rafael Lima')
    expect(html).toContain('Próximos bloqueios')
  })
})
