import type { PhotoProfessional, PhotosScreenProps } from '../../types'

export type TeamPhotosCardProps = {
  professionals: PhotoProfessional[]
  onUpload: PhotosScreenProps['onUploadProfessional']
  onRemove: PhotosScreenProps['onRemoveProfessional']
}
