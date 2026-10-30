import { addMinutes, format, parse } from 'date-fns'

import { useCallback } from 'react'

export type CalendarEvent = {
  /** Identificador estável: o mesmo evento exportado duas vezes não duplica na agenda. */
  id: string
  title: string
  location?: string
  /** Dia, `yyyy-MM-dd`, e início, `HH:mm`, no fuso `timeZone`. */
  date: string
  time: string
  durationMinutes: number
  /** Fuso IANA do estabelecimento, por exemplo `America/Sao_Paulo`. Nunca offset fixo. */
  timeZone: string
}

/** Texto de iCalendar (RFC 5545): escapa `\`, `;`, `,` e quebra de linha. */
const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

const toIcs = (event: CalendarEvent) => {
  const start = parse(`${event.date} ${event.time}`, 'yyyy-MM-dd HH:mm', new Date())
  const end = addMinutes(start, event.durationMinutes)
  const local = (date: Date) => format(date, "yyyyMMdd'T'HHmmss")
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booking//Agendamentos//PT-BR',
    'BEGIN:VEVENT',
    `UID:${event.id}@booking`,
    `DTSTAMP:${stamp}`,
    // Hora local + TZID: a agenda converte respeitando o horário de verão do fuso.
    `DTSTART;TZID=${event.timeZone}:${local(start)}`,
    `DTEND;TZID=${event.timeZone}:${local(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

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
