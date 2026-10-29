import { PendingRequestsScreen } from '@features/pending-requests'
import { usePanelContext } from './panel-context'

/**
 * Pedidos pendentes (tela 10), dentro do `PanelLayout`. Aceitar confirma e recusar recusa na API; a
 * lista se atualiza sozinha. Em Saúde, o nome do consumidor aparece (decisão do Arthur) e a API
 * registra a leitura no log de acesso.
 *
 * TODO: a configuração da confirmação automática ainda não tem tela.
 */
export const PanelRequestsRoute = () => {
  const { pending, business, runAction, navigateTo } = usePanelContext()

  return (
    <PendingRequestsScreen
      data={pending}
      expirationHours={business.pendingExpirationHours}
      autoConfirm={business.autoConfirm}
      onAccept={(id) => runAction('confirm', id)}
      onReject={(id) => runAction('reject', id)}
      onAutoConfirmSettings={() => navigateTo('settings')}
    />
  )
}
