import type { AppointmentStatus } from '@components/status-chip/types'
import type { NavigationItemId } from '@components/bottom-navigation/types'

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
  /** Só enquanto pendente: até quando o estabelecimento pode confirmar. */
  expiresAt?: Date
  /** Concluído e ainda dentro da janela de avaliação. */
  reviewable?: boolean
}

export type AppointmentsList =
  | { status: 'loading' }
  | { status: 'signed-out'; onSignIn: () => void }
  | { status: 'error'; message: string; onRetry?: () => void }
  | { status: 'ready'; items: CustomerAppointment[] }

export type AppointmentsScreenProps = {
  list: AppointmentsList
  /** Cancela no servidor. A tela fecha o diálogo quando a promessa termina. */
  onCancel?: (appointment: CustomerAppointment) => Promise<void> | void
  onNavigate?: (item: NavigationItemId) => void
}
