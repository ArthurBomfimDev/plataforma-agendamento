import type { TimeSlotGroupProps } from '../time-slot-group/types'

export type SlotPeriodProps = Pick<TimeSlotGroupProps, 'slots' | 'value' | 'onValueChange'> & {
  /** Nome do período: Manhã, Tarde, Noite. */
  label: string
  defaultOpen?: boolean
  className?: string
}
