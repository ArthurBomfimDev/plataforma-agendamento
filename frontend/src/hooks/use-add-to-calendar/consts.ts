import { addMinutes, format, parse } from 'date-fns'

import type { CalendarEvent } from './types'

/** Texto de iCalendar (RFC 5545): escapa `\`, `;`, `,` e quebra de linha. */
export const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export const toIcs = (event: CalendarEvent) => {
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
