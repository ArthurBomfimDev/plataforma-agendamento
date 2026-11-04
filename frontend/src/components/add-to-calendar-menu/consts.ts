import type { CalendarTarget } from '@hooks/use-add-to-calendar/types'

/** Cada destino de "Adicionar à agenda", na ordem do menu. */
export const CALENDAR_OPTIONS: ReadonlyArray<{ target: CalendarTarget; label: string }> = [
  { target: 'google', label: 'Google Agenda' },
  { target: 'outlook', label: 'Outlook' },
  { target: 'ics', label: 'Apple e outros (arquivo .ics)' },
]
