import type { CalendarDayStatus } from './types'

/** Complemento do nome acessível do dia: o marcador visual sozinho não chega ao leitor de tela. */
export const DAY_STATUS_LABEL: Record<CalendarDayStatus, string> = {
  available: 'tem horário',
  'no-slots': 'sem horário',
  closed: 'não abre',
  past: 'data passada',
}

export const HOLIDAY_LABEL = 'feriado'
