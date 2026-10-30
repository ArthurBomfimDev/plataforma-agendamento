import type { CalendarDayStatus } from './types'
import { cn } from 'cn'

const MARKER_CLASSES: Record<CalendarDayStatus, string> = {
  available: 'size-1.5 rounded-(--radius-full) bg-(--action-primary)',
  'no-slots': 'size-2 rounded-(--radius-full) border-[1.5px] border-(--text-muted)',
  closed: 'h-[2.5px] w-3.25 rounded-(--radius-full) bg-(--text-muted)',
  past: 'size-1.5',
}

/** Marcador abaixo do número do dia. Também desenha a legenda. */
export const DayMarker = ({
  status,
  className,
}: {
  status: CalendarDayStatus
  className?: string
}) => <span aria-hidden="true" className={cn('block', MARKER_CLASSES[status], className)} />

export const HolidayMarker = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      'block h-0.75 w-6 rounded-(--radius-full) bg-(--agenda-holiday-marker)',
      className,
    )}
  />
)
