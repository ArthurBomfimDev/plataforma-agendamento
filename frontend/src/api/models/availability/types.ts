import type { AppointmentStatusResponse } from '../scheduling/types'

export type AvailableSlotsResponse = {
  professionalId: string
  serviceId: string
  date: string
  timeZone: string
  holiday: string | null
  slots: string[]
}

export type AvailabilityDayResponse = {
  date: string
  /** O profissional tem jornada neste dia. Falso = fechado. */
  works: boolean
  slotCount: number
  holiday: string | null
}

export type AvailabilityCalendarResponse = {
  professionalId: string
  serviceId: string
  timeZone: string
  days: AvailabilityDayResponse[]
}

/** Dia: 0 = domingo. Horários `HH:mm` no fuso do estabelecimento; datas `yyyy-MM-dd`. */
export type SaveWorkScheduleRequest = {
  dayOfWeek: number
  startTime: string
  endTime: string
  effectiveFrom: string
  effectiveTo: string | null
}

export type ScheduleExceptionKind = 'DayOff' | 'Vacation' | 'Block' | 'ExtraShift'

/** Sem profissional, vale para o estabelecimento inteiro. */
export type ScheduleExceptionResponse = {
  id: string
  professionalId: string | null
  kind: ScheduleExceptionKind
  startsAt: string
  endsAt: string
  reason: string | null
  cancelledAppointments: number
}

export type AddScheduleExceptionRequest = {
  professionalId: string | null
  kind: ScheduleExceptionKind
  startsAt: string
  endsAt: string
  reason: string | null
  /** `Keep` mantém os agendamentos do período; `CancelAll` cancela todos, com motivo. */
  existingAppointments: 'Keep' | 'CancelAll'
  cancellationReason: string | null
}

/** Agendamento que cairia dentro de um bloqueio: a prévia antes de gravar. */
export type AffectedAppointmentResponse = {
  id: string
  professionalId: string
  serviceName: string
  startsAt: string
  endsAt: string
  status: AppointmentStatusResponse
  attendeeName: string | null
}

/** `dayOfWeek` chega como número (0 = domingo, igual ao `Date.getDay()`); horários em `HH:mm:ss`. */
export type WorkScheduleResponse = {
  id: string
  professionalId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  effectiveFrom: string
  effectiveTo: string | null
}
