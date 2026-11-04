import type { ImageSet, PagedResult } from '../common/types'
import type { AddressResponse, SchedulingPolicyResponse } from './types'

/**
 * Cadastro do estabelecimento (ondas finais, 04/11). Espelha `Booking.Arguments.Module.Tenancy`. Ver o contrato
 * §4.10. O documento e o registro no conselho só chegam a quem a API manda: dono (o próprio documento) e Admin.
 */

export type BusinessCategoryName = 'Beleza' | 'Saude'

/** `Draft` (rascunho), `PendingReview` (em análise), `Active` (publicado), `Suspended`. "Reprovado" é `Draft` + `Rejected`. */
export type BusinessStatusName = 'Draft' | 'PendingReview' | 'Active' | 'Suspended'

export type ProfessionalCouncilName = 'Crm' | 'Crp' | 'Crefito' | 'Crn' | 'Crefono' | 'Cro'

export type RegisterBusinessRequest = {
  name: string
  document: string
  category: BusinessCategoryName
}

/** Item das listas do Admin e resposta de `POST /api/businesses`. */
export type BusinessResponse = {
  id: string
  name: string
  document: string
  category: BusinessCategoryName
  status: BusinessStatusName
  verificationLevel: string
}

/** `GET /api/businesses/current`: a visão completa do dono. */
export type OwnerBusinessResponse = {
  id: string
  name: string
  document: string
  category: BusinessCategoryName
  status: BusinessStatusName
  /** `Unverified`, `UnderReview`, `Verified` ou `Rejected`. */
  verificationLevel: string
  address: AddressResponse
  latitude: number | null
  longitude: number | null
  locationPrecision: string | null
  locationConfirmed: boolean
  policy: SchedulingPolicyResponse
  logo: ImageSet | null
  cover: ImageSet | null
  /** Motivo da suspensão ou da reprovação; nulo nos outros estados. */
  statusReason: string | null
  termsAccepted: boolean
  /** O registro no conselho nunca vem: o dono só sabe que o informou. */
  responsibleInformed: boolean
}

/** Item da checklist de envio e publicação. As chaves: `terms`, `responsible`, `location_confirmed`, `professional`... */
export type ChecklistItemResponse = {
  key: string
  done: boolean
  requiredForSubmit: boolean
}

export type UpdateAddressRequest = {
  street: string
  streetNumber: string
  district: string
  city: string
  state: string
  postalCode: string
}

export type ConfirmLocationRequest = {
  latitude: number
  longitude: number
  /** `Rooftop`, `Street`, `Locality` ou `City`. */
  precision: string
  source: string
}

export type SetResponsibleRequest = {
  name: string
  council: ProfessionalCouncilName
  councilNumber: string
  councilState: string
}

export type ResponsibleResponse = {
  name: string
  council: string
  councilNumber: string
  councilState: string
}

/** `GET /api/admin/businesses/{id}`. */
export type AdminBusinessDetailResponse = {
  business: OwnerBusinessResponse
  checklist: ChecklistItemResponse[]
  verifiedByUserId: string | null
  verifiedAt: string | null
  verificationNote: string | null
  /** Só aqui: o registro no conselho, para o Admin conferir à mão. */
  responsible: ResponsibleResponse | null
  suspensionReason: string | null
  suspendedByUserId: string | null
  suspendedAt: string | null
  termsAcceptedAt: string | null
  termsVersion: string | null
}

export type BusinessReportResponse = {
  id: string
  businessId: string
  businessName: string
  reason: string
  status: 'Open' | 'Resolved'
  reportedAt: string
  /** Só se quem denunciou estava logado. */
  reporterUserId: string | null
  resolvedByUserId: string | null
  resolvedAt: string | null
  resolution: string | null
}

export type AdminBusinessList = PagedResult<BusinessResponse>
export type AdminReportList = PagedResult<BusinessReportResponse>
