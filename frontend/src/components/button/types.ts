import type { ComponentProps } from 'react'
import type { Button as UiButton } from '@components/ui/button'

/** Variantes e tamanhos do Figma (componente Botão), não os do shadcn. */
export type ButtonProps = Omit<ComponentProps<typeof UiButton>, 'variant' | 'size'> & {
  /**
   * `primary` = ação principal; `secondary` = ação alternativa, com borda; `ghost` = ação
   * terciária, só texto. Padrão: `primary`.
   */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** `lg` = botão de rodapé, largura total. Padrão: `md`. */
  size?: 'md' | 'lg'
}
