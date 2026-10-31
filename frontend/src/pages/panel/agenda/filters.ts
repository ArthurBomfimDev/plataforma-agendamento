import type { AppointmentResponse, AppointmentStatusResponse } from '@api/models'
import { addDays, endOfMonth, format, parse, startOfMonth, startOfWeek } from 'date-fns'

import { dateKeyIn, timeIn } from '@utils/time-zone'

import type { AppointmentStatus } from '@components/status-chip/types'
import type { RangeAppointment } from './components/agenda-range/types'
import { customerNameOf } from '../adapters'

/** Agenda (Onda 7CF): visão e filtros, todos na URL (`#/panel?view=&pro=&status=&service=&q=`). */
export type AgendaView = 'day' | 'week' | 'month'

export const AGENDA_VIEWS: ReadonlyArray<{ value: AgendaView; label: string }> = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

/** Estados que a agenda mostra (os que ocupam ou ocuparam o horário) e os rótulos do filtro. */
export const AGENDA_STATUSES: ReadonlyArray<{ value: AppointmentStatusResponse; label: string }> = [
  { value: 'Pending', label: 'Pendentes' },
  { value: 'Confirmed', label: 'Confirmados' },
  { value: 'Completed', label: 'Concluídos' },
  { value: 'NoShow', label: 'Faltas' },
]

export type AgendaFilters = {
  view: AgendaView
  professionalId: string | null
  status: AppointmentStatusResponse | null
  serviceId: string | null
  /** Parte do nome de quem vai ser atendido. */
  query: string | null
}

export const EMPTY_AGENDA_FILTERS: AgendaFilters = {
  view: 'day',
  professionalId: null,
  status: null,
  serviceId: null,
  query: null,
}

const PARAMS = {
  view: 'view',
  professionalId: 'pro',
  status: 'status',
  serviceId: 'service',
  query: 'q',
} as const

/** Lê da URL; valor que não existe (link editado à mão) vira o padrão, nunca erro. */
export const readAgendaFilters = (params: URLSearchParams): AgendaFilters => {
  const view = params.get(PARAMS.view)
  const status = params.get(PARAMS.status)
  const query = params.get(PARAMS.query)?.trim()
  return {
    view: AGENDA_VIEWS.find(({ value }) => value === view)?.value ?? 'day',
    professionalId: params.get(PARAMS.professionalId) || null,
    status: AGENDA_STATUSES.find(({ value }) => value === status)?.value ?? null,
    serviceId: params.get(PARAMS.serviceId) || null,
    query: query ? query.slice(0, 60) : null,
  }
}

/** Escreve na URL só o que não é o padrão. */
export const agendaSearch = (filters: AgendaFilters) => {
  const params = new URLSearchParams()
  if (filters.view !== 'day') params.set(PARAMS.view, filters.view)
  if (filters.professionalId) params.set(PARAMS.professionalId, filters.professionalId)
  if (filters.status) params.set(PARAMS.status, filters.status)
  if (filters.serviceId) params.set(PARAMS.serviceId, filters.serviceId)
  if (filters.query) params.set(PARAMS.query, filters.query)
  return params.toString()
}

export const hasAgendaFilters = (filters: AgendaFilters) =>
  Boolean(filters.professionalId || filters.status || filters.serviceId || filters.query)

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()

/**
 * Aplica profissional, status, serviço e nome (sem acento e sem caixa) sobre os agendamentos que a API já devolveu.
 * Recusados, expirados e cancelados nunca entram: liberaram o horário.
 */
export const filterAgenda = (appointments: AppointmentResponse[], filters: AgendaFilters) => {
  const query = filters.query ? fold(filters.query) : null
  return appointments.filter(
    (appointment) =>
      AGENDA_STATUSES.some(({ value }) => value === appointment.status) &&
      (!filters.professionalId || appointment.professionalId === filters.professionalId) &&
      (!filters.status || appointment.status === filters.status) &&
      (!filters.serviceId || appointment.serviceId === filters.serviceId) &&
      (!query || fold(customerNameOf(appointment)).includes(query)),
  )
}

const toKey = (day: Date) => format(day, 'yyyy-MM-dd')
const fromKey = (key: string) => parse(key, 'yyyy-MM-dd', new Date())

/**
 * Período de cada visão, `yyyy-MM-dd` inclusivo. Semana: segunda a domingo. Mês: a grade de segunda antes do dia 1
 * ao domingo depois do último — no máximo 42 dias, o limite da API.
 */
export const agendaPeriod = (view: Exclude<AgendaView, 'day'>, date: string) => {
  const day = fromKey(date)
  if (view === 'week') {
    const from = startOfWeek(day, { weekStartsOn: 1 })
    return { from: toKey(from), to: toKey(addDays(from, 6)) }
  }
  const from = startOfWeek(startOfMonth(day), { weekStartsOn: 1 })
  const last = endOfMonth(day)
  const to = addDays(startOfWeek(last, { weekStartsOn: 1 }), 6)
  return { from: toKey(from), to: toKey(to) }
}

/** Andar uma semana ou um mês: o dia de referência muda, e o período segue. */
export const shiftPeriod = (view: Exclude<AgendaView, 'day'>, date: string, step: 1 | -1) => {
  const day = fromKey(date)
  if (view === 'week') return toKey(addDays(day, 7 * step))
  const month = new Date(day.getFullYear(), day.getMonth() + step, 1)
  return toKey(month)
}

/** Os dias do período, em ordem. */
export const daysOf = (from: string, to: string) => {
  const days: string[] = []
  for (let day = fromKey(from); toKey(day) <= to; day = addDays(day, 1)) days.push(toKey(day))
  return days
}

/** Do estado da API para o do chip (mesmas cores e ícones da agenda do dia). */
export const CHIP_STATUS: Partial<Record<AppointmentStatusResponse, AppointmentStatus>> = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Completed: 'completed',
  NoShow: 'no-show',
}

/** Um agendamento da API na forma da semana e do mês, no fuso do estabelecimento. */
export const toRangeAppointment = (
  appointment: AppointmentResponse,
  timeZone: string,
  professionalName: (id: string) => string,
): RangeAppointment => ({
  id: appointment.id,
  date: dateKeyIn(appointment.startsAt, timeZone),
  start: timeIn(appointment.startsAt, timeZone),
  end: timeIn(appointment.endsAt, timeZone),
  customerName: customerNameOf(appointment),
  serviceName: appointment.serviceName,
  professionalName: professionalName(appointment.professionalId),
  status: CHIP_STATUS[appointment.status] ?? 'confirmed',
})
