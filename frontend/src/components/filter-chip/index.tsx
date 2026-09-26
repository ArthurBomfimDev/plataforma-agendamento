import type { FilterChipProps } from './types'
import { cn } from 'cn'

export const FilterChip = (props: FilterChipProps) => {
  const { selected = false, className, children, ...buttonProps } = props

  return (
    <button
      {...buttonProps}
      type="button"
      aria-pressed={selected}
      className={cn(
        'type-caption flex min-h-(--size-touch-min) shrink-0 items-center gap-(--space-4) rounded-(--radius-full) px-(--space-12) py-(--space-8) whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        selected
          ? 'border-2 border-(--border-focus) bg-(--action-soft) text-(--text-link)'
          : 'border border-(--border-interactive) bg-(--bg-surface) text-(--text-body)',
        className,
      )}
    >
      {children}
    </button>
  )
}
