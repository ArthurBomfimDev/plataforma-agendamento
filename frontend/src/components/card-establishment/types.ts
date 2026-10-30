import type { ImageSet } from '@lib/api/types'

export type CardEstablishmentProps = {
  name: string
  /** Nota média, de 0 a 5. Ausente (sem avaliações ainda) = o card não mostra a nota. */
  rating?: number
  reviewCount?: number
  /** Ausente quando não se sabe de onde o consumidor está buscando. */
  distanceKm?: number
  neighborhood: string
  verified?: boolean
  /** Capa do estabelecimento. Sem ela, o card mostra a ilustração da categoria (Onda 6D). */
  image?: ImageSet | null
  /** `Beleza` ou `Saude`. */
  category?: string
  /** Quando presente, o card inteiro vira clicável, pelo botão que envolve o nome. */
  onClick?: () => void
  className?: string
}
