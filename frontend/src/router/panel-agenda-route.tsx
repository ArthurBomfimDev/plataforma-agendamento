import { BusinessAgendaScreen } from '@features/business-agenda'
import { toast } from '@lib/toast'

/**
 * TODO: as outras seções do painel (Pedidos, Marcação de balcão, Relatórios, "Mais") são as telas
 * 10 a 12 e P02–P05, ainda não implementadas. Por enquanto avisam. O painel também ainda não exige
 * login de Owner ou Professional: isso depende do módulo Identity, que exige revisão humana.
 */
export const PanelAgendaRoute = () => {
  return (
    <BusinessAgendaScreen
      onNavigate={(section) => {
        if (section !== 'agenda') toast.info('Esta seção do painel ainda não está disponível.')
      }}
      onCounterBooking={() => toast.info('Marcação de balcão ainda não está disponível.')}
      onWeekView={() => toast.info('A visão da semana ainda não está disponível.')}
    />
  )
}
