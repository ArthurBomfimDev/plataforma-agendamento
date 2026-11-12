import { BELL_TITLE, timeAgo } from './consts'

import { Button } from '@components/button'
import type { NotificationBellViewProps } from './types'
import { cn } from 'cn'

type NotificationPanelProps = Pick<
  NotificationBellViewProps,
  'unread' | 'items' | 'error' | 'onRetry' | 'onOpenItem' | 'onMarkAllRead' | 'now'
>

/** O conteúdo do sino aberto: cabeçalho, e a lista, ou o carregando, o erro ou o vazio. Fica fora do popover para o teste renderizá-lo. */
export const NotificationPanel = ({
  unread,
  items,
  error,
  onRetry,
  onOpenItem,
  onMarkAllRead,
  now = new Date(),
}: NotificationPanelProps) => (
  <>
    <div className="flex items-center gap-(--space-8) px-(--space-8)">
      <h2 className="type-label min-w-0 flex-1 text-(--text-strong)">{BELL_TITLE}</h2>
      {unread > 0 && (
        <Button variant="ghost" onClick={onMarkAllRead}>
          Marcar todas como lidas
        </Button>
      )}
    </div>

    {error !== undefined ? (
      <div role="alert" className="flex flex-col items-start gap-(--space-8) px-(--space-8)">
        <p className="type-body text-(--text-body)">{error}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Tentar de novo
          </Button>
        )}
      </div>
    ) : items === undefined ? (
      <p role="status" className="type-body px-(--space-8) py-(--space-12) text-(--text-muted)">
        Carregando…
      </p>
    ) : items.length === 0 ? (
      <p className="type-body px-(--space-8) py-(--space-12) text-(--text-muted)">
        Nenhum aviso por enquanto.
      </p>
    ) : (
      <ul className="flex max-h-96 flex-col overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpenItem(item)}
              className="flex min-h-(--size-touch-min) w-full gap-(--space-8) rounded-md px-(--space-8) py-(--space-8) text-left hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-(--space-4) size-2 shrink-0 rounded-(--radius-full)',
                  item.readAt === null ? 'bg-(--action-primary)' : 'bg-transparent',
                )}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <span
                  className={cn(
                    'type-label text-(--text-strong)',
                    item.readAt !== null && 'font-normal text-(--text-body)',
                  )}
                >
                  {item.readAt === null && <span className="sr-only">Não lido: </span>}
                  {item.title}
                </span>
                <span className="type-body text-(--text-body)">{item.body}</span>
                <span className="type-caption text-(--text-muted)">
                  {timeAgo(item.createdAt, now)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </>
)
