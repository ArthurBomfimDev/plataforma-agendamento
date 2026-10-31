import { describe, expect, it } from 'vitest'

import { ChooseContextScreen } from '.'
import type { ChooseContextScreenProps } from './types'
import { accountTriggerLabel, contextItems } from '@hooks/use-account-menu'
import { renderToString } from 'react-dom/server'

const render = (overrides: Partial<ChooseContextScreenProps> = {}) =>
  renderToString(
    <ChooseContextScreen
      status="ready"
      fullName="Joana Dona"
      items={contextItems(
        {
          hasCustomerProfile: true,
          businesses: [{ businessId: 'b1', name: 'Estúdio Duartina', role: 'Owner' }],
        },
        null,
      )}
      fromPanel={false}
      fromCustomerScreen={false}
      switching={false}
      onChoose={() => undefined}
      onSignOut={() => undefined}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

describe('ChooseContextScreen', () => {
  it('lista consumidor e cada painel, marca o atual e oferece sair', () => {
    const html = render()

    expect(html).toContain('Joana Dona')
    expect(html).toMatch(/aria-current="true"[^>]*>.*?Consumidor/)
    expect(html).toContain('Painel: Estúdio Duartina')
    expect(html).toContain('Sair')
  })

  it('vindo do painel sem estabelecimento, diz que a conta não tem um', () => {
    const html = render({
      fromPanel: true,
      items: contextItems({ hasCustomerProfile: true, businesses: [] }, null),
    })

    expect(html).toContain('Esta conta não tem um estabelecimento.')
    expect(html).not.toContain('Painel:')
  })

  it('vindo de uma tela de consumidor no painel, pede para trocar — ou diz que não há perfil', () => {
    expect(render({ fromCustomerScreen: true })).toContain('troque para consumidor')

    const ownerOnly = render({
      fromCustomerScreen: true,
      items: contextItems(
        {
          hasCustomerProfile: false,
          businesses: [{ businessId: 'b1', name: 'Estúdio Duartina', role: 'Owner' }],
        },
        'b1',
      ),
    })
    expect(ownerOnly).toContain('Esta conta não tem perfil de consumidor.')
    expect(ownerOnly).not.toContain('troque para consumidor')
  })

  it('dono sem perfil de consumidor não vê "Consumidor" fora do contexto de consumidor', () => {
    const items = contextItems(
      {
        hasCustomerProfile: false,
        businesses: [{ businessId: 'b1', name: 'Estúdio Duartina', role: 'Owner' }],
      },
      'b1',
    )

    expect(items.map(({ id }) => id)).toEqual(['b1'])
  })

  it('com um contexto só, não mostra a escolha nem o rótulo de papel (7CF)', () => {
    const html = render({ items: contextItems({ hasCustomerProfile: true, businesses: [] }, null) })

    expect(html).toContain('Joana Dona')
    expect(html).not.toContain('Entrar como')
    expect(html).not.toContain('Consumidor')
    expect(html).toContain('Sair')
  })
})

describe('rótulo do botão da conta', () => {
  const owner = { businessId: 'b1', name: 'Estúdio Duartina', role: 'Owner' as const }

  it('com um papel só, o nome da pessoa', () => {
    expect(
      accountTriggerLabel(
        { fullName: 'Ana Consumidora', hasCustomerProfile: true, businesses: [] },
        null,
        null,
      ),
    ).toBe('Ana Consumidora')
    expect(
      accountTriggerLabel(
        { fullName: 'Joana Dona', hasCustomerProfile: false, businesses: [owner] },
        'b1',
        'Estúdio Duartina',
      ),
    ).toBe('Joana Dona')
  })

  it('com mais de um contexto, o contexto atual, que é o que se troca', () => {
    const both = { fullName: 'Joana Dona', hasCustomerProfile: true, businesses: [owner] }

    expect(accountTriggerLabel(both, null, null)).toBe('Consumidor')
    expect(accountTriggerLabel(both, 'b1', 'Estúdio Duartina')).toBe('Painel: Estúdio Duartina')
  })

  it('antes de a conta carregar, o contexto da sessão', () => {
    expect(accountTriggerLabel(undefined, 'b1', 'Estúdio Duartina')).toBe(
      'Painel: Estúdio Duartina',
    )
  })
})
