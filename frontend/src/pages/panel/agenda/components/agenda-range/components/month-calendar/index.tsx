import { ITEM_CLASSES, VISIBLE_PER_DAY } from './consts'
import { WEEKDAY_HEADERS, dayCountLabel, shortDayLabel } from '../../consts'

import type { MonthCalendarProps } from './types'
import { PANEL_CARD } from '@components/panel-page'
import { cn } from 'cn'

/**
 * O mês como calendário de parede, na largura toda. No desktop, cada dia mostra os primeiros agendamentos — horário
 * e nome, com as cores da grade do dia — e "+N mais"; no celular, em 390 px, sete colunas só comportam o número e a
 * contagem. Tocar no dia abre a visão Dia.
 */
export const MonthCalendar = ({ days, month, today, byDay, onOpenDay }: MonthCalendarProps) => (
  <div className="flex flex-col gap-(--space-8)">
    <div className={cn(PANEL_CARD, 'gap-0 overflow-hidden p-0')}>
      <div
        aria-hidden="true"
        className="grid grid-cols-7 border-b border-(--border-subtle) bg-(--bg-page)"
      >
        {WEEKDAY_HEADERS.map((weekday) => (
          <span
            key={weekday}
            className="type-caption py-(--space-8) text-center text-(--text-muted) lg:px-(--space-8) lg:text-left"
          >
            {weekday}
          </span>
        ))}
      </div>

      <ul className="grid auto-rows-[minmax(var(--size-touch-min),auto)] grid-cols-7 lg:auto-rows-[minmax(8rem,auto)] xl:auto-rows-[minmax(9rem,auto)]">
        {days.map((day) => {
          const items = byDay.get(day) ?? []
          const pending = items.filter((item) => item.status === 'pending').length
          const outside = day.slice(0, 7) !== month
          const isToday = day === today
          const hidden = items.length - VISIBLE_PER_DAY

          return (
            <li
              key={day}
              className="border-r border-b border-(--border-subtle) nth-[7n]:border-r-0 nth-last-[-n+7]:border-b-0"
            >
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                aria-label={`${shortDayLabel(day)}${isToday ? ', hoje' : ''}: ${items.length === 0 ? 'sem agendamento' : dayCountLabel(items)}`}
                className={cn(
                  'flex size-full min-h-(--size-touch-min) flex-col items-center gap-(--space-4) p-(--space-4) text-left transition-colors hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--border-focus) lg:items-stretch lg:p-(--space-8)',
                  outside ? 'bg-(--bg-page) text-(--text-muted)' : 'text-(--text-strong)',
                )}
              >
                <span className="flex items-center justify-between gap-(--space-4)">
                  <span
                    className={cn(
                      'type-label tabular flex size-7 items-center justify-center rounded-(--radius-full)',
                      isToday && 'bg-(--action-primary) text-(--text-on-action)',
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {items.length > 0 && (
                    <span className="type-caption tabular hidden text-(--text-muted) lg:inline">
                      {items.length}
                    </span>
                  )}
                </span>

                {/* Celular: só a contagem; tracejada quando há pedido pendente. */}
                {items.length > 0 && (
                  <span
                    className={cn(
                      'type-caption tabular rounded-(--radius-full) px-(--space-4) lg:hidden',
                      pending > 0
                        ? 'border border-dashed border-(--status-pending-fg) bg-(--status-pending-bg) text-(--status-pending-fg)'
                        : 'bg-(--status-confirmed-bg) text-(--status-confirmed-fg)',
                    )}
                  >
                    {items.length}
                  </span>
                )}

                {/* Desktop: os primeiros do dia, como na grade do dia. */}
                {items.length > 0 && (
                  <span className="hidden min-w-0 flex-col gap-(--space-2) lg:flex">
                    {items.slice(0, VISIBLE_PER_DAY).map((item) => (
                      <span
                        key={item.id}
                        className={cn(
                          'type-caption tabular truncate rounded-sm px-(--space-4) py-(--space-2)',
                          ITEM_CLASSES[item.status],
                        )}
                      >
                        {item.start} {item.customerName}
                      </span>
                    ))}
                    {hidden > 0 && (
                      <span className="type-caption px-(--space-4) text-(--text-link)">
                        +{hidden} mais
                      </span>
                    )}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
    <p className="type-caption text-(--text-muted)">
      Toque num dia para abrir a agenda dele. Borda tracejada: pedido aguardando resposta.
    </p>
  </div>
)
