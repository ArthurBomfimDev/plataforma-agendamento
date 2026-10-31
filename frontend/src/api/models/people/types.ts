import type { ImageSet } from '../common/types'

/** Sem consentimento do profissional, só o nome vem preenchido — a foto também vem nula. */
export type PublicProfessionalResponse = {
  id: string
  displayName: string
  specialty: string | null
  bio: string | null
  photo: ImageSet | null
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
  /** Perfil completo (especialidade, bio, foto) na vitrine: exige o consentimento do profissional. */
  isPubliclyVisible: boolean
  hasPublicProfileConsent: boolean
  /** Vínculo com uma conta. Nulo: profissional sem login (o dono cadastrou). */
  membershipId: string | null
  photo: ImageSet | null
}

export type CreateProfessionalRequest = {
  displayName: string
  specialty: string | null
  bio: string | null
  /** O dono também atende: liga o profissional à própria conta. */
  isMe: boolean
}

export type UpdateProfessionalRequest = {
  displayName: string
  specialty: string | null
  bio: string | null
  isActive: boolean
  showFullProfile: boolean
}
