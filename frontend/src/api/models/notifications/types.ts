/** `GET /api/notifications`: um aviso do sino. O texto já vem pronto e, em Saúde, sem serviço nem estabelecimento (LGPD). */
export type NotificationResponse = {
  id: string
  type: NotificationType
  title: string
  body: string
  appointmentId: string | null
  createdAt: string
  /** Nulo: ainda não lido. */
  readAt: string | null
}

export type NotificationType =
  | 'RequestReceived'
  | 'Confirmed'
  | 'Rejected'
  | 'CancelledByBusiness'
  | 'CancelledByCustomer'
  | 'Expired'
  | 'ReviewInvite'
  | 'ReminderDayBefore'
  | 'ReminderHourBefore'

export type UnreadCountResponse = { count: number }
