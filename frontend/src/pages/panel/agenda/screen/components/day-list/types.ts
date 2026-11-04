import type { AgendaProfessional } from '../../types'

export type DayListProps = {
  professional: AgendaProfessional
  now: Date
  /** Abre o detalhe de um agendamento. */
  onOpen: (entryId: string) => void
  /** "Encaixar" num intervalo livre, com o início dele (`HH:mm`). */
  onFitIn?: (time: string) => void
}
