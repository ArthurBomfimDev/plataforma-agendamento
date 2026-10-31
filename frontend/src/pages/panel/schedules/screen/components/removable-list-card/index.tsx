import { ErrorState, LoadingState } from '@components/screen-state'

import { CARD } from '../../consts'
import { ConfirmDialog } from '@components/confirm-dialog'
import { DeleteIcon } from '@assets/icons'
import type { RemovableListCardProps } from './types'
import { cn } from 'cn'
import { notify } from '@components/toaster/notify'
import { useState } from 'react'

/**
 * Lista com "remover" e confirmação, nos cartões da tela 12 ("Mudanças programadas", "Próximos bloqueios"). Nem
 * faixa nem bloqueio têm edição na API: para mudar, remove e cria de novo.
 */
export const RemovableListCard = (props: RemovableListCardProps) => {
  const { id, title, items, emptyText, confirm, removedMessage, onRemove, className } = props
  const [removing, setRemoving] = useState<string | null>(null)

  const remove = async (itemId: string) => {
    setRemoving(null)
    const failure = await onRemove(itemId)
    if (failure) notify.error(failure)
    else notify.success(removedMessage)
  }

  return (
    <section aria-labelledby={id} className={cn(CARD, 'gap-(--space-8)', className)}>
      <h2 id={id} className="type-label text-(--text-strong)">
        {title}
      </h2>

      {items.status === 'loading' ? (
        <LoadingState />
      ) : items.status === 'error' ? (
        <ErrorState message={items.message} onRetry={items.onRetry} />
      ) : items.items.length === 0 ? (
        <p role="status" className="type-caption text-(--text-muted)">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-(--border-subtle)">
          {items.items.map((item) => (
            <li key={item.id} className="flex items-center gap-(--space-8) py-(--space-8)">
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <p className="type-label text-(--text-strong)">{item.title}</p>
                <p className="type-caption tabular text-(--text-body)">{item.detail}</p>
                {item.note && <p className="type-caption text-(--text-muted)">{item.note}</p>}
              </div>
              <button
                type="button"
                aria-label={item.removeLabel}
                onClick={() => setRemoving(item.id)}
                className="flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
              >
                <DeleteIcon aria-hidden="true" className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        {...confirm}
        onConfirm={() => removing && void remove(removing)}
      />
    </section>
  )
}
