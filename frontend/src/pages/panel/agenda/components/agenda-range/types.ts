import type { AppointmentStatus } from '@components/status-chip/types'
import type { ReactNode } from 'react'

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
  /** A barra com Dia/Semana/Mês e os filtros. */
  toolbar: ReactNode
  /** Há filtro aplicado: o vazio diz isso, em vez de "nenhum agendamento". */
  filtered: boolean
  onPrevious: () => void
  onNext: () => void
  /** Abre o dia na visão Dia. */
  onOpenDay: (date: string) => void
}
