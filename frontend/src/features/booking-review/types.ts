import type { BusinessService } from '@features/business-detail/types'

export type BookingBusiness = {
  name: string
  verified?: boolean
  coverUrl?: string
}

export type BookingReviewScreenProps = {
  business: BookingBusiness
  service: Omit<BusinessService, 'id'>
  /** `null` = "Sem preferência". */
  professionalName: string | null
  /** Dia escolhido, meia-noite local. */
  date: Date
  /** Horário de início, `HH:mm`, no fuso do estabelecimento. */
  time: string
  /** Até quantas horas antes o cancelamento é gratuito (política do estabelecimento). */
  cancellationWindowHours: number
  /** Pedido em envio: o botão fica desabilitado para não mandar duas vezes. */
  submitting?: boolean
  onBack?: () => void
  onSubmit?: (note: string) => void
}
