import {
  type AgendaFilters,
  agendaPeriod,
  agendaSearch,
  daysOf,
  filterAgenda,
  hasAgendaFilters,
  readAgendaFilters,
  shiftPeriod,
  toRangeAppointment,
} from './filters'
import { periodLabel, shortDayLabel } from './components/agenda-range/consts'
import { usePanelAgenda, usePanelAgendaRange, usePanelServices } from '@api/services/panel/hooks'

import type { AgendaControls } from './components/agenda-header/types'
import type { AgendaData } from './screen/types'
import { AgendaRangeScreen } from './components/agenda-range'
import { AgendaToolbar } from './components/agenda-toolbar'
import { BusinessAgendaScreen } from './screen'
import { DateNavigator } from './components/date-navigator'
import type { RangeData } from './components/agenda-range/types'
import { ViewSwitch } from './components/view-switch'
import { canManageBusiness } from '@router/paths'
import { errorMessage } from '@api/base'
import { shiftDay } from './screen/consts'
import { toAgendaDay } from '../adapters'
import { useCallback } from 'react'
import { usePanelContext } from '@layouts/panel-layout/context'
import { useSearchParams } from 'react-router'

/** Rótulos do anterior e do próximo de cada visão, para o leitor de tela. */
const STEP_LABELS = {
  day: { previous: 'Dia anterior', next: 'Próximo dia' },
  week: { previous: 'Semana anterior', next: 'Próxima semana' },
  month: { previous: 'Mês anterior', next: 'Próximo mês' },
} as const

/**
 * Agenda (tela 09), dentro do `PanelLayout`: o dia (a tela do Rafael), a semana ou o mês (Onda 7CF), com filtros por
 * profissional, status, serviço e nome, todos na URL. A API devolve o período inteiro; para o papel `Professional`,
 * só a própria agenda. Atualiza sozinha a cada 30 s e depois de cada ação.
 */
export const PanelAgendaRoute = () => {
  const panel = usePanelContext()
  const { context, business, today, date, setDate, professionals, schedules, pendingItems } = panel
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readAgendaFilters(searchParams)
  const owner = canManageBusiness(context.role)
  const view = filters.view
  const period = view === 'day' ? null : agendaPeriod(view, date)
  const days = period ? daysOf(period.from, period.to) : [date]

  const agenda = usePanelAgenda(context.businessId, date)
  const range = usePanelAgendaRange(
    context.businessId,
    period?.from ?? date,
    period?.to ?? date,
    period !== null,
  )
  const services = usePanelServices(context.businessId, true)

  const change = useCallback(
    (patch: Partial<AgendaFilters>, options?: { replace?: boolean }) =>
      setSearchParams(
        (current) => agendaSearch({ ...readAgendaFilters(current), ...patch }),
        options,
      ),
    [setSearchParams],
  )

  const nameOf = (id: string) =>
    professionals.find((professional) => professional.id === id)?.displayName ?? 'Profissional'

  const step = (direction: 1 | -1) =>
    setDate(view === 'day' ? shiftDay(date, direction) : shiftPeriod(view, date, direction))

  // "Hoje" fica desligado quando o período mostrado já contém hoje.
  const isCurrent =
    view === 'day'
      ? date === today
      : view === 'week'
        ? today >= period!.from && today <= period!.to
        : today.slice(0, 7) === date.slice(0, 7)

  const controls: AgendaControls = {
    viewSwitch: <ViewSwitch value={view} onValueChange={(next) => change({ view: next })} />,
    navigator: (
      <DateNavigator
        label={view === 'day' ? shortDayLabel(date) : periodLabel(view, days, date)}
        date={date}
        isCurrent={isCurrent}
        previousLabel={STEP_LABELS[view].previous}
        nextLabel={STEP_LABELS[view].next}
        onPrevious={() => step(-1)}
        onNext={() => step(1)}
        onToday={() => setDate(today)}
        onPick={setDate}
      />
    ),
    filters: (
      <AgendaToolbar
        filters={filters}
        professionals={professionals.map(({ id, displayName }) => ({ id, name: displayName }))}
        services={(services.data ?? []).map(({ id, name }) => ({ id, name }))}
        showProfessionalFilter={owner}
        onChange={change}
      />
    ),
  }

  if (period && view !== 'day') {
    const data: RangeData = range.isError
      ? { status: 'error', message: errorMessage(range.error), onRetry: () => void range.refetch() }
      : range.data
        ? {
            status: 'ready',
            appointments: filterAgenda(range.data, filters).map((appointment) =>
              toRangeAppointment(appointment, business.timeZone, nameOf),
            ),
          }
        : { status: 'loading' }

    return (
      <AgendaRangeScreen
        view={view}
        businessName={business.name}
        days={days}
        date={date}
        today={today}
        data={data}
        controls={controls}
        filtered={hasAgendaFilters(filters)}
        onCounterBooking={() => panel.openCounterBooking()}
        onOpenDay={(day) => {
          setDate(day)
          change({ view: 'day' })
        }}
      />
    )
  }

  const visibleProfessionals = filters.professionalId
    ? professionals.filter(({ id }) => id === filters.professionalId)
    : professionals

  const data: AgendaData = agenda.isError
    ? { status: 'error', message: errorMessage(agenda.error), onRetry: () => void agenda.refetch() }
    : agenda.data
      ? {
          status: 'ready',
          day: toAgendaDay({
            date,
            timeZone: business.timeZone,
            professionals: visibleProfessionals,
            schedules,
            appointments: filterAgenda(agenda.data, filters),
            pending: pendingItems,
            // Com filtro, só quem tem item no recorte; sem filtro, o dono vê a equipe toda.
            onlyWithItems: !owner || hasAgendaFilters(filters),
          }),
        }
      : { status: 'loading' }

  return (
    <BusinessAgendaScreen
      businessName={business.name}
      today={today}
      date={date}
      onDateChange={setDate}
      agenda={data}
      onAction={panel.runAction}
      onNavigate={panel.navigateTo}
      onCounterBooking={panel.openCounterBooking}
      controls={controls}
      filtered={hasAgendaFilters(filters)}
    />
  )
}
