import type { AgendaAction, CounterBookingSlot } from '@features/business-agenda/types'
import type {
  AppointmentResponse,
  ImageSet,
  ProfessionalResponse,
  WorkScheduleResponse,
} from '@lib/api/types'

import type { BusinessContext } from '@lib/zustand/session/types'
import type { PanelBottomItem } from '@components/panel-bottom-navigation/types'
import type { PanelSection } from '@components/panel-sidebar/types'
import type { PendingRequestsData } from '@features/pending-requests/types'
import { useOutletContext } from 'react-router'

/** O que o painel precisa do estabelecimento. O dono lê o detalhe; o profissional, a vitrine. */
export type PanelBusiness = {
  name: string
  /** `Beleza` ou `Saude`. */
  category: string
  /** Logotipo, para a barra lateral (7CF). Nulo: a ilustração da categoria. */
  logo: ImageSet | null
  timeZone: string
  pendingExpirationHours: number
  autoConfirm: boolean
}

/** O que o `PanelLayout` entrega às telas do painel. */
export type PanelContext = {
  context: BusinessContext
  business: PanelBusiness
  /** "Hoje" no fuso do estabelecimento, `yyyy-MM-dd`. */
  today: string
  /** Dia aberto na agenda; a marcação de balcão usa o mesmo. */
  date: string
  setDate: (date: string) => void
  professionals: ProfessionalResponse[]
  schedules: Map<string, WorkScheduleResponse[]>
  /** Pedidos aguardando resposta: alimentam o contador das navegações e a tela 10. */
  pending: PendingRequestsData
  pendingItems: AppointmentResponse[]
  pendingCount: number
  navigateTo: (section: PanelSection | PanelBottomItem) => void
  openCounterBooking: (slot?: CounterBookingSlot) => void
  /** Uma ação sobre um agendamento. Resolve `true` se deu certo; o erro vira toast aqui. */
  runAction: (action: AgendaAction, appointmentId: string) => Promise<boolean>
}

export const usePanelContext = () => useOutletContext<PanelContext>()
