import type { DayMarkerProps } from './types'
import { MARKER_CLASSES } from './consts'
import { cn } from 'cn'

/** Marcador abaixo do número do dia. Também desenha a legenda. */
export const DayMarker = (props: DayMarkerProps) => {
  const { status, className } = props

  return <span aria-hidden="true" className={cn('block', MARKER_CLASSES[status], className)} />
}
