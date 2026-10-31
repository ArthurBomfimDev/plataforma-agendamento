import type { TimeRange, WeekSchedule, Weekday } from '../../types'

export type WeekScheduleCardProps = {
  schedule: WeekSchedule
  /** Dia com o editor aberto. `null` = nenhum. */
  editingDay: Weekday | null
  onToggleDay: (day: Weekday, enabled: boolean) => void
  onEditDay: (day: Weekday) => void
  onCancelEdit: () => void
  onSaveDay: (day: Weekday, ranges: TimeRange[], applyToWorkdays: boolean) => void
}
