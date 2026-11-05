import type { CalendarTarget } from '@hooks/use-add-to-calendar/types'

export type AddToCalendarMenuProps = {
  onSelect: (target: CalendarTarget) => void
  className?: string
}
