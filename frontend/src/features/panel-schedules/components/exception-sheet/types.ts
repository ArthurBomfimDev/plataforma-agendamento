import type { AffectedItem, ExceptionChoice, ExceptionDraft } from '../../types'

export type ExceptionSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionals: ReadonlyArray<{ id: string; name: string }>
  today: string
  /** Os agendamentos do período, ou a mensagem de erro. */
  onPreview: (draft: ExceptionDraft) => Promise<AffectedItem[] | string>
  /** Resolve `null` se gravou, senão a mensagem de erro. */
  onAdd: (draft: ExceptionDraft, choice: ExceptionChoice) => Promise<string | null>
}
