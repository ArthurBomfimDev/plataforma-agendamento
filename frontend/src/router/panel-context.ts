import type { PanelBottomItem } from '@components/panel-bottom-navigation/types'
import type { PanelSection } from '@components/panel-sidebar/types'
import type { PendingRequest } from '@features/pending-requests/types'
import { toast } from '@lib/toast'
import { useOutletContext } from 'react-router'

/** O que o `PanelLayout` entrega às telas do painel. */
export type PanelContext = {
  /** Pedidos aguardando resposta: alimentam o contador das navegações e a tela 10. */
  requests: PendingRequest[]
  removeRequest: (requestId: string) => void
  navigateTo: (section: PanelSection | PanelBottomItem) => void
}

export const usePanelContext = () => useOutletContext<PanelContext>()

// TODO: a marcação de balcão é a tela P04, ainda não implementada.
export const openCounterBooking = () => toast.info('Marcação de balcão ainda não está disponível.')
