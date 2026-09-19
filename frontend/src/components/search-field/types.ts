import type { ComponentProps } from 'react'

export type SearchFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
  /** Nome acessível do campo. O placeholder não substitui rótulo. */
  label: string
}
