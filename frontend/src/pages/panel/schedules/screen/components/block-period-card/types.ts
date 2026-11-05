import type { AffectedItem, ExceptionChoice, ExceptionDraft, Outcome } from '../../types'

export type BlockPeriodCardProps = {
  /** Profissional aberto na tela: o bloqueio é dele, salvo "Estabelecimento inteiro". */
  professionalId: string
  /** Hoje, `yyyy-MM-dd`. */
  today: string
  /** Prévia: os agendamentos do período, ou a mensagem de erro. */
  onPreview: (draft: ExceptionDraft) => Promise<AffectedItem[] | string>
  /** Grava. Se cancela agendamentos, só depois do diálogo de confirmação. */
  onConfirm: (draft: ExceptionDraft, choice: ExceptionChoice) => Outcome
  className?: string
  /**
   * Mostra "Estabelecimento inteiro". O profissional só bloqueia a própria agenda (o servidor responde 403 ao resto),
   * então para ele a opção não existe.
   */
  allowWholeBusiness?: boolean
}
