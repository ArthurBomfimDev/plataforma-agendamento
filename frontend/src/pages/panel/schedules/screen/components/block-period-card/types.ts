import type { AffectedItem, ExceptionChoice, ExceptionDraft, Outcome } from '../../types'

export type BlockPeriodCardProps = {
  professionals: ReadonlyArray<{ id: string; name: string }>
  /** Profissional aberto na tela: o "Para" começa nele. */
  defaultTarget: string
  /** Hoje, `yyyy-MM-dd`. */
  today: string
  /** Prévia: os agendamentos do período, ou a mensagem de erro. */
  onPreview: (draft: ExceptionDraft) => Promise<AffectedItem[] | string>
  /** Grava. Se cancela agendamentos, só depois do diálogo de confirmação. */
  onConfirm: (draft: ExceptionDraft, choice: ExceptionChoice) => Outcome
  className?: string
}
