import { errorMessage } from '@api/base'
import { notify } from '@components/toaster/notify'

/**
 * Executa uma ação do painel. Deu certo: `true` (a tela mostra o sucesso). Falhou: o erro vira
 * mensagem em português — 409 de pedido já respondido, 403, 404, rede — e volta `false`. A lista é
 * buscada de novo nos dois casos (`usePanelAction`).
 */
export const performPanelAction = async (
  send: () => Promise<unknown>,
  notifier: { error: (message: string) => void } = notify,
) => {
  try {
    await send()
    return true
  } catch (error) {
    notifier.error(errorMessage(error))
    return false
  }
}
