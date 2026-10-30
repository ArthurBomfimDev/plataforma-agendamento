/** Histórico do consumidor neste estabelecimento. */
export type CustomerHistory = { appointments: number; noShows: number }

/** Pedido de agendamento aguardando a resposta do estabelecimento. */
export type PendingRequest = {
  id: string
  customerName: string
  /**
   * `null` = primeira vez neste estabelecimento. Ausente = a API ainda não informa o histórico
   * (Onda 7A): a linha não aparece, em vez de afirmar "primeira vez" sem saber.
   */
  customerHistory?: CustomerHistory | null
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
  /** Quando o pedido foi enviado. */
  requestedAt: Date
  /** Fim do prazo de resposta, vindo da API. Depois dele o pedido expira sozinho. */
  expiresAt: Date
  /** Horário fora da jornada do profissional: marcador "Fora do horário". */
  outsideWorkingHours: boolean
}

/** A lista que a tela recebe: carregando, erro (com "Tentar de novo") ou pronta. */
export type PendingRequestsData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; requests: PendingRequest[] }

export type PendingRequestsScreenProps = {
  data: PendingRequestsData
  /** Prazo de resposta do estabelecimento, em horas (política). */
  expirationHours: number
  autoConfirm: boolean
  /** Resolvem `true` se deu certo; o erro, a rota já mostrou. */
  onAccept?: (requestId: string) => Promise<boolean>
  onReject?: (requestId: string) => Promise<boolean>
  /** "Confirmação automática" leva à configuração. */
  onAutoConfirmSettings?: () => void
}
