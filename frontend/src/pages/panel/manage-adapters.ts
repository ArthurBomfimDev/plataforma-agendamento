import type {
  AffectedAppointmentResponse,
  ProfessionalResponse,
  SaveServiceRequest,
  SaveWorkScheduleRequest,
  ScheduleExceptionResponse,
  ServiceResponse,
  WorkScheduleResponse,
} from '@api/models'
import type {
  AffectedItem,
  ExceptionDraft,
  ExceptionItem,
  ScheduleDraft,
  ScheduleRow,
  ScheduledChange,
  WeekSchedule,
} from './schedules/screen/types'
import {
  WEEKDAYS,
  emptyWeek,
  previousDay,
  shortDateLabel,
  sortRanges,
  validityLabel,
} from './schedules/screen/consts'
import type { PreviewHours, ServiceDraft } from './services/components/service-form/types'
import { dateKeyIn, instantIn, timeIn } from '@utils/time-zone'

import { CATEGORY_LABELS } from '@pages/customer/search/screen/consts'
import type { ServiceListItem } from './services/screen/types'
import type { TeamMember } from './team/screen/types'
import { workHoursOn } from './adapters'

/** Da API para as telas de gestão do painel (Onda 7D). */

/** `Saude` exige tratamento de dado sensível (`BusinessCategory.RequiresSensitiveHandling`). */
export const isSensitiveCategory = (category: string) => category === 'Saude'

export const categoryLabel = (category: string) =>
  CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category

const addDays = (date: string, days: number) => {
  const [y, m, d] = date.split('-').map(Number)
  const next = new Date(Date.UTC(y!, m! - 1, d! + days))
  return next.toISOString().slice(0, 10)
}

/**
 * Expediente de exemplo para a pré-visualização do cadastro de serviço: o primeiro dia, a partir de
 * hoje e dentro de uma semana, em que alguém da equipe trabalha — da primeira entrada à última saída.
 * Sem jornada nenhuma, `null`: a tela pede para cadastrar a jornada em vez de inventar um horário.
 */
export const previewHoursOf = (
  schedules: Map<string, WorkScheduleResponse[]>,
  today: string,
): PreviewHours | null => {
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(today, offset)
    const hours = [...schedules.values()].flatMap((rules) => workHoursOn(rules, date) ?? [])
    if (hours.length > 0) {
      return {
        start: hours.map(({ start }) => start).sort()[0]!,
        end: hours
          .map(({ end }) => end)
          .sort()
          .at(-1)!,
      }
    }
  }
  return null
}

export const toServiceListItem = (
  service: ServiceResponse,
  professionals: ProfessionalResponse[],
): ServiceListItem => ({
  id: service.id,
  name: service.name,
  durationMinutes: service.durationMinutes,
  priceCents: service.priceCents,
  isActive: service.isActive,
  professionalNames: service.professionals.flatMap(
    ({ professionalId }) =>
      professionals.find(({ id }) => id === professionalId)?.displayName ?? [],
  ),
})

/** O pedido de gravação a partir do formulário. O que a tela não edita (insumos, situação) fica como estava. */
export const toSaveServiceRequest = (
  draft: ServiceDraft,
  existing: ServiceResponse | null,
): SaveServiceRequest => ({
  name: draft.name,
  description: draft.description,
  durationMinutes: draft.durationMinutes,
  bufferBeforeMinutes: draft.bufferBeforeMinutes,
  bufferAfterMinutes: draft.bufferAfterMinutes,
  slotStepMinutes: draft.slotStepMinutes,
  priceCents: draft.priceCents,
  suppliesNote: existing?.suppliesNote ?? null,
  isActive: existing?.isActive ?? true,
})

/** O mesmo serviço, só com a situação trocada: ativar e desativar usam a edição. */
export const withActive = (service: ServiceResponse, isActive: boolean): SaveServiceRequest => ({
  name: service.name,
  description: service.description,
  durationMinutes: service.durationMinutes,
  bufferBeforeMinutes: service.bufferBeforeMinutes,
  bufferAfterMinutes: service.bufferAfterMinutes,
  slotStepMinutes: service.slotStepMinutes,
  priceCents: service.priceCents,
  suppliesNote: service.suppliesNote,
  isActive,
})

/** Quem ligar e quem desligar para o serviço ficar com exatamente `wanted`. */
export const professionalChanges = (current: string[], wanted: string[]) => ({
  enable: wanted.filter((id) => !current.includes(id)),
  disable: current.filter((id) => !wanted.includes(id)),
})

export const toTeamMember = (
  professional: ProfessionalResponse,
  services: ServiceResponse[],
): TeamMember => ({
  id: professional.id,
  displayName: professional.displayName,
  specialty: professional.specialty,
  bio: professional.bio,
  isActive: professional.isActive,
  isPubliclyVisible: professional.isPubliclyVisible,
  hasPublicProfileConsent: professional.hasPublicProfileConsent,
  hasAccount: professional.membershipId !== null,
  photo: professional.photo,
  serviceIds: services
    .filter((service) =>
      service.professionals.some(({ professionalId }) => professionalId === professional.id),
    )
    .map(({ id }) => id),
})

export const toScheduleRow = (schedule: WorkScheduleResponse): ScheduleRow => ({
  id: schedule.id,
  dayOfWeek: schedule.dayOfWeek,
  start: schedule.startTime.slice(0, 5),
  end: schedule.endTime.slice(0, 5),
  effectiveFrom: schedule.effectiveFrom,
  effectiveTo: schedule.effectiveTo,
})

/** A API recebe `HH:mm:ss` (`TimeOnly`) e o dia como número. */
export const toScheduleRequest = (draft: ScheduleDraft): SaveWorkScheduleRequest => ({
  dayOfWeek: draft.dayOfWeek,
  startTime: `${draft.start}:00`,
  endTime: `${draft.end}:00`,
  effectiveFrom: draft.effectiveFrom,
  effectiveTo: draft.effectiveTo,
})

/** A faixa vale no dia `date` (`yyyy-MM-dd`). */
const activeOn = (row: ScheduleRow, date: string) =>
  row.effectiveFrom <= date && (row.effectiveTo === null || row.effectiveTo >= date)

const weekdayOf = (dayOfWeek: number) => WEEKDAYS.find(({ day }) => day === dayOfWeek)!

const rangeKey = (dayOfWeek: number, start: string, end: string) => `${dayOfWeek}|${start}|${end}`

/** A semana que vale no dia `date`: as faixas vigentes, por dia, em ordem. */
export const toWeekSchedule = (rows: ScheduleRow[], date: string): WeekSchedule => {
  const week = emptyWeek()
  for (const row of rows.filter((row) => activeOn(row, date))) {
    const day = week[weekdayOf(row.dayOfWeek).id]
    day.enabled = true
    day.ranges = sortRanges([...day.ranges, { start: row.start, end: row.end }])
  }
  return week
}

/** Faixas que ainda vão começar ou que já têm data para acabar: "Mudanças programadas". */
export const scheduledChanges = (rows: ScheduleRow[], today: string): ScheduledChange[] =>
  rows
    .filter(
      (row) => row.effectiveFrom > today || (row.effectiveTo !== null && row.effectiveTo >= today),
    )
    .toSorted(
      (a, b) =>
        a.effectiveFrom.localeCompare(b.effectiveFrom) ||
        WEEKDAYS.indexOf(weekdayOf(a.dayOfWeek)) - WEEKDAYS.indexOf(weekdayOf(b.dayOfWeek)) ||
        a.start.localeCompare(b.start),
    )
    .map((row) => ({
      id: row.id,
      label: `${weekdayOf(row.dayOfWeek).label} ${row.start} – ${row.end}`,
      validity: validityLabel(row, today),
    }))

/**
 * O que gravar para a semana valer a partir de `from`, preservando o histórico: a faixa vigente que continua igual
 * fica; a que saiu deixa de valer na véspera (`close`) — ou é apagada (`remove`), se ainda nem tinha começado; a
 * faixa nova entra valendo de `from` em diante (`add`). A ordem de gravação é essa, para nunca cruzar faixas.
 */
export const weekChanges = (rows: ScheduleRow[], week: WeekSchedule, from: string) => {
  const active = rows.filter((row) => activeOn(row, from))
  const wanted = WEEKDAYS.flatMap(({ id, day }) =>
    week[id].enabled ? week[id].ranges.map((range) => ({ day, ...range })) : [],
  )
  const wantedKeys = new Set(wanted.map(({ day, start, end }) => rangeKey(day, start, end)))
  const activeKeys = new Set(active.map((row) => rangeKey(row.dayOfWeek, row.start, row.end)))
  const leaving = active.filter(
    (row) => !wantedKeys.has(rangeKey(row.dayOfWeek, row.start, row.end)),
  )

  return {
    close: leaving
      .filter((row) => row.effectiveFrom < from)
      .map((row) => ({ ...row, effectiveTo: previousDay(from) })),
    remove: leaving.filter((row) => row.effectiveFrom >= from),
    add: wanted
      .filter(({ day, start, end }) => !activeKeys.has(rangeKey(day, start, end)))
      .map(({ day, start, end }): ScheduleDraft => ({
        dayOfWeek: day,
        start,
        end,
        effectiveFrom: from,
        effectiveTo: null,
      })),
  }
}

export const toExceptionItem = (
  exception: ScheduleExceptionResponse,
  timeZone: string,
  nameOf: (id: string) => string,
): ExceptionItem => ({
  id: exception.id,
  professionalName: exception.professionalId ? nameOf(exception.professionalId) : null,
  kind: exception.kind,
  startDate: dateKeyIn(exception.startsAt, timeZone),
  startTime: timeIn(exception.startsAt, timeZone),
  endDate: dateKeyIn(exception.endsAt, timeZone),
  endTime: timeIn(exception.endsAt, timeZone),
  reason: exception.reason,
})

/** O período digitado no relógio do estabelecimento, em instantes UTC (nunca o fuso do navegador). */
export const exceptionPeriod = (draft: ExceptionDraft, timeZone: string) => ({
  startsAt: instantIn(draft.startDate, draft.startTime, timeZone),
  endsAt: instantIn(draft.endDate, draft.endTime, timeZone),
})

/**
 * Um agendamento na prévia do bloqueio, nas duas colunas do Figma: "22 set · 10:00" e "Ana · Corte feminino". No
 * bloqueio do estabelecimento inteiro, o profissional entra no fim. Sem nome informado (só o balcão informa), "Consumidor".
 */
export const toAffectedItem = (
  appointment: AffectedAppointmentResponse,
  timeZone: string,
  nameOf: (id: string) => string,
  withProfessional: boolean,
): AffectedItem => ({
  id: appointment.id,
  when: `${shortDateLabel(dateKeyIn(appointment.startsAt, timeZone))} · ${timeIn(appointment.startsAt, timeZone)}`,
  detail: [
    appointment.attendeeName ?? 'Consumidor',
    appointment.serviceName,
    ...(withProfessional ? [nameOf(appointment.professionalId)] : []),
  ].join(' · '),
})
