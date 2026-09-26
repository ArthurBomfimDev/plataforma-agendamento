import type { ComponentProps } from 'react'

export type FilterChipProps = Omit<ComponentProps<'button'>, 'type'> & {
  /** Filtro ativo. Além da cor, ganha borda de 2px — o estado não depende só de cor. */
  selected?: boolean
}
