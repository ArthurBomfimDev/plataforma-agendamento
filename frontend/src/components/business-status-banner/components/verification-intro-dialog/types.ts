import type { ChecklistItemResponse } from '@api/models'

export type VerificationIntroDialogProps = {
  open: boolean
  /** Só os itens que o servidor exige (`requiredForSubmit`), na ordem da checklist. */
  items: ChecklistItemResponse[]
  /** "Começar pelo primeiro item": leva ao primeiro pendente. */
  onStart: () => void
  /** "Deixar para depois", Esc ou fechar: o estado continua na faixa do topo. */
  onLater: () => void
}

/** O que o corpo do modal precisa; separado do diálogo para renderizar sem o portal. */
export type VerificationIntroContentProps = Pick<
  VerificationIntroDialogProps,
  'items' | 'onStart' | 'onLater'
>
