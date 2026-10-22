import type { HolidayMarkerProps } from './types'
import { cn } from 'cn'

export const HolidayMarker = (props: HolidayMarkerProps) => {
  const { className } = props

  return (
    <span
      aria-hidden="true"
      className={cn(
        'block h-0.75 w-6 rounded-(--radius-full) bg-(--agenda-holiday-marker)',
        className,
      )}
    />
  )
}
