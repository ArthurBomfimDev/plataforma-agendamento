import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotifications,
} from '@api/services/notification/hooks'

import { NotificationBellView } from './view'
import { destinationOf } from './consts'
import { errorMessage } from '@api/base'
import { useBusinessContext } from '@api/services/auth/hooks'
import { useNavigate } from 'react-router'
import { useState } from 'react'

/**
 * O sino do aplicativo, ligado à API. O lado vem do token: no contexto de um estabelecimento, são os avisos do painel dele;
 * fora dele, os do consumidor. Só mostra com sessão (quem monta decide).
 */
export const NotificationBell = ({ className }: { className?: string }) => {
  const navigate = useNavigate()
  const context = useBusinessContext()
  const scope = context?.businessId ?? null
  const [open, setOpen] = useState(false)

  const unread = useUnreadNotifications(scope)
  const list = useNotifications(scope, open)
  const markRead = useMarkNotificationRead(scope)
  const markAll = useMarkAllNotificationsRead(scope)

  return (
    <NotificationBellView
      className={className}
      unread={unread.data ?? 0}
      open={open}
      onOpenChange={setOpen}
      items={list.data}
      error={list.isError ? errorMessage(list.error) : undefined}
      onRetry={() => void list.refetch()}
      onMarkAllRead={() => markAll.mutate()}
      onOpenItem={(item) => {
        if (item.readAt === null) markRead.mutate(item.id)
        setOpen(false)
        navigate(destinationOf(item, context !== null))
      }}
    />
  )
}
