import { AlertDialog, AlertDialogContent } from '@components/ui/alert-dialog'
import { CheckIcon, WarningIcon } from '@assets/icons'
import type { VerificationIntroContentProps, VerificationIntroDialogProps } from './types'
import { useId, useRef } from 'react'

import { Button } from '@components/button'
import { VerificationProgress } from '../verification-progress'
import { cn } from 'cn'
import { labelOf } from '../../consts'

/**
 * Primeiro acesso ao painel de um estabelecimento em rascunho (Figma 20b, "o único modal"): aparece uma vez,
 * para o dono que ainda não sabe que existe uma lista do que falta. Depois dele, o estado vive só na faixa.
 * Construído sobre o AlertDialog do shadcn (Base UI), como o `ConfirmDialog`: a lib dá foco preso, Esc e
 * devolução do foco. O foco inicial vai para "Começar", a ação que o dono veio fazer.
 */
export const VerificationIntroDialog = (props: VerificationIntroDialogProps) => {
  const { open, onLater, ...content } = props
  const startRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onLater()}>
      <AlertDialogContent
        initialFocus={startRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100dvh-2*var(--space-16))] w-[calc(100%-2*var(--space-16))] gap-(--space-16) overflow-y-auto rounded-lg bg-(--bg-surface) p-(--space-24) text-(--text-body) shadow-[0_8px_24px_0_rgba(0,0,0,0.18)] ring-0 data-[size=default]:max-w-140 data-[size=default]:sm:max-w-140"
      >
        <VerificationIntroContent
          {...content}
          onLater={onLater}
          startRef={startRef}
          titleId={titleId}
          descriptionId={descriptionId}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}

type ContentProps = VerificationIntroContentProps & {
  startRef?: React.Ref<HTMLButtonElement>
  titleId?: string
  descriptionId?: string
}

/** O conteúdo do modal. Não depende do portal, então os testes o renderizam direto. */
export const VerificationIntroContent = (props: ContentProps) => {
  const { items, onStart, onLater, startRef, titleId, descriptionId } = props
  const done = items.filter((item) => item.done).length
  const missing = items.length - done

  return (
    <>
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full bg-(--status-pending-bg) text-(--status-pending-fg)"
      >
        <WarningIcon className="size-5" />
      </span>

      <h2 id={titleId} className="type-heading text-(--text-strong)">
        {missing === 1 ? 'Falta 1 passo' : `Faltam ${missing} passos`} para você aparecer na busca
      </h2>
      <p id={descriptionId} className="type-body text-(--text-body)">
        O estabelecimento está como Rascunho: ele já existe no sistema, mas nenhum consumidor
        consegue encontrá-lo nem agendar. Dá para resolver tudo agora ou retomar depois pela faixa
        no topo do painel.
      </p>

      <ul
        aria-label="Itens da verificação"
        className="flex flex-col gap-(--space-8) rounded-md bg-(--bg-surface-raised) p-(--space-16)"
      >
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5">
            {item.done ? (
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-(--status-confirmed-bg) text-(--status-confirmed-fg)"
              >
                <CheckIcon className="size-5" />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="size-5 shrink-0 rounded-full border-2 border-(--border-interactive)"
              />
            )}
            <span
              className={cn(
                'type-body',
                item.done ? 'text-(--text-muted)' : 'text-(--text-strong)',
              )}
            >
              {labelOf(item.key)}
              <span className="sr-only">{item.done ? ' (feito)' : ' (falta)'}</span>
            </span>
          </li>
        ))}
      </ul>

      <VerificationProgress done={done} total={items.length} tone="pending" fill />

      <div className="flex flex-col gap-(--space-8) sm:flex-row sm:items-center sm:gap-(--space-12)">
        <Button ref={startRef} className="sm:flex-1" onClick={onStart}>
          Começar pelo primeiro item
        </Button>
        <Button variant="ghost" onClick={onLater}>
          Deixar para depois
        </Button>
      </div>

      <p className="type-caption text-(--text-muted)">
        Este aviso completo aparece só neste primeiro acesso. Depois dele, o estado fica na faixa do
        topo do painel.
      </p>
    </>
  )
}
