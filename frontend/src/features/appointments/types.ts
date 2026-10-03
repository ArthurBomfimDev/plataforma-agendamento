import type { AppointmentStatus } from '../../components/status-chip/types'
import type { NavigationItemId } from '../../components/bottom-navigation/types'

export type CustomerAppointment = {
  id: string
  businessName: string
  serviceName: string
  status: AppointmentStatus
  /** Dia, `yyyy-MM-dd`, e início, `HH:mm`, no fuso do estabelecimento. */
  date: string
  time: string
  durationMinutes: number
  /** Fuso IANA do estabelecimento. */
  timeZone: string
  address?: string
  distanceKm?: number
  /** Quando o pedido foi enviado. Só importa enquanto pendente: o prazo conta daqui. */
  requestedAt?: Date
  /** Concluído e ainda dentro da janela de avaliação. */
  reviewable?: boolean
}

export type AppointmentsScreenProps = {
  onNavigate?: (item: NavigationItemId) => void
}
