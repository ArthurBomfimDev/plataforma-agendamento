/**
 * Larguras da coluna central por faixa de tela:
 * - celular (< 768px): a tela inteira, layout de 390px do Figma;
 * - tablet (768–1023px): coluna de 640px, o layout de celular centralizado;
 * - desktop (≥ 1024px): as larguras dos frames 01D–08D;
 * - telas grandes (≥ 1920px): a coluna larga cresce para 1440px, para não sobrar vazio.
 */
export const WIDTHS = {
  /** Vitrine, estabelecimento, profissional, horários. */
  wide: 'lg:max-w-[calc(1200px+2*var(--space-40))] min-[120rem]:max-w-[calc(1440px+2*var(--space-40))]',
  /** Meus agendamentos. */
  medium: 'lg:max-w-[calc(1000px+2*var(--space-40))]',
  /** Revisão e pedido enviado. */
  narrow: 'lg:max-w-[calc(760px+2*var(--space-40))]',
} as const
