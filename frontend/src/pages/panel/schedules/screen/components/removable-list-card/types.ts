import type { Loadable, Outcome } from '../../types'

export type RemovableItem = {
  id: string
  title: string
  detail: string
  note?: string | null
  /** Nome acessível do botão de remover: "Remover folga de 03/11/2026". */
  removeLabel: string
}

export type RemovableListCardProps = {
  id: string
  title: string
  items: Loadable<RemovableItem>
  emptyText: string
  confirm: { title: string; description: string; confirmLabel: string; dismissLabel: string }
  /** Toast depois de remover. */
  removedMessage: string
  onRemove: (id: string) => Outcome
  className?: string
}
