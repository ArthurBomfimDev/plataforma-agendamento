import type { ComponentProps } from 'react'

export type SelectFieldOption = { value: string; label: string }

export type SelectFieldProps = Omit<ComponentProps<'select'>, 'id' | 'children'> & {
  id: string
  label: string
  helper?: string
  error?: string
  options: ReadonlyArray<SelectFieldOption>
}
