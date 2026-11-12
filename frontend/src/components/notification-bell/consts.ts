import type { NotificationResponse } from '@api/models'
import { ROUTES } from '@router/paths'

export const BELL_TITLE = 'Avisos'

/** O contador de 10 em diante vira "9+": cabe no círculo e o número exato está na lista. */
export const MAX_BADGE = 9

export const badgeLabel = (unread: number) =>
  unread > MAX_BADGE ? `${MAX_BADGE}+` : String(unread)

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "agora", "há 5 min", "há 3 h", "há 2 d"; de uma semana em diante, a data. */
export const timeAgo = (iso: string, now: Date) => {
  const elapsed = Math.max(0, now.getTime() - new Date(iso).getTime())
  if (elapsed < MINUTE) return 'agora'
  if (elapsed < HOUR) return `há ${Math.floor(elapsed / MINUTE)} min`
  if (elapsed < DAY) return `há ${Math.floor(elapsed / HOUR)} h`
  if (elapsed < 7 * DAY) return `há ${Math.floor(elapsed / DAY)} d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Para onde o aviso leva: pedido novo, ao painel de pedidos; o resto do painel, à agenda; o do consumidor, aos agendamentos. */
export const destinationOf = (item: NotificationResponse, inPanel: boolean) => {
  if (!inPanel) return ROUTES.appointments
  return item.type === 'RequestReceived' ? ROUTES.panelRequests : ROUTES.panel
}
