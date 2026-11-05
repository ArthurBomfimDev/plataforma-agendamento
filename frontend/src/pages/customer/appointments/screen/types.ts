import type { MyReviewResponse, SaveReviewRequest } from '@api/models'
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
  /** Concluído, ainda sem avaliação e dentro da janela de 30 dias. */
  reviewable?: boolean
  /** A avaliação que o consumidor já fez deste atendimento (ADR-032). */
  review?: MyReviewResponse | null
  /** Estabelecimento de Saúde: o formulário avisa para não escrever dado de saúde. */
  sensitive?: boolean
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
  /** Envia ou edita a avaliação. `null` se deu certo, senão a mensagem de erro. Sem a prop, não há gaveta. */
  onSaveReview?: (
    appointment: CustomerAppointment,
    request: SaveReviewRequest,
  ) => Promise<string | null>
}
