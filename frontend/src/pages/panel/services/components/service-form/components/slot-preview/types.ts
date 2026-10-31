import type { PreviewHours } from '../../types'

export type SlotPreviewProps = {
  /** Nulo: nenhum profissional escolhido tem jornada para servir de exemplo. */
  hours: PreviewHours | null
  /** Ocupação total em minutos: buffers + atendimento. */
  occupancy: number
  step: number
}
