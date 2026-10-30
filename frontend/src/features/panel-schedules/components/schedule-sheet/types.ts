import type { ScheduleDraft } from '../../types'

export type ScheduleSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionalName: string
  /** Valores ao abrir: a faixa editada, ou os padrões de uma nova. */
  initial: ScheduleDraft
  editing: boolean
  /** Resolve `null` se gravou, senão a mensagem de erro. */
  onSave: (draft: ScheduleDraft) => Promise<string | null>
}
