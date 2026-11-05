import type { RangeAppointment } from '../../types'

export type MonthCalendarProps = {
  /** A grade inteira, de segunda antes do dia 1 ao domingo depois do último (`yyyy-MM-dd`). */
  days: string[]
  /** Mês mostrado, `yyyy-MM`: os dias de fora dele aparecem apagados. */
  month: string
  today: string
  /** Os agendamentos de cada dia, em ordem de horário. */
  byDay: Map<string, RangeAppointment[]>
  onOpenDay: (date: string) => void
}
