import type { ImageSet } from '@api/models'
import type { PhotosScreenProps } from '../../types'

export type ShowcaseCardProps = {
  /** As fotos da vitrine, na ordem; a primeira é a capa. */
  photos: ImageSet[]
  onUpload: PhotosScreenProps['onUploadShowcase']
  onRemove: PhotosScreenProps['onRemoveShowcase']
  /** Aplica a nova ordem (permutação dos lugares atuais). */
  onReorder: PhotosScreenProps['onReorderShowcase']
}
