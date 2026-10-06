/**
 * Estado do agendamento. O Figma define sete (Pending, Confirmed, Rejected, NoShow, Expired,
 * Cancelled, Completed); só entram aqui os que já têm tela.
 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type StatusChipProps = {
  status: AppointmentStatus
  className?: string
}
