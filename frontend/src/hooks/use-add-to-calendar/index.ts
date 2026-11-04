import type { CalendarEvent, CalendarTarget } from './types'
import { googleCalendarUrl, outlookCalendarUrl, toIcs } from './consts'
import { useCallback } from 'react'

/**
 * "Adicionar à agenda". Google e Outlook abrem o link de criação de evento pré-preenchido (sem OAuth); Apple e
 * outros baixam um `.ics`, que o celular abre direto na agenda. Recurso nativo atrás de hook próprio (regra 5 de
 * empacotamento): no Capacitor, troca-se só a implementação daqui por um plugin de calendário, sem tocar em componente.
 */
export const useAddToCalendar = () =>
  useCallback((event: CalendarEvent, target: CalendarTarget = 'ics') => {
    if (target === 'google' || target === 'outlook') {
      const url = target === 'google' ? googleCalendarUrl(event) : outlookCalendarUrl(event)
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    const url = URL.createObjectURL(new Blob([toIcs(event)], { type: 'text/calendar' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.id}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }, [])

export {
  calendarTitle,
  googleCalendarUrl,
  mapLink,
  outlookCalendarUrl,
  toIcs as calendarEventToIcs,
  zonedToUtc,
} from './consts'
export type { CalendarEvent, CalendarTarget } from './types'
