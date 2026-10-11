import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible'

import { ChevronRight } from 'lucide-react'
import type { SlotPeriodProps } from './types'
import { TimeSlotGroup } from '@components/time-slot-group'
import { cn } from 'cn'

const countLabel = (count: number) => `${count} ${count === 1 ? 'horário' : 'horários'}`

/**
 * Período do dia na grade de horários (Figma, tela 05), construído sobre o Collapsible do shadcn
 * (Base UI), que dá `aria-expanded` e `aria-controls`. Fechado, é uma linha com borda e chevron;
 * aberto, vira cabeçalho simples sobre os chips.
 */
export const SlotPeriod = (props: SlotPeriodProps) => {
  const { label, slots, value, onValueChange, defaultOpen, className } = props

  const freeCount = slots.filter(({ unavailable }) => !unavailable).length

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn('flex flex-col gap-(--space-8)', className)}
    >
      <CollapsibleTrigger
        className={cn(
          'group/period flex min-h-(--size-touch-min) w-full items-center gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-surface) p-(--space-12) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
          // Aberto, o Figma mostra só a linha de texto; a margem negativa mantém os 44px de toque.
          'data-panel-open:-my-(--space-12) data-panel-open:border-transparent data-panel-open:bg-transparent data-panel-open:px-0',
        )}
      >
        <span className="type-label min-w-0 flex-1 text-(--text-body)">{label}</span>
        <span className="type-caption tabular shrink-0 text-(--text-muted)">
          {countLabel(freeCount)}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-(--text-strong) group-data-panel-open/period:hidden"
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <TimeSlotGroup
          label={`Horários da ${label.toLowerCase()}`}
          slots={slots}
          value={value}
          onValueChange={onValueChange}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
