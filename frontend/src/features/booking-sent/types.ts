export type BookingSentScreenProps = {
  businessId: string
  serviceId: string
  /** `null` = "Sem preferência". */
  professionalId: string | null
  /** Dia do atendimento, meia-noite local. */
  date: Date
  /** Horário de início, `HH:mm`, no fuso do estabelecimento. */
  time: string
  /** Quando o pedido foi enviado. O prazo de confirmação conta a partir daqui. */
  sentAt: Date
  onViewAppointments?: () => void
  /** Chamado só depois que o consumidor confirma no diálogo. */
  onCancel?: () => void
}
