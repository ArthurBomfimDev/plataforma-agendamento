import type { BusinessService } from '@features/business-detail/types'
import type { ImageSet } from '@lib/api/types'

export type BusinessProfessional = {
  id: string
  name: string
  /** Sem consentimento do profissional para o perfil público, só o nome aparece (ADR-004). */
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
