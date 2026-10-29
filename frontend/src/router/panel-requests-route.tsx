import { PendingRequestsScreen } from '@features/pending-requests'
import { usePanelContext } from './panel-context'

/**
 * TODO: aceitar e recusar só tiram o pedido da lista; a resposta de verdade depende da API de
 * Scheduling. A configuração da confirmação automática ainda não tem tela.
 */
export const PanelRequestsRoute = () => {
  const { requests, removeRequest, navigateTo } = usePanelContext()

  return (
    <PendingRequestsScreen
      requests={requests}
      onAccept={removeRequest}
      onReject={removeRequest}
      onAutoConfirmSettings={() => navigateTo('settings')}
    />
  )
}
