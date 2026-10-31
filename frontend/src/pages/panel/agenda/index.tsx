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
import { usePanelAgenda, usePanelAgendaRange, usePanelServices } from '@api/services/panel/hooks'

import type { AgendaData } from './screen/types'
import { AgendaRangeScreen } from './components/agenda-range'
import { AgendaToolbar } from './components/agenda-toolbar'
import { BusinessAgendaScreen } from './screen'
import type { RangeData } from './components/agenda-range/types'
import { canManageBusiness } from '@router/paths'
import { errorMessage } from '@api/base'
import { toAgendaDay } from '../adapters'
import { usePanelContext } from '@layouts/panel-layout/context'
import { useSearchParams } from 'react-router'

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
  const period = filters.view === 'day' ? null : agendaPeriod(filters.view, date)

  const agenda = usePanelAgenda(context.businessId, date)
  const range = usePanelAgendaRange(
    context.businessId,
    period?.from ?? date,
    period?.to ?? date,
    period !== null,
  )
  const services = usePanelServices(context.businessId, true)

  const change = (patch: Partial<AgendaFilters>) =>
    setSearchParams(agendaSearch({ ...filters, ...patch }))

  const nameOf = (id: string) =>
    professionals.find((professional) => professional.id === id)?.displayName ?? 'Profissional'

  const toolbar = (
    <AgendaToolbar
      filters={filters}
      professionals={professionals.map(({ id, displayName }) => ({ id, name: displayName }))}
      services={(services.data ?? []).map(({ id, name }) => ({ id, name }))}
      showProfessionalFilter={owner}
      onChange={change}
    />
  )

  if (period && filters.view !== 'day') {
    const view = filters.view
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
        days={daysOf(period.from, period.to)}
        date={date}
        today={today}
        data={data}
        toolbar={toolbar}
        filtered={hasAgendaFilters(filters)}
        onPrevious={() => setDate(shiftPeriod(view, date, -1))}
        onNext={() => setDate(shiftPeriod(view, date, 1))}
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
      pendingRequests={panel.pendingCount}
      onAction={panel.runAction}
      onNavigate={panel.navigateTo}
      onCounterBooking={panel.openCounterBooking}
      toolbar={toolbar}
      filtered={hasAgendaFilters(filters)}
    />
  )
}
