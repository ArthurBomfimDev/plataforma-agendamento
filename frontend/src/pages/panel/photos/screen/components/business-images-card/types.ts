import type { ImageSet } from '@api/models'
import type { PhotosScreenProps } from '../../types'

export type BusinessImagesCardProps = {
  logo: ImageSet | null
  cover: ImageSet | null
  onUpload: PhotosScreenProps['onUploadBusiness']
  onRemove: PhotosScreenProps['onRemoveBusiness']
}
