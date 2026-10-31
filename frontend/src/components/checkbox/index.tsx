import { Checkbox as UiCheckbox } from '@components/ui/checkbox'
import type { CheckboxProps } from './types'
import { cn } from 'cn'

/**
 * Caixa de seleção do Figma (18px, raio `sm`, tela 12) com o rótulo ao lado, construída sobre o
 * Checkbox do shadcn (Base UI). O `<label>` inteiro é o alvo de toque, com 44px de altura.
 *
 * TODO(figma): o wireframe só mostra o estado marcado, sem o ✓; o ícone vem do shadcn para o
 * estado não depender só da cor.
 */
export const Checkbox = (props: CheckboxProps) => {
  const { label, className, ...checkboxProps } = props

  return (
    <label
      className={cn(
        'type-label flex min-h-(--size-touch-min) cursor-pointer items-center gap-(--space-8) pr-(--space-8) text-(--text-body)',
        className,
      )}
    >
      <UiCheckbox
        {...checkboxProps}
        className="size-4.5 rounded-sm border border-(--border-interactive) bg-(--bg-surface) text-(--text-on-action) after:hidden focus-visible:border-(--border-interactive) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) data-checked:border-(--action-primary) data-checked:bg-(--action-primary) [&_svg]:size-3.5!"
      />
      {label}
    </label>
  )
}
