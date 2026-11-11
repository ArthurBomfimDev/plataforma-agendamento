import type { ImageSet } from '@api/models'
import type { UploadImage } from '@pages/panel/photos/screen/types'

/** O perfil de profissional da própria conta. */
export type MyProfile = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  /** Registro profissional (Saúde). */
  registration: string | null
  photo: ImageSet | null
}

export type ProfileData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; profile: MyProfile }

export type ProfileValues = { specialty: string; bio: string; registration: string }

export type ProfileScreenProps = {
  data: ProfileData
  businessName: string
  /** Mostra o campo "Registro profissional": só em estabelecimento de Saúde. */
  showRegistration: boolean
  /** Grava. Resolve `null` se deu certo, senão a mensagem de erro, já em português. */
  onSave?: (values: ProfileValues) => Promise<string | null>
  onUploadPhoto?: UploadImage
  onRemovePhoto?: () => Promise<void>
  /** "Sair do estabelecimento": resolve `null` se saiu, senão a mensagem de erro. Ausente: a seção não aparece. */
  onLeave?: () => Promise<string | null>
}
