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

export type ScheduleProfessional = { id: string; name: string; schedule: WeekSchedule }

/** `ScheduleException` que subtrai disponibilidade. `ExtraShift` soma e não é bloqueio. */
export type BlockType = 'dayOff' | 'vacation' | 'block'

/** O que fazer com os agendamentos confirmados que caem no período bloqueado. */
export type BlockConflictAction = 'keep' | 'cancel'

/** O que está no formulário de bloqueio. Datas em `yyyy-MM-dd`; vazio = não escolhida. */
export type BlockPeriodValues = {
  type: BlockType
  from: string
  to: string
  reason: string
  conflictAction: BlockConflictAction
}

export type BlockPeriodErrors = Partial<Record<'from' | 'to', string>>

/** Bloqueio pronto para enviar ao backend (módulo Availability). */
export type BlockPeriodDraft = {
  professionalId: string
  type: BlockType
  /** Primeiro e último dia bloqueados, inclusive. */
  from: string
  to: string
  /** `null` = sem motivo. */
  reason: string | null
  /** Agendamentos confirmados no período que o Owner decidiu cancelar. Vazio = mantém todos. */
  cancelAppointmentIds: string[]
}

/** Agendamento confirmado, só o que a tela precisa para mostrar o conflito com o bloqueio. */
export type ConfirmedAppointment = {
  id: string
  professionalId: string
  /** `yyyy-MM-dd`. */
  date: string
  /** `HH:mm`. */
  start: string
  customerName: string
  serviceName: string
}

export type Holiday = { date: string; name: string }

/** Regra do estabelecimento para um feriado. Padrão: fechado. */
export type HolidayRule = { kind: 'closed' } | ({ kind: 'special' } & TimeRange)

export type WorkScheduleScreenProps = {
  professionals: ScheduleProfessional[]
  appointments: ConfirmedAppointment[]
  holidays: Holiday[]
  /** Regras por data (`yyyy-MM-dd`). Feriado sem regra = fechado. */
  initialHolidayRules: Record<string, HolidayRule>
  /** Hoje, `yyyy-MM-dd`: não se bloqueia o passado. */
  today: string
  initialBlock: BlockPeriodValues
  /** Chamado só com a jornada válida e sem dia em edição. */
  onSaveSchedule?: (professionalId: string, schedule: WeekSchedule) => void
  /** Chamado só com o bloqueio válido e, se for cancelar agendamentos, depois da confirmação. */
  onBlockPeriod?: (draft: BlockPeriodDraft) => void
  onHolidayRuleChange?: (holiday: Holiday, rule: HolidayRule) => void
}
