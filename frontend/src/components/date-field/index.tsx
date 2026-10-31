import { FIELD_BOX_CLASSES, FIELD_LABEL_CLASSES } from '@components/text-field/consts'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'
import { format, parseISO } from 'date-fns'

import { Calendar } from '@components/ui/calendar'
import type { DateFieldProps } from './types'
import { X } from 'lucide-react'
import { cn } from 'cn'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useState } from 'react'

/**
 * Campo de data: a caixa do `TextField` mostra "21/09/2026" e abre o Calendar do shadcn
 * (react-day-picker) num Popover (Base UI) — o calendário do projeto (PROJECT-CONTEXT §4.2), em vez
 * do `<input type="date">` nativo, que tem cara diferente em cada navegador.
 *
 * O valor é `yyyy-MM-dd`, sem fuso: é um dia do calendário do estabelecimento, não um instante.
 */
export const DateField = (props: DateFieldProps) => {
  const { id, label, value, onValueChange, fromDate, error, className, labelClassName } = props

  const [open, setOpen] = useState(false)
  const labelId = `${id}-label`
  const errorId = `${id}-error`
  const selected = value ? parseISO(value) : undefined

  return (
    <div className={cn('flex flex-col gap-(--space-4)', className)}>
      <span id={labelId} className={cn(FIELD_LABEL_CLASSES, labelClassName)}>
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          aria-labelledby={`${labelId} ${id}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            FIELD_BOX_CLASSES,
            'tabular w-full text-left whitespace-nowrap aria-invalid:border-2 aria-invalid:border-(--border-error) aria-invalid:px-[calc(var(--space-16)-1px)] aria-invalid:py-[calc(var(--space-12)-1px)]',
            !selected && 'text-(--text-muted)',
          )}
        >
          {selected ? format(selected, 'dd/MM/yyyy') : 'dd/mm/aaaa'}
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
            disabled={fromDate ? { before: parseISO(fromDate) } : undefined}
            onSelect={(date) => {
              if (!date) return
              onValueChange(format(date, 'yyyy-MM-dd'))
              setOpen(false)
            }}
            // Célula de 44px: alvo de toque mínimo também no painel (CLAUDE.md §3.1).
            className="p-0 [--cell-size:var(--size-touch-min)]"
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p
          id={errorId}
          className="type-caption flex items-center gap-(--space-4) text-(--status-rejected-fg)"
        >
          <X aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
