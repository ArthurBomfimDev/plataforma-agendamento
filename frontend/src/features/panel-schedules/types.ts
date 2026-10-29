import type { ScheduleExceptionKind } from '@lib/api/types'

/** Uma faixa da jornada semanal. Horários `HH:mm` e datas `yyyy-MM-dd`, no fuso do estabelecimento. */
export type ScheduleRow = {
  id: string
  /** 0 = domingo. */
  dayOfWeek: number
  start: string
  end: string
  effectiveFrom: string
  effectiveTo: string | null
}

export type ScheduleDraft = Omit<ScheduleRow, 'id'>

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
export type AffectedItem = {
  id: string
  label: string
}

export type ExceptionChoice = {
  existingAppointments: 'Keep' | 'CancelAll'
  cancellationReason: string | null
}

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; items: T[] }

export type SchedulesScreenProps = {
  businessName: string
  professionals: ReadonlyArray<{ id: string; name: string }>
  /** Profissional cuja jornada está aberta. Nulo: ninguém cadastrado. */
  selectedId: string | null
  onSelect: (professionalId: string) => void
  schedules: Loadable<ScheduleRow>
  exceptions: Loadable<ExceptionItem>
  /** "Hoje" no fuso do estabelecimento: começo padrão de uma faixa nova. */
  today: string
  /** As gravações resolvem `null` se deu certo, senão a mensagem de erro (o 409 de faixa cruzada). */
  onSaveSchedule?: (rowId: string | null, draft: ScheduleDraft) => Promise<string | null>
  onRemoveSchedule?: (row: ScheduleRow) => Promise<string | null>
  /** Prévia: os agendamentos do período, ou a mensagem de erro. */
  onPreviewException?: (draft: ExceptionDraft) => Promise<AffectedItem[] | string>
  onAddException?: (draft: ExceptionDraft, choice: ExceptionChoice) => Promise<string | null>
  onRemoveException?: (item: ExceptionItem) => Promise<string | null>
}
