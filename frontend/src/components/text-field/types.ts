import type { ComponentProps } from 'react'

export type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  /** Texto de ajuda abaixo do campo, ligado por `aria-describedby`. */
  helper?: string
  /** Classes do texto de ajuda — por exemplo, para mostrá-lo só no desktop. */
  helperClassName?: string
  /**
   * Mensagem de erro. Substitui o texto de ajuda e ganha ícone ✕ e borda de 2px: o erro nunca
   * depende só de cor.
   */
  error?: string
}
