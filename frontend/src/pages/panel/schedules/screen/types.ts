import type { ScheduleExceptionKind } from '@api/models'

export type Weekday =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

/** Faixa de atendimento, `HH:mm`, no fuso do estabelecimento. */
export type TimeRange = { start: string; end: string }

/**
 * Um dia da jornada recorrente (`WorkSchedule`, modelo de domínio §7). Não existe campo de pausa:
 * duas faixas no mesmo dia são o almoço. `enabled = false` guarda as faixas para religar o dia.
 */
export type DaySchedule = { enabled: boolean; ranges: TimeRange[] }

export type WeekSchedule = Record<Weekday, DaySchedule>

/** Uma faixa como a API guarda: com vigência. Horários `HH:mm` e datas `yyyy-MM-dd`, no fuso do estabelecimento. */
export type ScheduleRow = {
  id: string
  /** 0 = domingo, como o `Date.getDay()` e a API. */
  dayOfWeek: number
  start: string
  end: string
  effectiveFrom: string
  effectiveTo: string | null
}

export type ScheduleDraft = Omit<ScheduleRow, 'id'>

/** Faixa que começa depois de hoje ou já tem data para acabar: aparece em "Mudanças programadas". */
export type ScheduledChange = { id: string; label: string; validity: string }

export type ScheduleProfessional = {
  id: string
  name: string
  /** A semana que vale hoje. */
  schedule: WeekSchedule
  changes: ScheduledChange[]
}

/** Um bloqueio, já no fuso do estabelecimento. */
export type ExceptionItem = {
  id: string
  /** Nulo: vale para o estabelecimento inteiro. */
  professionalName: string | null
  kind: ScheduleExceptionKind
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  reason: string | null
}

/** Bloqueio pronto para a prévia e para gravar. O fim é exclusivo: o dia inteiro vai até 00:00 do dia seguinte. */
export type ExceptionDraft = {
  /** Nulo: todos. */
  professionalId: string | null
  kind: ScheduleExceptionKind
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  reason: string | null
}

/** Agendamento que cairia dentro do bloqueio, na prévia. */
export type AffectedItem = { id: string; label: string }

/** A API mantém todos ou cancela todos — com motivo, que aparece para quem tinha horário. */
export type ExceptionChoice = {
  existingAppointments: 'Keep' | 'CancelAll'
  cancellationReason: string | null
}

/** O que está no formulário de bloqueio. Datas `yyyy-MM-dd` e horas `HH:mm`; vazio = não escolhida. */
export type BlockPeriodValues = {
  kind: ScheduleExceptionKind
  /** Quem o bloqueio atinge: o id de um profissional, ou `ALL_PROFESSIONALS` para o estabelecimento inteiro. */
  target: string
  from: string
  to: string
  /** Dia inteiro: de 00:00 do primeiro dia a 00:00 do dia seguinte ao último. Turno extra sempre tem horário. */
  allDay: boolean
  startTime: string
  endTime: string
  reason: string
  conflictAction: 'keep' | 'cancel'
  cancellationReason: string
}

export type BlockPeriodErrors = Partial<
  Record<'target' | 'from' | 'to' | 'startTime' | 'endTime' | 'cancellationReason', string>
>

export type Holiday = { date: string; name: string }

/** Regra do estabelecimento para um feriado. Padrão: fechado. */
export type HolidayRule = { kind: 'closed' } | ({ kind: 'special' } & TimeRange)

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; items: T[] }

/** As gravações resolvem `null` se deu certo, senão a mensagem de erro. */
export type Outcome = Promise<string | null>

export type WorkScheduleScreenProps = {
  professionals: Loadable<ScheduleProfessional>
  exceptions: Loadable<ExceptionItem>
  holidays: Holiday[]
  /** Regras por data (`yyyy-MM-dd`). Feriado sem regra = fechado. */
  initialHolidayRules: Record<string, HolidayRule>
  /** Hoje, `yyyy-MM-dd`, no fuso do estabelecimento: não se bloqueia o passado. */
  today: string
  /** Chamado só com a jornada válida e sem dia em edição. A semana vale a partir de `from`. */
  onSaveSchedule?: (professionalId: string, schedule: WeekSchedule, from: string) => Outcome
  onRemoveChange?: (change: ScheduledChange) => Outcome
  /** Prévia: os agendamentos do período, ou a mensagem de erro. */
  onPreviewBlock?: (draft: ExceptionDraft) => Promise<AffectedItem[] | string>
  onBlock?: (draft: ExceptionDraft, choice: ExceptionChoice) => Outcome
  onRemoveException?: (item: ExceptionItem) => Outcome
  onHolidayRuleChange?: (holiday: Holiday, rule: HolidayRule) => void
}
