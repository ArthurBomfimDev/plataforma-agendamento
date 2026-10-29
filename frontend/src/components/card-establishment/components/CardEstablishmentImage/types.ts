import type { ImageSet } from '@lib/api/types'

export type CardEstablishmentImageProps = {
  /** Capa (ou logotipo) do estabelecimento. Nula: ilustração da categoria. */
  image?: ImageSet | null
  /** `Beleza` ou `Saude`, para a ilustração padrão. */
  category?: string
  className?: string
}
