import { SIZE_CLASSES, VARIANT_CLASSES } from './consts'

import type { ButtonProps } from './types'
import { Button as UiButton } from '@components/ui/button'
import { cn } from 'cn'

/**
 * Botão do Figma, construído sobre o Button do shadcn (Base UI). A lib dá semântica, foco e
 * estados; aqui entram os tokens do design system.
 *
 * O hover do primário usa `action/primary-hover`. TODO(figma): o Figma ainda não tem hover para
 * secundário e fantasma, nem tokens de active e disabled (ver `tokens.css`). Esses hovers ficam
 * iguais ao repouso até lá; o `opacity-50` do disabled é padrão do shadcn, não um valor do design.
 */
export const Button = (props: ButtonProps) => {
  const { variant = 'primary', size = 'md', className, ...buttonProps } = props

  return (
    <UiButton
      {...buttonProps}
      className={cn(
        'h-auto min-h-(--size-touch-min) gap-(--space-8) rounded-md focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    />
  )
}
