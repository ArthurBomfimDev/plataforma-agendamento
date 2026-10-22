export type CardEstablishmentProps = {
  name: string
  /** Nota média, de 0 a 5. Ausente (sem avaliações ainda) = o card não mostra a nota. */
  rating?: number
  reviewCount?: number
  /** Ausente quando não se sabe de onde o consumidor está buscando. */
  distanceKm?: number
  neighborhood: string
  verified?: boolean
  /** Sem foto, o card mostra o bloco neutro do wireframe. */
  imageUrl?: string
  /** Quando presente, o card inteiro vira clicável, pelo botão que envolve o nome. */
  onClick?: () => void
  className?: string
}
