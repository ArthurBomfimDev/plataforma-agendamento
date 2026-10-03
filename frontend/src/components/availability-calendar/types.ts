/**
 * Estado do dia na vitrine, cada um com marcador próprio abaixo do número (Figma, "Célula de
 * calendário"): ponto cheio, anel vazado, traço ou nenhum.
 */
export type CalendarDayStatus = 'available' | 'no-slots' | 'closed' | 'past'

export type CalendarDayInfo = {
  status: CalendarDayStatus
  /** Feriado ganha a barra no topo, que coexiste com o marcador: dá para abrir em feriado. */
  holiday?: { name: string }
}

export type AvailabilityCalendarProps = {
  selected?: Date
  onSelect: (date: Date) => void
  /** Primeiro e último mês navegáveis. */
  startMonth: Date
  endMonth: Date
  getDayInfo: (date: Date) => CalendarDayInfo
  className?: string
}
