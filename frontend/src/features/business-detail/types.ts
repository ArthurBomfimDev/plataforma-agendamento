import type { ServiceCardProps } from '@components/service-card/types'

export type BusinessService = Pick<ServiceCardProps, 'name' | 'durationMinutes' | 'priceCents'> & {
  id: string
}

export type BusinessDetail = {
  id: string
  name: string
  /** Nota média, de 0 a 5. */
  rating: number
  reviewCount: number
  verified?: boolean
  street: string
  neighborhood: string
  distanceKm: number
  /** Horário de fechamento de hoje, já formatado no fuso do estabelecimento. Ausente = não exibe. */
  openUntil?: string
  /** Sem foto, a tela mostra o bloco neutro do wireframe. */
  coverUrl?: string
  services: BusinessService[]
}

export type BusinessDetailScreenProps = {
  businessId: string
  onBookService?: (serviceId: string) => void
}
