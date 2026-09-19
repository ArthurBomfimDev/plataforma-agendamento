export type CardEstablishmentProps = {
  name: string
  /** Nota média, de 0 a 5. */
  rating: number
  reviewCount: number
  distanceKm: number
  neighborhood: string
  verified?: boolean
  /** Sem foto, o card mostra o bloco neutro do wireframe. */
  imageUrl?: string
  className?: string
}
