import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@components/ui/sheet'

import { DESKTOP_QUERY } from '@hooks/use-media-query/consts'
import type { PanelSheetProps } from './types'
import { X } from 'lucide-react'
import { cn } from 'cn'
import { useMediaQuery } from '@hooks/use-media-query'

/**
 * Gaveta de edição do painel, no desenho da marcação de balcão (P04): lateral no desktop, de baixo no
 * celular. Foco preso, Esc e devolução do foco vêm da lib.
 */
export const PanelSheet = (props: PanelSheetProps) => {
  const { open, onOpenChange, title, description, children } = props
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const side = isDesktop ? 'right' : 'bottom'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className={cn(
          'gap-(--space-20) overflow-y-auto border-(--border-subtle) bg-(--bg-surface) p-(--space-24) text-(--text-body)',
          side === 'bottom'
            ? 'max-h-[90dvh] rounded-t-lg pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]'
            : 'w-full sm:max-w-md',
        )}
      >
        <div className="flex items-start gap-(--space-12)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-4)">
            <SheetTitle className="type-heading text-(--text-strong)">{title}</SheetTitle>
            {/* Sem descrição visível, a lib ainda pede uma para o leitor de tela. */}
            <SheetDescription
              className={cn('type-body text-(--text-muted)', !description && 'sr-only')}
            >
              {description ?? title}
            </SheetDescription>
          </div>
          <SheetClose
            aria-label="Fechar"
            className="flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-muted) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  )
}
