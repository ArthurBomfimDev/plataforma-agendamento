import type { AgendaData } from '@features/business-agenda/types'
import { BusinessAgendaScreen } from '@features/business-agenda'
import { errorMessage } from '@lib/api/errors'
import { toAgendaDay } from './panel-adapters'
import { toast } from '@lib/toast'
import { usePanelAgenda } from '@lib/api/queries'
import { usePanelContext } from './panel-context'

/**
 * Agenda do dia (tela 09), dentro do `PanelLayout`. A API devolve o dia inteiro; para o papel
 * `Professional`, só a própria agenda. Atualiza sozinha a cada 30 s e depois de cada ação.
 */
export const PanelAgendaRoute = () => {
  const panel = usePanelContext()
  const { context, business, today, date, setDate, professionals, schedules, pendingItems } = panel
  const agenda = usePanelAgenda(context.businessId, date)

  const data: AgendaData = agenda.isError
    ? { status: 'error', message: errorMessage(agenda.error), onRetry: () => void agenda.refetch() }
    : agenda.data
      ? {
          status: 'ready',
          day: toAgendaDay({
            date,
            timeZone: business.timeZone,
            professionals,
            schedules,
            appointments: agenda.data,
            pending: pendingItems,
            onlyWithItems: context.role !== 'Owner',
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
      onWeekView={() => toast.info('A visão da semana ainda não está disponível.')}
    />
  )
}
