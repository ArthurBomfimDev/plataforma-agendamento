import {
  CalendarTodayIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@assets/icons'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'
import { format, parseISO } from 'date-fns'

import { Calendar } from '@components/ui/calendar'
import type { DateNavigatorProps } from './types'
import { ICON_BUTTON } from '@pages/panel/agenda/screen/consts'
import { cn } from 'cn'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useState } from 'react'

const NAV_BUTTON = cn(ICON_BUTTON, 'text-(--text-link) hover:bg-(--bg-surface-raised)')

/**
 * Andar pelo período da agenda: anterior e próximo, o rótulo do período — que abre o calendário para pular direto
 * para um dia — e "Hoje". Vale para Dia, Semana e Mês; quem decide o passo é a rota.
 */
export const DateNavigator = (props: DateNavigatorProps) => {
  const {
    label,
    date,
    isCurrent,
    previousLabel,
    nextLabel,
    onPrevious,
    onNext,
    onToday,
    onPick,
    className,
  } = props
  const [open, setOpen] = useState(false)
  const selected = parseISO(date)

  return (
    <div className={cn('flex items-center gap-(--space-4)', className)}>
      <div className="flex items-center rounded-md border border-(--border-subtle) bg-(--bg-surface)">
        <button
          type="button"
          aria-label={previousLabel}
          onClick={onPrevious}
          className={NAV_BUTTON}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
        </button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            aria-label={`${label}. Escolher outra data`}
            className="type-label tabular flex min-h-(--size-touch-min) items-center gap-(--space-8) rounded-sm px-(--space-8) text-(--text-strong) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <CalendarTodayIcon aria-hidden="true" className="size-4 text-(--text-muted)" />
            <span aria-live="polite" className="first-letter:uppercase">
              {label}
            </span>
            <ChevronDownIcon aria-hidden="true" className="size-4 text-(--text-muted)" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto rounded-lg bg-(--bg-surface) p-(--space-8) shadow-(--elevation-card) ring-(--border-subtle)"
          >
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selected}
              defaultMonth={selected}
              onSelect={(day) => {
                if (!day) return
                onPick(format(day, 'yyyy-MM-dd'))
                setOpen(false)
              }}
              // Célula de 44px: alvo de toque mínimo também no painel (CLAUDE.md §3.1).
              className="p-0 [--cell-size:var(--size-touch-min)]"
            />
          </PopoverContent>
        </Popover>
        <button type="button" aria-label={nextLabel} onClick={onNext} className={NAV_BUTTON}>
          <ChevronRightIcon aria-hidden="true" className="size-5" />
        </button>
      </div>
      <button
        type="button"
        onClick={onToday}
        disabled={isCurrent}
        className="type-label min-h-(--size-touch-min) rounded-md px-(--space-12) text-(--text-link) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) disabled:text-(--text-disabled) disabled:hover:bg-transparent"
      >
        Hoje
      </button>
    </div>
  )
}
