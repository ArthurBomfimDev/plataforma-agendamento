import type { ImageSet } from '../common/types'

export type AddressResponse = {
  street: string | null
  streetNumber: string | null
  district: string | null
  city: string | null
  state: string | null
  postalCode: string | null
}

export type PublicBusinessResponse = {
  id: string
  name: string
  category: string
  verified: boolean
  address: AddressResponse
  latitude: number | null
  longitude: number | null
  cancellationWindowHours: number
  pendingExpirationHours: number
  autoConfirm: boolean
  /** IANA, ex. `America/Sao_Paulo`. */
  timeZone: string
  /** Nulas sem imagem: a tela mostra o padrão visual da categoria. */
  logo: ImageSet | null
  cover: ImageSet | null
}

export type BusinessSearchItemResponse = {
  id: string
  name: string
  category: string
  verified: boolean
  district: string | null
  city: string | null
  distanceKm: number
  /** Serviço em destaque: o que casa com o termo, ou o mais barato. Nulos sem serviço ativo. */
  serviceId: string | null
  serviceName: string | null
  durationMinutes: number | null
  /** "A partir de", em centavos. */
  fromPriceCents: number | null
  logo: ImageSet | null
  cover: ImageSet | null
}

export type SchedulingPolicyResponse = {
  autoConfirm: boolean
  pendingExpirationHours: number
  minLeadTimeHours: number
  bookingHorizonDays: number
  cancellationWindowHours: number
  timeZone: string
}

/** Visão do dono. Só os campos que o painel usa. */
export type BusinessDetailResponse = {
  id: string
  name: string
  /** `Beleza` ou `Saude`. `Saude` exige o tratamento de dado sensível (LGPD Art. 11). */
  category: string
  status: string
  policy: SchedulingPolicyResponse
  logo: ImageSet | null
  cover: ImageSet | null
}

export type UpdateSchedulingPolicyRequest = Omit<SchedulingPolicyResponse, 'timeZone'> & {
  timeZone: string | null
}
