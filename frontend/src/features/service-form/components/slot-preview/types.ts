import type { PreviewHours } from '../../types'

export type SlotPreviewProps = {
  hours: PreviewHours
  /** Ocupação total em minutos: buffers + atendimento. */
  occupancy: number
  step: number
}
