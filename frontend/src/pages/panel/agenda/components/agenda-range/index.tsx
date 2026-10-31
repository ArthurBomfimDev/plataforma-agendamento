import { ChevronLeftIcon, ChevronRightIcon } from '@assets/icons'
import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_CARD, PanelPage } from '@components/panel-page'
import { WEEKDAY_HEADERS, byDay, dayCountLabel, periodLabel, shortDayLabel } from './consts'

import type { AgendaRangeScreenProps, RangeAppointment } from './types'
import { ICON_BUTTON } from '@pages/panel/agenda/screen/consts'
import { StatusChip } from '@components/status-chip'
import { cn } from 'cn'

/**
 * Agenda da semana e do mês (Onda 7CF). Sem wireframe no Figma: a semana é uma lista por dia (o mesmo "um dia como
 * lista cronológica" do celular, CLAUDE.md §3.1), e o mês, uma grade com a contagem de cada dia, que abre o dia.
 * As cores e ícones de status são os do chip da agenda do dia.
 */
export const AgendaRangeScreen = (props: AgendaRangeScreenProps) => {
  const {
    view,
    businessName,
    days,
    date,
    today,
    data,
    toolbar,
    filtered,
    onPrevious,
    onNext,
    onOpenDay,
  } = props

  const title = view === 'week' ? 'Agenda da semana' : 'Agenda do mês'
  const label = periodLabel(view, days, date)
  const grouped: Map<string, RangeAppointment[]> =
    data.status === 'ready' ? byDay(data.appointments) : new Map()
  const total = data.status === 'ready' ? data.appointments.length : 0
  const month = date.slice(0, 7)

  return (
    <PanelPage
      title={title}
      subtitle={`${label} · ${businessName}`}
      actions={
        <div className="flex shrink-0 items-center gap-(--space-4)">
          <button
            type="button"
            aria-label={view === 'week' ? 'Semana anterior' : 'Mês anterior'}
            onClick={onPrevious}
            className={cn(ICON_BUTTON, 'text-(--text-link)')}
          >
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label={view === 'week' ? 'Próxima semana' : 'Próximo mês'}
            onClick={onNext}
            className={cn(ICON_BUTTON, 'text-(--text-link)')}
          >
            <ChevronRightIcon aria-hidden="true" className="size-5" />
          </button>
        </div>
      }
    >
      {toolbar}

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
            // Menos respiro no celular: em 390 px, sete colunas precisam caber com 44 px cada.
            <div className={cn(PANEL_CARD, 'px-(--space-8) md:px-(--space-16)')}>
              <div
                aria-hidden="true"
                className="grid grid-cols-7 gap-(--space-2) md:gap-(--space-4)"
              >
                {WEEKDAY_HEADERS.map((weekday) => (
                  <span key={weekday} className="type-caption text-center text-(--text-muted)">
                    {weekday}
                  </span>
                ))}
              </div>
              <ul className="grid grid-cols-7 gap-(--space-2) md:gap-(--space-4)">
                {days.map((day) => {
                  const items = grouped.get(day) ?? []
                  const pending = items.filter((item) => item.status === 'pending').length
                  const outside = day.slice(0, 7) !== month
                  return (
                    <li key={day}>
                      <button
                        type="button"
                        onClick={() => onOpenDay(day)}
                        aria-label={`${shortDayLabel(day)}: ${items.length === 0 ? 'sem agendamento' : dayCountLabel(items)}`}
                        className={cn(
                          'flex min-h-(--size-touch-min) w-full flex-col items-center justify-center gap-(--space-2) rounded-md border px-(--space-2) py-(--space-4) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
                          day === today
                            ? 'border-2 border-(--border-focus)'
                            : 'border-(--border-subtle)',
                          outside
                            ? 'bg-(--bg-page) text-(--text-muted)'
                            : 'bg-(--bg-surface) text-(--text-strong)',
                          'hover:bg-(--bg-surface-raised)',
                        )}
                      >
                        <span className="type-label tabular">{Number(day.slice(8))}</span>
                        {items.length > 0 && (
                          <span
                            className={cn(
                              'type-caption tabular rounded-(--radius-full) px-(--space-4)',
                              pending > 0
                                ? 'border border-dashed border-(--status-pending-fg) bg-(--status-pending-bg) text-(--status-pending-fg)'
                                : 'bg-(--status-confirmed-bg) text-(--status-confirmed-fg)',
                            )}
                          >
                            {items.length}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="type-caption text-(--text-muted)">
                O número é a quantidade de agendamentos do dia; com borda tracejada, há pedido
                pendente.
              </p>
            </div>
          )}
        </>
      )}
    </PanelPage>
  )
}
