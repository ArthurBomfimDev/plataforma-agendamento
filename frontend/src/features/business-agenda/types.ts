import type { PanelBottomItem } from '@components/panel-bottom-navigation/types'
import type { PanelSection } from '@components/panel-sidebar/types'
import type { ReactNode } from 'react'

/** Agendamento na agenda do dia. Horários em `HH:mm`, no fuso do estabelecimento. */
export type AgendaAppointment = {
  kind: 'appointment'
  id: string
  start: string
  durationMinutes: number
  serviceName: string
  customerName: string
  status: 'pending' | 'confirmed' | 'completed' | 'no-show'
  /** Fim do prazo de resposta, vindo da API. Só existe enquanto pendente. */
  expiresAt?: Date
  /** Fim do atendimento. Concluir e marcar falta só valem depois dele (regra do domínio). */
  endsAt?: Date
}

/** O que o estabelecimento pode fazer com um agendamento (rotas `businesses/current/appointments`). */
export type AgendaAction = 'confirm' | 'reject' | 'cancel' | 'complete' | 'noShow'

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

/**
 * Indicadores do dia, só no desktop. Somados da própria agenda no frontend: não há endpoint de
 * indicadores (Onda 7A). Ocupação e tempo de resposta saíram até existir dado medido.
 */
export type AgendaSummary = {
  appointmentsCount: number
  confirmedCount: number
  pendingCount: number
  /** Em centavos. Estimativa pelos agendamentos, não faturamento. */
  expectedRevenueCents: number
}

/** A agenda que a tela recebe: carregando, erro (com "Tentar de novo") ou pronta. */
export type AgendaData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; day: AgendaDay }

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
  businessName: string
  /** "Hoje" no fuso do estabelecimento, `yyyy-MM-dd`. */
  today: string
  /** Dia mostrado, `yyyy-MM-dd`. */
  date: string
  onDateChange: (date: string) => void
  agenda: AgendaData
  /** Pedidos pendentes de qualquer dia, para o indicador. */
  pendingRequests: number
  /** Resolve `true` se a ação deu certo; o erro, a rota já mostrou. */
  onAction: (action: AgendaAction, entryId: string) => Promise<boolean>
  onNavigate?: (section: PanelSection | PanelBottomItem) => void
  /** "+ Marcação de balcão" (sem horário) ou "Encaixar" num intervalo livre (com horário). */
  onCounterBooking?: (slot?: CounterBookingSlot) => void
  /**
   * Barra com Dia, Semana e Mês e os filtros (7CF): no celular, no topo da lista; no desktop, abaixo do título. Sem
   * ela, a tela é só o dia.
   */
  toolbar?: ReactNode
  /** Há filtro aplicado: o dia vazio diz isso, em vez de "nenhum agendamento". */
  filtered?: boolean
}

/**
 * Remarcação: o item vai para outro horário e, talvez, outro profissional.
 * TODO: o backend não tem remarcação (trabalho futuro, Onda 7A); a grade não arrasta mais.
 */
export type AgendaMove = { entryId: string; professionalId: string; start: string }
