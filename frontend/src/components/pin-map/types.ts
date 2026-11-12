import type { MapPoint } from './consts'

export type PinMapProps = MapPoint & {
  /** O dono arrastou o pino, tocou no mapa ou usou um botão de ajuste. */
  onChange: (point: MapPoint) => void
  className?: string
}
