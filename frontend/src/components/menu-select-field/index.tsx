import { FIELD_BOX_CLASSES, FIELD_LABEL_CLASSES } from '@components/text-field/consts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'

import type { MenuSelectFieldProps } from './types'
import { cn } from 'cn'

/**
 * Campo de seleção com a mesma caixa e o mesmo rótulo do `TextField`, construído sobre o Select do
 * shadcn (Base UI). A lib dá a lista, o teclado e `aria-*`; aqui entram os tokens.
 */
export const MenuSelectField = <Value extends string>(props: MenuSelectFieldProps<Value>) => {
  const { id, label, value, options, onValueChange, className, labelClassName } = props

  const labelId = `${id}-label`

  return (
    <div className={cn('flex flex-col gap-(--space-4)', className)}>
      <span id={labelId} className={cn(FIELD_LABEL_CLASSES, labelClassName)}>
        {label}
      </span>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => next !== null && onValueChange(next)}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={labelId}
          className={cn(
            FIELD_BOX_CLASSES,
            'w-full gap-(--space-8) bg-(--bg-surface) data-[size=default]:h-auto [&_svg]:text-(--text-muted)',
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-md bg-(--bg-surface) p-(--space-4) text-(--text-strong) shadow-(--elevation-card) ring-(--border-subtle)">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="type-body min-h-(--size-touch-min) rounded-sm text-(--text-body) focus:bg-(--bg-surface-raised) focus:text-(--text-strong) data-selected:text-(--text-link)"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
