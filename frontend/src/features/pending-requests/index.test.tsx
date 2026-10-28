import { describe, expect, it } from 'vitest'
import { historyLabel, whenLabel } from './consts'

import { PendingRequestsScreen } from '.'
import { createMockPendingRequests } from './mock'
import { renderToString } from 'react-dom/server'

// O React separa trechos de texto com `<!-- -->` no HTML do servidor; tiramos para comparar o texto.
const render = (requests = createMockPendingRequests()) =>
  renderToString(<PendingRequestsScreen requests={requests} />)
    .replaceAll('<!-- -->', '')
    .replaceAll(' ', ' ')

describe('PendingRequestsScreen', () => {
  it('conta os pedidos e explica o prazo de resposta', () => {
    const html = render()

    expect(html).toContain('3 aguardando sua resposta')
    expect(html).toContain('Pedido não respondido em 12 h expira automaticamente')
    expect(html).toContain('Confirmação automática: desligada')
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

  it('avisa quando não há pedido', () => {
    expect(render([])).toContain('Nenhum pedido aguardando resposta.')
  })
})

describe('pedidos pendentes', () => {
  it('descreve o histórico do consumidor', () => {
    expect(historyLabel(null)).toBe('Primeira vez neste estabelecimento')
    expect(historyLabel({ appointments: 3, noShows: 1 })).toBe('3 atendimentos · 1 falta')
    expect(historyLabel({ appointments: 1, noShows: 0 })).toBe('1 atendimento · 0 faltas')
  })

  it('abrevia o dia da semana e o mês como no Figma', () => {
    const [ana] = createMockPendingRequests()
    expect(whenLabel({ ...ana, date: '2026-09-12', start: '14:00', durationMinutes: 90 })).toBe(
      'sáb, 12 set · 14:00 — 15:30',
    )
  })
})
