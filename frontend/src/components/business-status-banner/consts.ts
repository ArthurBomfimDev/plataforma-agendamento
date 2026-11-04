import type { BannerBusiness, BannerState } from './types'
import type { ChecklistItemResponse } from '@api/models'

export const bannerState = (
  business: Pick<BannerBusiness, 'status' | 'verificationLevel'>,
): BannerState => {
  switch (business.status) {
    case 'PendingReview':
      return 'review'
    case 'Suspended':
      return 'suspended'
    case 'Active':
      return 'active'
    default:
      return business.verificationLevel === 'Rejected' ? 'rejected' : 'draft'
  }
}

/** Cada item da checklist em linguagem de dono. As chaves vêm de `ActivationChecklist` no backend. */
export const CHECKLIST_LABELS: Record<string, string> = {
  document: 'Documento informado',
  terms: 'Aceitar os termos',
  responsible: 'Informar o responsável e o registro no conselho',
  address: 'Informar o endereço',
  location_confirmed: 'Confirmar a localização no mapa',
  professional: 'Cadastrar ao menos 1 profissional',
  service_with_professional: 'Cadastrar ao menos 1 serviço com profissional habilitado',
  work_schedule: 'Definir a jornada semanal de um profissional',
}

/** Só o que o servidor exige hoje para enviar ou publicar. */
export const requiredItems = (checklist: ChecklistItemResponse[]) =>
  checklist.filter((item) => item.requiredForSubmit)

export const missingItems = (checklist: ChecklistItemResponse[]) =>
  requiredItems(checklist).filter((item) => !item.done)

export const labelOf = (key: string) => CHECKLIST_LABELS[key] ?? key
