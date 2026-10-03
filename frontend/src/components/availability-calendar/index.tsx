import { DayMarker, HolidayMarker } from './day-marker'
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'

import { AvailabilityDayButton } from './day-button'
import type { AvailabilityCalendarProps } from './types'
import { Calendar } from '../ui/calendar'
import { Flag } from 'lucide-react'
import { cn } from 'cn'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useState } from 'react'

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const NAV_BUTTON_CLASSES =
  'flex size-(--size-touch-min) items-center justify-center text-(--text-link) focus-visible:outline-2 focus-visible:outline-(--border-focus) aria-disabled:text-(--text-disabled)'

/**
 * Calendário da vitrine (Figma, tela 05), construído sobre o Calendar do shadcn (react-day-picker).
 * A lib dá a grade, a troca de mês, `aria-*` e a navegação por setas; aqui entram os tokens, a
 * célula de 44px, os marcadores de disponibilidade, a legenda e a nota de feriados.
 *
 * O calendário só desenha. Quem decide o estado de cada dia é o `getDayInfo` — no futuro, o
 * resultado do `AvailabilityCalculator` vindo da API.
 */
export const AvailabilityCalendar = (props: AvailabilityCalendarProps) => {
  const { selected, onSelect, startMonth, endMonth, getDayInfo, className } = props

  const [month, setMonth] = useState(selected ?? startMonth)

  const holidays = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  }).flatMap((date) => {
    const { holiday, status } = getDayInfo(date)
    return holiday ? [{ date, name: holiday.name, closed: status === 'closed' }] : []
  })

  return (
    <div
      className={cn(
        'flex flex-col gap-(--space-8) rounded-(--radius-lg) border border-(--border-subtle) bg-(--bg-surface) p-(--space-12)',
        className,
      )}
    >
      <Calendar
        mode="single"
        required
        locale={ptBR}
        showOutsideDays={false}
        month={month}
        onMonthChange={setMonth}
        startMonth={startMonth}
        endMonth={endMonth}
        selected={selected}
        onSelect={onSelect}
        disabled={(date) => getDayInfo(date).status !== 'available'}
        modifiers={{
          available: (date) => getDayInfo(date).status === 'available',
          'no-slots': (date) => getDayInfo(date).status === 'no-slots',
          closed: (date) => getDayInfo(date).status === 'closed',
          past: (date) => getDayInfo(date).status === 'past',
          holiday: (date) => Boolean(getDayInfo(date).holiday),
        }}
        formatters={{
          formatCaption: (date) => capitalize(format(date, 'LLLL yyyy', { locale: ptBR })),
          formatWeekdayName: (date) => format(date, 'EEEEE', { locale: ptBR }),
        }}
        className="w-full bg-transparent p-0"
        classNames={{
          root: 'w-full',
          months: 'relative flex flex-col',
          month: 'flex w-full flex-col gap-(--space-8)',
          // Chevron de 20px com área de toque de 44px; o `-top` mantém a linha de 20px do Figma.
          nav: 'absolute inset-x-0 -top-(--space-12) z-10 flex items-center justify-between lg:-top-2',
          button_previous: NAV_BUTTON_CLASSES,
          button_next: NAV_BUTTON_CLASSES,
          chevron: 'size-5',
          month_caption: 'flex h-5 items-center justify-center lg:h-7',
          // Desktop (05D): o mês sobe para `heading`.
          caption_label:
            'type-label text-(--text-strong) lg:text-(length:--size-heading)! lg:leading-(--line-height-heading)! lg:font-semibold!',
          month_grid: 'w-full',
          weekdays: 'flex justify-between',
          weekday:
            'type-caption flex h-6 max-w-(--size-touch-min) min-w-0 flex-1 items-center justify-center font-normal text-(--text-muted)',
          week: 'mt-(--space-8) flex justify-between',
          // Até 44px de largura; abaixo de ~360px de tela as sete colunas encolhem para caber.
          // A altura fica sempre em 44px (regra de alvo de toque).
          day: 'h-(--size-touch-min) max-w-(--size-touch-min) min-w-0 flex-1 p-0',
          today: '',
          disabled: '',
          outside: '',
        }}
        components={{ DayButton: AvailabilityDayButton }}
      />

      <ul className="type-caption flex flex-wrap items-center gap-x-(--space-12) gap-y-(--space-4) text-(--text-muted)">
        <li className="flex items-center gap-(--space-4)">
          <DayMarker status="available" className="size-1.25" />
          Tem horário
        </li>
        <li className="flex items-center gap-(--space-4)">
          <DayMarker status="no-slots" className="size-1.5 border" />
          Sem horário
        </li>
        <li className="flex items-center gap-(--space-4)">
          <DayMarker status="closed" className="h-0.5 w-2.25 bg-(--text-disabled)" />
          Não abre
        </li>
        <li className="flex items-center gap-(--space-4)">
          <HolidayMarker className="h-0.5 w-3" />
          Feriado
        </li>
      </ul>

      {holidays.length > 0 && (
        <p className="type-caption flex items-center gap-(--space-8) text-(--text-body)">
          <Flag aria-hidden="true" className="size-3.5 shrink-0" />
          <span>
            Feriados em {format(month, 'LLLL', { locale: ptBR })}:{' '}
            {holidays
              .map(
                ({ date, name, closed }) =>
                  `${date.getDate()} · ${name}${closed ? ' (fechado)' : ''}`,
              )
              .join('; ')}
          </span>
        </p>
      )}
    </div>
  )
}
