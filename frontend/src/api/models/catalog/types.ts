export type ServiceProfessionalResponse = {
  professionalId: string
  priceCents: number
  durationMinutes: number
  hasOverride: boolean
}

export type PublicServiceResponse = {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  priceCents: number
  professionals: ServiceProfessionalResponse[]
}

/** Visão do painel: com intervalos, passo e nota de insumos, que a vitrine não mostra. */
export type ServiceResponse = PublicServiceResponse & {
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  slotStepMinutes: number
  suppliesNote: string | null
  isActive: boolean
}

export type SaveServiceRequest = {
  name: string
  description: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  slotStepMinutes: number
  priceCents: number
  suppliesNote: string | null
  isActive: boolean
}
