import type { ServiceCardProps } from '@components/service-card/types'

export type BusinessService = Pick<ServiceCardProps, 'name' | 'durationMinutes' | 'priceCents'> & {
  id: string
}

export type BusinessDetail = {
  id: string
  name: string
  /** Nota média, de 0 a 5. Ausente = ainda sem avaliações; a nota não aparece. */
  rating?: number
  reviewCount?: number
  verified?: boolean
  street: string
  neighborhood: string
  /** Ausente quando não se sabe de onde o consumidor está buscando. */
  distanceKm?: number
  /** Horário de fechamento de hoje, já formatado no fuso do estabelecimento. Ausente = não exibe. */
  openUntil?: string
  /** Sem foto, a tela mostra o bloco neutro do wireframe. */
  coverUrl?: string
  /** Em quantas horas o estabelecimento confirma ou recusa um pedido. */
  confirmationHours: number
  services: BusinessService[]
}

export type BusinessDetailScreenProps = {
  business: BusinessDetail
  /** Próximos horários livres, `HH:mm`, para o card "Agendar agora" do desktop. Vazio = não exibe. */
  nextFreeSlots?: string[]
  onBookService?: (serviceId: string) => void
}
