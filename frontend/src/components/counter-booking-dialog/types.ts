export type CounterBookingValues = {
  professionalId: string
  serviceId: string
  /** `HH:mm`, no fuso do estabelecimento. */
  time: string
  walkInName: string
  walkInPhone: string | null
}

export type CounterBookingOption = { id: string; name: string }

export type CounterBookingService = CounterBookingOption & {
  durationMinutes: number
  /** Profissionais habilitados neste serviço. */
  professionalIds: string[]
}

export type CounterBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `right` no desktop, `bottom` no celular. */
  side: 'right' | 'bottom'
  /** "sexta, 11 de setembro". */
  dayLabel: string
  /** Vindo de "Encaixar": profissional e horário já escolhidos. */
  initial?: { professionalId?: string; time?: string }
  professionals: CounterBookingOption[]
  services: CounterBookingService[]
  /** Serviços ainda chegando: não diz "sem serviço" antes da hora. */
  servicesLoading?: boolean
  submitting: boolean
  /** Erro da última tentativa, já em português. */
  error?: string
  onSubmit: (values: CounterBookingValues) => void
}
