import type { ImageSet } from '../common/types'

/** O perfil de todo profissional ativo é público (ADR-031). `registration`: registro profissional, só em Saúde. */
export type PublicProfessionalResponse = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  registration: string | null
  photo: ImageSet | null
}

/** O estabelecimento, na página pública do profissional. `category`: `Beleza` ou `Saude`. */
export type ProfessionalBusinessResponse = {
  id: string
  name: string
  addressLine: string | null
  category: string
  timeZone: string
}

/** Serviço que o profissional executa, com o preço e a duração dele. */
export type ProfessionalServiceResponse = {
  id: string
  name: string
  durationMinutes: number
  priceCents: number
  photo: ImageSet | null
}

/** `GET /api/professionals/{id}`: só profissional ativo de estabelecimento ativo (senão 404). */
export type ProfessionalPageResponse = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  /** Registro profissional (Saúde). Só vem quando informado. */
  registration: string | null
  photo: ImageSet | null
  business: ProfessionalBusinessResponse
  services: ProfessionalServiceResponse[]
}

/** "Solicitar remoção deste perfil": motivo de 5 a 500 caracteres e contato opcional. Sem login. */
export type RequestProfessionalRemovalRequest = { reason: string; contact: string | null }

export type ProfessionalRemovalResponse = {
  id: string
  professionalId: string
  professionalName: string
  businessId: string
  businessName: string
  reason: string
  contact: string | null
  status: 'Open' | 'Resolved'
  requestedAt: string
  resolvedByUserId: string | null
  resolvedAt: string | null
  resolution: string | null
}

export type CustomerResponse = {
  id: string
  birthDate: string
  socialName: string | null
}

export type ProfessionalResponse = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  /** Vínculo com uma conta. Nulo: profissional sem login (o dono cadastrou). */
  membershipId: string | null
  /** O dono já declarou ter a autorização desta pessoa para exibir os dados dela (ADR-031). */
  authorizationDeclared: boolean
  registration: string | null
  photo: ImageSet | null
}

export type CreateProfessionalRequest = {
  displayName: string
  specialty: string | null
  bio: string | null
  /** O dono também atende: liga o profissional à própria conta. */
  isMe: boolean
  /** Registro profissional (Saúde), opcional. */
  registration?: string | null
}

/** `PUT professionals/me`: o profissional com conta edita a própria especialidade, bio e registro. */
export type UpdateMyProfessionalProfileRequest = {
  specialty: string | null
  bio: string | null
  registration: string | null
}

export type UpdateProfessionalRequest = {
  displayName: string
  specialty: string | null
  bio: string | null
  /** Registro profissional (Saúde), opcional. */
  registration?: string | null
  isActive: boolean
  /** "Declaro ter autorização desta pessoa para exibir estes dados publicamente." Obrigatória para salvar a bio de quem não tem conta. */
  authorizationDeclared: boolean
}
