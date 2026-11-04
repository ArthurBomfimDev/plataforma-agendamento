import type { ImageSet } from '@api/models'

export type PhotoProfessional = {
  id: string
  name: string
  photo: ImageSet | null
  /** A foto só aparece na vitrine com o perfil completo, que exige o consentimento do profissional. */
  isPubliclyVisible: boolean
}

export type PhotosData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | {
      status: 'ready'
      logo: ImageSet | null
      cover: ImageSet | null
      professionals: PhotoProfessional[]
    }

/** Envia e devolve a imagem nova (o `ImageUploader` mostra o progresso e o erro). */
export type UploadImage = (
  file: File,
  onProgress: (fraction: number) => void,
) => Promise<ImageSet | null>

export type PhotosScreenProps = {
  data: PhotosData
  businessName: string
  onUploadBusiness: (slot: 'logo' | 'cover') => UploadImage
  onRemoveBusiness: (slot: 'logo' | 'cover') => () => Promise<void>
  onUploadProfessional: (professionalId: string) => UploadImage
  onRemoveProfessional: (professionalId: string) => () => Promise<void>
}
