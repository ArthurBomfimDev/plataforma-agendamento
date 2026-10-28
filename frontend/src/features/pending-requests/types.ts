/** Histórico do consumidor neste estabelecimento. */
export type CustomerHistory = { appointments: number; noShows: number }

/** Pedido de agendamento aguardando a resposta do estabelecimento. */
export type PendingRequest = {
  id: string
  customerName: string
  /** `null` = primeira vez neste estabelecimento. */
  customerHistory: CustomerHistory | null
  serviceName: string
  durationMinutes: number
  /** Em centavos. */
  priceCents: number
  /** `yyyy-MM-dd`, no fuso do estabelecimento. */
  date: string
  /** `HH:mm`, no fuso do estabelecimento. */
  start: string
  /** `null` = "Sem preferência". */
  professionalName: string | null
  /** Quando o pedido foi enviado. O prazo de resposta conta daqui. */
  requestedAt: Date
  /** Horário fora da jornada do profissional: marcador "Fora do horário". */
  outsideWorkingHours: boolean
}

export type PendingRequestsScreenProps = {
  requests: PendingRequest[]
  onAccept?: (requestId: string) => void
  onReject?: (requestId: string) => void
  /** "Confirmação automática: desligada" leva à configuração. */
  onAutoConfirmSettings?: () => void
}
