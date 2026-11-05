import type { ImageSet } from '@api/models'

export type CardEstablishmentProps = {
  name: string
  /** Nota média, de 1 a 5. Ausente com `reviewCount` presente = "Novo" (menos de 3 avaliações). */
  rating?: number
  /** Presente = a nota foi lida. Ausente = o card não diz nada sobre nota. */
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
