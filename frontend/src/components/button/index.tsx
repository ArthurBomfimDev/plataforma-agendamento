import type { ButtonProps } from './types'
import { Button as UiButton } from '../ui/button'
import { cn } from 'cn'

/**
 * Botão primário, tamanho md do Figma, construído sobre o Button do shadcn (Base UI). A lib dá
 * semântica, foco e estados; aqui entram os tokens do design system. As variantes `secondary` e
 * `ghost` do Figma entram quando uma tela precisar.
 *
 * TODO(figma): hover, active e disabled dependem de tokens que o Figma ainda não expõe (ver
 * `tokens.css`). O hover fica igual ao repouso até lá; o `opacity-50` do disabled é padrão do
 * shadcn, não um valor do design.
 */
export const Button = (props: ButtonProps) => {
  const { className, ...buttonProps } = props

  return (
    <UiButton
      {...buttonProps}
      className={cn(
        'type-label h-auto min-h-(--size-touch-min) gap-(--space-8) rounded-md bg-(--action-primary) px-(--space-16) py-(--space-12) text-(--text-on-action) hover:bg-(--action-primary) focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        className,
      )}
    />
  )
}
