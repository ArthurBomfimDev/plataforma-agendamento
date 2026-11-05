import type { TimeRange, WeekSchedule, Weekday } from '../../types'
import type { ReactNode } from 'react'

export type WeekScheduleCardProps = {
  schedule: WeekSchedule
  /** Dia com o editor aberto. `null` = nenhum. */
  editingDay: Weekday | null
  onToggleDay: (day: Weekday, enabled: boolean) => void
  onEditDay: (day: Weekday) => void
  onCancelEdit: () => void
  onSaveDay: (day: Weekday, ranges: TimeRange[], applyToWorkdays: boolean) => void
  /** Ao lado da legenda, no pé do cartão (ex.: a data a partir da qual a semana vale). */
  footer?: ReactNode
}
