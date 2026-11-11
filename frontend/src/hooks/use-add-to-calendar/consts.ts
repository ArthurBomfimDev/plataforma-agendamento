import { addMinutes, format, parse } from 'date-fns'

import type { CalendarEvent } from './types'

/** Texto de iCalendar (RFC 5545): escapa `\`, `;`, `,` e quebra de linha. */
export const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** Link do mapa para o endereço, no detalhe do evento. */
export const mapLink = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

/** Descrição do evento: o link do mapa, quando há endereço. */
const detailsOf = (event: CalendarEvent) =>
  event.location ? `Mapa: ${mapLink(event.location)}` : ''

/** Diferença, em ms, entre a hora de parede no fuso e o UTC, no instante dado. */
const offsetMs = (instant: number, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const wall = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  )
  return wall - Math.floor(instant / 1000) * 1000
}

/**
 * O instante UTC de um dia e hora que valem no fuso IANA dado. Respeita o horário de verão: o deslocamento é
 * calculado no próprio instante, duas vezes, para cobrir a virada.
 */
export const zonedToUtc = (date: string, time: string, timeZone: string) => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const first = wall - offsetMs(wall, timeZone)
  return new Date(wall - offsetMs(first, timeZone))
}

/** `20261104T170000Z`, o formato de data e hora em UTC do iCalendar e dos links das agendas. */
const utcStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

const span = (event: CalendarEvent) => {
  const start = zonedToUtc(event.date, event.time, event.timeZone)
  return { start, end: new Date(start.getTime() + event.durationMinutes * 60_000) }
}

/** Google Agenda: link de criação de evento pré-preenchido, sem OAuth. Início e fim em UTC. */
export const googleCalendarUrl = (event: CalendarEvent) => {
  const { start, end } = span(event)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
  })
  if (event.location) params.set('location', event.location)
  if (detailsOf(event)) params.set('details', detailsOf(event))
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Outlook na web: link de composição equivalente. Início e fim em UTC (ISO 8601). */
export const outlookCalendarUrl = (event: CalendarEvent) => {
  const { start, end } = span(event)
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  })
  if (event.location) params.set('location', event.location)
  if (detailsOf(event)) params.set('body', detailsOf(event))
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Título do evento. Em Saúde o serviço diz a condição da pessoa e a agenda sincroniza com outros aparelhos e
 * pessoas: o título leva só o estabelecimento ("Atendimento — Clínica").
 */
export const calendarTitle = (params: {
  serviceName: string
  businessName: string
  sensitive?: boolean
}) =>
  params.sensitive
    ? `Atendimento — ${params.businessName}`
    : `${params.serviceName} — ${params.businessName}`

export const toIcs = (event: CalendarEvent) => {
  const start = parse(`${event.date} ${event.time}`, 'yyyy-MM-dd HH:mm', new Date())
  const end = addMinutes(start, event.durationMinutes)
  const local = (date: Date) => format(date, "yyyyMMdd'T'HHmmss")
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
  const details = detailsOf(event)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booking//Agendamentos//PT-BR',
    'BEGIN:VEVENT',
    // UID estável: baixar o mesmo agendamento duas vezes atualiza o evento, não duplica.
    `UID:${event.id}@booking`,
    `DTSTAMP:${stamp}`,
    'SEQUENCE:0',
    // Hora local + TZID: a agenda converte respeitando o horário de verão do fuso.
    `DTSTART;TZID=${event.timeZone}:${local(start)}`,
    `DTEND;TZID=${event.timeZone}:${local(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    ...(details ? [`DESCRIPTION:${escapeText(details)}`] : []),
    // Lembrete 1 hora antes.
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
