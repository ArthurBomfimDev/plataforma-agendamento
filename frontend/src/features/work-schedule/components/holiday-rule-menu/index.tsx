import { COMPACT_LABEL, TIME_INPUT, holidayRuleLabel, validateRanges } from '../../consts'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'
import { useId, useState } from 'react'

import { Button } from '@components/button'
import type { HolidayRule } from '../../types'
import type { HolidayRuleMenuProps } from './types'
import { RadioOptionGroup } from '@components/radio-option-group'
import { X } from 'lucide-react'
import { cn } from 'cn'

type RuleKind = HolidayRule['kind']

const KIND_OPTIONS = [
  { value: 'closed', label: 'Fechado', description: 'Ninguém agenda nesta data.' },
  { value: 'special', label: 'Horário especial', description: 'Abre só na faixa abaixo.' },
] as const

/**
 * A pílula do feriado ("Fechado", "Especial 09–13") abre um menu para trocar a regra. Fechado é o
 * padrão; horário especial vale para o estabelecimento inteiro naquela data.
 *
 * TODO(figma): o wireframe só mostra as pílulas, sem o menu; o menu segue o resto da tela 12.
 */
export const HolidayRuleMenu = (props: HolidayRuleMenuProps) => {
  const { holidayName, rule, onChange } = props

  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<RuleKind>(rule.kind)
  const [range, setRange] = useState(
    rule.kind === 'special'
      ? { start: rule.start, end: rule.end }
      : { start: '09:00', end: '13:00' },
  )
  const [submitted, setSubmitted] = useState(false)
  const titleId = useId()
  const errorId = useId()

  const error = submitted && kind === 'special' ? validateRanges([range]) : null

  // Reabrir o menu volta ao que está gravado, não ao rascunho abandonado.
  const openChange = (next: boolean) => {
    if (next) {
      setKind(rule.kind)
      if (rule.kind === 'special') setRange({ start: rule.start, end: rule.end })
      setSubmitted(false)
    }
    setOpen(next)
  }

  const apply = () => {
    setSubmitted(true)
    if (kind === 'special' && validateRanges([range])) return
    onChange(kind === 'closed' ? { kind } : { kind, ...range })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger
        aria-label={`${holidayName}: ${holidayRuleLabel(rule)}. Trocar regra`}
        className={cn(
          // A pílula tem 24px; o `after` estende a área de toque para 44px sem mexer no desenho.
          'type-caption relative shrink-0 rounded-(--radius-full) border px-(--space-12) py-(--space-4) whitespace-nowrap after:absolute after:-inset-y-2.5 after:inset-x-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
          rule.kind === 'special'
            ? 'border-(--action-primary) bg-(--action-primary) text-(--text-on-action) hover:bg-(--action-primary-hover)'
            : 'border-(--border-interactive) bg-(--bg-surface) text-(--text-body) hover:bg-(--bg-surface-raised)',
        )}
      >
        {holidayRuleLabel(rule)}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-labelledby={titleId}
        className="w-[min(20rem,calc(100vw-2*var(--space-16)))] gap-(--space-8) rounded-lg bg-(--bg-surface) p-(--space-16) text-(--text-body) shadow-(--elevation-card) ring-(--border-subtle)"
      >
        <p id={titleId} className="type-label text-(--text-strong)">
          {holidayName}
        </p>
        <RadioOptionGroup
          aria-labelledby={titleId}
          value={kind}
          options={KIND_OPTIONS}
          onValueChange={setKind}
        />
        {kind === 'special' && (
          <div className="flex items-center gap-(--space-8) pl-(--space-32)">
            <input
              type="time"
              step={300}
              aria-label="Abre às"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={range.start}
              onChange={(event) =>
                setRange((current) => ({ ...current, start: event.target.value }))
              }
              className={TIME_INPUT}
            />
            <span className={COMPACT_LABEL}>até</span>
            <input
              type="time"
              step={300}
              aria-label="Fecha às"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={range.end}
              onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))}
              className={TIME_INPUT}
            />
          </div>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="type-caption flex items-center gap-(--space-4) text-(--status-rejected-fg)"
          >
            <X aria-hidden="true" className="size-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="flex justify-end gap-(--space-8)">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Voltar
          </Button>
          <Button onClick={apply}>Aplicar</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
