import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

import { TIME_SLOT_CHIP_CLASSES } from '../time-slot-chip/consts'
import type { TimeSlotGroupProps } from './types'
import { cn } from 'cn'

/**
 * Grade de Chips de horário do Figma, construída sobre o ToggleGroup do shadcn (Base UI). A lib dá
 * `aria-pressed`, navegação por setas e foco; aqui entram os tokens e os estados do chip:
 * `selected` com preenchimento E borda de 2px (não depende só de cor) e `disabled` riscado.
 *
 * TODO(figma): o risco do `disabled` é `line-through` do CSS, não a linha desenhada no Figma.
 */
export const TimeSlotGroup = (props: TimeSlotGroupProps) => {
  const { label, slots, value, onValueChange, className } = props

  const selectedHere = slots.some(({ time }) => time === value)

  return (
    <ToggleGroup
      aria-label={label}
      value={selectedHere && value ? [value] : []}
      onValueChange={([time]) => onValueChange(time ?? null)}
      className={cn('grid w-full grid-cols-4 gap-(--space-8)', className)}
    >
      {slots.map(({ time, unavailable }) => (
        <ToggleGroupItem
          key={time}
          value={time}
          disabled={unavailable}
          aria-label={unavailable ? `${time}, indisponível` : time}
          className={cn(
            TIME_SLOT_CHIP_CLASSES,
            // Desfaz o visual do Toggle do shadcn: raio, altura, hover e o fundo de pressionado.
            'h-auto min-w-0 rounded-md px-(--space-8) hover:bg-(--bg-surface) hover:text-(--text-body) focus-visible:ring-0',
            'aria-pressed:border-2 aria-pressed:border-(--action-primary) aria-pressed:bg-(--action-primary) aria-pressed:text-(--text-on-action) aria-pressed:hover:bg-(--action-primary) aria-pressed:hover:text-(--text-on-action)',
            'disabled:border-(--border-subtle) disabled:bg-(--bg-surface-raised) disabled:text-(--text-disabled) disabled:line-through disabled:opacity-100',
          )}
        >
          {time}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
