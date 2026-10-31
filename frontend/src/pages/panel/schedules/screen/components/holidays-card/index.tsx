import { CARD, shortDateLabel } from '../../consts'

import { HolidayRuleMenu } from '../holiday-rule-menu'
import type { HolidaysCardProps } from './types'
import { cn } from 'cn'
import { memo } from 'react'

const CLOSED = { kind: 'closed' } as const

/**
 * "Feriados" (tela 12): calculados, fechados por padrão, com a regra de cada um na pílula.
 *
 * Memorizado: a semana e o bloqueio mudam muito mais do que os feriados.
 */
export const HolidaysCard = memo((props: HolidaysCardProps) => {
  const { holidays, rules, onRuleChange } = props

  return (
    <section aria-labelledby="holidays-title" className={cn(CARD, 'gap-(--space-8)')}>
      <h2 id="holidays-title" className="type-label text-(--text-strong)">
        Feriados
      </h2>
      <p className="type-caption text-(--text-muted)">
        Calculados automaticamente. Padrão: fechado. O consumidor vê que a data é feriado.
      </p>

      <ul>
        {holidays.map((holiday) => (
          <li
            key={holiday.date}
            className="flex min-h-(--size-touch-min) items-center gap-(--space-12) px-(--space-2) py-(--space-8)"
          >
            <time dateTime={holiday.date} className="type-label w-14 shrink-0 text-(--text-strong)">
              {shortDateLabel(holiday.date)}
            </time>
            <span className="type-body min-w-0 flex-1 text-(--text-body)">{holiday.name}</span>
            <HolidayRuleMenu
              holidayName={holiday.name}
              rule={rules[holiday.date] ?? CLOSED}
              onChange={(rule) => onRuleChange(holiday, rule)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
})
