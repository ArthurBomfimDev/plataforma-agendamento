import type { ImageSet } from '@api/models'

export type CardEstablishmentImageProps = {
  /** Capa (ou logotipo) do estabelecimento. Nula: ilustração da categoria. */
  image?: ImageSet | null
  /** `Beleza` ou `Saude`, para a ilustração padrão. */
  category?: string
  className?: string
}
