import { authRequest } from '@api/base'
import type { NotificationResponse, PagedResult, UnreadCountResponse } from '@api/models'

const NOTIFICATIONS = '/api/notifications'

/** O sino do aplicativo. O lado (consumidor ou painel) vem do token, não da rota. */
export const notificationService = {
  mine: (signal?: AbortSignal) =>
    authRequest<PagedResult<NotificationResponse>>({
      url: NOTIFICATIONS,
      params: { page: 1, pageSize: 20 },
      signal,
    }),
  unreadCount: (signal?: AbortSignal) =>
    authRequest<UnreadCountResponse>({ url: `${NOTIFICATIONS}/unread-count`, signal }),
  markRead: (id: string) =>
    authRequest<NotificationResponse>({ method: 'POST', url: `${NOTIFICATIONS}/${id}/read` }),
  markAllRead: () =>
    authRequest<UnreadCountResponse>({ method: 'POST', url: `${NOTIFICATIONS}/read-all` }),
}
