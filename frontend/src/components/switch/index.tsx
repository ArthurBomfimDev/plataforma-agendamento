import { Switch as UiSwitch } from '@components/ui/switch'
import type { SwitchProps } from './types'
import { cn } from 'cn'

/**
 * Interruptor do Figma (34 × 20, tela 12), construído sobre o Switch do shadcn (Base UI). A lib dá
 * `role="switch"`, `aria-checked` e o teclado; aqui entram os tokens: ligado = trilho
 * `action/primary` com bolinha branca à direita; desligado = trilho de superfície com borda e
 * bolinha `border/interactive` à esquerda.
 *
 * O desenho tem 20px de altura; o `after` do shadcn estende a área de toque para os 44px.
 */
export const Switch = (props: SwitchProps) => {
  const { className, ...switchProps } = props

  return (
    <UiSwitch
      {...switchProps}
      className={cn(
        'h-5! w-8.5! border border-(--border-interactive) bg-(--bg-surface) p-0 after:-inset-x-1.25 after:-inset-y-3 focus-visible:border-(--border-interactive) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) data-checked:border-(--action-primary) data-checked:bg-(--action-primary) data-unchecked:border-(--border-interactive) data-unchecked:bg-(--bg-surface)',
        // Bolinha de 14px, 3px longe da borda externa: 1px (desligado) ou 17px (ligado) além da
        // borda de 1px do trilho, como no SVG do Figma.
        '*:data-[slot=switch-thumb]:size-3.5! *:data-[slot=switch-thumb]:translate-x-px! *:data-[slot=switch-thumb]:bg-(--border-interactive)! *:data-[slot=switch-thumb]:shadow-none *:data-[slot=switch-thumb]:data-checked:translate-x-4.25! *:data-[slot=switch-thumb]:data-checked:bg-(--text-on-action)!',
        className,
      )}
    />
  )
}
