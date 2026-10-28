import { openCounterBooking, usePanelContext } from './panel-context'

import { BusinessAgendaScreen } from '@features/business-agenda'
import { toast } from '@lib/toast'

/** Agenda do dia (tela 09), dentro do `PanelLayout`. */
export const PanelAgendaRoute = () => {
  const { navigateTo } = usePanelContext()

  return (
    <BusinessAgendaScreen
      onNavigate={navigateTo}
      onCounterBooking={openCounterBooking}
      onWeekView={() => toast.info('A visão da semana ainda não está disponível.')}
    />
  )
}
