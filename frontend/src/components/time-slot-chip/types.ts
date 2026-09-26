import type { ComponentProps } from 'react'

export type TimeSlotChipProps = Omit<ComponentProps<'button'>, 'type' | 'children'> & {
  /** Horário já formatado no fuso do estabelecimento, por exemplo `14:30`. */
  time: string
}
