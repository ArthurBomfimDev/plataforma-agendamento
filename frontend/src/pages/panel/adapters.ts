import type { AgendaAppointment, AgendaDay, AgendaProfessional } from './agenda/screen/types'
import type { AppointmentResponse, ProfessionalResponse, WorkScheduleResponse } from '@api/models'
import { dateKeyIn, timeIn } from '@utils/time-zone'
import { entryEnd, summarize, toMinutes, toTime } from './agenda/screen/consts'

import type { PendingRequest } from './requests/screen/types'

/**
 * Da API para as telas do painel (Onda 7A). Horários sempre no fuso do estabelecimento, nunca no do
 * navegador (CLAUDE.md §5).
 */

const AGENDA_STATUS: Partial<Record<AppointmentResponse['status'], AgendaAppointment['status']>> = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Completed: 'completed',
  NoShow: 'no-show',
}

/** Recusado, expirado e cancelado liberaram o horário: não entram na agenda. */
export const occupiesAgenda = (appointment: AppointmentResponse) =>
  AGENDA_STATUS[appointment.status] !== undefined

/** Nome de quem vai ser atendido: o da API (nome social primeiro; no balcão, o informado). */
export const customerNameOf = (appointment: AppointmentResponse) =>
  appointment.customerName ?? appointment.attendeeName ?? 'Consumidor'

const minutesBetween = (startsAt: string, endsAt: string) =>
  Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000)

const weekdayOf = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y!, m! - 1, d!).getDay()
}

/**
 * Jornada do profissional no dia, `HH:mm`. Vale a regra da semana em vigor naquela data. Com mais
 * de uma faixa no mesmo dia, vai da primeira entrada à última saída. Sem jornada, `null`.
 */
export const workHoursOn = (schedules: WorkScheduleResponse[], date: string) => {
  const weekday = weekdayOf(date)
  const rules = schedules.filter(
    (rule) =>
      rule.dayOfWeek === weekday &&
      rule.effectiveFrom <= date &&
      (rule.effectiveTo === null || rule.effectiveTo >= date),
  )
  if (rules.length === 0) return null

  return {
    start: rules.map(({ startTime }) => startTime.slice(0, 5)).sort()[0]!,
    end: rules
      .map(({ endTime }) => endTime.slice(0, 5))
      .sort()
      .at(-1)!,
  }
}

export const toAgendaAppointment = (
  appointment: AppointmentResponse,
  timeZone: string,
): AgendaAppointment => ({
  kind: 'appointment',
  id: appointment.id,
  start: timeIn(appointment.startsAt, timeZone),
  durationMinutes: minutesBetween(appointment.startsAt, appointment.endsAt),
  serviceName: appointment.serviceName,
  customerName: customerNameOf(appointment),
  status: AGENDA_STATUS[appointment.status] ?? 'confirmed',
  expiresAt: appointment.expiresAt ? new Date(appointment.expiresAt) : undefined,
  endsAt: new Date(appointment.endsAt),
})

type AgendaInput = {
  date: string
  timeZone: string
  professionals: ProfessionalResponse[]
  /** Jornadas por profissional; ausente = ainda carregando ou falhou, e o dia usa os próprios itens. */
  schedules: Map<string, WorkScheduleResponse[]>
  appointments: AppointmentResponse[]
  pending: AppointmentResponse[]
  /**
   * Papel `Professional`: a API devolve só a própria agenda, mas a lista de profissionais é a de
   * todos. Mostra só quem tem item no dia ou pedido pendente.
   */
  onlyWithItems: boolean
}

/** A agenda do dia na forma da tela 09: uma coluna por profissional. */
export const toAgendaDay = (input: AgendaInput): AgendaDay => {
  const { date, timeZone, professionals, schedules, pending, onlyWithItems } = input
  const appointments = input.appointments.filter(
    (appointment) =>
      occupiesAgenda(appointment) && dateKeyIn(appointment.startsAt, timeZone) === date,
  )

  const columns: AgendaProfessional[] = professionals.flatMap((professional) => {
    const entries = appointments
      .filter(({ professionalId }) => professionalId === professional.id)
      .map((appointment) => toAgendaAppointment(appointment, timeZone))
    const pendingRequests = pending.filter(
      ({ professionalId }) => professionalId === professional.id,
    ).length
    if (onlyWithItems && entries.length === 0 && pendingRequests === 0) return []

    // A jornada cobre também o que caiu fora dela (encaixe de balcão, regra mudada depois do pedido).
    const hours = workHoursOn(schedules.get(professional.id) ?? [], date)
    const starts = entries.map(({ start }) => toMinutes(start))
    const ends = entries.map(entryEnd)
    const workStart = Math.min(...starts, hours ? toMinutes(hours.start) : Infinity)
    const workEnd = Math.max(...ends, hours ? toMinutes(hours.end) : -Infinity)
    const empty = !Number.isFinite(workStart)

    return [
      {
        id: professional.id,
        name: professional.displayName,
        workStart: empty ? '09:00' : toTime(workStart),
        workEnd: empty ? '09:00' : toTime(workEnd),
        pendingRequests,
        entries,
      },
    ]
  })

  return {
    date,
    professionals: columns,
    summary: summarize(
      appointments.map((appointment) => ({
        status: AGENDA_STATUS[appointment.status] ?? 'confirmed',
        priceCents: appointment.priceCents,
      })),
    ),
  }
}

/** Um pedido na forma da tela 10. */
export const toPendingRequest = (
  appointment: AppointmentResponse,
  context: {
    timeZone: string
    professionalName: (id: string) => string | null
    schedules: Map<string, WorkScheduleResponse[]>
  },
): PendingRequest => {
  const { timeZone, professionalName, schedules } = context
  const date = dateKeyIn(appointment.startsAt, timeZone)
  const start = timeIn(appointment.startsAt, timeZone)
  const durationMinutes = minutesBetween(appointment.startsAt, appointment.endsAt)
  const hours = workHoursOn(schedules.get(appointment.professionalId) ?? [], date)
  const requestedAt = new Date(appointment.requestedAt)

  return {
    id: appointment.id,
    customerName: customerNameOf(appointment),
    // A API ainda não informa o histórico do consumidor: a linha não aparece.
    customerHistory: undefined,
    serviceName: appointment.serviceName,
    durationMinutes,
    priceCents: appointment.priceCents,
    date,
    start,
    professionalName: professionalName(appointment.professionalId),
    requestedAt,
    // Pendente sempre tem prazo; sem ele (dado inesperado), conta como encerrado agora.
    expiresAt: appointment.expiresAt ? new Date(appointment.expiresAt) : requestedAt,
    // Só afirma "fora do horário" quando a jornada é conhecida.
    outsideWorkingHours:
      hours !== null &&
      (toMinutes(start) < toMinutes(hours.start) ||
        toMinutes(start) + durationMinutes > toMinutes(hours.end)),
  }
}
