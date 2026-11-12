import { useService, useServiceMutation } from '@api/base'

import { notificationService } from '.'
import { queryKeys } from '../query-keys'
import { useSessionStore } from '@store/session'

/** O contador confere de minuto em minuto, e só com a aba à vista (o padrão do TanStack Query). */
export const UNREAD_POLL_MS = 60_000

/** `scope`: o estabelecimento ativo, ou `null` no lado do consumidor. Trocar de contexto troca de cache. */
export const useUnreadNotifications = (scope: string | null) =>
  useService({
    queryKey: queryKeys.unreadNotifications(scope),
    service: async (signal) => (await notificationService.unreadCount(signal)).count,
    enabled: useSessionStore((state) => state.session !== null),
    refetchInterval: UNREAD_POLL_MS,
  })

/** A lista só é buscada com o sino aberto. */
export const useNotifications = (scope: string | null, enabled: boolean) =>
  useService({
    queryKey: queryKeys.notifications(scope),
    service: async (signal) => (await notificationService.mine(signal)).items,
    enabled,
  })

export const useMarkNotificationRead = (scope: string | null) =>
  useServiceMutation({
    service: (id: string) => notificationService.markRead(id),
    invalidates: [queryKeys.notifications(scope), queryKeys.unreadNotifications(scope)],
  })

export const useMarkAllNotificationsRead = (scope: string | null) =>
  useServiceMutation({
    service: () => notificationService.markAllRead(),
    invalidates: [queryKeys.notifications(scope), queryKeys.unreadNotifications(scope)],
  })
