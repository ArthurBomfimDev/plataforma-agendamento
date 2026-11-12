import { describe, expect, it } from 'vitest'

import type { NotificationResponse } from '@api/models'
import { NotificationBellView } from './view'
import { NotificationPanel } from './list'
import { renderToString } from 'react-dom/server'
import { ROUTES } from '@router/paths'
import { badgeLabel, destinationOf, timeAgo } from './consts'

const NOW = new Date('2026-11-11T12:00:00Z')
const noop = () => undefined

const notice = (patch: Partial<NotificationResponse> = {}): NotificationResponse => ({
  id: 'n1',
  type: 'RequestReceived',
  title: 'Novo pedido aguardando resposta',
  body: 'Abra o painel para ver os detalhes.',
  appointmentId: 'a1',
  createdAt: '2026-11-11T11:55:00Z',
  readAt: null,
  ...patch,
})

const bell = (unread: number) =>
  renderToString(
    <NotificationBellView
      unread={unread}
      open={false}
      onOpenChange={noop}
      items={[]}
      onOpenItem={noop}
      onMarkAllRead={noop}
      now={NOW}
    />,
  )

const panel = (props: Partial<Parameters<typeof NotificationPanel>[0]> = {}) =>
  renderToString(
    <NotificationPanel
      unread={0}
      items={[]}
      onOpenItem={noop}
      onMarkAllRead={noop}
      now={NOW}
      {...props}
    />,
  )

describe('NotificationBellView (o botão)', () => {
  it('nomeia o botão com as não lidas, para o leitor de tela', () => {
    expect(bell(3)).toContain('aria-label="Avisos, 3 não lidos"')
  })

  it('sem não lidas, o nome é simples e não há contador', () => {
    const html = bell(0)

    expect(html).toContain('aria-label="Avisos"')
    expect(html).not.toContain('aria-hidden="true" class="type-caption')
  })

  it('o contador visível para em 9+', () => {
    expect(bell(14)).toContain('9+')
  })

  it('o alvo de toque é de 44px', () => {
    expect(bell(0)).toContain('min-h-(--size-touch-min)')
    expect(bell(0)).toContain('min-w-(--size-touch-min)')
  })
})

describe('NotificationPanel (a lista)', () => {
  it('sem avisos, diz que não há e não oferece marcar como lidas', () => {
    const html = panel()

    expect(html).toContain('Nenhum aviso por enquanto.')
    expect(html).not.toContain('Marcar todas como lidas')
  })

  it('enquanto a lista não chegou, avisa que carrega', () => {
    expect(panel({ items: undefined })).toContain('Carregando')
  })

  it('no erro, mostra a mensagem e a nova tentativa', () => {
    const html = panel({ items: undefined, error: 'Sem conexão.', onRetry: noop })

    expect(html).toContain('role="alert"')
    expect(html).toContain('Sem conexão.')
    expect(html).toContain('Tentar de novo')
  })

  it('marca o não lido para o leitor de tela e diz a idade; o lido fica sem marca', () => {
    const html = panel({
      unread: 1,
      items: [
        notice(),
        notice({ id: 'n2', title: 'Horário confirmado', readAt: NOW.toISOString() }),
      ],
    })

    expect(html).toContain('Não lido: </span>Novo pedido aguardando resposta')
    expect(html).not.toContain('Não lido: </span>Horário confirmado')
    expect(html).toContain('há 5 min')
    expect(html).toContain('Marcar todas como lidas')
  })
})

describe('badgeLabel e timeAgo', () => {
  it('limita o contador', () => {
    expect(badgeLabel(1)).toBe('1')
    expect(badgeLabel(9)).toBe('9')
    expect(badgeLabel(10)).toBe('9+')
  })

  it.each([
    ['2026-11-11T11:59:40Z', 'agora'],
    ['2026-11-11T11:15:00Z', 'há 45 min'],
    ['2026-11-11T09:00:00Z', 'há 3 h'],
    ['2026-11-09T12:00:00Z', 'há 2 d'],
    ['2026-11-11T12:00:30Z', 'agora'],
  ])('diz %s como "%s"', (iso, expected) => {
    expect(timeAgo(iso, NOW)).toBe(expected)
  })

  it('de uma semana em diante, mostra a data', () => {
    expect(timeAgo('2026-10-20T12:00:00Z', NOW)).toBe('20/10')
  })
})

describe('destinationOf', () => {
  it('leva o consumidor aos agendamentos', () => {
    expect(destinationOf(notice({ type: 'Confirmed' }), false)).toBe(ROUTES.appointments)
  })

  it('leva o pedido novo do painel aos pedidos, e o resto à agenda', () => {
    expect(destinationOf(notice({ type: 'RequestReceived' }), true)).toBe(ROUTES.panelRequests)
    expect(destinationOf(notice({ type: 'CancelledByCustomer' }), true)).toBe(ROUTES.panel)
  })
})
