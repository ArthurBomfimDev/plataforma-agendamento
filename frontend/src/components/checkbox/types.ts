import type { ComponentProps, ReactNode } from 'react'
import type { Checkbox as UiCheckbox } from '@components/ui/checkbox'

export type CheckboxProps = Omit<ComponentProps<typeof UiCheckbox>, 'className'> & {
  /** Rótulo visível; também é o nome acessível. */
  label: ReactNode
  className?: string
}
