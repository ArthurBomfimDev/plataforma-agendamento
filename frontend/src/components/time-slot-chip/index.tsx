import { TIME_SLOT_CHIP_CLASSES } from './consts'
import type { TimeSlotChipProps } from './types'
import { cn } from 'cn'

/**
 * Chip de horário do Figma, estado padrão, como botão avulso. Para escolher um horário numa grade,
 * com os estados `selected` e `disabled`, use `TimeSlotGroup`.
 */
export const TimeSlotChip = (props: TimeSlotChipProps) => {
  const { time, className, ...buttonProps } = props

  return (
    <button {...buttonProps} type="button" className={cn(TIME_SLOT_CHIP_CLASSES, className)}>
      {time}
    </button>
  )
}
