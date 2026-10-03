import type { ComponentProps, ReactNode } from 'react'

export type SearchFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
  /** Nome acessível do campo. O placeholder não substitui rótulo. */
  label: string
  /** Ação ao lado do campo, dentro da mesma moldura — o botão "Buscar" do desktop. */
  action?: ReactNode
  /** Classes do campo de texto, por exemplo o tamanho maior do destaque da Home no desktop. */
  inputClassName?: string
}
