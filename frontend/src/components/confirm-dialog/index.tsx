import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@components/ui/alert-dialog'

import { Button } from '@components/button'
import type { ConfirmDialogProps } from './types'
import { useRef } from 'react'

/**
 * Confirmação de ação irreversível, construída sobre o AlertDialog do shadcn (Base UI). A lib dá
 * `role="alertdialog"`, foco preso no diálogo, Esc e devolução do foco; aqui entram os tokens.
 * O foco inicial vai para a opção segura, para um Enter apressado não confirmar a ação.
 *
 * TODO(figma): não há wireframe de diálogo nem variante destrutiva do Botão; a ação usa `primary`.
 */
export const ConfirmDialog = (props: ConfirmDialogProps) => {
  const { open, onOpenChange, title, description, confirmLabel, dismissLabel, onConfirm } = props

  const dismissRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        initialFocus={dismissRef}
        className="w-[calc(100%-2*var(--space-16))] max-w-sm gap-(--space-20) rounded-lg bg-(--bg-surface) p-(--space-24) text-(--text-body) ring-0 shadow-(--elevation-card) data-[size=default]:max-w-sm"
      >
        <div className="flex flex-col gap-(--space-8)">
          <AlertDialogTitle className="type-heading text-(--text-strong)">{title}</AlertDialogTitle>
          <AlertDialogDescription className="type-body text-(--text-muted)">
            {description}
          </AlertDialogDescription>
        </div>
        <div className="flex flex-col gap-(--space-8)">
          <Button size="lg" className="w-full" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <AlertDialogCancel
            ref={dismissRef}
            render={<Button variant="ghost" className="w-full" />}
          >
            {dismissLabel}
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
