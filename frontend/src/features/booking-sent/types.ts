import type { BusinessService } from '@features/business-detail/types'

export type BookingSentScreenProps = {
  businessName: string
  service: Omit<BusinessService, 'id'>
  /** `null` = "Sem preferência". */
  professionalName: string | null
  /** Dia do atendimento, meia-noite local. */
  date: Date
  /** Horário de início, `HH:mm`, no fuso do estabelecimento. */
  time: string
  /** Quando o pedido foi enviado. */
  sentAt: Date
  /** Até quando o estabelecimento pode confirmar; depois, o pedido expira sozinho. */
  expiresAt: Date
  /** Em quantas horas o estabelecimento confirma (política dele). */
  confirmationHours: number
  /** Cancelamento em andamento. */
  cancelling?: boolean
  onViewAppointments?: () => void
  /** Chamado só depois que o consumidor confirma no diálogo. */
  onCancel?: () => void
}
