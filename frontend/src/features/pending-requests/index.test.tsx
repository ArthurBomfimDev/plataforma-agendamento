import { FIXTURE_EXPIRATION_HOURS, createFixturePendingRequests } from './fixtures'
import type { PendingRequestsData, PendingRequestsScreenProps } from './types'
import { describe, expect, it } from 'vitest'
import { historyLabel, whenLabel } from './consts'

import { PendingRequestsScreen } from '.'
import { renderToString } from 'react-dom/server'

const ready = (requests = createFixturePendingRequests()): PendingRequestsData => ({
  status: 'ready',
  requests,
})

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (overrides: Partial<PendingRequestsScreenProps> = {}) =>
  renderToString(
    <PendingRequestsScreen
      data={ready()}
      expirationHours={FIXTURE_EXPIRATION_HOURS}
      autoConfirm={false}
      {...overrides}
    />,
  )
    .replaceAll('<!-- -->', '')
    .replaceAll(' ', ' ')

describe('PendingRequestsScreen', () => {
  it('conta os pedidos e explica o prazo de resposta da política', () => {
    const html = render()

    expect(html).toContain('3 aguardando sua resposta')
    expect(html).toContain('Pedido não respondido em 12 h expira automaticamente')
    expect(html).toContain('Confirmação automática: desligada')
    expect(render({ expirationHours: 24, autoConfirm: true })).toContain(
      'Confirmação automática: ligada',
    )
    expect(render({ expirationHours: 24 })).toContain('Pedido não respondido em 24 h')
  })

  it('mostra serviço, horário, profissional e prazo de cada pedido', () => {
    const html = render()

    expect(html).toContain('Corte masculino · 30 min · R$ 45,00')
    expect(html).toContain('sex, 11 set · 09:30 — 10:00')
    expect(html).toContain('Sem preferência')
    expect(html).toMatch(/pedido há 1[45] min · expira em 11 h 4[56]/)
  })

  it('lista primeiro o que expira primeiro e destaca o urgente', () => {
    const html = render()
    const order = ['Carla Menezes', 'Bruno Teixeira', 'Ana Ribeiro'].map((name) =>
      html.indexOf(`>${name}</h2>`),
    )

    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(html.match(/border-2 border-\(--marker-urgent-fg\)/g)).toHaveLength(1)
    expect(html).toContain('Fora do horário')
  })

  it('sem histórico do consumidor na API, não afirma "primeira vez"', () => {
    const [ana] = createFixturePendingRequests()
    const html = render({ data: ready([{ ...ana!, customerHistory: undefined }]) })

    expect(html).toContain('Ana Ribeiro')
    expect(html).not.toContain('Primeira vez neste estabelecimento')
  })

  it('avisa quando não há pedido', () => {
    expect(render({ data: ready([]) })).toContain('Nenhum pedido aguardando resposta.')
  })

  it('mostra o carregando e o erro com "Tentar de novo"', () => {
    expect(render({ data: { status: 'loading' } })).toContain('Carregando os pedidos…')

    const html = render({
      data: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: () => undefined },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
    expect(html).not.toContain('Nenhum pedido aguardando resposta.')
  })
})

describe('pedidos pendentes', () => {
  it('descreve o histórico do consumidor', () => {
    expect(historyLabel(null)).toBe('Primeira vez neste estabelecimento')
    expect(historyLabel({ appointments: 3, noShows: 1 })).toBe('3 atendimentos · 1 falta')
    expect(historyLabel({ appointments: 1, noShows: 0 })).toBe('1 atendimento · 0 faltas')
  })

  it('abrevia o dia da semana e o mês como no Figma', () => {
    const [ana] = createFixturePendingRequests()
    expect(whenLabel({ ...ana!, date: '2026-09-12', start: '14:00', durationMinutes: 90 })).toBe(
      'sáb, 12 set · 14:00 — 15:30',
    )
  })
})
