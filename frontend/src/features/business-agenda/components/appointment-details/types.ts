import type { AgendaAppointment, AgendaMove, AgendaProfessional } from '../../types'

export type AppointmentDetailsProps = {
  /** O agendamento aberto e o profissional dele; `null` fecha o painel. */
  selection: { entry: AgendaAppointment; professional: AgendaProfessional } | null
  /** Todos os profissionais do dia, para remarcar com outro. */
  professionals: AgendaProfessional[]
  /** `right` no desktop, `bottom` no celular. */
  side: 'right' | 'bottom'
  now: Date
  onClose: () => void
  onConfirm: (entryId: string) => void
  onReject: (entryId: string) => void
  onMove: (move: AgendaMove) => void
}
