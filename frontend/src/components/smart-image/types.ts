import type { ImageSet } from '@api/models'
import type { ReactNode } from 'react'

export type SmartImageProps = {
  /** Nula: mostra o `fallback`. */
  image: ImageSet | null | undefined
  /** Vazio para imagem decorativa; descrição para imagem informativa. */
  alt: string
  /** Largura exibida, para o navegador escolher o tamanho certo do `srcSet` (ex.: `(min-width: 1024px) 33vw, 100vw`). */
  sizes: string
  /** Proporção reservada antes de a imagem chegar. */
  width: number
  height: number
  /** O padrão visual: ilustração da categoria, iniciais, ícone. */
  fallback: ReactNode
  className?: string
  imgClassName?: string
}
