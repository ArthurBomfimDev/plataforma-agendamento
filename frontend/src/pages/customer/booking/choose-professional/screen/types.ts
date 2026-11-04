import type { BusinessService } from '@pages/customer/business-detail/screen/types'
import type { ImageSet } from '@api/models'

export type BusinessProfessional = {
  id: string
  name: string
  /** O perfil de todo profissional ativo é público (ADR-031): especialidade, bio e foto, quando informadas. */
  specialty?: string
  yearsOfExperience?: number
  /** Nota média, de 0 a 5. Ausente = ainda sem avaliações. */
  rating?: number
  /** Nula sem foto ou sem perfil público consentido: a tela mostra as iniciais. */
  photo?: ImageSet | null
}

export type ChooseProfessionalScreenProps = {
  businessName: string
  service: Omit<BusinessService, 'id'>
  /** Só quem executa o serviço. */
  professionals: BusinessProfessional[]
  onBack?: () => void
  /** `null` = "Sem preferência": qualquer profissional que execute o serviço. */
  onSelectProfessional?: (professionalId: string | null) => void
}
