import type { TimeSlotChipProps } from './types'
import { cn } from 'cn'

/**
 * Chip de horário do Figma, estado padrão. Os estados `selected` e `disabled` entram quando a
 * grade de slots do detalhe precisar deles.
 */
export const TimeSlotChip = (props: TimeSlotChipProps) => {
  const { time, className, ...buttonProps } = props

  return (
    <button
      {...buttonProps}
      type="button"
      className={cn(
        'type-label tabular flex min-h-(--size-touch-min) items-center justify-center rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-16) py-(--space-12) text-(--text-body) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        className,
      )}
    >
      {time}
    </button>
  )
}
