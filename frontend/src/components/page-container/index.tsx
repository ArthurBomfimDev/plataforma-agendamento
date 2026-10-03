import type { ReactNode } from 'react'
import { cn } from 'cn'

/**
 * Larguras da coluna central por faixa de tela:
 * - celular (< 768px): a tela inteira, layout de 390px do Figma;
 * - tablet (768–1023px): coluna de 640px, o layout de celular centralizado;
 * - desktop (≥ 1024px): as larguras dos frames 01D–08D;
 * - telas grandes (≥ 1920px): a coluna larga cresce para 1440px, para não sobrar vazio.
 */
const WIDTHS = {
  /** Vitrine, estabelecimento, profissional, horários. */
  wide: 'lg:max-w-[calc(1200px+2*var(--space-40))] min-[120rem]:max-w-[calc(1440px+2*var(--space-40))]',
  /** Meus agendamentos. */
  medium: 'lg:max-w-[calc(1000px+2*var(--space-40))]',
  /** Revisão e pedido enviado. */
  narrow: 'lg:max-w-[calc(760px+2*var(--space-40))]',
} as const

/*
 * Barras de largura total (cabeçalho com "voltar", rodapé fixo, navegação inferior) ficam fora do
 * container e alinham o conteúdo com a coluna do tablet pelo respiro lateral, que cresce em vez de
 * a barra encolher:  md:px-[max(var(--space-16),calc((100%-40rem)/2+var(--space-16)))]
 * O Tailwind só gera a classe escrita por extenso no arquivo — não monte o nome por variável.
 */

/** Coluna central das telas. No celular não faz nada: cada tela mantém o próprio layout. */
export const PageContainer = ({
  width = 'wide',
  className,
  children,
}: {
  width?: keyof typeof WIDTHS
  className?: string
  children: ReactNode
}) => (
  <div
    className={cn('md:mx-auto md:w-full md:max-w-160 lg:px-(--space-40)', WIDTHS[width], className)}
  >
    {children}
  </div>
)
