import type { BlockPeriodDraft, BlockPeriodValues, ConfirmedAppointment } from '../../types'

export type BlockPeriodCardProps = {
  professionalId: string
  appointments: ConfirmedAppointment[]
  /** Hoje, `yyyy-MM-dd`. */
  today: string
  initialValues: BlockPeriodValues
  /** Chamado com o bloqueio válido; se cancela agendamentos, só depois do diálogo. */
  onConfirm: (draft: BlockPeriodDraft) => void
  className?: string
}
