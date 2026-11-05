export type AppointmentStatusResponse =
  'Pending' | 'Confirmed' | 'Rejected' | 'Expired' | 'Cancelled' | 'Completed' | 'NoShow'

export type AppointmentResponse = {
  id: string
  businessId: string
  professionalId: string
  serviceId: string
  serviceName: string
  durationMinutes: number
  priceCents: number
  startsAt: string
  endsAt: string
  status: AppointmentStatusResponse
  source: string
  /** Só enquanto pendente: depois dele o pedido expira sozinho. */
  expiresAt: string | null
  attendeeName: string | null
  customerNotes: string | null
  cancellationReason: string | null
  cancelledBy: string | null
  /** Quando o pedido foi feito. O prazo de resposta conta daqui. */
  requestedAt: string
  /**
   * Só nas rotas do estabelecimento: nome social do consumidor, senão o do cadastro; no balcão, o
   * nome informado. Nulo nas rotas do consumidor.
   */
  customerName?: string | null
}

export type CounterAppointmentRequest = {
  serviceId: string
  professionalId: string
  startsAt: string
  walkInName: string
  walkInPhone: string | null
  notes: string | null
}

export type RequestAppointmentRequest = {
  businessId: string
  serviceId: string
  professionalId: string
  startsAt: string
  notes: string | null
  attendeeName: string | null
  /** Gerada aqui; repetir o envio devolve o mesmo agendamento em vez de criar dois. */
  idempotencyKey: string
}
