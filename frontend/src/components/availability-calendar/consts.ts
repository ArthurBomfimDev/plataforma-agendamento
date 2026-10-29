import type { CalendarDayStatus } from './types'

/** Complemento do nome acessível do dia: o marcador visual sozinho não chega ao leitor de tela. */
export const DAY_STATUS_LABEL: Record<CalendarDayStatus, string> = {
  available: 'tem horário',
  'no-slots': 'sem horário',
  closed: 'não abre',
  past: 'data passada',
}

export const HOLIDAY_LABEL = 'feriado'

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export const NAV_BUTTON_CLASSES =
  'flex size-(--size-touch-min) items-center justify-center text-(--text-link) focus-visible:outline-2 focus-visible:outline-(--border-focus) aria-disabled:text-(--text-disabled)'
