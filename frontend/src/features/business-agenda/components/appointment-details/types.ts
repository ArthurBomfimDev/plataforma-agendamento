import type { AgendaAction, AgendaAppointment, AgendaProfessional } from '../../types'

export type AppointmentDetailsProps = {
  /** O agendamento aberto e o profissional dele; `null` fecha o painel. */
  selection: { entry: AgendaAppointment; professional: AgendaProfessional } | null
  /** `right` no desktop, `bottom` no celular. */
  side: 'right' | 'bottom'
  now: Date
  /** Uma ação em andamento: os botões ficam desabilitados para não enviar duas vezes. */
  busy: boolean
  onClose: () => void
  /** Ação direta (confirmar, concluir). */
  onAction: (action: AgendaAction, entryId: string) => void
  /** Ação que pede confirmação antes (recusar, falta, cancelar). */
  onAskConfirm: (action: AgendaAction, entryId: string) => void
}
