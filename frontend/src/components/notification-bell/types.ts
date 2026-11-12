import type { NotificationResponse } from '@api/models'

export type NotificationBellViewProps = {
  /** Não lidas; zero esconde o contador. */
  unread: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `undefined`: ainda buscando; erro mostra a mensagem e a nova tentativa. */
  items: ReadonlyArray<NotificationResponse> | undefined
  error?: string
  onRetry?: () => void
  onOpenItem: (item: NotificationResponse) => void
  onMarkAllRead: () => void
  /** Relógio injetável, para o "há 5 min" do teste. */
  now?: Date
  className?: string
}
