import type { AgendaEntry, AgendaMove, AgendaProfessional } from '../../types'

export type DayGridProps = {
  professionals: AgendaProfessional[]
  /** Minuto do dia de agora, para a linha do horário atual; `null` quando o dia não é hoje. */
  nowMinutes: number | null
  /** Abre o detalhe de um agendamento. */
  onOpen: (entryId: string) => void
  /** Bloco arrastado para um horário livre: a tela pede confirmação. */
  onMove: (move: AgendaMove) => void
  /** Clique num horário vazio: marcação de balcão naquele horário. */
  onFitIn: (professionalId: string, time: string) => void
}

/** Onde o bloco arrastado cairia, e se ali está livre. */
export type Preview = {
  professionalId: string
  start: number
  durationMinutes: number
  valid: boolean
}

export type AppointmentBlockProps = {
  entry: Extract<AgendaEntry, { kind: 'appointment' }>
  preview: Preview | null
  onOpen: () => void
}
