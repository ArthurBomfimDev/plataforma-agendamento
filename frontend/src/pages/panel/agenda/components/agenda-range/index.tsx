import { ErrorState, LoadingState } from '@components/screen-state'
import { byDay, periodLabel, shortDayLabel } from './consts'

import { AgendaHeader } from '../agenda-header'
import { MonthCalendar } from './components/month-calendar'
import type { AgendaRangeScreenProps, RangeAppointment } from './types'
import { PANEL_CARD } from '@components/panel-page'
import { PANEL_CONTENT_BOTTOM_PADDING_WITH_ACTION } from '@components/bottom-navigation/consts'
import { StatusChip } from '@components/status-chip'
import { cn } from 'cn'

/**
 * Agenda da semana e do mês (Onda 7CF). Sem wireframe no Figma: o cabeçalho é o da tela 09; a semana é uma lista por
 * dia (o mesmo "um dia como lista cronológica" do celular, CLAUDE.md §3.1), e o mês, uma grade com a contagem de cada
 * dia, que abre o dia. As cores e ícones de status são os do chip da agenda do dia.
 */
export const AgendaRangeScreen = (props: AgendaRangeScreenProps) => {
  const {
    view,
    businessName,
    days,
    date,
    today,
    data,
    controls,
    filtered,
    onCounterBooking,
    onOpenDay,
  } = props

  const title = view === 'week' ? 'Agenda da semana' : 'Agenda do mês'
  const label = periodLabel(view, days, date)
  const grouped: Map<string, RangeAppointment[]> =
    data.status === 'ready' ? byDay(data.appointments) : new Map()
  const total = data.status === 'ready' ? data.appointments.length : 0
  const month = date.slice(0, 7)

  return (
    <main
      className={cn(
        'flex flex-col gap-(--space-16) px-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] md:mx-auto md:max-w-160 lg:mx-0 lg:max-w-none lg:px-(--space-24) lg:pt-(--space-24)',
        PANEL_CONTENT_BOTTOM_PADDING_WITH_ACTION,
      )}
    >
      <AgendaHeader
        title={title}
        caption={`${label} · ${businessName}`}
        controls={controls}
        onCounterBooking={onCounterBooking}
      />

      {data.status === 'loading' ? (
        <LoadingState label="Carregando a agenda…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : (
        <>
          <p aria-live="polite" className="type-caption tabular text-(--text-muted)">
            {total === 0
              ? filtered
                ? 'Nenhum agendamento com esses filtros neste período.'
                : 'Nenhum agendamento neste período.'
              : total === 1
                ? '1 agendamento'
                : `${total} agendamentos`}
          </p>

          {view === 'week' ? (
            <ul className="flex flex-col gap-(--space-12)">
              {days.map((day) => {
                const items = grouped.get(day) ?? []
                return (
                  <li
                    key={day}
                    className={cn(PANEL_CARD, day === today && 'border-2 border-(--border-focus)')}
                  >
                    <div className="flex items-center gap-(--space-8)">
                      <h2 className="type-label min-w-0 flex-1 text-(--text-strong)">
                        {shortDayLabel(day)}
                        {day === today && <span className="text-(--text-link)"> · hoje</span>}
                      </h2>
                      <button
                        type="button"
                        onClick={() => onOpenDay(day)}
                        className="type-label min-h-(--size-touch-min) rounded-md px-(--space-12) text-(--text-link) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
                        aria-label={`Abrir ${shortDayLabel(day)} na visão do dia`}
                      >
                        Abrir dia
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <p className="type-caption text-(--text-muted)">Sem agendamento.</p>
                    ) : (
                      <ul className="flex flex-col divide-y divide-(--border-subtle)">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center gap-(--space-8) py-(--space-8)"
                          >
                            <span className="type-label tabular w-24 shrink-0 text-(--text-strong)">
                              {item.start}–{item.end}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="type-body truncate text-(--text-strong)">
                                {item.customerName}
                              </span>
                              <span className="type-caption truncate text-(--text-muted)">
                                {item.serviceName} · {item.professionalName}
                              </span>
                            </span>
                            <StatusChip status={item.status} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <MonthCalendar
              days={days}
              month={month}
              today={today}
              byDay={grouped}
              onOpenDay={onOpenDay}
            />
          )}
        </>
      )}
    </main>
  )
}
