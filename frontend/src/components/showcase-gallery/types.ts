import type { ImageSet } from '@api/models'

export type ShowcaseGalleryProps = {
  name: string
  /** `Beleza` ou `Saude`: escolhe a ilustração padrão quando não há foto. */
  category: string
  /** A vitrine, na ordem; a primeira é a capa. */
  photos?: ImageSet[]
  /** Capa de um estabelecimento sem vitrine. */
  cover?: ImageSet | null
}
