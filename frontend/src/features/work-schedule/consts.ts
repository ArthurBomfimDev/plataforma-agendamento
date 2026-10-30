import type {
  BlockPeriodDraft,
  BlockPeriodErrors,
  BlockPeriodValues,
  BlockType,
  ConfirmedAppointment,
  DaySchedule,
  Holiday,
  HolidayRule,
  TimeRange,
  WeekSchedule,
  Weekday,
} from './types'
import { format, parseISO } from 'date-fns'

import type { SelectOption } from '@components/menu-select-field/types'
import { ptBR } from 'date-fns/locale/pt-BR'
import { toMinutes } from '@features/business-agenda/consts'

/** Ordem da tela 12: a semana começa na segunda. */
export const WEEKDAYS = [
  { id: 'monday', label: 'Segunda' },
  { id: 'tuesday', label: 'Terça' },
  { id: 'wednesday', label: 'Quarta' },
  { id: 'thursday', label: 'Quinta' },
  { id: 'friday', label: 'Sexta' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
] as const satisfies ReadonlyArray<{ id: Weekday; label: string }>

/** "Aplicar a todos os dias úteis": segunda a sexta. */
export const WORKDAYS: ReadonlyArray<Weekday> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
]

/** Faixa que um dia ganha ao ser ligado sem nenhuma guardada. */
export const DEFAULT_RANGE: TimeRange = { start: '09:00', end: '18:00' }

export const BLOCK_TYPE_OPTIONS: ReadonlyArray<SelectOption<BlockType>> = [
  { value: 'dayOff', label: 'Folga' },
  { value: 'vacation', label: 'Férias' },
  { value: 'block', label: 'Bloqueio' },
]

export const EMPTY_BLOCK: BlockPeriodValues = {
  type: 'dayOff',
  from: '',
  to: '',
  reason: '',
  conflictAction: 'keep',
}

/** Cartão de seção do Figma: superfície, borda sutil e raio grande. */
export const CARD =
  'flex flex-col rounded-lg border border-(--border-subtle) bg-(--bg-surface) px-(--space-16) py-(--space-12)'

/** Rótulo menor dos campos compactos da tela 12: `caption` em `text/muted`. */
export const COMPACT_LABEL = 'type-caption text-(--text-muted)'

/** Caixa de hora do editor do dia: 80 × 44, raio pequeno. */
export const TIME_INPUT =
  'type-body tabular h-(--size-touch-min) w-20 rounded-sm border border-(--border-interactive) bg-(--bg-surface) text-center text-(--text-strong) focus-visible:border-(--border-focus) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:justify-center'

/** Link de texto com 44px de alvo de toque ("editar", "+ faixa"). */
export const TEXT_ACTION =
  'type-label flex min-h-(--size-touch-min) shrink-0 items-center px-(--space-4) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

/** "09:00 – 12:00 · 13:00 – 18:00". */
export const rangesLabel = (ranges: TimeRange[]) =>
  ranges.map(({ start, end }) => `${start} – ${end}`).join(' · ')

export const sortRanges = (ranges: TimeRange[]) =>
  ranges.toSorted((a, b) => toMinutes(a.start) - toMinutes(b.start))

/** O dia gera horário: ligado e com ao menos uma faixa. */
export const isWorking = (day: DaySchedule) => day.enabled && day.ranges.length > 0

/** Profissional sem nenhum dia de atendimento não gera horário nenhum. */
export const hasSchedule = (schedule: WeekSchedule) =>
  WEEKDAYS.some(({ id }) => isWorking(schedule[id]))

/**
 * Invariantes do `WorkSchedule` (modelo de domínio §7): toda faixa com início antes do fim, e duas
 * faixas do mesmo dia sem sobreposição. O backend valida de novo; aqui é para o Owner corrigir.
 */
export const validateRanges = (ranges: TimeRange[]) => {
  if (ranges.some(({ start, end }) => !start || !end))
    return 'Preencha o início e o fim de cada faixa.'
  if (ranges.some(({ start, end }) => toMinutes(start) >= toMinutes(end)))
    return 'Cada faixa precisa terminar depois de começar.'

  const sorted = sortRanges(ranges)
  const overlap = sorted.findIndex(
    (range, index) => index > 0 && toMinutes(range.start) < toMinutes(sorted[index - 1].end),
  )
  if (overlap > 0)
    return `As faixas ${rangesLabel([sorted[overlap - 1]])} e ${rangesLabel([sorted[overlap]])} se sobrepõem.`

  return null
}

/** Grava as faixas no dia — e nos dias úteis, se pedido. Os dias gravados ficam ligados. */
export const applyRanges = (
  schedule: WeekSchedule,
  day: Weekday,
  ranges: TimeRange[],
  toWorkdays: boolean,
): WeekSchedule => {
  const days = toWorkdays ? new Set([day, ...WORKDAYS]) : new Set([day])
  const sorted = sortRanges(ranges)
  return Object.fromEntries(
    WEEKDAYS.map(({ id }) => [id, days.has(id) ? { enabled: true, ranges: sorted } : schedule[id]]),
  ) as WeekSchedule
}

/** Liga ou desliga o dia. Ligar um dia sem faixa guardada dá a ele a faixa padrão. */
export const toggleDay = (schedule: WeekSchedule, day: Weekday, enabled: boolean): WeekSchedule => {
  const current = schedule[day]
  const ranges = enabled && current.ranges.length === 0 ? [DEFAULT_RANGE] : current.ranges
  return { ...schedule, [day]: { enabled, ranges } }
}

/** "7 set", "12 out". */
export const shortDateLabel = (date: string) => format(parseISO(date), 'd MMM', { locale: ptBR })

/** "22 set · 10:00". */
export const appointmentWhenLabel = (appointment: ConfirmedAppointment) =>
  `${shortDateLabel(appointment.date)} · ${appointment.start}`

/** "09:00" → "09"; "09:30" fica igual. */
const compactTime = (time: string) => (time.endsWith(':00') ? time.slice(0, 2) : time)

/** "Fechado", "Especial 09–13". */
export const holidayRuleLabel = (rule: HolidayRule) =>
  rule.kind === 'closed'
    ? 'Fechado'
    : `Especial ${compactTime(rule.start)}–${compactTime(rule.end)}`

/** Agendamentos confirmados do profissional entre `from` e `to`, inclusive, em ordem. */
export const conflictsIn = (
  appointments: ConfirmedAppointment[],
  professionalId: string,
  from: string,
  to: string,
) => {
  if (!from || !to || to < from) return []
  return appointments
    .filter(
      (appointment) =>
        appointment.professionalId === professionalId &&
        appointment.date >= from &&
        appointment.date <= to,
    )
    .toSorted((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
}

/** "1 agendamento já confirmado", "3 agendamentos já confirmados". */
export const conflictsTitle = (count: number) =>
  count === 1
    ? '1 agendamento já confirmado neste período'
    : `${count} agendamentos já confirmados neste período`

export const validateBlock = (values: BlockPeriodValues, today: string): BlockPeriodErrors => {
  const errors: BlockPeriodErrors = {}
  if (!values.from) errors.from = 'Escolha o primeiro dia.'
  else if (values.from < today) errors.from = 'Não dá para bloquear o passado.'
  if (!values.to) errors.to = 'Escolha o último dia.'
  else if (values.from && values.to < values.from) errors.to = 'Precisa ser depois do início.'
  return errors
}

export const toBlockDraft = (
  values: BlockPeriodValues,
  professionalId: string,
  conflicts: ConfirmedAppointment[],
): BlockPeriodDraft => {
  const reason = values.reason.trim()
  return {
    professionalId,
    type: values.type,
    from: values.from,
    to: values.to,
    reason: reason || null,
    cancelAppointmentIds: values.conflictAction === 'cancel' ? conflicts.map(({ id }) => id) : [],
  }
}

/** Domingo de Páscoa pelo algoritmo de Gauss (computus gregoriano anônimo). */
export const easterSunday = (year: number) => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const FIXED_HOLIDAYS: ReadonlyArray<{ monthDay: string; name: string }> = [
  { monthDay: '01-01', name: 'Confraternização Universal' },
  { monthDay: '04-21', name: 'Tiradentes' },
  { monthDay: '05-01', name: 'Dia do Trabalho' },
  { monthDay: '09-07', name: 'Independência' },
  { monthDay: '10-12', name: 'N. Sra. Aparecida' },
  { monthDay: '11-02', name: 'Finados' },
  { monthDay: '11-15', name: 'Proclamação da República' },
  { monthDay: '11-20', name: 'Consciência Negra' },
  { monthDay: '12-25', name: 'Natal' },
]

/**
 * Feriados nacionais do ano, calculados sem API (modelo de domínio §7): os fixos são constantes e
 * os móveis derivam da Páscoa.
 *
 * TODO: provisório. A lista que vale é a do `Holiday` calculado no módulo Availability; quando a API
 * existir, a tela recebe os feriados dela e esta função sai. Feriados estaduais e municipais ainda
 * não entram.
 */
export const nationalHolidays = (year: number): Holiday[] => {
  const easter = easterSunday(year)
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2)

  return [
    ...FIXED_HOLIDAYS.map(({ monthDay, name }) => ({ date: `${year}-${monthDay}`, name })),
    { date: format(goodFriday, 'yyyy-MM-dd'), name: 'Sexta-feira Santa' },
  ].toSorted((a, b) => a.date.localeCompare(b.date))
}

/** Feriados do mês de `today` até o fim do ano. */
export const holidaysFrom = (today: string) =>
  nationalHolidays(Number(today.slice(0, 4))).filter(
    ({ date }) => date >= `${today.slice(0, 7)}-01`,
  )
