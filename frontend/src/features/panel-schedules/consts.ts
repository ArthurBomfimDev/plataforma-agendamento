import type { ExceptionDraft, ExceptionItem, ScheduleDraft, ScheduleRow } from './types'
import { format, parse } from 'date-fns'

import type { ScheduleExceptionKind } from '@lib/api/types'

/** Segunda primeiro, como a semana de trabalho; o número é o do `Date.getDay()` e da API. */
export const WEEKDAYS = [
  { day: 1, label: 'Segunda' },
  { day: 2, label: 'Terça' },
  { day: 3, label: 'Quarta' },
  { day: 4, label: 'Quinta' },
  { day: 5, label: 'Sexta' },
  { day: 6, label: 'Sábado' },
  { day: 0, label: 'Domingo' },
] as const

export const KIND_LABELS: Record<ScheduleExceptionKind, string> = {
  Block: 'Bloqueio',
  DayOff: 'Folga',
  Vacation: 'Férias',
  ExtraShift: 'Turno extra',
}

/** O que cada tipo faz, para o dono escolher sem adivinhar. */
export const KIND_HELP: Record<ScheduleExceptionKind, string> = {
  Block: 'Tira o período da agenda (consulta médica, reforma).',
  DayOff: 'Um dia sem atendimento.',
  Vacation: 'Vários dias sem atendimento.',
  ExtraShift: 'Soma horário fora da jornada. Precisa de um profissional.',
}

/** `yyyy-MM-dd` → `03/11/2026`. */
export const shortDate = (date: string) =>
  format(parse(date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')

export const rowsOfDay = (rows: ScheduleRow[], day: number) =>
  rows
    .filter(({ dayOfWeek }) => dayOfWeek === day)
    .toSorted((a, b) => a.start.localeCompare(b.start))

/** "Desde 01/09/2026" ou "De 01/09/2026 a 30/11/2026". */
export const validityLabel = (row: Pick<ScheduleRow, 'effectiveFrom' | 'effectiveTo'>) =>
  row.effectiveTo
    ? `De ${shortDate(row.effectiveFrom)} a ${shortDate(row.effectiveTo)}`
    : `Desde ${shortDate(row.effectiveFrom)}`

/** "Folga · 03/11/2026, 00:00 – 04/11/2026, 00:00" — sempre no fuso do estabelecimento. */
export const exceptionWhenLabel = (
  item: Pick<ExceptionItem, 'startDate' | 'startTime' | 'endDate' | 'endTime'>,
) =>
  item.startDate === item.endDate
    ? `${shortDate(item.startDate)}, ${item.startTime} – ${item.endTime}`
    : `${shortDate(item.startDate)}, ${item.startTime} – ${shortDate(item.endDate)}, ${item.endTime}`

export type FieldErrors<T> = Partial<Record<keyof T, string>>

/** Mesmas regras do `WorkSchedule`: fim depois do início e data final depois da inicial. */
export const validateSchedule = (draft: ScheduleDraft): FieldErrors<ScheduleDraft> => {
  const errors: FieldErrors<ScheduleDraft> = {}
  if (!draft.start) errors.start = 'Informe o início.'
  if (!draft.end) errors.end = 'Informe o fim.'
  else if (draft.start && draft.end <= draft.start)
    errors.end = 'O fim precisa ser depois do início.'
  if (!draft.effectiveFrom) errors.effectiveFrom = 'Informe a partir de quando vale.'
  if (draft.effectiveTo && draft.effectiveFrom && draft.effectiveTo < draft.effectiveFrom)
    errors.effectiveTo = 'Precisa ser depois da data inicial.'
  return errors
}

/** Mesmas regras do `ScheduleException`: período válido e turno extra com profissional. */
export const validateException = (draft: ExceptionDraft): FieldErrors<ExceptionDraft> => {
  const errors: FieldErrors<ExceptionDraft> = {}
  if (!draft.startDate || !draft.startTime) errors.startDate = 'Informe quando começa.'
  if (!draft.endDate || !draft.endTime) errors.endDate = 'Informe quando termina.'
  else if (
    draft.startDate &&
    draft.startTime &&
    `${draft.endDate}T${draft.endTime}` <= `${draft.startDate}T${draft.startTime}`
  )
    errors.endDate = 'O fim precisa ser depois do início.'
  if (draft.kind === 'ExtraShift' && !draft.professionalId)
    errors.professionalId = 'Turno extra precisa de um profissional.'
  return errors
}

/** Uma faixa nova: segunda, das 9h às 18h, valendo a partir de hoje. */
export const newScheduleDraft = (today: string, dayOfWeek = 1): ScheduleDraft => ({
  dayOfWeek,
  start: '09:00',
  end: '18:00',
  effectiveFrom: today,
  effectiveTo: null,
})

/** Um bloqueio novo: hoje, das 9h às 18h, para todos. */
export const newExceptionDraft = (today: string): ExceptionDraft => ({
  professionalId: null,
  kind: 'Block',
  startDate: today,
  startTime: '09:00',
  endDate: today,
  endTime: '18:00',
  reason: null,
})
