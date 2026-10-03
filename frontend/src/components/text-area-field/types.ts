import type { ComponentProps } from 'react'

export type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  id: string
  label: string
  /** Texto de ajuda abaixo do campo, ligado por `aria-describedby`. */
  helper?: string
}
