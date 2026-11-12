import { BELL_TITLE, badgeLabel } from './consts'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'

import { NotificationsIcon } from '@assets/icons'
import type { NotificationBellViewProps } from './types'
import { NotificationPanel } from './list'
import { cn } from 'cn'

/**
 * O sino: botão de 44px com o contador de não lidas e, aberto, a lista dos avisos mais novos. Não sabe de rede nem de
 * rota (isso é do `NotificationBell`), então o teste cobre cada estado sem servidor.
 */
export const NotificationBellView = (props: NotificationBellViewProps) => {
  const {
    unread,
    open,
    onOpenChange,
    items,
    error,
    onRetry,
    onOpenItem,
    onMarkAllRead,
    now = new Date(),
    className,
  } = props

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={unread > 0 ? `${BELL_TITLE}, ${unread} não lidos` : BELL_TITLE}
        className={cn(
          'relative flex min-h-(--size-touch-min) min-w-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
          className,
        )}
      >
        <NotificationsIcon aria-hidden="true" className="size-6" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="type-caption tabular absolute top-(--space-4) right-(--space-4) flex min-w-5 items-center justify-center rounded-(--radius-full) bg-(--status-pending-bg) px-(--space-4) text-(--status-pending-fg) ring-2 ring-(--bg-surface)"
          >
            {badgeLabel(unread)}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(22rem,calc(100vw-2*var(--space-16)))] gap-(--space-8) rounded-md border border-(--border-subtle) bg-(--bg-surface) p-(--space-8) shadow-(--elevation-card)"
      >
        <NotificationPanel
          unread={unread}
          items={items}
          error={error}
          onRetry={onRetry}
          onOpenItem={onOpenItem}
          onMarkAllRead={onMarkAllRead}
          now={now}
        />
      </PopoverContent>
    </Popover>
  )
}
