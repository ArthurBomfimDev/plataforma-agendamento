import type { CalendarEvent } from './types'
import { toIcs } from './consts'
import { useCallback } from 'react'

/**
 * "Adicionar à agenda". Na web, baixa um `.ics`, que o celular abre direto na agenda.
 * Recurso nativo atrás de hook próprio (regra 5 de empacotamento): no Capacitor, troca-se só a
 * implementação daqui por um plugin de calendário, sem tocar em componente.
 */
export const useAddToCalendar = () =>
  useCallback((event: CalendarEvent) => {
    const url = URL.createObjectURL(new Blob([toIcs(event)], { type: 'text/calendar' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.id}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }, [])

export { toIcs as calendarEventToIcs }
