import type { AgendaControls } from '../agenda-header/types'
import type { AppointmentStatus } from '@components/status-chip/types'

/** Um agendamento na semana ou no mês, já no fuso do estabelecimento. */
export type RangeAppointment = {
  id: string
  /** `yyyy-MM-dd`. */
  date: string
  /** `HH:mm`. */
  start: string
  end: string
  customerName: string
  serviceName: string
  professionalName: string
  status: AppointmentStatus
}

export type RangeData =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry: () => void }
  | { status: 'ready'; appointments: RangeAppointment[] }

export type AgendaRangeScreenProps = {
  view: 'week' | 'month'
  businessName: string
  /** Os dias do período, em ordem (`yyyy-MM-dd`). */
  days: string[]
  /** Dia de referência: no mês, os dias de fora do mês aparecem apagados. */
  date: string
  today: string
  data: RangeData
  /** Dia/Semana/Mês, o período e os filtros, montados pela rota. */
  controls?: AgendaControls
  /** Há filtro aplicado: o vazio diz isso, em vez de "nenhum agendamento". */
  filtered: boolean
  onCounterBooking?: () => void
  /** Abre o dia na visão Dia. */
  onOpenDay: (date: string) => void
}
