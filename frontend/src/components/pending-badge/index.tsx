import type { PendingBadgeProps } from './types'
import { cn } from 'cn'

/** Contador de pedidos aguardando resposta, na lateral e na navegação inferior do painel. */
export const PendingBadge = ({ count, className }: PendingBadgeProps) => (
  <span
    className={cn(
      'type-caption tabular rounded-(--radius-full) bg-(--status-pending-bg) px-(--space-8) py-(--space-2) text-(--status-pending-fg)',
      className,
    )}
  >
    {count}
    <span className="sr-only"> pendentes</span>
  </span>
)
