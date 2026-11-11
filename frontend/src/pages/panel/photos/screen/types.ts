import type { ImageSet } from '@api/models'

export type PhotoProfessional = {
  id: string
  name: string
  specialty: string | null
  photo: ImageSet | null
}

export type PhotosData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | {
      status: 'ready'
      logo: ImageSet | null
      /** A vitrine, na ordem; a primeira é a capa. */
      photos: ImageSet[]
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
  onUploadBusiness: (slot: 'logo') => UploadImage
  onRemoveBusiness: (slot: 'logo') => () => Promise<void>
  /** Vitrine: o lugar (0 a 2) é o índice da foto; um lugar depois do fim ocupa o primeiro livre. */
  onUploadShowcase: (slot: number) => UploadImage
  onRemoveShowcase: (slot: number) => () => Promise<void>
  onReorderShowcase: (order: number[]) => Promise<void>
  onUploadProfessional: (professionalId: string) => UploadImage
  onRemoveProfessional: (professionalId: string) => () => Promise<void>
}
