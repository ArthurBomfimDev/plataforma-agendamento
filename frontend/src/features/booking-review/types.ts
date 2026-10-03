export type BookingReviewScreenProps = {
  businessId: string
  serviceId: string
  /** `null` = "Sem preferência". */
  professionalId: string | null
  /** Dia escolhido, meia-noite local. */
  date: Date
  /** Horário de início, `HH:mm`, no fuso do estabelecimento. */
  time: string
  /** Data de hoje no fuso do estabelecimento, para validar o horário escolhido. */
  today: Date
  onBack?: () => void
  onSubmit?: (note: string) => void
}
