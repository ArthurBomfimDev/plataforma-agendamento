import type { PanelBottomItem } from '@components/panel-bottom-navigation/types'
import type { PanelSection } from '@components/panel-sidebar/types'

/** Agendamento na agenda do dia. Horários em `HH:mm`, no fuso do estabelecimento. */
export type AgendaAppointment = {
  kind: 'appointment'
  id: string
  start: string
  durationMinutes: number
  serviceName: string
  customerName: string
  status: 'pending' | 'confirmed'
  /** Quando o pedido foi enviado. Só importa enquanto pendente: o prazo conta daqui. */
  requestedAt?: Date
}

/** Bloqueio do profissional: almoço, folga, compromisso. */
export type AgendaBlock = {
  kind: 'block'
  id: string
  start: string
  durationMinutes: number
  label: string
  /** Ex.: "Bloqueio recorrente". */
  detail?: string
}

export type AgendaEntry = AgendaAppointment | AgendaBlock

export type AgendaProfessional = {
  id: string
  name: string
  /** Jornada do dia, `HH:mm`. Fora dela, "Fora do expediente". */
  workStart: string
  workEnd: string
  /** Pedidos aguardando resposta, de qualquer dia. */
  pendingRequests: number
  entries: AgendaEntry[]
}

/** Indicadores do dia, só no desktop. */
export type AgendaSummary = {
  appointmentsCount: number
  /** Em centavos. Estimativa pelos agendamentos, não faturamento. */
  expectedRevenueCents: number
  occupancyPercent: number
  /** Diferença, em pontos percentuais, para o mesmo dia da semana passada. */
  occupancyDeltaPercent: number
  averageResponseMinutes: number
}

export type AgendaDay = {
  /** `yyyy-MM-dd`. */
  date: string
  professionals: AgendaProfessional[]
  summary: AgendaSummary
}

/** Linha da lista do celular: um item da agenda, um intervalo livre ou o fim do expediente. */
export type AgendaRow =
  | { type: 'entry'; entry: AgendaEntry }
  | { type: 'free'; start: string; end: string }
  | { type: 'off-hours'; start: string }

/** Horário que o estabelecimento quer ocupar com uma marcação de balcão. */
export type CounterBookingSlot = { professionalId: string; date: string; time: string }

export type BusinessAgendaScreenProps = {
  onNavigate?: (section: PanelSection | PanelBottomItem) => void
  /** "+ Marcação de balcão" (sem horário) ou "Encaixar" num intervalo livre (com horário). */
  onCounterBooking?: (slot?: CounterBookingSlot) => void
  /** "Semana" no desktop. */
  onWeekView?: () => void
}

/** Remarcação: o item vai para outro horário e, talvez, outro profissional. */
export type AgendaMove = { entryId: string; professionalId: string; start: string }
