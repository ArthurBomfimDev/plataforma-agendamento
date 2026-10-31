import { RadioGroupItem, RadioGroup as UiRadioGroup } from '@components/ui/radio-group'

import type { RadioOptionGroupProps } from './types'
import { cn } from 'cn'

/**
 * Opções exclusivas com título e explicação (tela 12, "O que fazer com eles?"), construídas sobre o
 * RadioGroup do shadcn (Base UI). A lib dá `role="radiogroup"`, setas e foco; aqui entram os
 * tokens. Escolhido = círculo de 20px preenchido em `action/primary`; o resto, só o contorno.
 *
 * Cada opção inteira é um `<label>`: o alvo de toque é a linha, não só o círculo.
 */
export const RadioOptionGroup = <Value extends string>(props: RadioOptionGroupProps<Value>) => {
  const { value, options, onValueChange, className, ...groupProps } = props

  return (
    <UiRadioGroup
      {...groupProps}
      value={value}
      onValueChange={(next) => onValueChange(next as Value)}
      className={cn('flex flex-col gap-0', className)}
    >
      {options.map((option) => {
        const checked = option.value === value
        return (
          <label
            key={option.value}
            className="flex min-h-(--size-touch-min) cursor-pointer items-start gap-(--space-12) px-(--space-2) py-(--space-8)"
          >
            <RadioGroupItem
              value={option.value}
              className="mt-0.5 size-5 border border-(--border-interactive) bg-(--bg-surface) after:hidden focus-visible:border-(--border-interactive) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) data-checked:border-(--action-primary) data-checked:bg-(--action-primary) [&_[data-slot=radio-group-indicator]]:hidden"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
              <span
                className={cn('type-body', checked ? 'text-(--text-strong)' : 'text-(--text-body)')}
              >
                {option.label}
              </span>
              {option.description && (
                <span className="type-caption text-(--text-muted)">{option.description}</span>
              )}
            </span>
          </label>
        )
      })}
    </UiRadioGroup>
  )
}
