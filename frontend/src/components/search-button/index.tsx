import { SearchIcon, SpinnerIcon } from '@assets/icons'

import { Button } from '@components/button'
import type { ComponentProps } from 'react'
import { cn } from 'cn'

export type SearchButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'type'> & {
  /** Busca em andamento: desligado, com `aria-busy` e o ícone girando. */
  loading?: boolean
}

/**
 * "Buscar" da barra de pesquisa (Onda 6C): o `Button` primário do sistema, com os tokens da R5. Fica dentro da
 * moldura do `SearchField`, então tem a altura mínima de toque dela (44 px) e o raio herdado pela classe de quem
 * usa (`rounded-(--radius-full)` na Home do desktop). É `submit`: quem envia é o `<form role="search">` em volta.
 */
export const SearchButton = (props: SearchButtonProps) => {
  const { loading = false, disabled, className, children = 'Buscar', ...buttonProps } = props

  return (
    <Button
      {...buttonProps}
      type="submit"
      variant="primary"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn('shrink-0 py-(--space-8)', className)}
    >
      {loading ? (
        <SpinnerIcon
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <SearchIcon aria-hidden="true" className="size-4" />
      )}
      {children}
    </Button>
  )
}
