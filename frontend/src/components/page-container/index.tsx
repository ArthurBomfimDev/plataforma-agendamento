import type { PageContainerProps } from './types'
import { WIDTHS } from './consts'
import { cn } from 'cn'

/*
 * Barras de largura total (cabeçalho com "voltar", rodapé fixo, navegação inferior) ficam fora do
 * container e alinham o conteúdo com a coluna do tablet pelo respiro lateral, que cresce em vez de
 * a barra encolher:  md:px-[max(var(--space-16),calc((100%-40rem)/2+var(--space-16)))]
 * O Tailwind só gera a classe escrita por extenso no arquivo — não monte o nome por variável.
 */

/** Coluna central das telas. No celular não faz nada: cada tela mantém o próprio layout. */
export const PageContainer = (props: PageContainerProps) => {
  const { children, className, width = 'wide' } = props

  return (
    <div
      className={cn(
        'md:mx-auto md:w-full md:max-w-160 lg:px-(--space-40)',
        WIDTHS[width],
        className,
      )}
    >
      {children}
    </div>
  )
}
