import type { ImageSet } from '@api/models'
import type { PhotosScreenProps } from '../../types'

export type BusinessImagesCardProps = {
  logo: ImageSet | null
  onUpload: PhotosScreenProps['onUploadBusiness']
  onRemove: PhotosScreenProps['onRemoveBusiness']
}
