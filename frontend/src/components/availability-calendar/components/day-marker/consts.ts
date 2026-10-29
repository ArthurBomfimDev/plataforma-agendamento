import type { CalendarDayStatus } from '../../types'

export const MARKER_CLASSES: Record<CalendarDayStatus, string> = {
  available: 'size-1.5 rounded-(--radius-full) bg-(--action-primary)',
  'no-slots': 'size-2 rounded-(--radius-full) border-[1.5px] border-(--text-muted)',
  closed: 'h-[2.5px] w-3.25 rounded-(--radius-full) bg-(--text-muted)',
  past: 'size-1.5',
}
